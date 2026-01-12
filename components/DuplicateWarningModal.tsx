'use client';

import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface DuplicateJob {
  id: string;
  job_title: string;
  address_text: string;
  trade_needed: string;
  job_status: string;
  created_at: string;
  city?: string;
  state?: string;
}

interface DuplicateWarningModalProps {
  duplicates: DuplicateJob[];
  onViewExisting: (jobId: string) => void;
  onContinueAnyway: () => void;
  onCancel: () => void;
}

export default function DuplicateWarningModal({
  duplicates,
  onViewExisting,
  onContinueAnyway,
  onCancel
}: DuplicateWarningModalProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'unassigned':
        return '#6C72C9';
      case 'assigned':
        return '#F59E0B';
      case 'completed':
        return '#10B981';
      default:
        return '#A0A0A8';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 600,
          width: '90%',
          maxHeight: '80vh',
          position: 'relative',
          background: 'rgba(47, 47, 47, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          filter: 'brightness(1.15)',
          borderRadius: 'var(--modal-border-radius)',
          padding: 'var(--spacing-3xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* SVG Background */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <rect x="0" y="0" width="600" height="600" rx="16" fill="#151413"/>
          <rect x="1" y="1" width="598" height="598" rx="15" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.5" fill="none"/>
        </svg>

        {/* Warning Icon and Title */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'var(--font-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-xs)'
            }}>
              Similar Work Order Found
            </h2>
            <p style={{
              fontFamily: 'var(--font-text-body)',
              fontSize: 'var(--font-sm)',
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              We found {duplicates.length} similar work {duplicates.length === 1 ? 'order' : 'orders'} that may be duplicates
            </p>
          </div>
        </div>

        {/* Scrollable duplicate list */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          overflowY: 'auto',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          {duplicates.map((duplicate, index) => (
            <div
              key={duplicate.id}
              style={{
                background: 'rgba(101, 98, 144, 0.15)',
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: 'var(--spacing-lg)',
                marginBottom: index < duplicates.length - 1 ? 'var(--spacing-md)' : 0,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => onViewExisting(duplicate.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(101, 98, 144, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(249, 243, 229, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(101, 98, 144, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(249, 243, 229, 0.33)';
              }}
            >
              {/* WO Number */}
              <div style={{
                fontFamily: 'var(--font-text-body)',
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                letterSpacing: '0.5px',
                marginBottom: 'var(--spacing-sm)'
              }}>
                WO-{duplicate.id.slice(0, 8).toUpperCase()}
              </div>

              {/* Status Badge */}
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '6px',
                background: `${getStatusColor(duplicate.job_status)}22`,
                border: `1px solid ${getStatusColor(duplicate.job_status)}`,
                fontFamily: 'var(--font-text-body)',
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: getStatusColor(duplicate.job_status),
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: 'var(--spacing-md)'
              }}>
                {getStatusLabel(duplicate.job_status)}
              </div>

              {/* Job Title */}
              <div style={{
                fontFamily: 'var(--font-text-body)',
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-sm)'
              }}>
                {duplicate.job_title}
              </div>

              {/* Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-sm)',
                fontSize: 'var(--font-sm)',
                color: 'var(--text-secondary)'
              }}>
                <div>
                  <span style={{ opacity: 0.7 }}>Trade: </span>
                  <span style={{ color: 'var(--text-primary)' }}>{duplicate.trade_needed}</span>
                </div>
                <div>
                  <span style={{ opacity: 0.7 }}>Created: </span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatDate(duplicate.created_at)}</span>
                </div>
              </div>

              {/* Location */}
              <div style={{
                marginTop: 'var(--spacing-sm)',
                fontSize: 'var(--font-sm)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span style={{ color: 'var(--text-primary)' }}>{duplicate.address_text}</span>
              </div>

              {/* Click hint */}
              <div style={{
                marginTop: 'var(--spacing-sm)',
                fontSize: 'var(--font-xs)',
                color: 'rgba(249, 243, 229, 0.5)',
                fontStyle: 'italic'
              }}>
                Click to view details →
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          gap: 'var(--spacing-md)',
          paddingTop: 'var(--spacing-lg)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 'var(--spacing-md) var(--spacing-xl)',
              background: 'transparent',
              border: '1px solid rgba(249, 243, 229, 0.3)',
              borderRadius: 'var(--btn-corner-radius)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-text-body)',
              fontSize: 'var(--font-md)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(249, 243, 229, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(249, 243, 229, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(249, 243, 229, 0.3)';
            }}
          >
            Cancel
          </button>

          <button
            onClick={onContinueAnyway}
            className="primary-button"
            style={{
              flex: 1,
              padding: 'var(--spacing-md) var(--spacing-xl)',
              background: 'linear-gradient(135deg, #9a96d5 0%, #7b76b8 100%)',
              border: 'none',
              borderRadius: 'var(--btn-corner-radius)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-text-body)',
              fontSize: 'var(--font-md)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Continue Anyway
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
}
