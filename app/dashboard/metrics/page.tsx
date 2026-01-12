'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AnalyticsSummary {
  totalWorkOrders: number;
  pendingCount: number;
  assignedCount: number;
  completedCount: number;
  thisMonthCount: number;
  lastMonthCount: number;
  byTrade: { trade: string; count: number }[];
  byStatus: { status: string; count: number }[];
  recentJobs: {
    id: string;
    job_title: string;
    trade_needed: string;
    status: string;
    created_at: string;
  }[];
}

export default function MetricsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/jobs/analytics/summary');

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'pending' || normalized === 'unassigned') {
      return { bg: 'rgba(108, 114, 201, 0.15)', border: 'rgba(108, 114, 201, 0.3)', text: '#8A86DB' };
    } else if (normalized === 'assigned') {
      return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#F7B13C' };
    } else if (normalized === 'completed') {
      return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#3CC896' };
    } else {
      return { bg: 'rgba(160, 160, 168, 0.15)', border: 'rgba(160, 160, 168, 0.3)', text: '#B3B3BA' };
    }
  };

  const calculatePercentage = (count: number, total: number): string => {
    if (total === 0) return '0';
    return ((count / total) * 100).toFixed(1);
  };

  const getMonthlyChange = () => {
    if (!data || data.lastMonthCount === 0) return { change: 0, isPositive: true };
    const change = ((data.thisMonthCount - data.lastMonthCount) / data.lastMonthCount) * 100;
    return { change: Math.abs(change), isPositive: change >= 0 };
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-2xl)'
      }}>
        <div style={{
          fontSize: 'var(--font-xl)',
          color: 'var(--text-secondary)'
        }}>
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        padding: 'var(--spacing-2xl)',
        paddingTop: 'var(--spacing-5xl)'
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-lg)',
            color: 'var(--error)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                {error}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const monthlyChange = getMonthlyChange();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: 'var(--spacing-2xl)',
      paddingTop: 'var(--spacing-5xl)'
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <h1 style={{
            fontSize: 'var(--font-4xl)',
            fontWeight: 'var(--font-weight-bold)',
            fontFamily: 'var(--font-section-title)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-xs)'
          }}>
            Work Order Analytics
          </h1>
          <p style={{
            fontSize: 'var(--font-md)',
            color: 'var(--text-secondary)'
          }}>
            Track work order volume and performance metrics
          </p>
        </div>

        {/* KPI Cards Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          {/* Total Work Orders */}
          <div style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)'
          }}>
            <div style={{
              fontSize: 'var(--font-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 'var(--spacing-md)'
            }}>
              Total Work Orders
            </div>
            <div style={{
              fontSize: 'var(--font-4xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)'
            }}>
              {data.totalWorkOrders}
            </div>
          </div>

          {/* Pending */}
          <div style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)'
          }}>
            <div style={{
              fontSize: 'var(--font-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 'var(--spacing-md)'
            }}>
              Pending
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--spacing-md)'
            }}>
              <div style={{
                fontSize: 'var(--font-4xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}>
                {data.pendingCount}
              </div>
              <div style={{
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: '#8A86DB'
              }}>
                {calculatePercentage(data.pendingCount, data.totalWorkOrders)}%
              </div>
            </div>
          </div>

          {/* Assigned */}
          <div style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)'
          }}>
            <div style={{
              fontSize: 'var(--font-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 'var(--spacing-md)'
            }}>
              Assigned
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--spacing-md)'
            }}>
              <div style={{
                fontSize: 'var(--font-4xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}>
                {data.assignedCount}
              </div>
              <div style={{
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: '#F7B13C'
              }}>
                {calculatePercentage(data.assignedCount, data.totalWorkOrders)}%
              </div>
            </div>
          </div>

          {/* Completed */}
          <div style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)'
          }}>
            <div style={{
              fontSize: 'var(--font-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 'var(--spacing-md)'
            }}>
              Completed
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--spacing-md)'
            }}>
              <div style={{
                fontSize: 'var(--font-4xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}>
                {data.completedCount}
              </div>
              <div style={{
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: '#3CC896'
              }}>
                {calculatePercentage(data.completedCount, data.totalWorkOrders)}%
              </div>
            </div>
          </div>
        </div>

        {/* Month Comparison Card */}
        <div style={{
          background: 'var(--container-bg)',
          border: 'var(--container-border)',
          borderRadius: 'var(--container-border-radius)',
          padding: 'var(--spacing-xl)',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <div style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            Monthly Comparison
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-xl)'
          }}>
            <div>
              <div style={{
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 'var(--spacing-sm)'
              }}>
                This Month
              </div>
              <div style={{
                fontSize: 'var(--font-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}>
                {data.thisMonthCount}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 'var(--spacing-sm)'
              }}>
                Last Month
              </div>
              <div style={{
                fontSize: 'var(--font-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}>
                {data.lastMonthCount}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 'var(--spacing-sm)'
              }}>
                Change
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)'
              }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={monthlyChange.isPositive ? '#3CC896' : '#F7B13C'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: monthlyChange.isPositive ? 'rotate(0deg)' : 'rotate(180deg)'
                  }}
                >
                  <line x1="12" y1="19" x2="12" y2="5"/>
                  <polyline points="5 12 12 5 19 12"/>
                </svg>
                <div style={{
                  fontSize: 'var(--font-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: monthlyChange.isPositive ? '#3CC896' : '#F7B13C'
                }}>
                  {monthlyChange.change.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* By Trade Section */}
        <div style={{
          background: 'var(--container-bg)',
          border: 'var(--container-border)',
          borderRadius: 'var(--container-border-radius)',
          padding: 'var(--spacing-xl)',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <div style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            Work Orders by Trade
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-md)'
          }}>
            {data.byTrade.map((item) => {
              const maxCount = Math.max(...data.byTrade.map(t => t.count));
              const widthPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

              return (
                <div key={item.trade}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    <div style={{
                      fontSize: 'var(--font-md)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)'
                    }}>
                      {item.trade}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-md)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--text-primary)'
                    }}>
                      {item.count}
                    </div>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(108, 114, 201, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${widthPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, rgba(108, 114, 201, 0.6), rgba(128, 131, 174, 0.6))',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Status Section */}
        <div style={{
          background: 'var(--container-bg)',
          border: 'var(--container-border)',
          borderRadius: 'var(--container-border-radius)',
          padding: 'var(--spacing-xl)',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <div style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            Work Orders by Status
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-md)'
          }}>
            {data.byStatus.map((item) => {
              const statusColors = getStatusColor(item.status);
              const maxCount = Math.max(...data.byStatus.map(s => s.count));
              const widthPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

              return (
                <div key={item.status}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: statusColors.text
                      }} />
                      <div style={{
                        fontSize: 'var(--font-md)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--text-primary)'
                      }}>
                        {item.status}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 'var(--font-md)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--text-primary)'
                    }}>
                      {item.count}
                    </div>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: statusColors.bg,
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${widthPercent}%`,
                      height: '100%',
                      background: statusColors.text,
                      borderRadius: '4px',
                      transition: 'width 0.5s ease',
                      opacity: 0.8
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Work Orders Table */}
        <div style={{
          background: 'var(--container-bg)',
          border: 'var(--container-border)',
          borderRadius: 'var(--container-border-radius)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: 'var(--spacing-xl)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)'
            }}>
              Recent Work Orders
            </div>
          </div>
          <div style={{
            overflowX: 'auto'
          }}>
            <table className="data-table" style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Title
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Trade
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Status
                  </th>
                  <th style={{
                    textAlign: 'right',
                    padding: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentJobs.map((job) => {
                  const statusColors = getStatusColor(job.status);

                  return (
                    <tr
                      key={job.id}
                      style={{
                        cursor: 'pointer',
                        transition: 'all var(--transition-hover)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--container-hover-bg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <div style={{
                          fontSize: 'var(--font-md)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--text-primary)'
                        }}>
                          {job.job_title}
                        </div>
                      </td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-xs)',
                          padding: '4px 12px',
                          background: 'rgba(108, 114, 201, 0.15)',
                          border: '1px solid rgba(108, 114, 201, 0.3)',
                          borderRadius: 'var(--btn-corner-radius)',
                          fontSize: 'var(--font-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--text-primary)'
                        }}>
                          {job.trade_needed}
                        </div>
                      </td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-xs)',
                          padding: '4px 12px',
                          background: statusColors.bg,
                          border: `1px solid ${statusColors.border}`,
                          borderRadius: 'var(--btn-corner-radius)',
                          fontSize: 'var(--font-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: statusColors.text
                        }}>
                          {job.status}
                        </div>
                      </td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                        textAlign: 'right'
                      }}>
                        <div style={{
                          fontSize: 'var(--font-md)',
                          color: 'var(--text-secondary)'
                        }}>
                          {formatDate(job.created_at)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
