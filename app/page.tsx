'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { CreateJobForm } from '@/components/CreateJobForm';
import { useMultipleDrafts } from '@/lib/useMultipleDrafts';
import { supabase } from '@/lib/supabaseClient';
import { MOCK_JOBS, MOCK_TECHNICIANS, MOCK_DRAFTS, isMockMode } from '@/lib/mock-supabase';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [workOrderText, setWorkOrderText] = useState('');
  const [isParsingText, setIsParsingText] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    activeJobs: 0,
    pendingJobs: 0,
    completedJobs: 0,
    technicians: 0
  });

  // Drafts
  const drafts = useMultipleDrafts({
    key: 'work-orders',
    maxDrafts: 10
  });

  useEffect(() => {
    setMounted(true);
    
    // Seed mock drafts in dev mode if none exist
    if (isMockMode() || process.env.NODE_ENV === 'development') {
      const existingDrafts = localStorage.getItem('raven-drafts-work-orders');
      if (!existingDrafts || existingDrafts === '[]') {
        localStorage.setItem('raven-drafts-work-orders', JSON.stringify(MOCK_DRAFTS));
      }
    }
  }, []);

  // Get org_id
  useEffect(() => {
    const getOrgId = async () => {
      if (!user) return;

      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
        setOrgId('152ca2e3-a371-4167-99c5-0890afcd83d7');
        return;
      }

      const { data: membership } = await supabase
        .from('org_memberships')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (membership?.org_id) {
        setOrgId(membership.org_id);
      }
    };
    getOrgId();
  }, [user]);

  // Load stats
  useEffect(() => {
    const loadStats = async () => {
      if (!orgId) return;

      // Use mock data in mock mode
      if (isMockMode() || process.env.NODE_ENV === 'development') {
        const jobs = MOCK_JOBS;
        setStats({
          activeJobs: jobs.filter((j: any) => j.job_status === 'assigned' || j.job_status === 'active').length,
          pendingJobs: jobs.filter((j: any) => j.job_status === 'pending' || j.job_status === 'matching').length,
          completedJobs: jobs.filter((j: any) => j.job_status === 'completed').length,
          technicians: MOCK_TECHNICIANS.filter((t: any) => t.is_available).length
        });
        return;
      }

      try {
        const response = await fetch(`/api/jobs/list?orgId=${orgId}&perPage=100`);
        const data = await response.json();
        
        if (response.ok && data.jobs) {
          const jobs = data.jobs;
          setStats({
            activeJobs: jobs.filter((j: any) => j.job_status === 'assigned' || j.job_status === 'active').length,
            pendingJobs: jobs.filter((j: any) => j.job_status === 'pending' || j.job_status === 'matching').length,
            completedJobs: jobs.filter((j: any) => j.job_status === 'completed').length,
            technicians: 12 // Placeholder
          });
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, [orgId]);

  // Check URL params
  useEffect(() => {
    if (searchParams?.get('create') === 'true') {
      setShowCreateForm(true);
    }
    const draftId = searchParams?.get('draft');
    if (draftId) {
      const draft = drafts.drafts.find(d => d.id === draftId);
      if (draft) {
        setWorkOrderText(draft.description || '');
        setShowCreateForm(true);
      }
    }
  }, [searchParams, drafts.drafts]);

  // Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFirstName = () => {
    if (!user) return '';
    const metadata = (user as any).user_metadata || (user as any).raw_user_meta_data;
    if (metadata?.full_name) return metadata.full_name.split(' ')[0];
    if (metadata?.name) return metadata.name.split(' ')[0];
    if (user.email) return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
    return '';
  };

  // Handle work order creation
  const handleCreateWorkOrder = async () => {
    if (!workOrderText.trim() || !orgId) return;

    setIsParsingText(true);
    try {
      // Create empty job first
      const createResponse = await fetch('/api/jobs/create-empty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create job');
      }

      const { job_id } = await createResponse.json();

      // Parse the text
      const parseResponse = await fetch(`/api/jobs/${job_id}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: workOrderText }),
      });

      if (!parseResponse.ok) {
        throw new Error('Failed to parse work order');
      }

      // Show the form to review/edit
      setEditingJobId(job_id);
      setShowCreateForm(true);
      setWorkOrderText('');
    } catch (error) {
      console.error('Error creating work order:', error);
      alert('Failed to create work order. Please try again.');
    } finally {
      setIsParsingText(false);
    }
  };

  if (!mounted) return null;
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      {/* Create Job Form Modal */}
      {showCreateForm && (
        <div 
          className="modal-backdrop" 
          onClick={() => {
            setShowCreateForm(false);
            setEditingJobId(null);
          }}
        >
          <div 
            className="modal modal--xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {editingJobId ? 'Review Work Order' : 'Create Work Order'}
              </h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingJobId(null);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <CreateJobForm
                onClose={() => {
                  setShowCreateForm(false);
                  setEditingJobId(null);
                }}
                onJobCreated={() => {
                  setShowCreateForm(false);
                  setEditingJobId(null);
                  router.push('/jobs');
                }}
                editingJobId={editingJobId}
              />
            </div>
          </div>
        </div>
      )}

      <div className="page-container">
        {/* Header with Welcome + Inline Stats */}
        <div className="page-header">
          <div className="page-header-content">
            <div className="page-header-info">
              <h1 className="page-header-title">
                {getGreeting()}, {getFirstName()}
              </h1>
              <p className="page-header-description">
                Here's what's happening with your work orders today.
              </p>
            </div>
            
            {/* Compact Inline Stats */}
            <div className="page-header-actions" style={{ gap: 'var(--ds-space-5)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--ds-text-xl)', fontWeight: 'var(--ds-font-bold)', color: 'var(--ds-accent-primary)' }}>{stats.activeJobs}</div>
                <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</div>
              </div>
              <div style={{ width: '1px', height: '32px', background: 'var(--ds-border-default)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--ds-text-xl)', fontWeight: 'var(--ds-font-bold)', color: 'var(--ds-warning)' }}>{stats.pendingJobs}</div>
                <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</div>
              </div>
              <div style={{ width: '1px', height: '32px', background: 'var(--ds-border-default)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--ds-text-xl)', fontWeight: 'var(--ds-font-bold)', color: 'var(--ds-success)' }}>{stats.completedJobs}</div>
                <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Done</div>
              </div>
              <div style={{ width: '1px', height: '32px', background: 'var(--ds-border-default)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--ds-text-xl)', fontWeight: 'var(--ds-font-bold)', color: 'var(--ds-feature-technicians)' }}>{stats.technicians}</div>
                <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Techs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Feature Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 'var(--ds-space-3)',
          marginBottom: 'var(--ds-space-6)'
        }}>
          <Link href="/jobs" className="feature-card feature-card--jobs">
            <div className="feature-card__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="8" y1="8" x2="16" y2="8" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className="feature-card__title">Work Orders</div>
            <div className="feature-card__description">{stats.activeJobs + stats.pendingJobs} total</div>
          </Link>

          <Link href="/policies" className="feature-card feature-card--compliance">
            <div className="feature-card__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="feature-card__title">Policies</div>
            <div className="feature-card__description">Compliance</div>
          </Link>

          <Link href="/technicians" className="feature-card feature-card--technicians">
            <div className="feature-card__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div className="feature-card__title">Technicians</div>
            <div className="feature-card__description">{stats.technicians} available</div>
          </Link>

          <Link href="/drafts" className="feature-card feature-card--drafts">
            <div className="feature-card__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="feature-card__title">Drafts</div>
            <div className="feature-card__description">{drafts.draftCount} saved</div>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--ds-space-6)' }}>
          {/* Left - Create Work Order */}
          <div className="card">
            <div className="card-header" style={{ padding: 'var(--ds-space-4) var(--ds-space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ds-accent-primary)" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="card-title" style={{ fontSize: 'var(--ds-text-sm)' }}>
                  Quick Create Work Order
                </span>
              </div>
            </div>
            <div className="card-body">
              <textarea
                className="form-textarea"
                placeholder="Paste work order text to auto-parse..."
                value={workOrderText}
                onChange={(e) => setWorkOrderText(e.target.value)}
                style={{ 
                  minHeight: '100px',
                  marginBottom: 'var(--ds-space-3)'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--ds-space-3)' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCreateForm(true)}
                >
                  Manual Entry
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleCreateWorkOrder}
                  disabled={!workOrderText.trim() || isParsingText}
                >
                  {isParsingText ? 'Parsing...' : 'Parse & Create'}
                </button>
              </div>
            </div>
          </div>

          {/* Right - Recent Drafts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-3)' }}>
            <div className="card">
              <div className="card-header" style={{ padding: 'var(--ds-space-4)' }}>
                <span className="card-title" style={{ fontSize: 'var(--ds-text-sm)' }}>
                  Recent Drafts
                </span>
                {drafts.draftCount > 0 && (
                  <Link href="/drafts" style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-accent-primary)', textDecoration: 'none' }}>
                    View all
                  </Link>
                )}
              </div>
              <div style={{ padding: 'var(--ds-space-2)' }}>
                {drafts.draftCount === 0 ? (
                  <div className="empty-state" style={{ padding: 'var(--ds-space-6) var(--ds-space-3)' }}>
                    <svg className="empty-state-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)' }}>No drafts saved</div>
                  </div>
                ) : (
                  drafts.drafts.slice(0, 3).map((draft) => (
                    <div 
                      key={draft.id}
                      className="list-item"
                      onClick={() => router.push(`/?draft=${draft.id}`)}
                      style={{ padding: 'var(--ds-space-3)' }}
                    >
                      <div className="list-item__content">
                        <div className="list-item__title">{draft.title || 'Untitled Draft'}</div>
                        <div className="list-item__meta">{drafts.getTimeSince(draft.lastModified)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Overview Card */}
            <div className="stat-card">
              <div className="stat-card__label">Overview</div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'var(--ds-space-3)'
              }}>
                <span style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-secondary)' }}>Total Jobs</span>
                <span style={{ fontSize: 'var(--ds-text-sm)', fontWeight: 'var(--ds-font-semibold)', color: 'var(--ds-text-primary)' }}>
                  {stats.activeJobs + stats.pendingJobs + stats.completedJobs}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-secondary)' }}>Completion Rate</span>
                <span style={{ fontSize: 'var(--ds-text-sm)', fontWeight: 'var(--ds-font-semibold)', color: 'var(--ds-success)' }}>
                  {stats.activeJobs + stats.pendingJobs + stats.completedJobs > 0 
                    ? Math.round((stats.completedJobs / (stats.activeJobs + stats.pendingJobs + stats.completedJobs)) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '50vh',
        background: 'var(--ds-bg-subtle)'
      }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          border: '3px solid var(--ds-border-default)', 
          borderTopColor: 'var(--ds-accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
