'use client'

import { motion } from 'framer-motion'
import { HowItWorksStep } from '../types'

export default function HowItWorks() {
  const steps: HowItWorksStep[] = [
    {
      id: '1',
      stepNumber: 1,
      title: 'Post Your Job',
      description: 'Describe your maintenance need, location, and timeline. Upload photos if needed.',
      timeEstimate: '2 minutes',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      )
    },
    {
      id: '2',
      stepNumber: 2,
      title: 'Review Qualified Technicians',
      description: 'Get responses from vetted pros nearby. Compare ratings, reviews, and pricing instantly.',
      timeEstimate: '5-10 minutes',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )
    },
    {
      id: '3',
      stepNumber: 3,
      title: 'Assign & Track',
      description: 'Choose your technician and monitor job progress in real-time. Pay only after completion.',
      timeEstimate: '1 minute',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 11 12 14 22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
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
      {/* Background accent */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
        height: '60%',
        background: 'radial-gradient(circle, rgba(101, 98, 144, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
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
            How It Works
          </h2>
          <p style={{
            fontSize: 'var(--font-xl)',
            color: 'var(--text-secondary)',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            From emergency repair to scheduled maintenance in three simple steps
          </p>
        </motion.div>

        {/* Steps Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: 'var(--spacing-3xl)',
          maxWidth: '1400px',
          margin: '0 auto',
          flexWrap: 'wrap'
        }}>
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              style={{
                flex: '1 1 320px',
                maxWidth: '400px',
                position: 'relative'
              }}
            >
              {/* Connecting Arrow (except for last step) */}
              {index < steps.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: '80px',
                  right: '-40px',
                  width: '80px',
                  height: '2px',
                  background: 'linear-gradient(90deg, var(--accent-primary) 0%, transparent 100%)',
                  // Responsive display handled via CSS media queries
                }}>
                  <div style={{
                    position: 'absolute',
                    right: '-4px',
                    top: '-4px',
                    width: 0,
                    height: 0,
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderLeft: `8px solid var(--accent-primary)`
                  }} />
                </div>
              )}

              {/* Step Card */}
              <div style={{
                padding: 'var(--spacing-3xl)',
                background: 'rgba(178, 173, 201, 0.05)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                filter: 'brightness(1.15)',
                textAlign: 'center',
                position: 'relative'
              }}>
                {/* Step Number Badge */}
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--font-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  border: '3px solid var(--bg-primary)'
                }}>
                  {step.stepNumber}
                </div>

                {/* Icon */}
                <div style={{
                  color: 'var(--accent-primary)',
                  marginTop: 'var(--spacing-xl)',
                  marginBottom: 'var(--spacing-lg)',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  {step.icon}
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: 'var(--font-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  {step.title}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: 'var(--font-lg)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  {step.description}
                </p>

                {/* Time Estimate */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--btn-corner-radius)',
                  color: 'var(--success)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {step.timeEstimate}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Total Time Callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{
            marginTop: 'var(--spacing-5xl)',
            padding: 'var(--spacing-2xl)',
            background: 'rgba(59, 130, 246, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 'var(--container-border-radius)',
            textAlign: 'center',
            maxWidth: '600px',
            margin: 'var(--spacing-5xl) auto 0'
          }}
        >
          <div style={{
            fontSize: 'var(--font-4xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: '#3B82F6',
            marginBottom: 'var(--spacing-sm)'
          }}>
            10 minutes vs 48 hours
          </div>
          <p style={{
            fontSize: 'var(--font-lg)',
            color: 'var(--text-secondary)'
          }}>
            Average time from posting to technician assignment
          </p>
        </motion.div>
      </div>
    </section>
  )
}
