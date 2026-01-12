'use client';

import { ReactNode } from 'react';

interface FeatureGridProps {
  columns?: 2 | 3;
  children: ReactNode;
}

/**
 * FeatureGrid - Responsive grid layout for feature cards
 * 
 * Automatically adjusts from 3 columns (desktop) → 2 (tablet) → 1 (mobile)
 * Uses globals.css responsive breakpoints
 * 
 * @example
 * ```tsx
 * <FeatureGrid columns={3}>
 *   <FeatureCard {...feature1} />
 *   <FeatureCard {...feature2} />
 *   <FeatureCard {...feature3} />
 * </FeatureGrid>
 * ```
 */
export default function FeatureGrid({
  columns = 3,
  children
}: FeatureGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 'var(--spacing-xl)', // 24px
        width: '100%'
      }}
      className="feature-grid"
    >
      {children}

      <style jsx>{`
        @media (max-width: 1023px) {
          .feature-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 767px) {
          .feature-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
