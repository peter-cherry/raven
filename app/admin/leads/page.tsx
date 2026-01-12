'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Tab = 'import' | 'verify' | 'cold-leads'

interface StagingStats {
  total: number
  bySource: Record<string, number>
  byTrade: Record<string, number>
  verified: number
  pendingSelection: number
}

interface VerificationStats {
  pendingVerification: number
  verified: number
  attempted: number
  lowConfidence: number
  averageConfidence: number
  hunterAccount: {
    searchesUsed: number
    searchesAvailable: number
  } | null
}

interface ColdLeadStats {
  readyToMove: number
  alreadyMoved: number
  coldLeadsBySource: Record<string, number>
}

interface ImportResult {
  success: boolean
  results?: {
    total: number
    filtered: number
    imported: number
    skipped: number
    duplicates: number
    errors: string[]
  }
  message?: string
  error?: string
}

export default function AdminLeadsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('import')
  const [loading, setLoading] = useState(true)

  // Import tab state
  const [stagingStats, setStagingStats] = useState<StagingStats>({
    total: 0,
    bySource: {},
    byTrade: {},
    verified: 0,
    pendingSelection: 0
  })
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedState, setSelectedState] = useState<'california' | 'florida'>('california')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Verification tab state
  const [verificationStats, setVerificationStats] = useState<VerificationStats | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<any>(null)

  // Cold leads tab state
  const [coldLeadStats, setColdLeadStats] = useState<ColdLeadStats | null>(null)
  const [moving, setMoving] = useState(false)
  const [moveResult, setMoveResult] = useState<any>(null)

  useEffect(() => {
    fetchAllStats()
  }, [])

  async function fetchAllStats() {
    setLoading(true)
    await Promise.all([
      fetchStagingStats(),
      fetchVerificationStats(),
      fetchColdLeadStats()
    ])
    setLoading(false)
  }

  async function fetchStagingStats() {
    try {
      const [caRes, flRes] = await Promise.all([
        fetch('/api/leads/import/california'),
        fetch('/api/leads/import/florida')
      ])
      const [caData, flData] = await Promise.all([caRes.json(), flRes.json()])

      const bySource: Record<string, number> = {}
      const byTrade: Record<string, number> = {}
      let verified = 0
      let pendingSelection = 0

      if (caData.stats) {
        bySource['California (CSLB)'] = caData.stats.total || 0
        Object.entries(caData.stats.byTrade || {}).forEach(([trade, count]) => {
          byTrade[trade] = (byTrade[trade] || 0) + (count as number)
        })
        verified += caData.stats.verified || 0
        pendingSelection += caData.stats.pendingSelection || 0
      }

      if (flData.stats) {
        bySource['Florida (DBPR)'] = flData.stats.total || 0
        Object.entries(flData.stats.byTrade || {}).forEach(([trade, count]) => {
          byTrade[trade] = (byTrade[trade] || 0) + (count as number)
        })
        verified += flData.stats.verified || 0
        pendingSelection += flData.stats.pendingSelection || 0
      }

      setStagingStats({
        total: Object.values(bySource).reduce((a, b) => a + b, 0),
        bySource,
        byTrade,
        verified,
        pendingSelection
      })
    } catch (error) {
      console.error('Error fetching staging stats:', error)
    }
  }

  async function fetchVerificationStats() {
    try {
      const res = await fetch('/api/leads/verify')
      const data = await res.json()
      if (data.success) {
        setVerificationStats({
          ...data.stats,
          hunterAccount: data.hunterAccount
        })
      }
    } catch (error) {
      console.error('Error fetching verification stats:', error)
    }
  }

  async function fetchColdLeadStats() {
    try {
      const res = await fetch('/api/leads/move-to-cold')
      const data = await res.json()
      if (data.success) {
        setColdLeadStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching cold lead stats:', error)
    }
  }

  // Import handlers (same as before but updated for staging table)
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const lines = text.split('\n')
      const isFloridaFile = selectedState === 'florida'

      // FL DBPR columns: A=ID, B=License Type, C=First, D=Middle, E=Last, F=Suffix,
      // G=Address1, H=Address2, I=City, J=State, K=blank, L=LICENSE_NUMBER, M=unknown, N=Phone
      const flColumnMap = [
        'ROW_ID', 'OCCUPATION_CODE', 'FIRST_NAME', 'MIDDLE_NAME', 'LAST_NAME',
        'SUFFIX', 'ADDRESS_1', 'ADDRESS_2', 'CITY', 'STATE', 'BLANK_1', 'LICENSE_NUMBER',
        'UNKNOWN_1', 'PHONE', 'LICENSE_STATUS'
      ]

      const caHeaderMap: Record<string, string> = {
        'LicenseNo': 'LICENSE_NUMBER', 'LicenseNumber': 'LICENSE_NUMBER', 'License Number': 'LICENSE_NUMBER',
        'BusinessName': 'BUSINESS_NAME', 'Business Name': 'BUSINESS_NAME', 'FullBusinessName': 'BUSINESS_NAME',
        'MailingAddress': 'ADDRESS', 'Address': 'ADDRESS', 'Address1': 'ADDRESS', 'Address2': 'ADDRESS2',
        'City': 'CITY', 'State': 'STATE', 'ZIPCode': 'ZIP', 'ZIP': 'ZIP', 'Zip': 'ZIP',
        'BusinessPhone': 'PHONE', 'Phone': 'PHONE',
        'IssueDate': 'ISSUE_DATE', 'ExpirationDate': 'EXPIRE_DATE', 'ExpireDate': 'EXPIRE_DATE',
        'LicenseStatus': 'LICENSE_STATUS', 'Status': 'LICENSE_STATUS', 'PrimaryStatus': 'LICENSE_STATUS',
        'Classification': 'PRIMARY_CLASSIFICATION', 'Classifications': 'PRIMARY_CLASSIFICATION',
        'Classifications(s)': 'PRIMARY_CLASSIFICATION', 'LicenseType': 'PRIMARY_CLASSIFICATION',
        'PersonnelName': 'PERSONNEL_NAME', 'PersonnelTitle': 'PERSONNEL_TITLE',
      }

      let headers: string[]
      let startLine: number

      if (isFloridaFile) {
        headers = flColumnMap
        startLine = 0
      } else {
        const headerLine = lines[0]
        const rawHeaders: string[] = []
        let current = ''
        let inQuotes = false
        for (const char of headerLine) {
          if (char === '"') inQuotes = !inQuotes
          else if (char === ',' && !inQuotes) { rawHeaders.push(current.trim().replace(/"/g, '')); current = '' }
          else current += char
        }
        rawHeaders.push(current.trim().replace(/"/g, ''))
        headers = rawHeaders.map(h => caHeaderMap[h] || h)
        startLine = 1
      }

      const records = []
      for (let i = startLine; i < lines.length; i++) {
        if (!lines[i].trim()) continue
        const values: string[] = []
        let current = ''
        let inQuotes = false
        for (const char of lines[i]) {
          if (char === '"') inQuotes = !inQuotes
          else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
          else current += char
        }
        values.push(current.trim())

        const record: Record<string, string> = {}
        headers.forEach((header, index) => {
          record[header] = values[index]?.replace(/"/g, '') || ''
        })
        records.push(record)
      }

      const endpoint = selectedState === 'california' ? '/api/leads/import/california' : '/api/leads/import/florida'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records, tradeFilter: ['HVAC', 'Plumbing', 'Electrical', 'General'] })  // No limit - import all matching records, all trades
      })

      const result = await response.json()
      setImportResult(result)
      if (result.success) fetchStagingStats()
    } catch (error) {
      setImportResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }

    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Verification handler
  async function handleVerify() {
    setVerifying(true)
    setVerifyResult(null)

    try {
      const response = await fetch('/api/leads/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10, minConfidence: 70 })
      })
      const result = await response.json()
      setVerifyResult(result)
      if (result.success) {
        fetchVerificationStats()
        fetchColdLeadStats()
      }
    } catch (error) {
      setVerifyResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setVerifying(false)
  }

  // Move to cold leads handler
  async function handleMoveToCold() {
    setMoving(true)
    setMoveResult(null)

    try {
      const response = await fetch('/api/leads/move-to-cold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50, minConfidence: 70 })
      })
      const result = await response.json()
      setMoveResult(result)
      if (result.success) {
        fetchColdLeadStats()
        fetchVerificationStats()
      }
    } catch (error) {
      setMoveResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setMoving(false)
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'import', label: 'Import', count: stagingStats.total },
    { id: 'verify', label: 'Verification', count: verificationStats?.verified || 0 },
    { id: 'cold-leads', label: 'Cold Leads', count: coldLeadStats?.readyToMove || 0 }
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ds-text-primary)', marginBottom: 'var(--spacing-sm)' }}>
          Lead Pipeline
        </h1>
        <p style={{ fontSize: 'var(--font-md)', color: 'var(--ds-text-secondary)' }}>
          Import → Verify → Cold Leads
        </p>
      </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xl)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 'var(--spacing-md)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                borderRadius: 'var(--btn-corner-radius)',
                border: 'none',
                background: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)'
              }}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--accent-primary)',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 'var(--font-xs)'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)' }}>
              <StatCard label="Total in Staging" value={stagingStats.total} loading={loading} />
              <StatCard label="Verified" value={stagingStats.verified} loading={loading} color="#10B981" />
              <StatCard label="Pending" value={stagingStats.pendingSelection} loading={loading} color="#F59E0B" />
            </div>

            {/* By Source & Trade */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-2xl)' }}>
              <DataCard title="By State Source" data={stagingStats.bySource} loading={loading} />
              <DataCard title="By Trade" data={stagingStats.byTrade} loading={loading} />
            </div>

            {/* Import Section */}
            <div style={{ background: 'var(--container-bg)', border: 'var(--container-border)', borderRadius: 'var(--container-border-radius)', padding: 'var(--spacing-xl)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>
                Import State License Data → Staging Table
              </h3>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <select value={selectedState} onChange={(e) => setSelectedState(e.target.value as 'california' | 'florida')}
                  style={{ padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--btn-corner-radius)', border: 'var(--container-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  <option value="california">California (CSLB)</option>
                  <option value="florida">Florida (DBPR)</option>
                </select>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} disabled={importing}
                  style={{ padding: 'var(--spacing-sm)', borderRadius: 'var(--btn-corner-radius)', border: 'var(--container-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: importing ? 'not-allowed' : 'pointer' }} />
                {importing && <span style={{ color: 'var(--accent-primary)' }}>Importing...</span>}
              </div>
              {importResult && <ResultBox result={importResult} />}
              <div style={{ marginTop: 'var(--spacing-lg)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                Download: <a href="https://www.cslb.ca.gov/onlineservices/dataportal/ContractorList" target="_blank" style={{ color: 'var(--accent-primary)' }}>CA CSLB</a> | <a href="https://www2.myfloridalicense.com/construction-industry/public-records/" target="_blank" style={{ color: 'var(--accent-primary)' }}>FL DBPR</a>
              </div>
            </div>
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verify' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)' }}>
              <StatCard label="Pending Verify" value={verificationStats?.pendingVerification || 0} loading={loading} color="#F59E0B" />
              <StatCard label="Verified" value={verificationStats?.verified || 0} loading={loading} color="#10B981" />
              <StatCard label="Avg Confidence" value={`${verificationStats?.averageConfidence || 0}%`} loading={loading} />
              <StatCard label="Hunter.io Credits" value={verificationStats?.hunterAccount ? `${verificationStats.hunterAccount.searchesAvailable}` : 'N/A'} loading={loading} color="#6C72C9" />
            </div>

            <div style={{ background: 'var(--container-bg)', border: 'var(--container-border)', borderRadius: 'var(--container-border-radius)', padding: 'var(--spacing-xl)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>
                Email Verification (Hunter.io)
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                Find email addresses for contractors using Hunter.io API.
              </p>
              <button onClick={handleVerify} disabled={verifying || (verificationStats?.pendingVerification || 0) === 0}
                style={{ padding: 'var(--spacing-sm) var(--spacing-xl)', borderRadius: 'var(--btn-corner-radius)', border: 'none', background: verifying ? 'rgba(108, 114, 201, 0.3)' : 'linear-gradient(135deg, #6C72C9 0%, #9896D5 100%)', color: 'white', fontWeight: 'var(--font-weight-semibold)', cursor: verifying ? 'not-allowed' : 'pointer' }}>
                {verifying ? 'Verifying...' : 'Verify 10 Leads'}
              </button>
              {verifyResult && (
                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                  <ResultBox result={verifyResult} />
                  {verifyResult.results && verifyResult.results.length > 0 && (
                    <div style={{ marginTop: 'var(--spacing-md)', maxHeight: 300, overflowY: 'auto' }}>
                      {verifyResult.results.map((r: any) => (
                        <div key={r.id} style={{ padding: 'var(--spacing-sm)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{r.businessName}</span>
                          <span style={{ color: r.status === 'found' ? '#10B981' : '#EF4444' }}>
                            {r.email || r.error || 'Not found'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cold Leads Tab */}
        {activeTab === 'cold-leads' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-2xl)' }}>
              <StatCard label="Ready to Move" value={coldLeadStats?.readyToMove || 0} loading={loading} color="#10B981" />
              <StatCard label="Already Moved" value={coldLeadStats?.alreadyMoved || 0} loading={loading} />
            </div>

            {coldLeadStats?.coldLeadsBySource && Object.keys(coldLeadStats.coldLeadsBySource).length > 0 && (
              <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <DataCard title="Cold Leads by Source" data={coldLeadStats.coldLeadsBySource} loading={loading} />
              </div>
            )}

            <div style={{ background: 'var(--container-bg)', border: 'var(--container-border)', borderRadius: 'var(--container-border-radius)', padding: 'var(--spacing-xl)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>
                Move to Cold Leads
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                Move verified contractors to cold_leads table for Instantly email campaigns.
              </p>
              <button onClick={handleMoveToCold} disabled={moving || (coldLeadStats?.readyToMove || 0) === 0}
                style={{ padding: 'var(--spacing-sm) var(--spacing-xl)', borderRadius: 'var(--btn-corner-radius)', border: 'none', background: moving ? 'rgba(108, 114, 201, 0.3)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', fontWeight: 'var(--font-weight-semibold)', cursor: moving ? 'not-allowed' : 'pointer' }}>
                {moving ? 'Moving...' : 'Move 50 to Cold Leads'}
              </button>
              {moveResult && (
                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                  <ResultBox result={moveResult} />
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  )
}

// Helper Components
function StatCard({ label, value, loading, color }: { label: string; value: number | string; loading: boolean; color?: string }) {
  return (
    <div style={{ background: 'var(--container-bg)', border: 'var(--container-border)', borderRadius: 'var(--container-border-radius)', padding: 'var(--spacing-lg)' }}>
      <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>{label}</div>
      <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 'var(--font-weight-bold)', color: color || 'var(--text-primary)' }}>
        {loading ? '...' : typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  )
}

function DataCard({ title, data, loading }: { title: string; data: Record<string, number>; loading: boolean }) {
  return (
    <div style={{ background: 'var(--container-bg)', border: 'var(--container-border)', borderRadius: 'var(--container-border-radius)', padding: 'var(--spacing-lg)' }}>
      <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>{title}</h3>
      {Object.entries(data).map(([key, count]) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-sm) 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{key}</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>{count.toLocaleString()}</span>
        </div>
      ))}
      {Object.keys(data).length === 0 && !loading && <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No data</div>}
    </div>
  )
}

function ResultBox({ result }: { result: { success: boolean; message?: string; error?: string; results?: any } }) {
  return (
    <div style={{
      padding: 'var(--spacing-md)',
      borderRadius: 'var(--btn-corner-radius)',
      background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      border: `1px solid ${result.success ? '#10B981' : '#EF4444'}`
    }}>
      <div style={{ fontWeight: 'var(--font-weight-semibold)', color: result.success ? '#10B981' : '#EF4444', marginBottom: 'var(--spacing-xs)' }}>
        {result.success ? 'Success' : 'Failed'}
      </div>
      {result.message && <div style={{ color: 'var(--text-secondary)' }}>{result.message}</div>}
      {result.error && <div style={{ color: '#EF4444' }}>{result.error}</div>}
      {result.results && typeof result.results === 'object' && !Array.isArray(result.results) && (
        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
          {Object.entries(result.results).filter(([k]) => typeof result.results[k] !== 'object').map(([k, v]) => `${k}: ${v}`).join(' | ')}
        </div>
      )}
    </div>
  )
}
