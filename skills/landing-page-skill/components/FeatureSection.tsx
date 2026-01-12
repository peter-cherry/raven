'use client';

import { ReactNode } from 'react';

export interface Feature {
  icon?: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}

interface FeatureSectionProps {
  title: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3;
  layout?: 'grid' | 'list';
  background?: string;
}

/**
 * FeatureSection Component
 * 
 * Multi-column feature showcase with icons and descriptions.
 * Based on Trade Services Platform wireframe boxes and grid layouts.
 * Uses design tokens from globals.css.
 * 
 * @example
 * ```tsx
 * <FeatureSection
 *   title="Platform Features"
 *   subtitle="Everything you need"
 *   columns={3}
 *   features={[
 *     { title: "Job Management", description: "Track all jobs", icon: "📋" },
 *     { title: "Tech Network", description: "Find technicians", icon: "👷" }
 *   ]}
 * />
 * ```
 */
export default function FeatureSection({
  title,
  subtitle,
  features,
  columns = 3,
  layout = 'grid',
  background
}: FeatureSectionProps) {
  const minColumnWidth = columns === 3 ? '250px' : '300px';

  return (
    <section
      style={{
        background: background || 'var(--bg-primary)',
        padding: 'var(--spacing-5xl) var(--spacing-3xl)',
        color: 'var(--text-primary)'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {/* Section Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'var(--spacing-4xl)'
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'var(--font-3xl)',
              fontWeight: 'var(--font-section-title-weight)',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)'
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                fontFamily: 'var(--font-text-body)',
                fontSize: 'var(--font-lg)',
                color: 'var(--text-secondary)',
                maxWidth: '700px',
                margin: '0 auto'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Features Grid/List */}
        <div
          style={{
            display: layout === 'grid' ? 'grid' : 'flex',
            flexDirection: layout === 'list' ? 'column' : undefined,
            gridTemplateColumns: layout === 'grid' 
              ? `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))` 
              : undefined,
            gap: 'var(--spacing-xl)',
            alignItems: layout === 'list' ? 'stretch' : 'start'
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={feature.onClick}
              style={{
                background: 'var(--container-bg)',
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: 'var(--spacing-xl)',
                cursor: feature.onClick ? 'pointer' : 'default',
                transition: 'all var(--transition-hover)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--container-hover-bg)';
                e.currentTarget.style.borderColor = 'var(--container-hover-border)';
                if (feature.onClick) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--container-bg)';
                e.currentTarget.style.borderColor = 'rgba(249, 243, 229, 0.33)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Icon */}
              {feature.icon && (
                <div
                  style={{
                    fontSize: 'var(--icon-size-xl)',
                    marginBottom: 'var(--spacing-md)',
                    color: 'var(--accent-primary)'
                  }}
                >
                  {feature.icon}
                </div>
              )}

              {/* Title */}
              <h3
                style={{
                  fontFamily: 'var(--font-text-body)',
                  fontSize: 'var(--font-lg)',
                  fontWeight: 700,
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--text-primary)'
                }}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: 'var(--font-text-body)',
                  fontSize: 'var(--font-md)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          section {
            padding: var(--spacing-4xl) var(--spacing-lg) !important;
          }
          h2 {
            font-size: var(--font-2xl) !important;
          }
          div[style*="grid"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
