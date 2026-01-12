'use client';

import { ReactNode } from 'react';

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string;
  height?: string;
  children?: ReactNode;
}

/**
 * Hero - Landing page hero section with title, subtitle, and CTA
 * 
 * Uses design tokens from globals.css for consistent styling
 * 
 * @example
 * ```tsx
 * <Hero
 *   title="Connect with Qualified Technicians"
 *   subtitle="Find HVAC, plumbing, and electrical experts in minutes"
 *   ctaText="Get Started"
 *   ctaLink="/signup"
 * />
 * ```
 */
export default function Hero({
  title,
  subtitle,
  ctaText,
  ctaLink,
  backgroundImage,
  height = '600px',
  children
}: HeroProps) {
  return (
    <section
      style={{
        position: 'relative',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        overflow: 'hidden'
      }}
    >
      {/* Background Image (if provided) */}
      {backgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.2,
            filter: 'blur(4px)',
            zIndex: 0
          }}
        />
      )}

      {/* Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1400px',
          width: '100%',
          padding: '0 var(--spacing-2xl)',
          textAlign: 'center'
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--font-section-title)',
            fontSize: 'var(--font-4xl)', // 36px
            fontWeight: 'var(--font-section-title-weight)', // 700
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-lg)',
            lineHeight: 1.2
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: 'var(--font-text-body)',
            fontSize: 'var(--font-xl)', // 18px
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-3xl)',
            maxWidth: '700px',
            margin: '0 auto var(--spacing-3xl) auto',
            lineHeight: 1.6
          }}
        >
          {subtitle}
        </p>

        {/* CTA Button */}
        <a
          href={ctaLink}
          style={{
            display: 'inline-block',
            padding: 'var(--btn-text-padding)', // 12px 32px
            background: 'var(--accent-primary)',
            color: 'var(--btn-text-color)',
            fontSize: 'var(--btn-text-font-size)', // 18px
            fontWeight: 500,
            borderRadius: 'var(--btn-corner-radius)', // 6px
            textDecoration: 'none',
            transition: 'all var(--transition-hover)', // 0.2s
            cursor: 'pointer',
            border: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-secondary)';
            e.currentTarget.style.color = 'var(--btn-text-color-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent-primary)';
            e.currentTarget.style.color = 'var(--btn-text-color)';
          }}
        >
          {ctaText}
        </a>

        {/* Optional children (for additional content) */}
        {children && (
          <div style={{ marginTop: 'var(--spacing-3xl)' }}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
