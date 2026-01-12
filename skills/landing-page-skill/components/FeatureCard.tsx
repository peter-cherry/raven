'use client';

import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  ctaText?: string;
  ctaLink?: string;
}

/**
 * FeatureCard - Showcase individual features with icon and description
 * 
 * Uses globals.css design tokens for consistent styling
 * 
 * @example
 * ```tsx
 * <FeatureCard
 *   icon={<SearchIcon />}
 *   title="Smart Matching"
 *   description="AI-powered matching connects you with the right technician"
 *   ctaText="Learn More"
 *   ctaLink="/features/matching"
 * />
 * ```
 */
export default function FeatureCard({
  icon,
  title,
  description,
  ctaText,
  ctaLink
}: FeatureCardProps) {
  return (
    <div
      style={{
        background: 'var(--container-bg)', // rgba(178, 173, 201, 0.05)
        border: 'var(--container-border)', // 1px solid rgba(249, 243, 229, 0.33)
        borderRadius: 'var(--container-border-radius)', // 8px
        padding: 'var(--spacing-2xl)', // 32px
        transition: 'all var(--transition-hover)', // 0.2s
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
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
      {/* Icon */}
      <div
        style={{
          width: 'var(--icon-size-xl)', // 32px
          height: 'var(--icon-size-xl)',
          marginBottom: 'var(--spacing-lg)', // 16px
          color: 'var(--icon-color-accent)' // #656290
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: 'var(--font-xl)', // 18px
          fontWeight: 600,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-text-body)', // Inter
          marginBottom: 'var(--spacing-md)', // 12px
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: 'var(--font-md)', // 13px
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-text-body)', // Inter
          lineHeight: 1.6,
          marginBottom: ctaText ? 'var(--spacing-lg)' : 0,
          flex: 1
        }}
      >
        {description}
      </p>

      {/* Optional CTA Link */}
      {ctaText && ctaLink && (
        <a
          href={ctaLink}
          style={{
            fontSize: 'var(--font-md)', // 13px
            color: 'var(--accent-primary)',
            fontFamily: 'var(--font-text-body)', // Inter
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'color var(--transition-hover)',
            marginTop: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--accent-primary)';
          }}
        >
          {ctaText} →
        </a>
      )}
    </div>
  );
}
