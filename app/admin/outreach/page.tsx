'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { isMockMode } from '@/lib/mock-supabase'
import { useToast } from '@/components/Toast'
import Link from 'next/link'

// All 50 US States
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

const TRADES = ['Handyman', 'HVAC', 'Plumbing', 'Electrical']

const EMAIL_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'verified', label: 'Verified' },
  { value: 'found', label: 'Found (Unverified)' },
  { value: 'no_email', label: 'No Email' },
  { value: 'pending', label: 'Pending Enrichment' }
]

const DATA_SOURCES = [
  { value: 'outreach', label: 'Outreach Targets' },
  { value: 'staging', label: 'License Records (Staging)' }
]

interface Campaign {
  id: string
  name: string
  instantly_campaign_id: string
  trade_filter: string
  total_targets: number
  emails_sent: number
  emails_opened: number
  replies_received: number
  status: string
  created_at: string
}

interface OutreachTarget {
  id: string
  email: string | null
  contact_name: string | null
  phone: string | null
  business_name: string
  trade_type: string
  state: string
  city?: string
  status: string
  email_found: boolean
  email_verified: boolean
  created_at: string
  // Fields for unified view (can be from either source)
  source?: 'outreach' | 'staging'
  hunter_confidence?: number
  license_number?: string
  data_source?: string  // 'cslb' | 'dbpr' etc.
}

interface Reply {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  trade_type: string | null
  city: string | null
  state: string | null
  reply_text: string | null
  reply_subject: string | null
  reply_received_at: string
  last_dispatched_at: string | null
}

interface EnrichmentStats {
  pending: number
  enrichedThisMonth: number
  monthlyLimit: number
  totalTargets: number
  emailsFound: number
  emailsVerified: number
}

interface PendingReply {
  id: string
  cold_lead_id: string
  original_subject: string | null
  original_body: string
  original_from: string
  received_at: string
  reply_type: string
  classification_confidence: number
  classification_reason: string | null
  generated_subject: string | null
  generated_body: string | null
  status: string
  created_at: string
  cold_leads: {
    full_name: string | null
    email: string
    trade_type: string | null
  } | null
}

