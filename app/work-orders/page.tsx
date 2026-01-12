"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import type { RawWorkOrder } from '@/types/work-orders';
import EmptyState from '@/components/EmptyState';

export default function WorkOrdersPage() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<RawWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;

    const fetchWorkOrders = async () => {
      try {
        let query = supabase
          .from('raw_work_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (filter !== 'all') {
          query = query.eq('status', filter);
        }

        const { data, error } = await query;
        if (error) throw error;
        setWorkOrders((data || []) as RawWorkOrder[]);
      } catch (error) {
        console.error('Error fetching work orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, [user, filter]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'parsed':
        return 'status-parsed';
      case 'job_created':
        return 'status-created';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-default';
    }
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      email: '📧 Email',
      api: '🔌 API',
      manual: '✍️ Manual',
      search_input: '🔍 Search',
    };
    return labels[source] || source;
  };

  if (!user) {
    return (
      <main className="content-area">
        <div className="content-inner">
          <p className="header-subtitle">Please log in to view work orders</p>
        </div>
      </main>
    );
  }

  return (
    <main className="content-area">
      <div className="content-inner" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 className="header-title">Work Orders</h1>
        <p className="header-subtitle">Manage raw work order submissions awaiting parsing</p>

          <div className="filter-tabs" style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {['all', 'pending', 'parsed', 'job_created', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: filter === status ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: filter === status ? 'rgba(108, 114, 201, 0.1)' : 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="container-card">Loading work orders...</div>
          ) : workOrders.length === 0 ? (
            <div className="container-card">
              <EmptyState
                icon="work-orders"
                title="No work orders found"
                description={
                  filter === 'all'
                    ? "You haven't submitted any work orders yet. Create your first work order by using the search bar or pasting unstructured text."
                    : `No work orders with status "${filter.replace('_', ' ')}". Try selecting a different filter or view all work orders.`
                }
                actionLabel="Create Work Order"
                onAction={() => {
                  window.location.href = '/jobs/create';
                }}
                secondaryActionLabel={filter !== 'all' ? "View All" : undefined}
                onSecondaryAction={() => {
                  setFilter('all');
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {workOrders.map((wo) => (
                <div key={wo.id} className="container-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span className={`status-badge ${getStatusBadgeClass(wo.status)}`}>
                          {wo.status.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {getSourceLabel(wo.source)}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          marginBottom: 8,
                          color: 'var(--text-primary)',
                          wordBreak: 'break-word',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {wo.raw_text}
                      </p>
                      {wo.error_message && (
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--error)' }}>
                          Error: {wo.error_message}
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                        {new Date(wo.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {wo.job_id && (
                        <Link
                          href={`/jobs/${wo.job_id}`}
                          className="outline-button"
                          style={{ fontSize: 12, padding: '6px 12px' }}
                        >
                          View Job
                        </Link>
                      )}
                      <Link
                        href={`/work-orders/${wo.id}`}
                        className="outline-button"
                        style={{ fontSize: 12, padding: '6px 12px' }}
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <style>{`
          .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .status-pending {
          background: rgba(245, 158, 11, 0.2);
          color: var(--warning, #F59E0B);
        }
        .status-parsed {
          background: rgba(16, 185, 129, 0.2);
          color: var(--success, #10B981);
        }
        .status-created {
          background: rgba(108, 114, 201, 0.2);
          color: var(--accent-primary, #6C72C9);
        }
        .status-failed {
          background: rgba(239, 68, 68, 0.2);
          color: var(--error, #EF4444);
        }
        .status-default {
          background: rgba(107, 114, 128, 0.2);
          color: var(--text-secondary);
        }
      `}</style>
    </main>
  );
}
