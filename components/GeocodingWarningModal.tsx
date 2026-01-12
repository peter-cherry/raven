'use client';

import { motion } from 'framer-motion';

interface GeocodingWarningModalProps {
  address: string;
  onFixAddress: () => void;
  onUseFallback: () => void;
}

export default function GeocodingWarningModal({
  address,
  onFixAddress,
  onUseFallback
}: GeocodingWarningModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          maxWidth: 480,
          width: 'calc(100% - 32px)',
          background: 'transparent',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          filter: 'brightness(1.3)',
          border: '2px solid #EF4444',
          borderRadius: 'var(--modal-border-radius)',
          padding: 'var(--spacing-2xl)',
          textAlign: 'center'
        }}
      >
        {/* Warning Icon */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#EF4444"
          strokeWidth="2"
          style={{ margin: '0 auto var(--spacing-lg)' }}
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>

        {/* Title */}
        <h2
          style={{
            fontFamily: 'var(--font-section-title)',
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}
        >
          Unable to Find Address
        </h2>

        {/* Message */}
        <p
          style={{
            fontFamily: 'var(--font-text-body)',
            fontSize: 'var(--font-md)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-sm)',
            lineHeight: 1.5
          }}
        >
          We couldn't geocode the following address:
        </p>

        {/* Failed Address Display */}
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xl)',
            fontFamily: 'var(--font-text-body)',
            fontSize: 'var(--font-md)',
            color: 'var(--text-primary)',
            fontWeight: 'var(--font-weight-semibold)',
            wordBreak: 'break-word'
          }}
        >
          {address}
        </div>

        {/* Options */}
        <p
          style={{
            fontFamily: 'var(--font-text-body)',
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-lg)',
            lineHeight: 1.5
          }}
        >
          Please fix the address or use a fallback location (Miami, FL) to continue.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            justifyContent: 'center'
          }}
        >
          <button
            onClick={onFixAddress}
            className="outline-button"
            style={{
              flex: 1,
              maxWidth: 200,
              padding: '12px 24px',
              borderRadius: 'var(--btn-corner-radius)',
              border: '1px solid var(--accent-primary)',
              background: 'transparent',
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-text-body)',
              fontSize: 'var(--font-md)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Fix Address
          </button>

          <button
            onClick={onUseFallback}
            className="primary-button"
            style={{
              flex: 1,
              maxWidth: 200,
              padding: '12px 24px',
              borderRadius: 'var(--btn-corner-radius)',
              background: 'var(--accent-primary)',
              border: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-text-body)',
              fontSize: 'var(--font-md)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Use Fallback
          </button>
        </div>
      </motion.div>
    </div>
  );
}
