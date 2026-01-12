'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import { CloseButton } from '@/components/CloseButton';
import { JobDetailOverlay } from '@/components/JobDetailOverlay';
import { useSearchParams, useRouter } from 'next/navigation';

interface JobRow {
  id: string;
  job_title: string;
  address_text: string | null;
  city: string | null;
  state: string | null;
  trade_needed: string | null;
  job_status: string | null;
  scheduled_at: string | null;
  description: string | null;
  created_at: string;
}

interface JobsOverlayProps {
  onClose: () => void;
}

const JOBS_PER_PAGE = 20;
const STROKE_SUBTLE = 'rgba(249, 243, 229, 0.33)'; // CSS variable --stroke-subtle

export default function JobsOverlay({ onClose }: JobsOverlayProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTrade, setFilterTrade] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobRow | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get user's org_id
  useEffect(() => {
    const getUserOrg = async () => {
      // Development mode - use hardcoded org_id since fake user doesn't have real Supabase session
      if (process.env.NODE_ENV === 'development') {
        console.log('[JobsOverlay] Dev mode: using hardcoded org_id');
        setUserOrgId('152ca2e3-a371-4167-99c5-0890afcd83d7');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: membership, error } = await supabase
          .from('org_memberships')
          .select('org_id')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('[JobsOverlay] Error fetching org_id:', error);
        }

        if (membership) {
          setUserOrgId(membership.org_id);
        }
      }
    };
    getUserOrg();
  }, []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for job_id in URL and auto-open that job
  useEffect(() => {
    if (!userOrgId) return; // Wait for org_id

    const jobIdParam = searchParams?.get('job_id');
    if (jobIdParam && !selectedJobId) {
      // Fetch the specific job via API route
      fetch(`/api/jobs/${jobIdParam}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setSelectedJob(data);
            setSelectedJobId(data.id);
            setIsExpanding(true);
          }
        })
        .catch(error => {
          console.error('[JobsOverlay] Failed to fetch job:', error);
        });
    }
  }, [searchParams, selectedJobId, userOrgId]);

  useEffect(() => {
    if (userOrgId) {
      loadJobs();
    }
  }, [currentPage, userOrgId]);

  async function loadJobs() {
    if (!userOrgId) return; // Wait for org_id

    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/list?page=${currentPage}&perPage=${JOBS_PER_PAGE}&orgId=${userOrgId}`);
      const data = await response.json();

      if (response.ok && !data.error) {
        setJobs(data.jobs || []);
        setTotalCount(data.totalCount || 0);
      } else {
        console.error('[JobsOverlay] Failed to load jobs:', data.error);
        setJobs([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('[JobsOverlay] Error loading jobs:', error);
      setJobs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredJobs = jobs.filter(job => {
    const query = debouncedSearch.toLowerCase();
    const matchesSearch = (
      job.job_title?.toLowerCase().includes(query) ||
      job.id?.toLowerCase().includes(query) ||
      job.trade_needed?.toLowerCase().includes(query) ||
      job.city?.toLowerCase().includes(query)
    );

    const matchesStatus = !filterStatus || job.job_status?.toLowerCase() === filterStatus.toLowerCase();
    const matchesTrade = !filterTrade || job.trade_needed?.toLowerCase().includes(filterTrade.toLowerCase());
    const matchesCity = !filterCity || job.city?.toLowerCase().includes(filterCity.toLowerCase());

    return matchesSearch && matchesStatus && matchesTrade && matchesCity;
  });

  // Get card styling based on status - EXACT from Figma
  const getCardStyles = (status: string | null) => {
    const statusLower = status?.toLowerCase() || 'pending';

    // Orange = Active (Assigned) - Technician is assigned and working
    if (statusLower === 'active' || statusLower === 'assigned' || statusLower === 'in_progress') {
      return {
        cardBg: 'var(--job-status-active-bg)',
        rectBg: 'var(--job-status-active-bg)',
        innerBg: 'linear-gradient(to top right, var(--job-status-active-inner-start) 0%, #ECCB9F 19%, #EAC9A2 19%, #EDC89E 31%, var(--job-status-active-inner-start) 96%)',
        innerStroke: 'rgba(255, 249, 243, 1)',
        textColor: '#F9F3E5',
        statusColor: '#C4B49D',
        statusFontSize: 10,
        statusTop: 5,
        statusLeft: 5,
        borderRadius: '10px 10px 0px 0px',
        innerBorderRadius: '10px 10px 0px 0px',
        cardStroke: 'var(--container-border)',
        innerStrokeWidth: '1px',
        innerWidth: 105,
        innerHeight: 86,
        innerTop: 20,
        rectTop: 0,
        rectLeft: -1
      };
    } else if (statusLower === 'unassigned' || statusLower === 'matching' || statusLower === 'pending') {
      // Purple = Unassigned - Work order created but no tech assigned
      return {
        cardBg: 'var(--job-status-unassigned-bg)',
        rectBg: 'rgba(139, 109, 217, 0.06)',
        innerBg: 'var(--job-status-unassigned-inner)',
        innerStroke: 'rgba(106, 98, 136, 1)',
        textColor: '#F9F3E5',
        statusColor: '#918EB8',
        statusFontSize: 10,
        statusTop: 5,
        statusLeft: 5,
        borderRadius: '10px 10px 0px 0px',
        innerBorderRadius: '10px 10px 0px 0px',
        cardStroke: 'var(--container-border)',
        innerStrokeWidth: '1px',
        innerWidth: 105,
        innerHeight: 86,
        innerTop: 20,
        rectTop: 0,
        rectLeft: -1
      };
    } else if (statusLower === 'completed') {
      // Job Card 3 - Completed (Green) - matching orange dimensions
      return {
        cardBg: 'var(--job-status-completed-bg)',
        rectBg: 'linear-gradient(180deg, rgba(121, 148, 123, 1) 0%, rgba(38, 46, 38, 1) 100%)',
        innerBg: 'var(--job-status-completed-inner)',
        innerStroke: 'none',
        textColor: '#F9F3E5',
        statusColor: '#D5F2D8',
        statusFontSize: 10,
        statusTop: 5,
        statusLeft: 5,
        borderRadius: '10px 10px 0px 0px',
        innerBorderRadius: '10px 10px 0px 0px',
        cardStroke: 'var(--container-border)',
        innerStrokeWidth: '0px',
        innerWidth: 105,
        innerHeight: 86,
        innerTop: 20,
        rectTop: 0,
        rectLeft: -1
      };
    } else if (statusLower === 'archived') {
      // Gray = Archived
      return {
        cardBg: 'var(--job-status-archived-bg)',
        rectBg: 'var(--job-status-archived-inner)',
        innerBg: 'var(--job-status-archived-inner)',
        innerStroke: 'none',
        textColor: 'rgba(249, 243, 229, 0.28)',
        statusColor: '#C9C9C9',
        statusFontSize: 10,
        statusTop: 5,
        statusLeft: 5,
        borderRadius: '10px 10px 0px 0px',
        innerBorderRadius: '10px 10px 0px 0px',
        cardStroke: 'var(--container-border)',
        innerStrokeWidth: '0px',
        innerWidth: 105,
        innerHeight: 86,
        innerTop: 20,
        rectTop: 0,
        rectLeft: -1
      };
    } else {
      // Default to Purple (Unassigned) for any unknown status
      return {
        cardBg: 'var(--job-status-unassigned-bg)',
        rectBg: 'rgba(139, 109, 217, 0.06)',
        innerBg: 'var(--job-status-unassigned-inner)',
        innerStroke: 'rgba(106, 98, 136, 1)',
        textColor: '#F9F3E5',
        statusColor: '#918EB8',
        statusFontSize: 10,
        statusTop: 5,
        statusLeft: 5,
        borderRadius: '10px 10px 0px 0px',
        innerBorderRadius: '10px 10px 0px 0px',
        cardStroke: 'var(--container-border)',
        innerStrokeWidth: '1px',
        innerWidth: 105,
        innerHeight: 86,
        innerTop: 20,
        rectTop: 0,
        rectLeft: -1
      };
    }
  };


  return (
    <>
      {/* Job Detail Overlay - Replaces Jobs Overlay when expanding */}
      <AnimatePresence>
        {selectedJob && (
          <JobDetailOverlay
            job={selectedJob}
            onClose={() => {
              setSelectedJob(null);
              setSelectedJobId(null);
              setIsExpanding(false);
              // Remove job_id from URL to prevent re-opening
              router.push('/?overlay=jobs');
            }}
            onStatusChange={() => {
              // Reload jobs to reflect the status change
              loadJobs();
            }}
          />
        )}
      </AnimatePresence>

      {/* Jobs List Overlay - Fades out when expanding */}
      {!isExpanding && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            background: 'transparent', // NO backdrop
            pointerEvents: 'none' // Let clicks pass through
          }}
          onClick={onClose}
        >
          <motion.div
        className="jobs-overlay-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        style={{
          width: 615,
          maxWidth: 'calc(100vw - 32px)',
          height: 772,
          maxHeight: 'calc(100vh - 80px)',
          position: 'relative',
          background: 'rgba(47, 47, 47, 0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          filter: 'brightness(1.15)',
          border: '1px solid rgba(154, 150, 213, 0.3)',
          borderRadius: 'var(--modal-border-radius)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto' // Card itself captures clicks
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Close Button */}
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <CloseButton onClick={onClose} />
        </div>

        {/* Title */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '24px 28px 20px',
            fontFamily: 'var(--font-section-title)',
            fontSize: 'var(--font-section-title-size)',
            fontWeight: 'var(--font-section-title-weight)',
            color: 'var(--text-primary)',
            lineHeight: '1.329em'
          }}
        >
          Work Orders
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', zIndex: 1, padding: '0 28px 20px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 40,
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px'
            }}
          >
            {/* Search Icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              style={{ flexShrink: 0 }}
            >
              <circle cx="8.5" cy="8.5" r="5.5" stroke="var(--text-primary)" strokeWidth="2"/>
              <path d="M13 13L17 17" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round"/>
            </svg>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="jobs-search-input"
              style={{
                flex: 1,
                marginLeft: 12,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontFamily: 'var(--font-text-body)',
                fontWeight: 700
              }}
            />

            {/* Filter Icon Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="filter-toggle-btn"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                transition: 'color var(--transition-hover)'
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                style={{ flexShrink: 0, display: 'block' }}
              >
                <path d="M2 3H16M4 7H14M6 11H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div style={{
              margin: '12px 0 0',
              padding: 16,
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)'
            }}>
              <div style={{ display: 'grid', gap: 12 }}>
                {/* Status Filter */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                    fontFamily: 'var(--font-text-body)'
                  }}>Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--container-bg)',
                      border: 'var(--container-border)',
                      borderRadius: 'var(--container-border-radius)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-text-body-size)',
                      fontFamily: 'var(--font-text-body)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="matching">Matching</option>
                    <option value="assigned">Assigned</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Trade Filter */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                    fontFamily: 'var(--font-text-body)'
                  }}>Trade</label>
                  <input
                    type="text"
                    value={filterTrade}
                    onChange={(e) => setFilterTrade(e.target.value)}
                    placeholder="e.g., HVAC, Plumbing"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--container-bg)',
                      border: 'var(--container-border)',
                      borderRadius: 'var(--container-border-radius)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-text-body-size)',
                      fontFamily: 'var(--font-text-body)',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                </div>

                {/* City Filter */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                    fontFamily: 'var(--font-text-body)'
                  }}>City</label>
                  <input
                    type="text"
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    placeholder="e.g., Miami"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--container-bg)',
                      border: 'var(--container-border)',
                      borderRadius: 'var(--container-border-radius)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-text-body-size)',
                      fontFamily: 'var(--font-text-body)',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={() => {
                    setFilterStatus('');
                    setFilterTrade('');
                    setFilterCity('');
                  }}
                  style={{
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'var(--container-border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: 11,
                    fontFamily: 'var(--font-text-body)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginTop: 4
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--container-hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Most Recent Label */}
        <div
          style={{
            padding: '0 28px 12px',
            fontFamily: 'var(--font-text-body)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: '1.21em'
          }}
        >
          Most Recent
        </div>

        {/* Job Cards Grid - Scrollable */}
        <div
          className="jobs-grid"
          style={{
            position: 'relative',
            zIndex: 1,
            flex: 1,
            overflowY: 'auto',
            padding: '0 28px 28px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            alignContent: 'start'
          }}
        >
          {loading ? (
            // Loading skeleton - 6 placeholder cards
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                style={{
                  width: '100%',
                  height: isMobile ? 88 : 106,
                  background: 'rgba(178, 173, 201, 0.1)',
                  border: 'var(--container-border)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}
              >
                <div
                  style={{
                    width: isMobile ? 87 : 105,
                    height: isMobile ? 72 : 86,
                    background: 'rgba(178, 173, 201, 0.15)',
                    borderRadius: 8
                  }}
                />
              </div>
            ))
          ) : filteredJobs.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState
                icon="jobs"
                title={jobs.length === 0 ? "No jobs yet" : "No matching jobs"}
                description={
                  jobs.length === 0
                    ? "Get started by creating your first work order. Click the search bar and select 'Create WO' to begin."
                    : "No jobs match your current filters. Try adjusting your search criteria or clearing the filters."
                }
                actionLabel={jobs.length === 0 ? "Create Work Order" : "Clear Filters"}
                onAction={() => {
                  if (jobs.length === 0) {
                    onClose();
                    // User will see the search bar and can click "Create WO"
                  } else {
                    setSearchQuery('');
                    setFilterStatus('');
                    setFilterTrade('');
                    setFilterCity('');
                  }
                }}
                secondaryActionLabel={jobs.length === 0 ? undefined : "View All Jobs"}
                onSecondaryAction={() => {
                  setSearchQuery('');
                  setFilterStatus('');
                  setFilterTrade('');
                  setFilterCity('');
                }}
              />
            </div>
          ) : (
            filteredJobs.slice(0, 12).map((job) => {
            const styles = getCardStyles(job.job_status);
            const cardWidth = isMobile ? 140 : 169;
            const cardHeight = isMobile ? 88 : 106;
            const innerWidth = isMobile ? 87 : 105;
            const innerHeight = isMobile ? 72 : 86;
            const innerTop = isMobile ? 16 : styles.innerTop;

            return (
              <div
                key={job.id}
                style={{
                  width: '100%',
                  overflow: 'visible',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <div
                  onClick={() => {
                    setSelectedJob(job);
                    setSelectedJobId(job.id);
                    setIsExpanding(true);
                  }}
                  style={{
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'block'
                  }}
                >
                  <div
                    style={{
                      width: cardWidth,
                      height: cardHeight,
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      overflow: 'visible'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {/* Card Background with Gradient */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: cardWidth,
                        height: cardHeight,
                        background: styles.cardBg,
                        borderRadius: styles.borderRadius,
                        border: styles.cardStroke,
                        zIndex: 0
                      }}
                    />

                    {/* Status Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: styles.statusTop,
                        left: styles.statusLeft,
                        fontSize: styles.statusFontSize,
                        fontFamily: 'var(--font-text-body)',
                        fontWeight: 700,
                        color: styles.statusColor,
                        textTransform: 'capitalize',
                        lineHeight: '1.21em',
                        zIndex: 4
                      }}
                    >
                      {job.job_status || 'Pending'}
                    </div>

                    {/* Inner Card Rectangle */}
                    <div
                      style={{
                        position: 'absolute',
                        top: innerTop,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: innerWidth,
                        height: innerHeight,
                        background: styles.innerBg,
                        borderTop: styles.innerStroke !== 'none' ? `${styles.innerStrokeWidth} solid ${styles.innerStroke}` : 'none',
                        borderLeft: styles.innerStroke !== 'none' ? `${styles.innerStrokeWidth} solid ${styles.innerStroke}` : 'none',
                        borderRight: styles.innerStroke !== 'none' ? `${styles.innerStrokeWidth} solid ${styles.innerStroke}` : 'none',
                        borderBottom: 'none',
                        borderRadius: styles.innerBorderRadius,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 3
                      }}
                    >
                      {/* WO Number and Title Container */}
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: isMobile ? '6px' : '8px',
                          gap: isMobile ? '2px' : '4px'
                        }}
                      >
                        {/* WO Number */}
                        <div style={{
                          fontFamily: 'var(--font-section-title)',
                          fontSize: isMobile ? '10px' : '11px',
                          fontWeight: 'var(--font-section-title-weight)',
                          letterSpacing: '0.3px',
                          color: styles.textColor,
                          textAlign: 'center',
                          whiteSpace: 'nowrap'
                        }}>
                          WO-{job.id.slice(0, 8).toUpperCase()}
                        </div>

                        {/* Job Title - with line breaks for long text */}
                        <div style={{
                          fontFamily: 'var(--font-text-body)',
                          fontSize: (() => {
                            const title = job.job_title || 'Untitled';
                            if (title.length > 30) return isMobile ? '7px' : '8px';
                            if (title.length > 20) return isMobile ? '8px' : '9px';
                            return isMobile ? '9px' : '10px';
                          })(),
                          fontWeight: 'var(--font-weight-regular)',
                          color: styles.textColor,
                          opacity: 0.9,
                          textAlign: 'center',
                          lineHeight: '1.3',
                          width: '100%',
                          maxHeight: isMobile ? '32px' : '40px',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          wordBreak: 'break-word',
                          padding: '0 2px'
                        }}>
                          {job.job_title || 'Untitled'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }))}
        </div>

        {/* Pagination Controls */}
        {totalCount > JOBS_PER_PAGE && (
          <div
            style={{
              padding: '20px 28px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--container-border)',
            }}
          >
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                background: currentPage === 1 ? 'var(--container-bg)' : 'var(--container-hover-bg)',
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: '10px 20px',
                color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                fontFamily: 'var(--font-text-body)',
                fontWeight: 600,
                fontSize: 'var(--font-text-title-size)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-hover)',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = 'var(--container-active-hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = 'var(--container-hover-bg)';
                }
              }}
            >
              ← Previous
            </button>

            <div style={{
              color: 'var(--text-primary)',
              fontSize: 'var(--font-text-title-size)',
              fontFamily: 'var(--font-text-body)',
              fontWeight: 600
            }}>
              Page {currentPage} of {Math.ceil(totalCount / JOBS_PER_PAGE)}
              <span style={{
                color: 'var(--text-secondary)',
                marginLeft: 8,
                fontSize: 'var(--font-text-body-size)'
              }}>
                ({totalCount} total jobs)
              </span>
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / JOBS_PER_PAGE), p + 1))}
              disabled={currentPage >= Math.ceil(totalCount / JOBS_PER_PAGE)}
              style={{
                background: currentPage >= Math.ceil(totalCount / JOBS_PER_PAGE) ? 'var(--container-bg)' : 'var(--container-hover-bg)',
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: '10px 20px',
                color: currentPage >= Math.ceil(totalCount / JOBS_PER_PAGE) ? 'var(--text-secondary)' : 'var(--text-primary)',
                fontFamily: 'var(--font-text-body)',
                fontWeight: 600,
                fontSize: 'var(--font-text-title-size)',
                cursor: currentPage >= Math.ceil(totalCount / JOBS_PER_PAGE) ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-hover)',
              }}
              onMouseEnter={(e) => {
                if (currentPage < Math.ceil(totalCount / JOBS_PER_PAGE)) {
                  e.currentTarget.style.background = 'var(--container-active-hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage < Math.ceil(totalCount / JOBS_PER_PAGE)) {
                  e.currentTarget.style.background = 'var(--container-hover-bg)';
                }
              }}
            >
              Next →
            </button>
          </div>
        )}

      </motion.div>
    </div>
      )}
    </>
  );
}
