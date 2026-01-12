"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import type { RawWorkOrder } from '@/types/work-orders';

export default function WorkOrderDetailPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const workOrderId = pathname?.split('/').pop() || '';
  const [workOrder, setWorkOrder] = useState<RawWorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !workOrderId) return;

    const fetchWorkOrder = async () => {
      try {
        const { data, error: err } = await supabase
          .from('raw_work_orders')
          .select('*')
          .eq('id', workOrderId)
          .single();

        if (err) throw err;
        setWorkOrder(data as RawWorkOrder);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load work order');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrder();
  }, [user, workOrderId]);

  if (!user) {
    return (
      <main className="content-area">
        <div className="content-inner">
          <p className="header-subtitle">Please log in to view this work order</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="content-area">
        <div className="content-inner">
          <p className="header-subtitle">Loading work order...</p>
        </div>
      </main>
    );
  }

  if (error || !workOrder) {
    return (
      <main className="content-area">
        <div className="content-inner">
          <h1 className="header-title">Error</h1>
          <p className="header-subtitle">{error || 'Work order not found'}</p>
          <Link href="/work-orders" className="primary-button">
            Back to Work Orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="content-area">
      <div className="content-inner">
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ marginBottom: 24 }}>
            <Link href="/work-orders" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
              ← Back to Work Orders
            </Link>
          </div>

          <div className="container-card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h1 className="header-title" style={{ marginBottom: 0 }}>
                Work Order Details
              </h1>
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'rgba(108, 114, 201, 0.2)',
                  color: 'var(--accent-primary)',
                  textTransform: 'capitalize',
                }}
              >
                {workOrder.status.replace('_', ' ')}
              </span>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <p style={{ margin: 0, marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  ID
                </p>
                <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 12 }}>{workOrder.id}</p>
              </div>

              <div>
                <p style={{ margin: 0, marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Source
                </p>
                <p style={{ margin: 0, textTransform: 'capitalize' }}>{workOrder.source}</p>
              </div>

              <div>
                <p style={{ margin: 0, marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Created
                </p>
                <p style={{ margin: 0 }}>{new Date(workOrder.created_at).toLocaleString()}</p>
              </div>

              <div>
                <p style={{ margin: 0, marginBottom: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Updated
                </p>
                <p style={{ margin: 0 }}>{new Date(workOrder.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="container-card" style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, marginBottom: 12, fontSize: 16, fontWeight: 600 }}>Raw Text</h2>
            <p
              style={{
                margin: 0,
                padding: 12,
                background: 'var(--bg-primary)',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                fontFamily: 'monospace',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--text-secondary)',
              }}
            >
              {workOrder.raw_text}
            </p>
          </div>

          {workOrder.error_message && (
            <div className="container-card" style={{ marginBottom: 24, borderLeft: '4px solid var(--error)' }}>
              <h2 style={{ margin: 0, marginBottom: 12, fontSize: 16, fontWeight: 600, color: 'var(--error)' }}>
                Error
              </h2>
              <p style={{ margin: 0, color: 'var(--error)' }}>{workOrder.error_message}</p>
            </div>
          )}

          {workOrder.parsed_data && (
            <div className="container-card" style={{ marginBottom: 24 }}>
              <h2 style={{ margin: 0, marginBottom: 12, fontSize: 16, fontWeight: 600 }}>Parsed Data</h2>
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  background: 'var(--bg-primary)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  fontSize: 12,
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(workOrder.parsed_data, null, 2)}
              </pre>
            </div>
          )}

          {workOrder.job_id && (
            <div className="container-card">
              <h2 style={{ margin: 0, marginBottom: 12, fontSize: 16, fontWeight: 600 }}>Linked Job</h2>
              <Link
                href={`/jobs/${workOrder.job_id}`}
                className="primary-button"
                style={{ display: 'inline-block' }}
              >
                View Job Details →
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
