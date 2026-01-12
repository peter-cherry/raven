'use client';

interface StatCardProps {
  number: string | number;
  label: string;
  sublabel?: string;
  accentColor?: string;
}

/**
 * StatCard - Display key metrics with large numbers
 * 
 * Extracted from Trade Services Platform dashboard stat boxes
 * Uses globals.css design tokens
 * 
 * @example
 * ```tsx
 * <StatCard
 *   number="1000+"
 *   label="Active Technicians"
 *   sublabel="Verified & insured"
 * />
 * ```
 */
export default function StatCard({
  number,
  label,
  sublabel,
  accentColor
}: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--container-bg)', // rgba(178, 173, 201, 0.05)
        border: 'var(--container-border)', // 1px solid rgba(249, 243, 229, 0.33)
        borderRadius: 'var(--container-border-radius)', // 8px
        padding: 'var(--spacing-3xl)', // 40px
        textAlign: 'center',
        transition: 'all var(--transition-hover)', // 0.2s
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--container-hover-bg)';
        e.currentTarget.style.borderColor = 'var(--container-hover-border)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--container-bg)';
        e.currentTarget.style.borderColor = 'rgba(249, 243, 229, 0.33)';
      }}
    >
      {/* Number */}
      <div
        style={{
          fontSize: 'var(--font-4xl)', // 36px
          fontWeight: 700,
          color: accentColor || 'var(--text-primary)',
          marginBottom: 'var(--spacing-sm)', // 8px
          fontFamily: 'var(--font-section-title)' // Futura
        }}
      >
        {number}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 'var(--font-md)', // 13px
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-text-body)', // Inter
          fontWeight: 500,
          marginBottom: sublabel ? 'var(--spacing-xs)' : 0
        }}
      >
        {label}
      </div>

      {/* Sublabel (optional) */}
      {sublabel && (
        <div
          style={{
            fontSize: 'var(--font-sm)', // 11px
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-text-body)', // Inter
            opacity: 0.9
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}
