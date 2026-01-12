'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import EmptyState from '@/components/EmptyState'
import { isMockMode, createMockSupabaseClient } from '@/lib/mock-supabase'

interface ScrapingActivity {
  id: string
  source: string
  trade: string
  state: string
  query: string
  results_found: number
  new_targets: number
  duplicate_targets: number
  status: string
  started_at: string
  completed_at: string
}

export default function AdminActivityPage() {
  const supabase = isMockMode() ? createMockSupabaseClient() as any : createClientComponentClient()
  const [activities, setActivities] = useState<ScrapingActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTargets: 0,
    pendingEnrichment: 0,
    completedEnrichment: 0,
    failedEnrichment: 0
  })

  useEffect(() => {
    fetchData()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-activity')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scraping_activity'
        },
        () => {
          fetchData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'outreach_targets'
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchData() {
    setLoading(true)

    // Get scraping activities
    const { data: activityData } = await supabase
      .from('scraping_activity')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50)

    setActivities(activityData || [])

    await fetchStats()
    setLoading(false)
  }

  async function fetchStats() {
    // Get enrichment stats (using actual schema: status, email_found, email_verified)
    const { data: targetStats } = await supabase
      .from('outreach_targets')
      .select('status, email_found, email_verified')

    if (targetStats) {
      setStats({
        totalTargets: targetStats.length,
        pendingEnrichment: targetStats.filter(t => !t.email_found).length,
        completedEnrichment: targetStats.filter(t => t.email_found && t.email_verified).length,
        failedEnrichment: targetStats.filter(t => t.email_found && !t.email_verified).length
      })
    }
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
          Activity Dashboard
        </h1>
        <p style={{
          color: 'var(--ds-text-secondary)',
          fontSize: 'var(--font-md)'
        }}>
          Monitor scraping and enrichment activity
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-3xl)'
      }}>
        <div style={{
          background: 'var(--ds-bg-surface)',
          borderRadius: 'var(--ds-radius-lg)',
          padding: 'var(--spacing-xl)',
          border: '1px solid var(--ds-border-default)'
        }}>
          <div style={{
            fontSize: 'var(--font-md)',
            color: 'var(--ds-text-secondary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Total Targets
          </div>
          <div style={{
            fontSize: 'var(--font-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--ds-text-primary)'
          }}>
            {stats.totalTargets}
          </div>
        </div>

        <div style={{
          background: 'var(--ds-bg-surface)',
          borderRadius: 'var(--ds-radius-lg)',
          padding: 'var(--spacing-xl)',
          border: '1px solid var(--ds-border-default)'
        }}>
          <div style={{
            fontSize: 'var(--font-md)',
            color: 'var(--ds-text-secondary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Pending Enrichment
          </div>
          <div style={{
            fontSize: 'var(--font-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--ds-warning)'
          }}>
            {stats.pendingEnrichment}
          </div>
        </div>

        <div style={{
          background: 'var(--ds-bg-surface)',
          borderRadius: 'var(--ds-radius-lg)',
          padding: 'var(--spacing-xl)',
          border: '1px solid var(--ds-border-default)'
        }}>
          <div style={{
            fontSize: 'var(--font-md)',
            color: 'var(--ds-text-secondary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Enriched
          </div>
          <div style={{
            fontSize: 'var(--font-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--ds-success)'
          }}>
            {stats.completedEnrichment}
          </div>
        </div>

        <div style={{
          background: 'var(--ds-bg-surface)',
          borderRadius: 'var(--ds-radius-lg)',
          padding: 'var(--spacing-xl)',
          border: '1px solid var(--ds-border-default)'
        }}>
          <div style={{
            fontSize: 'var(--font-md)',
            color: 'var(--ds-text-secondary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Failed
          </div>
          <div style={{
            fontSize: 'var(--font-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--ds-error)'
          }}>
            {stats.failedEnrichment}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div style={{
        background: 'var(--ds-bg-surface)',
        borderRadius: 'var(--ds-radius-lg)',
        padding: 'var(--spacing-xl)',
        border: '1px solid var(--ds-border-default)'
      }}>
        <h2 style={{
          fontSize: 'var(--font-xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--ds-text-primary)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          Recent Scraping Activity
        </h2>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--spacing-3xl)',
            color: 'var(--ds-text-secondary)'
          }}>
            Loading activity...
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon="chart"
            title="No scraping activity yet"
            description="There hasn't been any technician scraping activity yet. Start collecting technician data to see activity logs here."
            actionLabel="Start Collection"
            actionHref="/admin/outreach"
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ds-border-default)' }}>
                  <th style={{
                    padding: 'var(--spacing-md)',
                    textAlign: 'left',
                    color: 'var(--ds-text-secondary)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Source</th>
                  <th style={{
                    padding: 'var(--spacing-md)',
                    textAlign: 'left',
                    color: 'var(--ds-text-secondary)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Trade</th>
                  <th style={{
                    padding: 'var(--spacing-md)',
                    textAlign: 'left',
                    color: 'var(--ds-text-secondary)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>State</th>
                  <th style={{
                    padding: 'var(--spacing-md)',
                    textAlign: 'left',
                    color: 'var(--ds-text-secondary)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Query</th>
                  <th style={{
                    padding: 'var(--spacing-md)',
                    textAlign: 'left',
                    color: 'var(--ds-text-secondary)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Results</th>
                  <th style={{
                    padding: 'var(--spacing-md)',
                    textAlign: 'left',
                    color: 'var(--ds-text-secondary)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>New</th>
                  <th style={{
                    padding: 'var(--spacing-md)',
                    textAlign: 'left',
                    color: 'var(--ds-text-secondary)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Duplicates</th>
                  <th style={{
                    padding: 'var(--spacing-md)',
                    textAlign: 'left',
                    color: 'var(--ds-text-secondary)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Status</th>
                  <th style={{
                    padding: 'var(--spacing-md)',
                    textAlign: 'left',
                    color: 'var(--ds-text-secondary)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>Started</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(activity => (
                  <tr key={activity.id} style={{ borderBottom: '1px solid var(--ds-border-subtle)' }}>
                    <td style={{
                      padding: 'var(--spacing-md)',
                      color: 'var(--ds-text-primary)',
                      textTransform: 'capitalize'
                    }}>
                      {activity.source}
                    </td>
                    <td style={{
                      padding: 'var(--spacing-md)',
                      color: 'var(--ds-text-secondary)'
                    }}>{activity.trade}</td>
                    <td style={{
                      padding: 'var(--spacing-md)',
                      color: 'var(--ds-text-secondary)'
                    }}>{activity.state}</td>
                    <td style={{
                      padding: 'var(--spacing-md)',
                      color: 'var(--ds-text-secondary)',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {activity.query || '-'}
                    </td>
                    <td style={{
                      padding: 'var(--spacing-md)',
                      color: 'var(--ds-text-secondary)'
                    }}>{activity.results_found}</td>
                    <td style={{
                      padding: 'var(--spacing-md)',
                      color: 'var(--ds-success)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}>
                      {activity.new_targets}
                    </td>
                    <td style={{
                      padding: 'var(--spacing-md)',
                      color: 'var(--ds-text-secondary)'
                    }}>{activity.duplicate_targets}</td>
                    <td style={{ padding: 'var(--spacing-md)' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--ds-radius-md)',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        background: activity.status === 'completed' ? 'var(--ds-success)' :
                                   activity.status === 'running' ? 'var(--ds-warning)' : 'var(--ds-error)',
                        color: 'white'
                      }}>
                        {activity.status}
                      </span>
                    </td>
                    <td style={{
                      padding: 'var(--spacing-md)',
                      color: 'var(--ds-text-secondary)',
                      fontSize: 'var(--font-sm)'
                    }}>
                      {new Date(activity.started_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
