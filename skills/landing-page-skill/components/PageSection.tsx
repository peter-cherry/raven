'use client';

import { ReactNode } from 'react';

interface PageSectionProps {
  children: ReactNode;
  background?: 'primary' | 'secondary' | 'transparent';
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * PageSection - Reusable section wrapper with consistent spacing
 * 
 * Provides standard padding and max-width for landing page sections
 * Uses globals.css design tokens
 * 
 * @example
 * ```tsx
 * <PageSection background="primary" spacing="xl">
 *   <h2>Our Features</h2>
 *   <FeatureGrid columns={3}>
 *     {features}
 *   </FeatureGrid>
 * </PageSection>
 * ```
 */
export default function PageSection({
  children,
  background = 'transparent',
  spacing = 'xl',
  className = ''
}: PageSectionProps) {
  // Map spacing prop to CSS variables
  const spacingMap = {
    sm: 'var(--spacing-2xl)', // 32px
    md: 'var(--spacing-4xl)', // 48px
    lg: 'var(--spacing-5xl)', // 64px
    xl: 'var(--spacing-5xl)'  // 64px (default)
  };

  // Map background prop to CSS variables
  const backgroundMap = {
    primary: 'var(--bg-primary)',
    secondary: 'var(--bg-secondary)',
    transparent: 'transparent'
  };

  return (
    <section
      className={className}
      style={{
        background: backgroundMap[background],
        padding: `${spacingMap[spacing]} var(--spacing-2xl)`, // Vertical + Horizontal padding
        width: '100%'
      }}
    >
      {/* Content Container */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        {children}
      </div>
    </section>
  );
}
