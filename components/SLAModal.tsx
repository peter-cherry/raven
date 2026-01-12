'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { SLABadge } from './SLABadge'
import { CloseButton } from '@/components/CloseButton'

interface SLAModalProps {
  jobId: string
  isOpen: boolean
  onClose: () => void
}

interface SLATimer {
  id: string
  stage: string
  target_minutes: number
  started_at: string
  completed_at: string | null
  breached: boolean
  breach_time: string | null
}

interface SLAAlert {
  id: string
  alert_type: string
  stage: string
  message: string
  sent_at: string
  acknowledged: boolean
}

export function SLAModal({ jobId, isOpen, onClose }: SLAModalProps) {
  const [timers, setTimers] = useState<SLATimer[]>([])
  const [alerts, setAlerts] = useState<SLAAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    async function loadSLAData() {
      setLoading(true)

      // Load timers
      const { data: timersData } = await supabase
        .from('sla_timers')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true })

      // Load alerts
      const { data: alertsData } = await supabase
        .from('sla_alerts')
        .select('*')
        .eq('job_id', jobId)
        .order('sent_at', { ascending: false })

      if (timersData) setTimers(timersData)
      if (alertsData) setAlerts(alertsData)

      setLoading(false)
    }

    loadSLAData()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`sla-${jobId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sla_timers',
        filter: `job_id=eq.${jobId}`
      }, () => {
        loadSLAData()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sla_alerts',
        filter: `job_id=eq.${jobId}`
      }, () => {
        loadSLAData()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [jobId, isOpen])

  function getTimerStatus(timer: SLATimer): 'on-time' | 'warning' | 'breached' | 'completed' {
    if (timer.completed_at) return 'completed'
    if (timer.breached) return 'breached'

    const elapsed = (Date.now() - new Date(timer.started_at).getTime()) / 60000
    const remaining = timer.target_minutes - elapsed

    if (remaining < timer.target_minutes * 0.25) return 'warning'
    return 'on-time'
  }

  function getTimeRemaining(timer: SLATimer): number {
    if (timer.completed_at || timer.breached) return 0
    const elapsed = (Date.now() - new Date(timer.started_at).getTime()) / 60000
    return Math.max(0, timer.target_minutes - elapsed)
  }

  function getProgressPercent(timer: SLATimer): number {
    if (timer.completed_at) return 100

    const elapsed = (Date.now() - new Date(timer.started_at).getTime()) / 60000
    return Math.min(100, (elapsed / timer.target_minutes) * 100)
  }

  if (!isOpen) return null

  // Determine worst status for overlay color
  const worstStatus = timers.reduce<'on-time' | 'warning' | 'breached' | 'completed'>((worst, timer) => {
    const status = getTimerStatus(timer)
    if (status === 'breached') return 'breached'
    if (status === 'warning' && worst !== 'breached') return 'warning'
    if (status === 'completed' && worst === 'on-time') return 'completed'
    return worst
  }, 'on-time')

  const overlayColor =
    worstStatus === 'breached' ? 'rgba(239, 68, 68, 0.15)' :
    worstStatus === 'warning' ? 'rgba(245, 158, 11, 0.15)' :
    worstStatus === 'completed' ? 'rgba(34, 197, 94, 0.15)' :
    'rgba(108, 114, 201, 0.15)'

  return (
    <div
      className="policy-modal-overlay"
      onClick={onClose}
      style={{ backgroundColor: overlayColor }}
    >
      <div
        className="policy-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720 }}
      >
        <div className="policy-list">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="header-title" style={{ fontSize: 18, margin: 0 }}>
              ⏱️ SLA Timers
            </h2>
            <CloseButton onClick={onClose} />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
              Loading SLA data...
            </div>
          ) : (
            <>
              {/* Timer Stages */}
              <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                {timers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
                    No SLA timers configured for this job
                  </div>
                ) : (
                  timers.map((timer) => {
                    const status = getTimerStatus(timer)
                    const remaining = getTimeRemaining(timer)
                    const progress = getProgressPercent(timer)

                    return (
                      <div key={timer.id} className="container-card" style={{ padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                              {timer.stage}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
                              Target: {timer.target_minutes} minutes
                            </div>
                          </div>
                          <SLABadge status={status} timeRemaining={remaining} />
                        </div>

                        {/* Progress bar */}
                        <div style={{
                          height: 6,
                          background: 'var(--border-subtle)',
                          borderRadius: 3,
                          overflow: 'hidden'
                        }}>
                          <div
                            style={{
                              width: `${progress}%`,
                              height: '100%',
                              background: timer.breached
                                ? 'var(--error)'
                                : timer.completed_at
                                ? 'var(--success)'
                                : status === 'warning'
                                ? 'var(--warning)'
                                : 'linear-gradient(90deg, #6C72C9, #8083AE)',
                              borderRadius: 3,
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>

                        {/* Timestamps */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: timer.completed_at ? '1fr 1fr' : '1fr',
                          gap: 12,
                          marginTop: 8,
                          fontSize: 11,
                          color: 'var(--text-secondary)'
                        }}>
                          <div>
                            Started: {new Date(timer.started_at).toLocaleString()}
                          </div>
                          {timer.completed_at && (
                            <div>
                              Completed: {new Date(timer.completed_at).toLocaleString()}
                            </div>
                          )}
                          {timer.breach_time && (
                            <div style={{ color: 'var(--error)' }}>
                              Breached: {new Date(timer.breach_time).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Alerts Section */}
              {alerts.length > 0 && (
                <>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                    Alerts & Escalations
                  </h3>

                  <div style={{ display: 'grid', gap: 8 }}>
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          background: alert.acknowledged
                            ? 'rgba(108, 114, 201, 0.1)'
                            : alert.alert_type === 'breach'
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(245, 158, 11, 0.1)',
                          border: `1px solid ${
                            alert.acknowledged
                              ? 'var(--border-accent)'
                              : alert.alert_type === 'breach'
                              ? 'var(--error)'
                              : 'var(--warning)'
                          }`,
                          opacity: alert.acknowledged ? 0.6 : 1
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>
                                {alert.alert_type}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                • {alert.stage}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                              {alert.message}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                              {new Date(alert.sent_at).toLocaleString()}
                            </div>
                          </div>
                          {alert.acknowledged && (
                            <div style={{ fontSize: 11, color: 'var(--success)' }}>
                              ✓ Acknowledged
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
