'use client'

import { motion } from 'framer-motion'
import { Feature } from '../types'

export default function FeaturesSection() {
  const features: Feature[] = [
    {
      id: '1',
      title: 'Smart Technician Matching',
      description: 'AI-powered matching connects you with the best-fit technicians based on trade, location, availability, and past performance.',
      benefit: 'Save 2+ hours per job request',
      screenshotUrl: '/videos/feature-matching.mp4' // User will add video here
    },
    {
      id: '2',
      title: 'Verified Credentials & Insurance',
      description: 'All technicians are pre-screened with license verification, background checks, and current insurance coverage.',
      benefit: 'Eliminate compliance risk',
      screenshotUrl: '/videos/feature-credentials.mp4'
    },
    {
      id: '3',
      title: 'Real-Time Job Dashboard',
      description: 'Monitor all active and completed jobs in one place. See technician location, ETA, and job progress updates.',
      benefit: 'Complete visibility across properties',
      screenshotUrl: '/videos/feature-dashboard.mp4'
    },
    {
      id: '4',
      title: 'Integrated Billing & Reporting',
      description: 'Automated invoicing, payment processing, and detailed expense reports by property, trade, and time period.',
      benefit: 'Streamline month-end reconciliation',
      screenshotUrl: '/videos/feature-billing.mp4'
    },
    {
      id: '5',
      title: 'Multi-Property Management',
      description: 'Manage maintenance across multiple locations from a single account. Assign property managers and track spend by site.',
      benefit: 'Scale operations effortlessly',
      screenshotUrl: '/videos/feature-multi-property.mp4'
    },
    {
      id: '6',
      title: 'Performance Analytics',
      description: 'Track response times, completion rates, cost per job, and technician performance across your portfolio.',
      benefit: 'Data-driven optimization',
      screenshotUrl: '/videos/feature-analytics.mp4'
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
          Built for Modern Facility Management
        </h2>
        <p style={{
          fontSize: 'var(--font-xl)',
          color: 'var(--text-secondary)',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          Everything you need to streamline maintenance operations and reduce costs
        </p>
      </motion.div>

      {/* Features Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: 'var(--spacing-3xl)',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {features.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
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
            {/* Top gradient bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              opacity: 0.6
            }} />

            {/* Video placeholder - User will add screen recordings */}
            {feature.screenshotUrl && (
              <div style={{
                width: '100%',
                height: '200px',
                marginBottom: 'var(--spacing-xl)',
                background: 'rgba(101, 98, 144, 0.1)',
                borderRadius: 'var(--btn-corner-radius)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  fontSize: 'var(--font-md)',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  padding: 'var(--spacing-lg)'
                }}>
                  Screen recording placeholder
                  <br />
                  <span style={{ fontSize: 'var(--font-sm)', opacity: 0.7 }}>
                    Save video to: /public{feature.screenshotUrl}
                  </span>
                </div>
              </div>
            )}

            {/* Title */}
            <h3 style={{
              fontSize: 'var(--font-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-md)'
            }}>
              {feature.title}
            </h3>

            {/* Description */}
            <p style={{
              fontSize: 'var(--font-lg)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 'var(--spacing-xl)'
            }}>
              {feature.description}
            </p>

            {/* Benefit Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-md) var(--spacing-xl)',
              background: 'rgba(101, 98, 144, 0.15)',
              border: '2px solid var(--accent-primary)',
              borderRadius: 'var(--btn-corner-radius)',
              color: 'var(--accent-primary)',
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {feature.benefit}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Integration callout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          marginTop: 'var(--spacing-5xl)',
          padding: 'var(--spacing-3xl)',
          background: 'rgba(178, 173, 201, 0.05)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: 'var(--container-border)',
          borderRadius: 'var(--container-border-radius)',
          filter: 'brightness(1.15)',
          textAlign: 'center',
          maxWidth: '900px',
          margin: 'var(--spacing-5xl) auto 0'
        }}
      >
        <h3 style={{
          fontSize: 'var(--font-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          Integrates with Your Existing Tools
        </h3>
        <p style={{
          fontSize: 'var(--font-lg)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: 'var(--spacing-xl)'
        }}>
          Connect with your calendar, accounting software, property management systems, and more
        </p>
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-xl)',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {['QuickBooks', 'Google Calendar', 'Slack', 'Yardi'].map((tool) => (
            <div
              key={tool}
              style={{
                padding: 'var(--spacing-md) var(--spacing-xl)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--btn-corner-radius)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              {tool}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
