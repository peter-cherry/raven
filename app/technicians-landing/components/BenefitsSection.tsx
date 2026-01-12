'use client'

import { motion } from 'framer-motion'

export default function BenefitsSection() {
  const benefits = [
    {
      id: '1',
      title: 'Get Matched Instantly',
      description: 'AI matches you to local jobs in seconds based on your skills, location, and availability. No more scrolling through irrelevant listings.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      )
    },
    {
      id: '2',
      title: 'Set Your Own Rates',
      description: 'You decide what you charge. No hidden fees, no platform commissions. Keep 100% of your earnings.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      )
    },
    {
      id: '3',
      title: 'Build Your Reputation',
      description: 'Star ratings and verified reviews help you stand out. Your experience and quality work finally matter.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      )
    }
  ]

  return (
    <section
      style={{
        position: 'relative',
        padding: 'var(--spacing-5xl) var(--spacing-3xl)',
        overflow: 'hidden'
      }}
    >
      {/* Unsplash Landscape Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2940&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          filter: 'brightness(0.7)',
          zIndex: 0
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{
            textAlign: 'center',
            marginBottom: 'var(--spacing-4xl)'
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)',
              letterSpacing: '-0.5px'
            }}
          >
            Why Technicians Choose Raven
          </h2>
          <p
            style={{
              fontSize: 'var(--font-xl)',
              color: 'var(--text-secondary)',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}
          >
            Join thousands of technicians who doubled their income by taking control of their work
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--spacing-2xl)'
          }}
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.7 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              style={{
                padding: 'var(--spacing-2xl)',
                background: 'transparent',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                filter: 'brightness(1.3)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: 'var(--container-border-radius)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Icon Container */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(108, 114, 201, 0.15)',
                  border: '2px solid rgba(108, 114, 201, 0.3)',
                  borderRadius: 'var(--container-border-radius)',
                  marginBottom: 'var(--spacing-xl)',
                  color: 'var(--accent-primary)'
                }}
              >
                {benefit.icon}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: 'var(--font-text-body)',
                  fontSize: 'var(--font-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-md)',
                  letterSpacing: '-0.3px'
                }}
              >
                {benefit.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: 'var(--font-lg)',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  fontWeight: 'var(--font-weight-regular)'
                }}
              >
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
