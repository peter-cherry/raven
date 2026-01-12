'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Site {
  id: string;
  organization_id: string;
  name: string;
  type: 'retail' | 'office' | 'warehouse' | 'other';
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  client_name: string | null;
  client_contact: string | null;
  use_org_policy: boolean;
  custom_policy_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  work_order_count?: number;
}

export default function SitesManagementPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sites for the user's organization
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('*')
        .order('name', { ascending: true });

      if (sitesError) {
        throw sitesError;
      }

      // For each site, count associated work orders
      const sitesWithCounts = await Promise.all(
        (sitesData || []).map(async (site) => {
          const { count, error: countError } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', site.id);

          return {
            ...site,
            work_order_count: countError ? 0 : (count || 0)
          };
        })
      );

      setSites(sitesWithCounts);
    } catch (err: any) {
      console.error('Error fetching sites:', err);
      setError(err.message || 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      retail: 'Retail',
      office: 'Office',
      warehouse: 'Warehouse',
      other: 'Other'
    };
    return labels[type] || type;
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
          Loading sites...
        </div>
      </div>
    );
  }

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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <div>
            <h1 style={{
              fontSize: 'var(--font-4xl)',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: 'var(--font-section-title)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-xs)'
            }}>
              Sites
            </h1>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)'
            }}>
              Manage your organization's physical locations
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              // TODO: Navigate to add site form
              alert('Add Site functionality coming soon');
            }}
            style={{
              padding: '12px 24px'
            }}
          >
            + Add Site
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-2xl)',
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
        )}

        {/* Empty State */}
        {!loading && !error && sites.length === 0 && (
          <div style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-5xl)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 'var(--font-2xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-md)'
            }}>
              No sites yet
            </div>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-xl)'
            }}>
              Create your first site to start managing work orders by location
            </p>
            <button
              className="primary-button"
              onClick={() => {
                // TODO: Navigate to add site form
                alert('Add Site functionality coming soon');
              }}
            >
              Create First Site
            </button>
          </div>
        )}

        {/* Sites Table */}
        {!loading && !error && sites.length > 0 && (
          <div style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            overflow: 'hidden'
          }}>
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
                      Name
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
                      Type
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
                      City/State
                    </th>
                    <th style={{
                      textAlign: 'center',
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
                      textAlign: 'center',
                      padding: '16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-md)',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Work Orders
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => (
                    <tr
                      key={site.id}
                      style={{
                        cursor: 'pointer',
                        transition: 'all var(--transition-hover)'
                      }}
                      onClick={() => {
                        // TODO: Navigate to site detail page
                        alert(`View site: ${site.name}`);
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
                          color: 'var(--text-primary)',
                          marginBottom: 'var(--spacing-xs)'
                        }}>
                          {site.name}
                        </div>
                        {site.client_name && (
                          <div style={{
                            fontSize: 'var(--font-sm)',
                            color: 'var(--text-secondary)'
                          }}>
                            {site.client_name}
                          </div>
                        )}
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
                          {getTypeLabel(site.type)}
                        </div>
                      </td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        <div style={{
                          fontSize: 'var(--font-md)',
                          color: 'var(--text-primary)',
                          marginBottom: 'var(--spacing-xs)'
                        }}>
                          {site.city}, {site.state}
                        </div>
                        <div style={{
                          fontSize: 'var(--font-sm)',
                          color: 'var(--text-secondary)'
                        }}>
                          {site.zip}
                        </div>
                      </td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-xs)',
                          padding: '4px 12px',
                          background: site.active
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(107, 114, 128, 0.15)',
                          border: site.active
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : '1px solid rgba(107, 114, 128, 0.3)',
                          borderRadius: 'var(--btn-corner-radius)',
                          fontSize: 'var(--font-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: site.active ? '#10B981' : '#9CA3AF'
                        }}>
                          <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: site.active ? '#10B981' : '#9CA3AF'
                          }} />
                          {site.active ? 'Active' : 'Inactive'}
                        </div>
                      </td>
                      <td style={{
                        padding: '16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: 'var(--font-lg)',
                          fontWeight: 'var(--font-weight-bold)',
                          color: 'var(--text-primary)'
                        }}>
                          {site.work_order_count || 0}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && !error && sites.length > 0 && (
          <div style={{
            marginTop: 'var(--spacing-2xl)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-lg)'
          }}>
            <div style={{
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-lg)'
            }}>
              <div style={{
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 'var(--spacing-sm)'
              }}>
                Total Sites
              </div>
              <div style={{
                fontSize: 'var(--font-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}>
                {sites.length}
              </div>
            </div>

            <div style={{
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-lg)'
            }}>
              <div style={{
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 'var(--spacing-sm)'
              }}>
                Active Sites
              </div>
              <div style={{
                fontSize: 'var(--font-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}>
                {sites.filter(s => s.active).length}
              </div>
            </div>

            <div style={{
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-lg)'
            }}>
              <div style={{
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 'var(--spacing-sm)'
              }}>
                Total Work Orders
              </div>
              <div style={{
                fontSize: 'var(--font-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}>
                {sites.reduce((sum, site) => sum + (site.work_order_count || 0), 0)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
