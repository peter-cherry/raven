'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import { JobDetailOverlay } from '@/components/JobDetailOverlay';

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

const JOBS_PER_PAGE = 15;

// Status configuration for badges
const getStatusConfig = (status: string | null) => {
  const statusLower = status?.toLowerCase() || 'pending';
  
  if (statusLower === 'active' || statusLower === 'assigned' || statusLower === 'in_progress') {
    return { label: 'Assigned', class: 'badge-warning' };
  } else if (statusLower === 'unassigned' || statusLower === 'matching' || statusLower === 'pending') {
    return { label: 'Pending', class: 'badge-primary' };
  } else if (statusLower === 'completed') {
    return { label: 'Completed', class: 'badge-success' };
  } else if (statusLower === 'archived') {
    return { label: 'Archived', class: 'badge-default' };
  }
  return { label: 'Pending', class: 'badge-primary' };
};

export default function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTrade, setFilterTrade] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Job detail
  const [selectedJob, setSelectedJob] = useState<JobRow | null>(null);

  // Redirect if not authenticated (skip in mock mode)
  useEffect(() => {
    const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
    if (!user && !isMockMode) {
      router.push('/login?returnUrl=/jobs');
    }
  }, [user, router]);

  // Get user's org_id
  useEffect(() => {
    const getUserOrg = async () => {
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
        setUserOrgId('152ca2e3-a371-4167-99c5-0890afcd83d7');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: membership } = await supabase
          .from('org_memberships')
          .select('org_id')
          .eq('user_id', user.id)
          .single();

        if (membership) {
          setUserOrgId(membership.org_id);
        }
      }
    };
    getUserOrg();
  }, []);

  // Load jobs
  useEffect(() => {
    if (userOrgId) {
      loadJobs();
    }
  }, [currentPage, userOrgId]);

  async function loadJobs() {
    if (!userOrgId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/list?page=${currentPage}&perPage=${JOBS_PER_PAGE}&orgId=${userOrgId}`);
      const data = await response.json();

      if (response.ok && !data.error) {
        setJobs(data.jobs || []);
        setTotalCount(data.totalCount || 0);
      } else {
        setJobs([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  // Check URL for job_id to auto-open
  useEffect(() => {
    if (!userOrgId) return;
    
    const jobIdParam = searchParams?.get('id');
    if (jobIdParam && !selectedJob) {
      fetch(`/api/jobs/${jobIdParam}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setSelectedJob(data);
          }
        })
        .catch(console.error);
    }
  }, [searchParams, userOrgId, selectedJob]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter jobs
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

    return matchesSearch && matchesStatus && matchesTrade;
  });

  const totalPages = Math.ceil(totalCount / JOBS_PER_PAGE);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <>
      {/* Job Detail Panel */}
      {selectedJob && (
        <JobDetailOverlay
          job={selectedJob}
          onClose={() => {
            setSelectedJob(null);
            router.push('/jobs');
          }}
          onStatusChange={() => loadJobs()}
        />
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-content">
            <div className="page-header-info">
              <h1 className="page-header-title">Work Orders</h1>
              <p className="page-header-description">
                Manage and track all your work orders in one place
              </p>
            </div>
            <div className="page-header-actions">
              <Link href="/?create=true" className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Work Order
              </Link>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="card" style={{ marginBottom: 'var(--ds-space-6)' }}>
          <div style={{ padding: 'var(--ds-space-4) var(--ds-space-5)', display: 'flex', gap: 'var(--ds-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div className="search-input-wrapper" style={{ flex: '1', minWidth: '240px', maxWidth: '400px' }}>
              <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search jobs by title, ID, trade, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="matching">Matching</option>
              <option value="assigned">Assigned</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            {/* Trade Filter */}
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={filterTrade}
              onChange={(e) => setFilterTrade(e.target.value)}
            >
              <option value="">All Trades</option>
              <option value="hvac">HVAC</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="roofing">Roofing</option>
              <option value="appliance">Appliance Repair</option>
            </select>

            {/* Results count */}
            <span style={{ color: 'var(--ds-text-tertiary)', fontSize: 'var(--ds-text-sm)', marginLeft: 'auto' }}>
              {totalCount} total • Showing {filteredJobs.length}
            </span>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="table-container">
          {loading ? (
            <div style={{ padding: 'var(--ds-space-12)', textAlign: 'center' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                border: '3px solid var(--ds-border-default)', 
                borderTopColor: 'var(--ds-accent-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto var(--ds-space-4)'
              }} />
              <p style={{ color: 'var(--ds-text-secondary)' }}>Loading jobs...</p>
              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="8" y1="8" x2="16" y2="8" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="8" y1="16" x2="12" y2="16" />
              </svg>
              <h3 className="empty-state-title">No work orders found</h3>
              <p className="empty-state-description">
                {searchQuery || filterStatus || filterTrade
                  ? 'Try adjusting your search or filters'
                  : 'Create your first work order to get started'}
              </p>
              <Link href="/?create=true" className="btn btn-primary">
                Create Work Order
              </Link>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Job</th>
                  <th style={{ width: '15%' }}>Trade</th>
                  <th style={{ width: '15%' }}>Location</th>
                  <th style={{ width: '15%' }}>Status</th>
                  <th style={{ width: '15%' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const statusConfig = getStatusConfig(job.job_status);
                  return (
                    <tr 
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 'var(--ds-font-medium)', color: 'var(--ds-text-primary)' }}>
                            {job.job_title || 'Untitled Job'}
                          </span>
                          <span style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)' }}>
                            #{job.id.slice(0, 8)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: 'var(--ds-text-secondary)' }}>
                          {job.trade_needed || '-'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--ds-text-secondary)' }}>
                          {job.city && job.state ? `${job.city}, ${job.state}` : job.city || job.state || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusConfig.class}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--ds-text-tertiary)', fontSize: 'var(--ds-text-sm)' }}>
                          {formatDate(job.created_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: 'var(--ds-space-4) var(--ds-space-5)',
              borderTop: '1px solid var(--ds-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--ds-bg-muted)'
            }}>
              <span style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: 'var(--ds-space-2)' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
