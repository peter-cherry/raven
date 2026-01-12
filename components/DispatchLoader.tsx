'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface DispatchLoaderProps {
  outreachId: string
  jobId: string
}

interface DispatchStats {
  warmSent: number
  warmOpened: number
  warmReplied: number
  warmQualified: number
  coldSent: number
  coldOpened: number
  coldReplied: number
  coldQualified: number
  totalQualified: number
  // Pipeline stats
  pipelineRan: boolean
  pipelineSelected: number
  pipelineVerified: number
  pipelineMoved: number
}

interface JobData {
  trade_needed: string
  job_title: string
  urgency: string
}

export function DispatchLoader({ outreachId, jobId }: DispatchLoaderProps) {
  const [stats, setStats] = useState<DispatchStats>({
    warmSent: 0,
    warmOpened: 0,
    warmReplied: 0,
    warmQualified: 0,
    coldSent: 0,
    coldOpened: 0,
    coldReplied: 0,
    coldQualified: 0,
    totalQualified: 0,
    // Pipeline stats
    pipelineRan: false,
    pipelineSelected: 0,
    pipelineVerified: 0,
    pipelineMoved: 0
  })
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchJobData() {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const data = await response.json();

        if (response.ok && !data.error) {
          setJobData({
            trade_needed: data.trade_needed,
            job_title: data.job_title,
            urgency: data.urgency
          });
        }
      } catch (error) {
        console.error('[DispatchLoader] Failed to fetch job data:', error);
      }
    }

    async function fetchStats() {
      const { data } = await supabase
        .from('work_order_outreach')
        .select('*')
        .eq('id', outreachId)
        .single()

      if (data) {
        setStats({
          warmSent: data.warm_sent || 0,
          warmOpened: data.warm_opened || 0,
          warmReplied: data.warm_replied || 0,
          warmQualified: data.warm_qualified || 0,
          coldSent: data.cold_sent || 0,
          coldOpened: data.cold_opened || 0,
          coldReplied: data.cold_replied || 0,
          coldQualified: data.cold_qualified || 0,
          totalQualified: data.qualified_count || 0,
          // Pipeline stats
          pipelineRan: data.pipeline_ran || false,
          pipelineSelected: data.pipeline_selected || 0,
          pipelineVerified: data.pipeline_verified || 0,
          pipelineMoved: data.pipeline_moved || 0
        })
        setLoading(false)

        // Stop loading once dispatch is complete
        if (data.status === 'completed' || data.status === 'failed') {
          setLoading(false)
        }
      }
    }

    fetchJobData()
    fetchStats()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`outreach-${outreachId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'work_order_outreach',
        filter: `id=eq.${outreachId}`
      }, () => {
        fetchStats()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'work_order_recipients',
        filter: `outreach_id=eq.${outreachId}`
      }, () => {
        fetchStats()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [outreachId])

  const totalSent = stats.warmSent + stats.coldSent
  const totalOpened = stats.warmOpened + stats.coldOpened
  const totalReplied = stats.warmReplied + stats.coldReplied
  const warmOpenRate = stats.warmSent > 0 ? Math.round((stats.warmOpened / stats.warmSent) * 100) : 0
  const coldOpenRate = stats.coldSent > 0 ? Math.round((stats.coldOpened / stats.coldSent) * 100) : 0
  const overallOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0

  if (loading && totalSent === 0) {
    return (
      <div className="policy-modal-overlay" style={{
        background: 'rgba(0, 0, 0, 0.85)'
      }}>
        <div
          className="container-card"
          style={{
            padding: 20,
            textAlign: 'center',
            background: 'rgba(108, 114, 201, 0.05)',
            border: '2px solid var(--border-accent)'
          }}
        >
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 16 }}>
            📧 Dispatching Work Order
          </div>
          <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 24, background: 'var(--border-subtle)', borderRadius: 4, width: '60%', margin: '0 auto' }} />
            <div style={{ height: 20, background: 'var(--border-subtle)', borderRadius: 4, width: '40%', margin: '0 auto' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="policy-modal-overlay" style={{
      background: 'rgba(0, 0, 0, 0.85)'
    }}>
      <div
        className="container-card"
        style={{
          padding: 24,
          background: 'rgba(108, 114, 201, 0.05)',
          border: '2px solid var(--border-accent)',
          borderRadius: 12
        }}
      >
      <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>
        📊 Dispatch Status
      </div>

      {/* Progress Timeline */}
      <div style={{ marginBottom: 24, padding: 16, background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Step 1: Job created */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
              Job created and added to work order
            </div>
          </div>

          {/* Step 2: Searching registered technicians */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: stats.warmSent > 0 ? 'var(--success)' : 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {stats.warmSent > 0 ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <div className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
              )}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
              {stats.warmSent > 0 ? `Found ${stats.warmSent} registered technicians` : 'Searching registered technicians...'}
            </div>
          </div>

          {/* Pipeline Steps (only show if pipeline ran or is running) */}
          {(stats.pipelineRan || stats.pipelineSelected > 0 || stats.warmSent === 0) && (
            <>
              {/* Step 3a: Searching license database */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: stats.pipelineSelected > 0 ? 'var(--success)' : stats.warmSent === 0 ? 'var(--accent-primary)' : 'rgba(107, 114, 128, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {stats.pipelineSelected > 0 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : stats.warmSent === 0 ? (
                    <div className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                  ) : (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                  )}
                </div>
                <div style={{ fontSize: 14, color: stats.pipelineSelected > 0 || stats.warmSent === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {stats.pipelineSelected > 0
                    ? `AI selected ${stats.pipelineSelected} contractors from license database`
                    : 'Searching license database...'}
                </div>
              </div>

              {/* Step 3b: Verifying emails */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: stats.pipelineVerified > 0 ? 'var(--success)' : stats.pipelineSelected > 0 ? 'var(--accent-primary)' : 'rgba(107, 114, 128, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {stats.pipelineVerified > 0 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : stats.pipelineSelected > 0 ? (
                    <div className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                  ) : (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                  )}
                </div>
                <div style={{ fontSize: 14, color: stats.pipelineVerified > 0 || stats.pipelineSelected > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {stats.pipelineVerified > 0
                    ? `Verified ${stats.pipelineVerified} emails via Hunter.io`
                    : 'Verifying emails...'}
                </div>
              </div>

              {/* Step 3c: Found new contractors */}
              {stats.pipelineMoved > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--success)', fontWeight: 600 }}>
                    Found {stats.pipelineMoved} new contractors ready for outreach
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 4: Reached out to contacts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: totalSent > 0 ? 'var(--success)' : 'rgba(107, 114, 128, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {totalSent > 0 ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
              )}
            </div>
            <div style={{ fontSize: 14, color: totalSent > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {totalSent > 0 ? `Reached out to ${totalSent} contacts` : 'Preparing to send emails...'}
            </div>
          </div>

          {/* Step 5: Waiting for answers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: totalReplied > 0 ? 'var(--success)' : totalSent > 0 ? 'var(--accent-primary)' : 'rgba(107, 114, 128, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {totalReplied > 0 ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : totalSent > 0 ? (
                <div className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
              ) : (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
              )}
            </div>
            <div style={{ fontSize: 14, color: totalReplied > 0 || totalSent > 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {totalReplied > 0 ? `Received ${totalReplied} ${totalReplied === 1 ? 'response' : 'responses'}` : totalSent > 0 ? 'Waiting for answers...' : 'Pending outreach...'}
            </div>
          </div>
        </div>
      </div>

      {/* Total Stats */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--font-4xl)', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 4 }}>
          {totalSent} {totalSent === 1 ? 'technician' : 'technicians'}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {totalOpened} opened ({overallOpenRate}%) • {totalReplied} replied
        </div>
      </div>

      {/* Warm vs Cold Split */}
      <div className="dispatch-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Warm Card */}
        <div style={{
          background: 'var(--stats-bg-warm)',
          border: '2px solid var(--stats-border-warm)',
          borderRadius: 8,
          padding: 16
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--stats-text-warm)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🟢 Warm (Registered)
          </div>
          <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {stats.warmSent}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {stats.warmOpened} opened • {stats.warmReplied} replied
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: 'rgba(16, 185, 129, 0.2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${warmOpenRate}%`,
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.6))',
              borderRadius: 3,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
            {warmOpenRate}% open rate
          </div>
          {stats.warmQualified > 0 && (
            <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 8, fontWeight: 600 }}>
              ✓ {stats.warmQualified} qualified
            </div>
          )}
        </div>

        {/* Cold Card */}
        <div style={{
          background: 'var(--stats-bg-cold)',
          border: '2px solid var(--stats-border-cold)',
          borderRadius: 8,
          padding: 16
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--stats-text-cold)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🔵 Cold (SuperSearch)
          </div>
          <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {stats.coldSent}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {stats.coldOpened} opened • {stats.coldReplied} replied
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: 'rgba(59, 130, 246, 0.2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${coldOpenRate}%`,
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.6))',
              borderRadius: 3,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
            {coldOpenRate}% open rate
          </div>
          {stats.coldQualified > 0 && (
            <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 8, fontWeight: 600 }}>
              ✓ {stats.coldQualified} qualified
            </div>
          )}
        </div>
      </div>

      {/* Qualified Total */}
      {stats.totalQualified > 0 && (
        <div
          style={{
            marginTop: 20,
            paddingTop: 20,
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            ✅ Qualified & Accepting
          </div>
          <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, color: 'var(--success)' }}>
            {stats.totalQualified}
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
        {loading ? '📡 Monitoring responses...' : `✅ Dispatch complete: ${totalSent}/${totalSent} sent`}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      </div>
    </div>
  )
}
