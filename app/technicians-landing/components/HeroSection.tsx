'use client'

import { motion } from 'framer-motion'

export default function HeroSection() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-3xl)',
        background: '#2F2F2F', // Platform dark background
        overflow: 'hidden'
      }}
    >
      {/* Subtle gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 0%, rgba(101, 98, 144, 0.08) 0%, transparent 50%)',
          zIndex: 0
        }}
      />

      {/* Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1200px',
          width: '100%',
          textAlign: 'center'
        }}
      >
        {/* Trust Indicator Badge - Platform Style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            background: 'var(--stats-bg-warm)',
            border: `1px solid var(--stats-border-warm)`,
            borderRadius: 'var(--btn-corner-radius)',
            marginBottom: 'var(--spacing-2xl)',
            fontSize: 'var(--font-sm)',
            fontWeight: 600,
            color: 'var(--stats-text-warm)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Trusted by 2,500+ Technicians
        </motion.div>

        {/* Main Headline - Futura-Bold */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{
            fontFamily: 'var(--font-section-title)',
            fontSize: 'clamp(40px, 5vw, 64px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            marginBottom: 'var(--spacing-xl)',
            letterSpacing: '-0.02em'
          }}
        >
          Find Local Jobs in 5 Minutes
          <br />
          <span style={{ color: 'var(--accent-primary)' }}>Without Agency Fees</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{
            fontFamily: 'var(--font-text-body)',
            fontSize: 'var(--font-xl)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '700px',
            margin: '0 auto var(--spacing-3xl)',
            opacity: 0.9
          }}
        >
          Traditional contractor platforms take 30% of your earnings and send you fake leads. You deserve better.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{
            display: 'flex',
            gap: 'var(--spacing-lg)',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          {/* Primary CTA - Platform Button Style */}
          <a
            href="#signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              padding: '16px 32px',
              background: 'transparent',
              border: '2px solid var(--accent-primary)',
              borderRadius: 'var(--btn-corner-radius)',
              fontSize: 'var(--font-lg)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              textDecoration: 'none',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(101, 98, 144, 0.15)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Get Your First Job
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>

          {/* Secondary CTA */}
          <a
            href="#how-it-works"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              padding: '16px 32px',
              background: 'var(--container-bg)',
              border: '1px solid var(--container-border)',
              borderRadius: 'var(--btn-corner-radius)',
              fontSize: 'var(--font-lg)',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--container-hover-bg)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--container-bg)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            See How It Works
          </a>
        </motion.div>

        {/* Stats Row - Glassmorphic Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-lg)',
            marginTop: 'var(--spacing-5xl)',
            maxWidth: '800px',
            margin: 'var(--spacing-5xl) auto 0'
          }}
        >
          {[
            { label: 'Jobs Posted This Week', value: '500+' },
            { label: 'Average Monthly Earnings', value: '$4,200' },
            { label: 'Average Response Time', value: '<10 min' }
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                background: 'var(--container-bg)',
                border: '1px solid var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: 'var(--spacing-xl)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontFamily: 'var(--font-section-title)',
                fontSize: 'var(--font-3xl)',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                marginBottom: 'var(--spacing-sm)'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--text-secondary)',
                opacity: 0.8,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
