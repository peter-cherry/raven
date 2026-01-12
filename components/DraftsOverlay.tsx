'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Draft } from '@/lib/useMultipleDrafts';
import { useEffect, useRef } from 'react';

interface DraftsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: Draft[];
  onSelectDraft: (draft: Draft) => void;
  onDeleteDraft: (draftId: string) => void;
  getTimeSince: (timestamp: string) => string;
  anchorRef?: React.RefObject<HTMLElement>;
}

export default function DraftsOverlay({
  isOpen,
  onClose,
  drafts,
  onSelectDraft,
  onDeleteDraft,
  getTimeSince,
  anchorRef
}: DraftsOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node) &&
          anchorRef?.current && !anchorRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, anchorRef]);

  // Calculate position based on anchor element
  const getPosition = () => {
    if (!anchorRef?.current) return { top: 100, left: 100 };

    const rect = anchorRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      left: rect.left,
      maxWidth: Math.min(500, window.innerWidth - rect.left - 20)
    };
  };

  const position = getPosition();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            maxWidth: position.maxWidth,
            width: 450,
            maxHeight: 500,
            background: 'transparent',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            filter: 'brightness(1.3)',
            border: '1px solid rgba(249, 243, 229, 0.33)',
            borderRadius: 'var(--container-border-radius)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}
        >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{
                fontFamily: 'var(--font-text-body)',
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Work Order Drafts
              </h3>
              <p style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-secondary)',
                margin: '4px 0 0 0'
              }}>
                {drafts.length} saved {drafts.length === 1 ? 'draft' : 'drafts'}
              </p>
            </div>

            {/* Drafts List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px 16px'
            }}>
              {drafts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 40,
                  color: 'var(--text-secondary)'
                }}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    style={{ margin: '0 auto 16px', opacity: 0.5 }}
                  >
                    <path d="M9 2h6a2 2 0 0 1 2 2v1h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2z"/>
                    <line x1="8" y1="10" x2="16" y2="10"/>
                    <line x1="8" y1="14" x2="16" y2="14"/>
                    <line x1="8" y1="18" x2="13" y2="18"/>
                  </svg>
                  <p>No drafts saved yet</p>
                  <p style={{ fontSize: 'var(--font-xs)', marginTop: 8 }}>
                    Your work orders will be automatically saved as drafts
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {drafts.map((draft) => (
                    <motion.div
                      key={draft.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      style={{
                        background: 'rgba(108, 114, 201, 0.05)',
                        border: '1px solid rgba(108, 114, 201, 0.3)',
                        borderRadius: 'var(--container-border-radius)',
                        padding: 16,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      onClick={() => onSelectDraft(draft)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(108, 114, 201, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(108, 114, 201, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(108, 114, 201, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(108, 114, 201, 0.3)';
                      }}
                    >
                      {/* Draft Header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: 8
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: 'var(--font-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--text-primary)',
                            margin: 0,
                            marginBottom: 4
                          }}>
                            {draft.title || 'Untitled Draft'}
                          </h3>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            fontSize: 'var(--font-xs)',
                            color: 'var(--text-secondary)'
                          }}>
                            <span>{getTimeSince(draft.lastModified)}</span>
                            {draft.data.trade_needed && (
                              <>
                                <span>•</span>
                                <span>{draft.data.trade_needed}</span>
                              </>
                            )}
                            {draft.data.urgency && (
                              <>
                                <span>•</span>
                                <span style={{ textTransform: 'capitalize' }}>
                                  {draft.data.urgency.replace('_', ' ')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this draft?')) {
                              onDeleteDraft(draft.id);
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: 4,
                            opacity: 0.7,
                            transition: 'opacity 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>

                      {/* Draft Description */}
                      {draft.description && (
                        <p style={{
                          fontSize: 'var(--font-sm)',
                          color: 'var(--text-secondary)',
                          margin: 0,
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {draft.description}
                        </p>
                      )}

                      {/* Draft Metadata */}
                      {(draft.data.address_text || draft.data.contact_name) && (
                        <div style={{
                          display: 'flex',
                          gap: 16,
                          marginTop: 12,
                          fontSize: 'var(--font-xs)',
                          color: 'var(--text-secondary)'
                        }}>
                          {draft.data.address_text && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                              <span style={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {draft.data.address_text}
                              </span>
                            </div>
                          )}
                          {draft.data.contact_name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                              <span>{draft.data.contact_name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}