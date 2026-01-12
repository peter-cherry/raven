'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useMultipleDrafts, Draft } from '@/lib/useMultipleDrafts';

export default function DraftsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const drafts = useMultipleDrafts({
    key: 'work-orders',
    maxDrafts: 10
  });

  // Redirect to login if not authenticated (skip in mock mode)
  useEffect(() => {
    const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
    if (!user && !isMockMode) {
      router.push('/login?returnUrl=/drafts');
    }
  }, [user, router]);

  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
  if (!user && !isMockMode) {
    return null;
  }

  // Get urgency badge
  const getUrgencyBadge = (urgency: string | undefined) => {
    if (!urgency) return null;
    const urgencyLower = urgency.toLowerCase().replace('_', ' ');
    if (urgencyLower.includes('high') || urgencyLower.includes('emergency')) {
      return <span className="badge badge-error">{urgencyLower}</span>;
    }
    if (urgencyLower.includes('medium') || urgencyLower.includes('standard')) {
      return <span className="badge badge-warning">{urgencyLower}</span>;
    }
    return <span className="badge badge-default">{urgencyLower}</span>;
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-info">
            <h1 className="page-header-title">Work Order Drafts</h1>
            <p className="page-header-description">
              {drafts.draftCount} saved {drafts.draftCount === 1 ? 'draft' : 'drafts'}
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

      {/* Drafts List */}
      {drafts.draftCount === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <h3 className="empty-state-title">No drafts saved yet</h3>
            <p className="empty-state-description">
              Your work orders will be automatically saved as drafts while you're creating them.
            </p>
            <Link href="/?create=true" className="btn btn-primary">
              Create Work Order
            </Link>
          </div>
        </div>
      ) : (
        <div className="list-view">
          <div className="list-view__header">
            <span className="list-view__title">All Drafts</span>
            {drafts.draftCount > 1 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--ds-error)' }}
                onClick={() => {
                  if (confirm(`Delete all ${drafts.draftCount} drafts?`)) {
                    drafts.clearAllDrafts();
                  }
                }}
              >
                Clear All
              </button>
            )}
          </div>
          
          {drafts.drafts.map((draft: Draft) => (
            <div 
              key={draft.id}
              className="list-item"
              onClick={() => router.push(`/?draft=${draft.id}`)}
            >
              {/* Icon */}
              <div 
                className="list-item__icon"
                style={{ 
                  background: 'var(--ds-feature-drafts-bg)', 
                  color: 'var(--ds-feature-drafts)' 
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>

              {/* Content */}
              <div className="list-item__content" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)', marginBottom: '4px' }}>
                  <span className="list-item__title" style={{ fontWeight: 'var(--ds-font-semibold)' }}>
                    {draft.title || 'Untitled Draft'}
                  </span>
                  {draft.data.urgency && getUrgencyBadge(draft.data.urgency)}
                </div>
                <div className="list-item__meta">
                  <span style={{ color: 'var(--ds-text-tertiary)' }}>
                    {drafts.getTimeSince(draft.lastModified)}
                  </span>
                  {draft.data.trade_needed && (
                    <>
                      <span style={{ color: 'var(--ds-border-default)' }}>•</span>
                      <span style={{ color: 'var(--ds-text-secondary)' }}>{draft.data.trade_needed}</span>
                    </>
                  )}
                  {draft.data.city && (
                    <>
                      <span style={{ color: 'var(--ds-border-default)' }}>•</span>
                      <span style={{ color: 'var(--ds-text-secondary)' }}>{draft.data.city}</span>
                    </>
                  )}
                </div>
                {draft.description && (
                  <p style={{ 
                    fontSize: 'var(--ds-text-sm)', 
                    color: 'var(--ds-text-secondary)',
                    marginTop: 'var(--ds-space-2)',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {draft.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this draft?')) {
                      drafts.deleteDraft(draft.id);
                    }
                  }}
                  style={{ color: 'var(--ds-text-tertiary)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ds-text-tertiary)" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