export default function AdminOutreachPage() {
  // Use the mock-aware supabase client
  const { showToast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [targets, setTargets] = useState<OutreachTarget[]>([])
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'campaigns' | 'targets' | 'replies'>('campaigns')
  const [expandedReply, setExpandedReply] = useState<string | null>(null)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [showCollector, setShowCollector] = useState(false)

  // Pending AI replies state
  const [pendingReplies, setPendingReplies] = useState<PendingReply[]>([])
  const [editedBodies, setEditedBodies] = useState<Record<string, string>>({})
  const [editedSubjects, setEditedSubjects] = useState<Record<string, string>>({})
  const [sendingReply, setSendingReply] = useState<string | null>(null)
  const [expandedPending, setExpandedPending] = useState<string | null>(null)

  // Enrichment state
  const [enriching, setEnriching] = useState(false)
  const [enrichmentStats, setEnrichmentStats] = useState<EnrichmentStats | null>(null)

  // Filter state
  const [filters, setFilters] = useState({
    business: '',
    email: '',
    city: '',
    trade: 'all',
    state: 'all',
    emailStatus: 'all',
    source: 'staging' as 'outreach' | 'staging'  // Default to staging (license_records)
  })

  // Staging stats
  const [stagingStats, setStagingStats] = useState({
    total: 0,
    verified: 0,
    pending: 0
  })

  // Selection state for targets
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set())

  // Recently verified IDs - these will be sorted to the top
  const [recentlyVerifiedIds, setRecentlyVerifiedIds] = useState<Set<string>>(new Set())

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // City-wide stats state
  const [cityStats, setCityStats] = useState({
    warm: { sent: 0, opened: 0, replied: 0 },
    cold: { sent: 0, opened: 0, replied: 0 }
  })

  // New campaign form
  const [campaignName, setCampaignName] = useState('')
  const [instantlyCampaignId, setInstantlyCampaignId] = useState('')
  const [tradeFilter, setTradeFilter] = useState('Handyman')
  const [validatingCampaign, setValidatingCampaign] = useState(false)
  const [campaignValid, setCampaignValid] = useState<boolean | null>(null)
  const [campaignDetails, setCampaignDetails] = useState<any>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Collector form
  const [collectorSource, setCollectorSource] = useState('apify')
  const [collectorTrade, setCollectorTrade] = useState('Handyman')
  const [collectorCity, setCollectorCity] = useState('Los Angeles')
  const [collectorState, setCollectorState] = useState('CA')
  const [collecting, setCollecting] = useState(false)

  // Debounce ref for text search filters
  const filterDebounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Clear previous debounce
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current)
    }

    // Debounce text search filters (business, email) by 400ms
    const hasTextFilters = filters.business || filters.email || filters.city
    const delay = hasTextFilters ? 400 : 0

    filterDebounceRef.current = setTimeout(() => {
      fetchData()
      if (activeTab === 'targets') {
        fetchStagingStats()
      }
    }, delay)

    // Non-debounced fetches
    fetchCityStats()
    fetchEnrichmentStats()

    return () => {
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current)
      }
    }
  }, [activeTab, filters])

  // Filtered targets
  const filteredTargets = useMemo(() => {
    const filtered = targets.filter(target => {
      // Business name filter
      if (filters.business && !target.business_name?.toLowerCase().includes(filters.business.toLowerCase())) {
        return false
      }

      // Email filter
      if (filters.email && !target.email?.toLowerCase().includes(filters.email.toLowerCase())) {
        return false
      }

      // Trade filter
      if (filters.trade !== 'all' && target.trade_type !== filters.trade) {
        return false
      }

      // State filter
      if (filters.state !== 'all' && target.state !== filters.state) {
        return false
      }

      // Email status filter
      if (filters.emailStatus !== 'all') {
        const status = getEmailStatusValue(target)
        if (status !== filters.emailStatus) {
          return false
        }
      }

      return true
    })

    // Sort recently verified/attempted IDs to the top
    if (recentlyVerifiedIds.size > 0) {
      filtered.sort((a, b) => {
        const aRecent = recentlyVerifiedIds.has(a.id) ? 1 : 0
        const bRecent = recentlyVerifiedIds.has(b.id) ? 1 : 0
        return bRecent - aRecent  // Recently verified first
      })
    }

    return filtered
  }, [targets, filters, recentlyVerifiedIds])

  // Paginated targets
  const totalPages = Math.ceil(filteredTargets.length / pageSize)
  const paginatedTargets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredTargets.slice(startIndex, startIndex + pageSize)
  }, [filteredTargets, currentPage, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  function getEmailStatusValue(target: OutreachTarget): string {
    if (target.email_found && target.email_verified) return 'verified'
    if (target.email_found && !target.email_verified) return 'found'
    if (!target.email_found && target.status === 'pending') return 'pending'
    return 'no_email'
  }

  async function fetchEnrichmentStats() {
    try {
      const response = await fetch('/api/outreach/enrich-batch')
      const data = await response.json()
      if (data.success) {
        setEnrichmentStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch enrichment stats:', error)
    }
  }

  async function fetchStagingStats() {
    try {
      // Count total records
      const { count: total } = await supabase
        .from('license_records')
        .select('*', { count: 'exact', head: true })

      // Count verified
      const { count: verified } = await supabase
        .from('license_records')
        .select('*', { count: 'exact', head: true })
        .eq('email_verified', true)

      // Count pending (not verified)
      const { count: pending } = await supabase
        .from('license_records')
        .select('*', { count: 'exact', head: true })
        .eq('email_verified', false)

      setStagingStats({
        total: total || 0,
        verified: verified || 0,
        pending: pending || 0
      })
    } catch (error) {
      console.error('Failed to fetch staging stats:', error)
    }
  }

  async function fetchCityStats() {
    const { data: dispatches, error } = await supabase
      .from('job_dispatches')
      .select('channel, email_opened, email_replied')

    if (!error && dispatches) {
      const warmDispatches = dispatches.filter(d => d.channel === 'sendgrid')
      const coldDispatches = dispatches.filter(d => d.channel === 'instantly')

      setCityStats({
        warm: {
          sent: warmDispatches.length,
          opened: warmDispatches.filter(d => d.email_opened).length,
          replied: warmDispatches.filter(d => d.email_replied).length
        },
        cold: {
          sent: coldDispatches.length,
          opened: coldDispatches.filter(d => d.email_opened).length,
          replied: coldDispatches.filter(d => d.email_replied).length
        }
      })
    }
  }

  async function fetchData() {
    setLoading(true)

    // Mock mode - return sample data
    if (isMockMode()) {
      if (activeTab === 'campaigns') {
        setCampaigns([
          {
            id: 'mock-campaign-1',
            name: 'Florida HVAC Contractors Q1',
            instantly_campaign_id: 'inst-12345',
            trade_filter: 'HVAC',
            total_targets: 150,
            emails_sent: 120,
            emails_opened: 45,
            replies_received: 12,
            status: 'active',
            created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          },
          {
            id: 'mock-campaign-2',
            name: 'Texas Plumbing Outreach',
            instantly_campaign_id: 'inst-67890',
            trade_filter: 'Plumbing',
            total_targets: 200,
            emails_sent: 180,
            emails_opened: 72,
            replies_received: 18,
            status: 'active',
            created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
          },
        ])
      } else if (activeTab === 'targets') {
        setTargets([
          {
            id: 'mock-target-1',
            email: 'john@acmehvac.com',
            contact_name: 'John Smith',
            phone: '(555) 123-4567',
            business_name: 'ACME HVAC Services',
            trade_type: 'HVAC',
            state: 'FL',
            city: 'Miami',
            status: 'verified',
            email_found: true,
            email_verified: true,
            created_at: new Date().toISOString(),
            source: 'staging',
          },
          {
            id: 'mock-target-2',
            email: 'mike@fixitplumbing.com',
            contact_name: 'Mike Johnson',
            phone: '(555) 987-6543',
            business_name: 'Fix-It Plumbing LLC',
            trade_type: 'Plumbing',
            state: 'TX',
            city: 'Houston',
            status: 'verified',
            email_found: true,
            email_verified: true,
            created_at: new Date().toISOString(),
            source: 'staging',
          },
        ])
      } else if (activeTab === 'replies') {
        setReplies([
          {
            id: 'mock-reply-1',
            email: 'contractor@example.com',
            full_name: 'Bob Williams',
            company_name: 'Williams Electric Co',
            trade_type: 'Electrical',
            city: 'Orlando',
            state: 'FL',
            reply_text: 'Hi, I am interested in learning more about your dispatch platform. Can we schedule a call?',
            reply_subject: 'Re: Work Opportunities in Orlando',
            reply_received_at: new Date(Date.now() - 86400000).toISOString(),
            last_dispatched_at: null,
          },
        ])
        setPendingReplies([])
      }
      setLoading(false)
      return
    }

    if (activeTab === 'campaigns') {
      const { data } = await supabase
        .from('outreach_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      setCampaigns(data || [])
    } else if (activeTab === 'targets') {
      if (filters.source === 'outreach') {
        // Fetch from outreach_targets
        const { data } = await supabase
          .from('outreach_targets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500)

        // Map to unified format
        const mapped: OutreachTarget[] = (data || []).map(t => ({
          ...t,
          source: 'outreach' as const
        }))
        setTargets(mapped)
      } else {
        // Fetch from license_records (staging) with server-side filtering
        let query = supabase
          .from('license_records')
          .select('*')
          .order('created_at', { ascending: false })

        // Apply filters server-side
        if (filters.business) {
          query = query.ilike('business_name', `%${filters.business}%`)
        }
        if (filters.email) {
          query = query.ilike('email', `%${filters.email}%`)
        }
        if (filters.city) {
          query = query.ilike('city', `%${filters.city}%`)
        }
        if (filters.trade !== 'all') {
          query = query.eq('trade_type', filters.trade)
        }
        if (filters.state !== 'all') {
          query = query.eq('state', filters.state)
        }
        if (filters.emailStatus !== 'all') {
          if (filters.emailStatus === 'verified') {
            query = query.eq('email_verified', true)
          } else if (filters.emailStatus === 'found') {
            query = query.not('email', 'is', null).eq('email_verified', false)
          } else if (filters.emailStatus === 'pending') {
            query = query.is('email', null)
          }
        }

        // Limit results for performance
        query = query.limit(1000)

        const { data } = await query

        // Map license_records to OutreachTarget format
        const mapped: OutreachTarget[] = (data || []).map(r => ({
          id: r.id,
          email: r.email,
          contact_name: r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || null,
          phone: r.phone || null,
          business_name: r.business_name || 'Unknown Business',
          trade_type: r.trade_type || 'General',
          state: r.state || '',
          city: r.city,
          status: r.email_verified ? 'verified' : (r.email ? 'pending' : 'imported'),
          email_found: !!r.email,
          email_verified: r.email_verified || false,
          created_at: r.created_at,
          // Staging-specific fields
          source: 'staging' as const,
          hunter_confidence: r.hunter_confidence,
          license_number: r.license_number,
          data_source: r.source  // 'cslb' or 'dbpr'
        }))
        setTargets(mapped)
      }
    } else if (activeTab === 'replies') {
      await Promise.all([fetchReplies(), fetchPendingReplies()])
    }

    setLoading(false)
  }

  async function fetchReplies() {
    const { data, error } = await supabase
      .from('cold_leads')
      .select('id, email, full_name, company_name, trade_type, city, state, reply_text, reply_subject, reply_received_at, last_dispatched_at')
      .eq('has_replied', true)
      .not('reply_received_at', 'is', null)
      .order('reply_received_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching replies:', error)
      return
    }

    setReplies(data || [])
  }

  async function fetchPendingReplies() {
    const { data, error } = await supabase
      .from('reply_queue')
      .select('*, cold_leads(full_name, email, trade_type)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending replies:', error)
      return
    }

    setPendingReplies(data || [])
  }

  async function sendPendingReply(replyId: string) {
    setSendingReply(replyId)
    try {
      const response = await fetch(`/api/replies/${replyId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editedBody: editedBodies[replyId] || null,
          editedSubject: editedSubjects[replyId] || null
        })
      })

      const data = await response.json()

      if (data.success) {
        showToast('Reply sent successfully!', 'success')
        // Remove from pending list
        setPendingReplies(prev => prev.filter(r => r.id !== replyId))
        // Clear edited state
        setEditedBodies(prev => {
          const { [replyId]: _, ...rest } = prev
          return rest
        })
        setEditedSubjects(prev => {
          const { [replyId]: _, ...rest } = prev
          return rest
        })
      } else {
        showToast(`Failed to send: ${data.error}`, 'error')
      }
    } catch (error) {
      showToast(`Error: ${error}`, 'error')
    }
    setSendingReply(null)
  }

  async function rejectPendingReply(replyId: string) {
    try {
      const response = await fetch(`/api/replies/${replyId}/send`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        showToast('Reply rejected', 'info')
        setPendingReplies(prev => prev.filter(r => r.id !== replyId))
      } else {
        showToast(`Failed to reject: ${data.error}`, 'error')
      }
    } catch (error) {
      showToast(`Error: ${error}`, 'error')
    }
  }

  async function enrichPending() {
    if (enriching) return

    setEnriching(true)
    showToast('Starting enrichment...', 'info')

    try {
      const response = await fetch('/api/outreach/enrich-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10 })
      })

      const data = await response.json()

      if (data.success) {
        showToast(`Enriched ${data.success} targets (${data.failed} failed)`, 'success')
        fetchData()
        fetchEnrichmentStats()
      } else {
        showToast(`Enrichment failed: ${data.error}`, 'error')
      }
    } catch (error) {
      showToast(`Error: ${error}`, 'error')
    }

    setEnriching(false)
  }

  async function validateInstantlyCampaign(campaignId: string) {
    if (!campaignId.trim()) {
      setCampaignValid(null)
      setCampaignDetails(null)
      setValidationError(null)
      return
    }

    setValidatingCampaign(true)
    setCampaignValid(null)
    setValidationError(null)

    try {
      const response = await fetch('/api/instantly/validate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaignId.trim() })
      })

      const data = await response.json()

      if (data.valid) {
        setCampaignValid(true)
        setCampaignDetails(data.campaign)
        if (!campaignName && data.campaign.name) {
          setCampaignName(data.campaign.name)
        }
      } else {
        setCampaignValid(false)
        setValidationError(data.error || 'Campaign not found')
      }
    } catch (error) {
      setCampaignValid(false)
      setValidationError('Failed to validate campaign')
    } finally {
      setValidatingCampaign(false)
    }
  }

  async function createCampaign() {
    if (!campaignValid) {
      showToast('Please enter a valid Instantly Campaign ID', 'error')
      return
    }

    const { error } = await supabase
      .from('outreach_campaigns')
      .insert({
        name: campaignName,
        instantly_campaign_id: instantlyCampaignId,
        trade_filter: tradeFilter,
        status: 'active'
      })

    if (!error) {
      showToast(`Campaign "${campaignName}" created successfully`, 'success')
      setShowNewCampaign(false)
      setCampaignName('')
      setInstantlyCampaignId('')
      setCampaignValid(null)
      setCampaignDetails(null)
      setValidationError(null)
      fetchData()
    } else {
      showToast('Failed to create campaign', 'error')
    }
  }

  async function collectTechnicians() {
    setCollecting(true)

    try {
      const response = await fetch('/api/outreach/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trade: collectorTrade,
          city: collectorCity,
          state: collectorState,
          maxResults: 50
        })
      })

      const data = await response.json()

      if (data.success) {
        showToast(`Successfully collected ${data.inserted} new technicians (${data.duplicates} duplicates skipped)!`, 'success')
        fetchData()
        fetchEnrichmentStats()
      } else {
        showToast(`Error: ${data.error}`, 'error')
      }
    } catch (error) {
      showToast(`Error: ${error}`, 'error')
    }

    setCollecting(false)
    setShowCollector(false)
  }

  // Filter input styles
  const filterInputStyle = {
    padding: '6px 10px',
    background: 'var(--ds-bg-surface)',
    border: '1px solid var(--ds-border-default)',
    borderRadius: '4px',
    color: 'var(--ds-text-primary)',
    fontSize: '12px',
    width: '100%',
    minWidth: '80px'
  }

  const filterSelectStyle = {
    ...filterInputStyle,
    cursor: 'pointer'
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h1 style={{
          fontSize: 'var(--font-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--ds-text-primary)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Cold Outreach
        </h1>
        <p style={{
          fontSize: 'var(--font-md)',
          color: 'var(--ds-text-secondary)'
        }}>
          Manage cold email campaigns to recruit technicians
        </p>
      </div>

      {/* City-Wide Stats - Warm/Cold Overview */}
      <div style={{
        background: 'var(--ds-bg-subtle)',
        border: '2px solid var(--ds-border-default)',
        borderRadius: 'var(--container-border-radius)',
        padding: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-2xl)'
      }}>
        <div style={{
          fontSize: 'var(--font-md)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--ds-text-secondary)',
          marginBottom: 'var(--spacing-lg)',
          textAlign: 'center'
        }}>
          CITY-WIDE OUTREACH OVERVIEW
        </div>

        {/* Warm/Cold Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--spacing-lg)'
        }}>
          {/* Warm Card (SendGrid) */}
          <div style={{
            background: 'var(--ds-success-bg)',
            border: '2px solid var(--ds-success-border)',
            borderRadius: 'var(--ds-radius-lg)',
            padding: '20px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--ds-success)',
              marginBottom: '16px',
              letterSpacing: '0.5px'
            }}>
              WARM (SENDGRID)
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-md)'
            }}>
              <div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Sent</div>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ds-text-primary)' }}>{cityStats.warm.sent}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Opened</div>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ds-text-primary)' }}>{cityStats.warm.opened}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Replied</div>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ds-text-primary)' }}>{cityStats.warm.replied}</div>
              </div>
            </div>

            <div style={{ height: 'var(--progress-bar-height)', background: 'var(--ds-success-bg)', borderRadius: 'var(--progress-bar-radius)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${cityStats.warm.sent > 0 ? (cityStats.warm.replied / cityStats.warm.sent) * 100 : 0}%`,
                background: 'linear-gradient(90deg, var(--stats-progress-warm-start) 0%, var(--stats-progress-warm-end) 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Cold Card (Instantly) */}
          <div style={{
            background: 'var(--ds-info-bg)',
            border: '2px solid var(--ds-info-border)',
            borderRadius: 'var(--ds-radius-lg)',
            padding: '20px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--ds-info)',
              marginBottom: '16px',
              letterSpacing: '0.5px'
            }}>
              COLD (INSTANTLY)
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-md)'
            }}>
              <div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Sent</div>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ds-text-primary)' }}>{cityStats.cold.sent}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Opened</div>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ds-text-primary)' }}>{cityStats.cold.opened}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Replied</div>
                <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ds-text-primary)' }}>{cityStats.cold.replied}</div>
              </div>
            </div>

            <div style={{ height: 'var(--progress-bar-height)', background: 'var(--ds-info-bg)', borderRadius: 'var(--progress-bar-radius)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${cityStats.cold.sent > 0 ? (cityStats.cold.replied / cityStats.cold.sent) * 100 : 0}%`,
                background: 'linear-gradient(90deg, var(--stats-progress-cold-start) 0%, var(--stats-progress-cold-end) 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--ds-border-default)',
        marginBottom: 'var(--spacing-2xl)'
      }}>
        <div style={{ display: 'flex', gap: 'var(--ds-space-6)' }}>
          <button
            onClick={() => setActiveTab('campaigns')}
            style={{
              padding: 'var(--ds-space-3) var(--ds-space-4)',
              background: 'none',
              border: 'none',
              color: activeTab === 'campaigns' ? 'var(--ds-accent-primary)' : 'var(--ds-text-secondary)',
              borderBottom: activeTab === 'campaigns' ? '2px solid var(--ds-accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 'var(--ds-text-base)',
              fontWeight: 'var(--ds-font-semibold)'
            }}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('targets')}
            style={{
              padding: 'var(--ds-space-3) var(--ds-space-4)',
              background: 'none',
              border: 'none',
              color: activeTab === 'targets' ? 'var(--ds-accent-primary)' : 'var(--ds-text-secondary)',
              borderBottom: activeTab === 'targets' ? '2px solid var(--ds-accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 'var(--ds-text-base)',
              fontWeight: 'var(--ds-font-semibold)'
            }}
          >
            Targets ({targets.length}/{stagingStats.total})
          </button>
          <button
            onClick={() => setActiveTab('replies')}
            style={{
              padding: 'var(--ds-space-3) var(--ds-space-4)',
              background: 'none',
              border: 'none',
              color: activeTab === 'replies' ? 'var(--ds-accent-primary)' : 'var(--ds-text-secondary)',
              borderBottom: activeTab === 'replies' ? '2px solid var(--ds-accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 'var(--ds-text-base)',
              fontWeight: 'var(--ds-font-semibold)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--ds-space-2)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            Replies ({replies.length})
          </button>
        </div>

        <Link href="/admin/outreach/compose">
          <button className="btn btn-primary" style={{
            marginBottom: 'var(--spacing-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Compose Email
          </button>
        </Link>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <button className="btn btn-primary" onClick={() => setShowNewCampaign(true)}>
              + New Campaign
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', color: 'var(--ds-text-secondary)' }}>
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', color: 'var(--ds-text-secondary)' }}>
              No campaigns yet. Create your first campaign!
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--spacing-xl)' }}>
              {campaigns.map(campaign => (
                <div key={campaign.id} style={{
                  background: 'var(--ds-bg-surface)',
                  borderRadius: 'var(--container-border-radius)',
                  padding: 'var(--spacing-xl)',
                  border: '1px solid var(--ds-border-default)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--ds-text-primary)', marginBottom: 'var(--spacing-xs)' }}>
                        {campaign.name}
                      </h3>
                      <div style={{ fontSize: 'var(--font-sm)', color: 'var(--ds-text-secondary)' }}>
                        Trade: {campaign.trade_filter}
                      </div>
                    </div>
                    <div style={{
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      borderRadius: 'var(--container-border-radius)',
                      fontSize: 'var(--font-md)',
                      fontWeight: 'var(--font-weight-medium)',
                      background: campaign.status === 'active' ? 'var(--ds-success)' :
                                 campaign.status === 'completed' ? 'var(--ds-accent-primary)' : 'var(--ds-text-secondary)',
                      color: 'var(--ds-text-inverse)',
                      height: 'fit-content'
                    }}>
                      {campaign.status.toUpperCase()}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-xl)' }}>
                    <div>
                      <div style={{ fontSize: 'var(--font-md)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Total Targets</div>
                      <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ds-text-primary)' }}>{campaign.total_targets}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-md)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Emails Sent</div>
                      <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ds-accent-primary)' }}>{campaign.emails_sent}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-md)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Opened</div>
                      <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ds-success)' }}>{campaign.emails_opened}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-md)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>Replies</div>
                      <div style={{ fontSize: 'var(--font-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ds-warning)' }}>{campaign.replies_received}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Targets Tab */}
      {activeTab === 'targets' && (
        <div>
          {/* Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              gap: '16px',
              padding: '8px 16px',
              background: 'var(--ds-bg-subtle)',
              borderRadius: '8px',
              fontSize: '13px'
            }}>
              <div style={{ color: 'var(--ds-text-secondary)' }}>
                Total: <span style={{ color: 'var(--ds-text-primary)', fontWeight: 600 }}>{stagingStats.total}</span>
              </div>
              <div style={{ color: 'var(--ds-text-secondary)' }}>
                Verified: <span style={{ color: 'var(--ds-success)', fontWeight: 600 }}>{stagingStats.verified}</span>
              </div>
              <div style={{ color: 'var(--ds-text-secondary)' }}>
                Pending: <span style={{ color: 'var(--ds-warning)', fontWeight: 600 }}>{stagingStats.pending}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons and Enrichment Counter */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                    className="btn btn-primary"
                    disabled={selectedTargets.size === 0}
                    style={{ opacity: selectedTargets.size === 0 ? 0.5 : 1, cursor: selectedTargets.size === 0 ? 'not-allowed' : 'pointer' }}
                    onClick={async () => {
                      if (selectedTargets.size === 0) return
                      const ids = Array.from(selectedTargets)
                      const res = await fetch('/api/leads/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids, limit: ids.length })
                      })
                      const data = await res.json()
                      if (data.success) {
                        showToast(`Verified ${data.verified} emails (${data.failed} failed)`, 'success')
                        // Track verified IDs to sort them to the top - keeps selection so user can see results
                        setRecentlyVerifiedIds(new Set(ids))
                        fetchData()
                        fetchStagingStats()
                      } else {
                        showToast(data.error || 'Verification failed', 'error')
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Verify Emails {selectedTargets.size > 0 && `(${selectedTargets.size})`}
                  </button>
                  <button
                    className="outline-button"
                    onClick={async () => {
                      const res = await fetch('/api/leads/move-to-cold', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ limit: 50 })
                      })
                      const data = await res.json()
                      if (data.success) {
                        showToast(`Moved ${data.moved} to cold leads`, 'success')
                        fetchData()
                        fetchStagingStats()
                      } else {
                        showToast(data.error || 'Move failed', 'error')
                      }
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                      <path d="M5 12h14"/>
                      <path d="M12 5l7 7-7 7"/>
                    </svg>
                    Move to Cold
                  </button>
            </div>

            {/* Enrichment Counter */}
            {enrichmentStats && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '8px 16px',
                background: 'var(--ds-bg-subtle)',
                borderRadius: '8px',
                fontSize: '13px'
              }}>
                <div style={{ color: 'var(--ds-text-secondary)' }}>
                  Hunter.io:{' '}
                  <span style={{
                    color: enrichmentStats.enrichedThisMonth >= enrichmentStats.monthlyLimit ? 'var(--ds-error)' :
                           enrichmentStats.enrichedThisMonth >= enrichmentStats.monthlyLimit * 0.8 ? 'var(--ds-warning)' : 'var(--ds-success)',
                    fontWeight: 600
                  }}>
                    {enrichmentStats.enrichedThisMonth}/{enrichmentStats.monthlyLimit}
                  </span>
                  {' '}this month
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ds-text-tertiary)' }}>
              Loading targets...
            </div>
          ) : stagingStats.total === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ds-text-tertiary)' }}>
              No targets yet. Start collecting technicians!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {/* Selection Toolbar */}
              {selectedTargets.size > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--ds-bg-subtle)',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  border: '1px solid var(--ds-border-default)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: 'var(--ds-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                      {selectedTargets.size} selected
                    </span>
                    <button
                      onClick={() => setSelectedTargets(new Set(filteredTargets.map(t => t.id)))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--ds-accent-primary)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        textDecoration: 'underline'
                      }}
                    >
                      Select all {filteredTargets.length}
                    </button>
                    <button
                      onClick={() => setSelectedTargets(new Set())}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--ds-text-secondary)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        textDecoration: 'underline'
                      }}
                    >
                      Clear selection
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="outline-button"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => {
                        // TODO: Add bulk action functionality
                        showToast(`${selectedTargets.size} targets selected for action`, 'info')
                      }}
                    >
                      Verify Emails
                    </button>
                    <button
                      className="outline-button"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => {
                        // TODO: Add to campaign functionality
                        showToast(`${selectedTargets.size} targets ready to add to campaign`, 'info')
                      }}
                    >
                      Add to Campaign
                    </button>
                  </div>
                </div>
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  {/* Filter Row */}
                  <tr style={{ background: 'var(--ds-bg-elevated)' }}>
                    <th style={{ padding: '8px 12px', width: '40px' }}>
                      {/* Checkbox column - no filter */}
                    </th>
                    <th style={{ padding: '8px 12px' }}>
                      <input
                        type="text"
                        placeholder="Search business..."
                        value={filters.business}
                        onChange={(e) => setFilters(f => ({ ...f, business: e.target.value }))}
                        style={filterInputStyle}
                      />
                    </th>
                    <th style={{ padding: '8px 12px' }}>
                      {/* Contact - no filter */}
                    </th>
                    <th style={{ padding: '8px 12px' }}>
                      {/* Phone - no filter */}
                    </th>
                    <th style={{ padding: '8px 12px' }}>
                      <input
                        type="text"
                        placeholder="Search email..."
                        value={filters.email}
                        onChange={(e) => setFilters(f => ({ ...f, email: e.target.value }))}
                        style={filterInputStyle}
                      />
                    </th>
                    <th style={{ padding: '8px 12px' }}>
                      <select
                        value={filters.trade}
                        onChange={(e) => setFilters(f => ({ ...f, trade: e.target.value }))}
                        style={filterSelectStyle}
                      >
                        <option value="all">All Trades</option>
                        {TRADES.map(trade => (
                          <option key={trade} value={trade}>{trade}</option>
                        ))}
                      </select>
                    </th>
                    <th style={{ padding: '8px 12px' }}>
                      <select
                        value={filters.state}
                        onChange={(e) => setFilters(f => ({ ...f, state: e.target.value }))}
                        style={filterSelectStyle}
                      >
                        <option value="all">All States</option>
                        {US_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </th>
                    <th style={{ padding: '8px 12px' }}>
                      <input
                        type="text"
                        placeholder="Search city..."
                        value={filters.city}
                        onChange={(e) => setFilters(f => ({ ...f, city: e.target.value }))}
                        style={filterInputStyle}
                      />
                    </th>
                    <th style={{ padding: '8px 12px' }}>
                      {/* Source - no filter */}
                    </th>
                    <th style={{ padding: '8px 12px' }}>
                      <select
                        value={filters.emailStatus}
                        onChange={(e) => setFilters(f => ({ ...f, emailStatus: e.target.value }))}
                        style={filterSelectStyle}
                      >
                        {EMAIL_STATUSES.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </th>
                  </tr>
                  {/* Header Row */}
                  <tr style={{ borderBottom: '1px solid var(--ds-border-default)' }}>
                    <th style={{ padding: '12px', textAlign: 'center', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={filteredTargets.length > 0 && selectedTargets.size === filteredTargets.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTargets(new Set(filteredTargets.map(t => t.id)))
                          } else {
                            setSelectedTargets(new Set())
                          }
                        }}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--ds-accent-primary)' }}
                        title={selectedTargets.size === filteredTargets.length ? 'Deselect all' : 'Select all'}
                      />
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--ds-text-secondary)', fontSize: '14px', fontWeight: 600 }}>Business</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--ds-text-secondary)', fontSize: '14px', fontWeight: 600 }}>Contact</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--ds-text-secondary)', fontSize: '14px', fontWeight: 600 }}>Phone</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--ds-text-secondary)', fontSize: '14px', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--ds-text-secondary)', fontSize: '14px', fontWeight: 600 }}>Trade</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--ds-text-secondary)', fontSize: '14px', fontWeight: 600 }}>State</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--ds-text-secondary)', fontSize: '14px', fontWeight: 600 }}>City</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--ds-text-secondary)', fontSize: '14px', fontWeight: 600 }}>Source</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--ds-text-secondary)', fontSize: '14px', fontWeight: 600 }}>Email Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTargets.map(target => (
                    <tr key={target.id} style={{ borderBottom: '1px solid var(--ds-border-subtle)', background: selectedTargets.has(target.id) ? 'var(--ds-accent-primary-light)' : 'transparent' }}>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedTargets.has(target.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedTargets)
                            if (e.target.checked) {
                              newSelected.add(target.id)
                            } else {
                              newSelected.delete(target.id)
                            }
                            setSelectedTargets(newSelected)
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--ds-accent-primary)' }}
                        />
                      </td>
                      <td style={{ padding: '12px', color: 'var(--ds-text-primary)', fontWeight: 500 }}>{target.business_name}</td>
                      <td style={{ padding: '12px', color: 'var(--ds-text-secondary)' }}>{target.contact_name || '-'}</td>
                      <td style={{ padding: '12px', color: 'var(--ds-text-secondary)' }}>{target.phone || '-'}</td>
                      <td style={{ padding: '12px', color: 'var(--ds-text-secondary)' }}>{target.email || '-'}</td>
                      <td style={{ padding: '12px', color: 'var(--ds-text-secondary)' }}>{target.trade_type}</td>
                      <td style={{ padding: '12px', color: 'var(--ds-text-secondary)' }}>{target.state}</td>
                      <td style={{ padding: '12px', color: 'var(--ds-text-secondary)' }}>{target.city || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          background: target.data_source === 'cslb' ? 'var(--ds-info-bg)' :
                                     target.data_source === 'dbpr' ? 'var(--ds-warning-bg)' :
                                     'var(--ds-bg-elevated)',
                          color: target.data_source === 'cslb' ? 'var(--ds-info)' :
                                 target.data_source === 'dbpr' ? 'var(--ds-warning)' :
                                 'var(--ds-text-tertiary)',
                          border: `1px solid ${target.data_source === 'cslb' ? 'var(--ds-info-border)' :
                                              target.data_source === 'dbpr' ? 'var(--ds-warning-border)' :
                                              'var(--ds-border-default)'}`
                        }}>
                          {target.data_source || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: target.email_found && target.email_verified ? 'var(--ds-success)' :
                                     target.email_found && !target.email_verified ? 'var(--ds-warning)' :
                                     !target.email_found && target.status === 'pending' ? 'var(--ds-accent-secondary)' :
                                     !target.email_found ? 'var(--ds-text-tertiary)' : 'var(--ds-error)',
                          color: 'var(--ds-text-inverse)'
                        }}>
                          {target.email_found && target.email_verified ? 'Verified' :
                           target.email_found && !target.email_verified ? 'Found' :
                           !target.email_found && target.status === 'pending' ? 'Pending' :
                           !target.email_found ? 'No Email' : 'Failed'}
                          {target.hunter_confidence && target.hunter_confidence > 0 && (
                            <span style={{ marginLeft: '6px', opacity: 0.8 }}>
                              {target.hunter_confidence}%
                            </span>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredTargets.length === 0 && stagingStats.total > 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ds-text-tertiary)' }}>
                  No targets match your filters ({filters.emailStatus !== 'all' ? `Email: ${filters.emailStatus}` : 'all filters'}).{' '}
                  <button
                    onClick={() => setFilters({ business: '', email: '', city: '', trade: 'all', state: 'all', emailStatus: 'all', source: 'staging' })}
                    style={{ color: 'var(--ds-accent-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {/* Pagination Controls */}
              {filteredTargets.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 0',
                  borderTop: '1px solid var(--ds-border-default)',
                  marginTop: '8px'
                }}>
                  {/* Left side - showing count */}
                  <div style={{ color: 'var(--ds-text-secondary)', fontSize: '13px' }}>
                    Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredTargets.length)} of {filteredTargets.length}
                  </div>

                  {/* Center - page navigation */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      style={{
                        padding: '6px 10px',
                        background: 'transparent',
                        border: '1px solid var(--ds-border-default)',
                        borderRadius: '4px',
                        color: currentPage === 1 ? 'var(--ds-text-tertiary)' : 'var(--ds-text-secondary)',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        border: '1px solid var(--ds-border-default)',
                        borderRadius: '4px',
                        color: currentPage === 1 ? 'var(--ds-text-tertiary)' : 'var(--ds-text-secondary)',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ←
                    </button>

                    <span style={{ color: 'var(--ds-text-primary)', fontSize: '14px', padding: '0 12px' }}>
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        border: '1px solid var(--ds-border-default)',
                        borderRadius: '4px',
                        color: currentPage === totalPages ? 'var(--ds-text-tertiary)' : 'var(--ds-text-secondary)',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      →
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '6px 10px',
                        background: 'transparent',
                        border: '1px solid var(--ds-border-default)',
                        borderRadius: '4px',
                        color: currentPage === totalPages ? 'var(--ds-text-tertiary)' : 'var(--ds-text-secondary)',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Last
                    </button>
                  </div>

                  {/* Right side - page size selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--ds-text-secondary)', fontSize: '13px' }}>Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="select-input"
                      style={{
                        padding: '4px 8px',
                        width: 'auto',
                        fontSize: '13px'
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Replies Tab */}
      {activeTab === 'replies' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', color: 'var(--ds-text-secondary)' }}>
              Loading replies...
            </div>
          ) : (
            <>
              {/* Pending AI Replies Section */}
              {pendingReplies.length > 0 && (
                <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-lg)'
                  }}>
                    <div style={{
                      background: 'var(--ds-warning-bg)',
                      border: '2px solid var(--ds-warning)',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ds-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--ds-text-primary)' }}>
                        Pending Review ({pendingReplies.length})
                      </div>
                      <div style={{ fontSize: 'var(--font-sm)', color: 'var(--ds-text-secondary)' }}>
                        AI-generated replies awaiting approval
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {pendingReplies.map(pending => (
                      <div
                        key={pending.id}
                        style={{
                          background: 'var(--ds-bg-surface)',
                          borderRadius: 'var(--container-border-radius)',
                          border: '1px solid var(--ds-warning-border)',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Header */}
                        <div
                          onClick={() => setExpandedPending(expandedPending === pending.id ? null : pending.id)}
                          style={{
                            padding: 'var(--spacing-lg)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', flex: 1 }}>
                            {/* AI indicator */}
                            <div style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: 'var(--ds-warning-bg)',
                              border: '2px solid var(--ds-warning)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ds-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                                <circle cx="7.5" cy="14.5" r="1.5"/>
                                <circle cx="16.5" cy="14.5" r="1.5"/>
                              </svg>
                            </div>

                            {/* Sender Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--ds-text-primary)' }}>
                                  {pending.cold_leads?.full_name || pending.original_from}
                                </span>
                                {pending.cold_leads?.trade_type && (
                                  <span style={{
                                    padding: '2px 8px',
                                    background: 'var(--ds-accent-primary-light)',
                                    border: '1px solid var(--ds-accent-primary-border)',
                                    borderRadius: '4px',
                                    fontSize: 'var(--font-xs)',
                                    color: 'var(--ds-accent-primary)'
                                  }}>
                                    {pending.cold_leads.trade_type}
                                  </span>
                                )}
                                <span style={{
                                  padding: '2px 8px',
                                  background: pending.reply_type === 'positive' ? 'var(--ds-success-bg)' : 'var(--ds-info-bg)',
                                  border: `1px solid ${pending.reply_type === 'positive' ? 'var(--ds-success-border)' : 'var(--ds-info-border)'}`,
                                  borderRadius: '4px',
                                  fontSize: 'var(--font-xs)',
                                  color: pending.reply_type === 'positive' ? 'var(--ds-success)' : 'var(--ds-info)'
                                }}>
                                  {pending.reply_type} ({Math.round(pending.classification_confidence * 100)}%)
                                </span>
                              </div>
                              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--ds-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                                {pending.original_from}
                              </div>
                            </div>

                            {/* Time */}
                            <div style={{
                              fontSize: 'var(--font-sm)',
                              color: 'var(--ds-text-secondary)',
                              flexShrink: 0
                            }}>
                              {new Date(pending.received_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>

                          {/* Expand Icon */}
                          <div style={{
                            marginLeft: 'var(--spacing-md)',
                            transform: expandedPending === pending.id ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ds-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedPending === pending.id && (
                          <div style={{
                            padding: 'var(--spacing-lg)',
                            paddingTop: 0,
                            borderTop: '1px solid var(--ds-border-default)'
                          }}>
                            {/* Their Original Reply */}
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                              <div style={{
                                fontSize: 'var(--font-xs)',
                                color: 'var(--ds-text-secondary)',
                                marginBottom: 'var(--spacing-sm)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Their Reply
                              </div>
                              <div style={{
                                fontSize: 'var(--font-md)',
                                color: 'var(--ds-text-primary)',
                                background: 'var(--ds-bg-subtle)',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--btn-corner-radius)',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                maxHeight: '150px',
                                overflowY: 'auto',
                                border: '1px solid var(--ds-border-default)'
                              }}>
                                {pending.original_body}
                              </div>
                              {pending.classification_reason && (
                                <div style={{
                                  fontSize: 'var(--font-xs)',
                                  color: 'var(--ds-text-secondary)',
                                  marginTop: 'var(--spacing-xs)',
                                  fontStyle: 'italic'
                                }}>
                                  AI Classification: {pending.classification_reason}
                                </div>
                              )}
                            </div>

                            {/* AI Generated Reply - Editable */}
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                              <div style={{
                                fontSize: 'var(--font-xs)',
                                color: 'var(--ds-text-secondary)',
                                marginBottom: 'var(--spacing-sm)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)'
                              }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                                </svg>
                                AI Draft Reply (Editable)
                              </div>
                              <input
                                type="text"
                                className="text-input"
                                value={editedSubjects[pending.id] ?? pending.generated_subject ?? ''}
                                onChange={(e) => setEditedSubjects(prev => ({ ...prev, [pending.id]: e.target.value }))}
                                placeholder="Subject"
                                style={{ marginBottom: 'var(--spacing-sm)' }}
                              />
                              <textarea
                                className="textarea-input"
                                value={editedBodies[pending.id] ?? pending.generated_body ?? ''}
                                onChange={(e) => setEditedBodies(prev => ({ ...prev, [pending.id]: e.target.value }))}
                                placeholder="Reply body..."
                                style={{
                                  minHeight: '120px',
                                  lineHeight: 1.6,
                                  resize: 'vertical'
                                }}
                              />
                            </div>

                            {/* Action Buttons */}
                            <div style={{
                              display: 'flex',
                              gap: 'var(--spacing-md)',
                              justifyContent: 'flex-end'
                            }}>
                              <button
                                onClick={() => rejectPendingReply(pending.id)}
                                className="btn btn-secondary"
                                style={{
                                  border: '1px solid var(--ds-error-border)',
                                  color: 'var(--ds-error)'
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/>
                                  <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                                Reject
                              </button>
                              <button
                                onClick={() => sendPendingReply(pending.id)}
                                disabled={sendingReply === pending.id}
                                className="btn btn-primary"
                                style={{
                                  background: 'var(--ds-success)',
                                  opacity: sendingReply === pending.id ? 0.7 : 1
                                }}
                              >
                                {sendingReply === pending.id ? (
                                  <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                    </svg>
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="22" y1="2" x2="11" y2="13"/>
                                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                    </svg>
                                    Approve & Send
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Replies Section Header */}
              {replies.length > 0 && pendingReplies.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  <div style={{
                    background: 'var(--ds-success-bg)',
                    border: '2px solid var(--ds-success)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ds-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--ds-text-primary)' }}>
                      All Replies ({replies.length})
                    </div>
                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--ds-text-secondary)' }}>
                      Received replies from cold outreach
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {replies.length === 0 && pendingReplies.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)', color: 'var(--ds-text-secondary)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: 'var(--spacing-lg)' }}>
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                  <div style={{ fontSize: 'var(--font-lg)', marginBottom: 'var(--spacing-sm)' }}>No replies yet</div>
                  <div style={{ fontSize: 'var(--font-md)' }}>Replies from cold outreach will appear here</div>
                </div>
              )}

              {/* Replies List */}
              {replies.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {replies.map(reply => (
                <div
                  key={reply.id}
                  style={{
                    background: 'var(--ds-bg-surface)',
                    borderRadius: 'var(--container-border-radius)',
                    border: '1px solid var(--ds-success-border)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Reply Header - Always visible */}
                  <div
                    onClick={() => setExpandedReply(expandedReply === reply.id ? null : reply.id)}
                    style={{
                      padding: 'var(--spacing-lg)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', flex: 1 }}>
                      {/* Green reply indicator */}
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'var(--ds-success-bg)',
                        border: '2px solid var(--ds-success)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ds-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 11 12 14 22 4"/>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                      </div>

                      {/* Sender Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--ds-text-primary)' }}>
                            {reply.full_name || reply.email}
                          </span>
                          {reply.company_name && (
                            <span style={{ fontSize: 'var(--font-md)', color: 'var(--ds-text-secondary)' }}>
                              @ {reply.company_name}
                            </span>
                          )}
                          {reply.trade_type && (
                            <span style={{
                              padding: '2px 8px',
                              background: 'var(--ds-accent-primary-light)',
                              border: '1px solid var(--ds-accent-primary-border)',
                              borderRadius: '4px',
                              fontSize: 'var(--font-xs)',
                              color: 'var(--ds-accent-primary)'
                            }}>
                              {reply.trade_type}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--ds-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                          {reply.email}
                          {reply.city && reply.state && ` • ${reply.city}, ${reply.state}`}
                        </div>
                      </div>

                      {/* Reply Preview */}
                      <div style={{
                        flex: 2,
                        fontSize: 'var(--font-md)',
                        color: 'var(--ds-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '400px'
                      }}>
                        {reply.reply_subject && <strong style={{ color: 'var(--ds-text-primary)' }}>{reply.reply_subject}: </strong>}
                        {reply.reply_text?.slice(0, 100) || 'No content'}
                        {(reply.reply_text?.length || 0) > 100 && '...'}
                      </div>

                      {/* Timestamp */}
                      <div style={{
                        fontSize: 'var(--font-sm)',
                        color: 'var(--ds-text-secondary)',
                        textAlign: 'right',
                        flexShrink: 0
                      }}>
                        {new Date(reply.reply_received_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Expand/Collapse Icon */}
                    <div style={{
                      marginLeft: 'var(--spacing-md)',
                      transform: expandedReply === reply.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ds-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedReply === reply.id && (
                    <div style={{
                      padding: 'var(--spacing-lg)',
                      paddingTop: 0,
                      borderTop: '1px solid var(--ds-border-default)'
                    }}>
                      {/* Subject */}
                      {reply.reply_subject && (
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Subject
                          </div>
                          <div style={{ fontSize: 'var(--font-md)', color: 'var(--ds-text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                            {reply.reply_subject}
                          </div>
                        </div>
                      )}

                      {/* Full Reply Text */}
                      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Message
                        </div>
                        <div style={{
                          fontSize: 'var(--font-md)',
                          color: 'var(--ds-text-primary)',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          background: 'var(--ds-bg-subtle)',
                          border: '1px solid var(--ds-border-default)',
                          padding: 'var(--spacing-md)',
                          borderRadius: 'var(--btn-corner-radius)',
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}>
                          {reply.reply_text || 'No content'}
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div style={{
                        display: 'flex',
                        gap: 'var(--spacing-xl)',
                        fontSize: 'var(--font-sm)',
                        color: 'var(--ds-text-secondary)'
                      }}>
                        <div>
                          <span style={{ opacity: 0.7 }}>Replied:</span>{' '}
                          {new Date(reply.reply_received_at).toLocaleString()}
                        </div>
                        {reply.last_dispatched_at && (
                          <div>
                            <span style={{ opacity: 0.7 }}>Originally contacted:</span>{' '}
                            {new Date(reply.last_dispatched_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
              )}
            </>
          )}
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="modal-overlay" onClick={() => setShowNewCampaign(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '560px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header modal-header-sidebar-style">
              <h2 className="modal-title">Create New Campaign</h2>
              <button onClick={() => setShowNewCampaign(false)} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--ds-text-secondary)', fontSize: 'var(--ds-text-sm)', marginBottom: 'var(--ds-space-6)' }}>
                Connect your Instantly campaign to start recruiting technicians
              </p>

              <div className="form-section">
                <div className="form-field">
                  <label className="form-label">Instantly Campaign ID</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="text-input"
                      value={instantlyCampaignId}
                      onChange={(e) => setInstantlyCampaignId(e.target.value)}
                      onBlur={() => validateInstantlyCampaign(instantlyCampaignId)}
                      placeholder="Enter your Instantly campaign ID"
                      style={{
                        borderColor: campaignValid === true ? 'var(--ds-success)' : campaignValid === false ? 'var(--ds-error)' : undefined,
                        paddingRight: '40px'
                      }}
                    />
                    {validatingCampaign && <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-accent-primary)' }}>⟳</div>}
                    {campaignValid === true && <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-success)' }}>✓</div>}
                    {campaignValid === false && <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-error)' }}>✕</div>}
                  </div>
                  {validationError && <div style={{ marginTop: 'var(--ds-space-1)', color: 'var(--ds-error)', fontSize: 'var(--ds-text-xs)' }}>{validationError}</div>}
                  {campaignDetails && (
                    <div style={{ marginTop: 'var(--ds-space-2)', padding: 'var(--ds-space-3)', background: 'var(--ds-success-bg)', border: '1px solid var(--ds-success-border)', borderRadius: 'var(--ds-radius-md)' }}>
                      <div style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-success)', marginBottom: 'var(--ds-space-1)' }}>✓ Campaign found: <strong>{campaignDetails.name}</strong></div>
                      <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-secondary)' }}>Status: {campaignDetails.status} • {campaignDetails.total_leads} leads • {campaignDetails.emails_sent} sent</div>
                    </div>
                  )}
                  <div style={{ marginTop: 'var(--ds-space-1)', fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)' }}>Find this in your Instantly dashboard → Campaign Settings</div>
                </div>

                <div className="form-field">
                  <label className="form-label">Campaign Name</label>
                  <input
                    type="text"
                    className="text-input"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g., Q1 2025 HVAC Recruitment"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Trade Filter</label>
                  <select
                    className="select-input"
                    value={tradeFilter}
                    onChange={(e) => setTradeFilter(e.target.value)}
                  >
                    {TRADES.map(trade => <option key={trade} value={trade}>{trade}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer modal-footer-sidebar-style">
              <button className="btn btn-secondary" onClick={() => setShowNewCampaign(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={createCampaign}
                disabled={!campaignValid || !campaignName.trim()}
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collector Modal */}
      {showCollector && (
        <div className="modal-overlay" onClick={() => !collecting && setShowCollector(false)}>
          <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-sidebar-style">
              <h2 className="modal-title">Collect Technicians</h2>
              <button onClick={() => !collecting && setShowCollector(false)} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <div className="form-field">
                  <label className="form-label">Source</label>
                  <select
                    className="select-input"
                    value={collectorSource}
                    onChange={(e) => setCollectorSource(e.target.value)}
                  >
                    <option value="apify">Apify Google Maps</option>
                  </select>
                  <div style={{ marginTop: 'var(--ds-space-1)', fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)' }}>Uses Apify&apos;s Google Maps scraper (~$4 per 1,000 results)</div>
                </div>

                <div className="form-field">
                  <label className="form-label">Trade</label>
                  <select
                    className="select-input"
                    value={collectorTrade}
                    onChange={(e) => setCollectorTrade(e.target.value)}
                  >
                    {TRADES.map(trade => <option key={trade} value={trade}>{trade}</option>)}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="text-input"
                    value={collectorCity}
                    onChange={(e) => setCollectorCity(e.target.value)}
                    placeholder="Los Angeles"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">State</label>
                  <select
                    className="select-input"
                    value={collectorState}
                    onChange={(e) => setCollectorState(e.target.value)}
                  >
                    {US_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer modal-footer-sidebar-style">
              <button className="btn btn-secondary" onClick={() => setShowCollector(false)} disabled={collecting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={collectTechnicians} disabled={collecting}>
                {collecting ? 'Collecting...' : 'Start Collection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
