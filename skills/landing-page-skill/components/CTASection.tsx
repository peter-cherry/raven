'use client';

interface CTASectionProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  centered?: boolean;
}

/**
 * CTASection - Call-to-action section with title, description, and button
 * 
 * Uses globals.css design tokens for styling
 * 
 * @example
 * ```tsx
 * <CTASection
 *   title="Ready to Get Started?"
 *   description="Join hundreds of service providers using our platform"
 *   buttonText="Sign Up Now"
 *   buttonLink="/signup"
 * />
 * ```
 */
export default function CTASection({
  title,
  description,
  buttonText,
  buttonLink,
  centered = true
}: CTASectionProps) {
  return (
    <div
      style={{
        background: 'var(--container-bg)', // rgba(178, 173, 201, 0.05)
        border: 'var(--container-border)', // 1px solid rgba(249, 243, 229, 0.33)
        borderRadius: 'var(--container-border-radius)', // 8px
        padding: 'var(--spacing-5xl)', // 64px
        textAlign: centered ? 'center' : 'left',
        display: 'flex',
        flexDirection: 'column',
        alignItems: centered ? 'center' : 'flex-start',
        gap: 'var(--spacing-xl)' // 24px
      }}
    >
      {/* Title */}
      <h2
        style={{
          fontFamily: 'var(--font-section-title)', // Futura
          fontSize: 'var(--font-3xl)', // 28px
          fontWeight: 'var(--font-section-title-weight)', // 700
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-md)' // 12px
        }}
      >
        {title}
      </h2>

      {/* Description */}
      <p
        style={{
          fontFamily: 'var(--font-text-body)', // Inter
          fontSize: 'var(--font-lg)', // 16px
          color: 'var(--text-secondary)',
          maxWidth: centered ? '700px' : '100%',
          lineHeight: 1.6,
          marginBottom: 'var(--spacing-lg)' // 16px
        }}
      >
        {description}
      </p>

      {/* CTA Button */}
      <a
        href={buttonLink}
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
        {buttonText}
      </a>
    </div>
  );
}
