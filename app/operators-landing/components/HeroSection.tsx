'use client'

import { motion } from 'framer-motion'
import { TrustIndicator } from '../types'

interface HeroSectionProps {
  onCtaClick?: () => void
}

export default function HeroSection({ onCtaClick }: HeroSectionProps) {
  const trustIndicators: TrustIndicator[] = [
    { label: 'Facilities Using Raven', value: '350+' },
    { label: 'Saved in 2024', value: '$2.4M' },
    { label: 'Avg Technician Rating', value: '4.8' },
    { label: 'Avg Response Time', value: '<10 min' }
  ]

  return (
    <section style={{
      padding: 'var(--spacing-5xl) var(--spacing-2xl)',
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      position: 'relative',
      minHeight: '90vh',
      justifyContent: 'center'
    }}>
      {/* Background gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 50% 20%, rgba(101, 98, 144, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ position: 'relative', zIndex: 1, maxWidth: '1200px' }}
      >
        {/* Problem (Headline) */}
        <h1 style={{
          fontFamily: 'var(--font-section-title)',
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-xl)',
          lineHeight: 1.2
        }}>
          Stop Overpaying for Slow Contractors
        </h1>

        {/* Agitate (Subheadline) */}
        <p style={{
          fontSize: 'clamp(18px, 2.5vw, 24px)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--spacing-2xl)',
          lineHeight: 1.6,
          maxWidth: '900px',
          margin: '0 auto var(--spacing-2xl)'
        }}>
          Traditional contractor agencies charge <strong style={{ color: 'var(--warning)' }}>30% markups</strong> and take{' '}
          <strong style={{ color: 'var(--warning)' }}>48+ hours</strong> to respond. Your facilities can't wait that long.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-lg)',
          justifyContent: 'center',
          marginBottom: 'var(--spacing-5xl)',
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
              transition: 'all 0.2s'
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
            Calculate Your Savings
          </motion.button>
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-xl)',
            maxWidth: '1000px',
            margin: '0 auto'
          }}
        >
          {trustIndicators.map((indicator, index) => (
            <div
              key={index}
              style={{
                padding: 'var(--spacing-xl)',
                background: 'rgba(178, 173, 201, 0.05)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                filter: 'brightness(1.15)'
              }}
            >
              <div style={{
                fontSize: 'var(--font-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--accent-primary)',
                marginBottom: 'var(--spacing-sm)'
              }}>
                {indicator.value}
              </div>
              <div style={{
                fontSize: 'var(--font-md)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {indicator.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
