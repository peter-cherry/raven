'use client'

import { motion } from 'framer-motion'

interface CTASectionProps {
  onCtaClick?: () => void
}

export default function CTASection({ onCtaClick }: CTASectionProps) {
  return (
    <section style={{
      padding: 'var(--spacing-5xl) var(--spacing-2xl)',
      background: 'transparent',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background gradient effects */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '120%',
        height: '120%',
        background: 'radial-gradient(circle, rgba(101, 98, 144, 0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'var(--spacing-5xl)',
          background: 'rgba(178, 173, 201, 0.05)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: 'var(--container-border)',
          borderRadius: 'var(--container-border-radius)',
          filter: 'brightness(1.15)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Top accent bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
          borderRadius: 'var(--container-border-radius) var(--container-border-radius) 0 0'
        }} />

        {/* Urgency badge */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            display: 'inline-block',
            padding: 'var(--spacing-sm) var(--spacing-xl)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--btn-corner-radius)',
            color: 'var(--success)',
            fontSize: 'var(--font-md)',
            fontWeight: 'var(--font-weight-semibold)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: 'var(--spacing-2xl)'
          }}
        >
          Join 350+ Facilities Already Saving
        </motion.div>

        {/* Headline */}
        <h2 style={{
          fontFamily: 'var(--font-section-title)',
          fontSize: 'clamp(32px, 4.5vw, 48px)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-xl)',
          lineHeight: 1.2
        }}>
          Start Saving Today with Zero Risk
        </h2>

        {/* Subheadline */}
        <p style={{
          fontSize: 'clamp(18px, 2.5vw, 22px)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: 'var(--spacing-3xl)',
          maxWidth: '800px',
          margin: '0 auto var(--spacing-3xl)'
        }}>
          No setup fees. No monthly minimums. No long-term contracts.
          Start using Raven today and only pay for completed jobs.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-lg)',
          justifyContent: 'center',
          marginBottom: 'var(--spacing-3xl)',
          flexWrap: 'wrap'
        }}>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCtaClick}
            style={{
              padding: 'var(--spacing-lg) var(--spacing-3xl)',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              border: 'none',
              borderRadius: 'var(--btn-corner-radius)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(101, 98, 144, 0.3)'
            }}
          >
            Get Started Free
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: 'var(--spacing-lg) var(--spacing-3xl)',
              background: 'transparent',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: 'var(--btn-corner-radius)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transition: 'all 0.2s'
            }}
          >
            Schedule a Demo
          </motion.button>
        </div>

        {/* Risk reversal */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          flexWrap: 'wrap',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          {[
            'Cancel anytime',
            'No credit card required',
            'Free onboarding support'
          ].map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                fontSize: 'var(--font-md)',
                color: 'var(--text-secondary)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {item}
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div style={{
          paddingTop: 'var(--spacing-2xl)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'var(--spacing-xl)',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {[
              { value: '$2.4M', label: 'Saved in 2024' },
              { value: '350+', label: 'Facilities' },
              { value: '4.8', label: 'Avg Rating' },
              { value: '<10 min', label: 'Response Time' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 + (index * 0.1) }}
              >
                <div style={{
                  fontSize: 'var(--font-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--accent-primary)',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Trust badges below */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          marginTop: 'var(--spacing-3xl)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--spacing-2xl)',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1
        }}
      >
        {['SOC 2 Compliant', 'Bank-Level Security', 'GDPR Compliant'].map((badge, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--btn-corner-radius)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-md)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            {badge}
          </div>
        ))}
      </motion.div>
    </section>
  )
}
