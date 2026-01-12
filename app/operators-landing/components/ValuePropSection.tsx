'use client'

import { motion } from 'framer-motion'
import { ValueProposition } from '../types'

export default function ValuePropSection() {
  const valueProps: ValueProposition[] = [
    {
      id: '1',
      title: 'Find Vetted Technicians in Minutes',
      description: 'Access pre-screened, licensed professionals instantly. No more waiting days for agency responses.',
      metric: '10 min avg response',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      )
    },
    {
      id: '2',
      title: 'Save 30% vs Traditional Agencies',
      description: 'Cut out the middleman markup. Work directly with technicians and keep more budget for your facilities.',
      metric: '$40K avg annual savings',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="2" x2="12" y2="22"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      )
    },
    {
      id: '3',
      title: 'Real-Time Tracking & Transparency',
      description: 'See job status from dispatch to completion. No hidden fees, no surprise charges.',
      metric: '100% pricing transparency',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      )
    }
  ]

  return (
    <section style={{
      padding: 'var(--spacing-5xl) var(--spacing-2xl)',
      background: 'transparent',
      position: 'relative'
    }}>
      {/* Section Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: 'var(--spacing-5xl)' }}
      >
        <h2 style={{
          fontFamily: 'var(--font-section-title)',
          fontSize: 'var(--font-4xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          Why Facility Managers Choose Raven
        </h2>
        <p style={{
          fontSize: 'var(--font-xl)',
          color: 'var(--text-secondary)',
          maxWidth: '700px',
          margin: '0 auto'
        }}>
          Join 350+ facilities that have transformed their maintenance operations
        </p>
      </motion.div>

      {/* Value Propositions Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 'var(--spacing-2xl)',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {valueProps.map((prop, index) => (
          <motion.div
            key={prop.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            whileHover={{ y: -8, scale: 1.02 }}
            style={{
              padding: 'var(--spacing-3xl)',
              background: 'rgba(178, 173, 201, 0.05)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              filter: 'brightness(1.15)',
              transition: 'all 0.3s',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Gradient overlay on hover */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              opacity: 0.6
            }} />

            {/* Icon */}
            <div style={{
              color: 'var(--accent-primary)',
              marginBottom: 'var(--spacing-xl)'
            }}>
              {prop.icon}
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: 'var(--font-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-md)'
            }}>
              {prop.title}
            </h3>

            {/* Description */}
            <p style={{
              fontSize: 'var(--font-lg)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 'var(--spacing-xl)'
            }}>
              {prop.description}
            </p>

            {/* Metric Badge */}
            <div style={{
              display: 'inline-block',
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--btn-corner-radius)',
              color: 'var(--success)',
              fontSize: 'var(--font-md)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              {prop.metric}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comparison callout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.8 }}
        style={{
          marginTop: 'var(--spacing-5xl)',
          padding: 'var(--spacing-3xl)',
          background: 'rgba(101, 98, 144, 0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '2px solid var(--accent-primary)',
          borderRadius: 'var(--container-border-radius)',
          textAlign: 'center',
          maxWidth: '900px',
          margin: 'var(--spacing-5xl) auto 0'
        }}
      >
        <h3 style={{
          fontSize: 'var(--font-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-md)'
        }}>
          30% less than traditional agencies
        </h3>
        <p style={{
          fontSize: 'var(--font-lg)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6
        }}>
          Average maintenance agency charges 30-40% markup on technician labor. Raven's platform fee is just 5%,
          saving you thousands per month while connecting you with the same quality professionals.
        </p>
      </motion.div>
    </section>
  )
}
