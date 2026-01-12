'use client'

import { motion } from 'framer-motion'
import { CaseStudy } from '../types'

export default function CaseStudiesSection() {
  const caseStudies: CaseStudy[] = [
    {
      id: '1',
      companyName: 'Riverside Commercial Properties',
      industry: 'Commercial Real Estate',
      facilitySize: '12 office buildings, 850K sq ft',
      problem: 'Emergency HVAC repairs taking 3-5 days to schedule through traditional agencies, costing $15K/month in overtime agency fees.',
      solution: 'Switched to Raven for all mechanical, electrical, and plumbing work. Posted jobs directly to vetted technicians within 15-mile radius.',
      results: {
        costSavings: '$42,000/year',
        timeSaved: '75% faster response',
        satisfactionScore: 4.9
      },
      testimonial: "Raven cut our emergency response time from 48 hours to under 2 hours. We\'re saving over $3,500/month and our tenants are happier than ever.",
      contactName: 'Michael Rodriguez',
      contactTitle: 'Director of Facilities'
    },
    {
      id: '2',
      companyName: 'HealthFirst Medical Centers',
      industry: 'Healthcare Facilities',
      facilitySize: '8 clinics, 320K sq ft',
      problem: 'Compliance-critical maintenance required licensed technicians with insurance verification, causing delays and $12K/month in agency markups.',
      solution: 'Used Raven\'s pre-verified technician network with automated insurance tracking and license verification.',
      results: {
        costSavings: '$38,500/year',
        timeSaved: '90% compliance verification',
        satisfactionScore: 4.8
      },
      testimonial: "The credential verification alone saves us 10 hours per week. Every technician is pre-screened and insured. It\'s a game-changer for healthcare facilities.",
      contactName: 'Dr. Sarah Chen',
      contactTitle: 'Operations Manager'
    },
    {
      id: '3',
      companyName: 'Metro Retail Management',
      industry: 'Retail Property Management',
      facilitySize: '22 shopping centers, 1.2M sq ft',
      problem: 'Managing maintenance across 22 locations with inconsistent contractor quality, no real-time tracking, and budget overruns averaging $8K/month.',
      solution: 'Centralized all maintenance through Raven\'s multi-property dashboard with real-time tracking and automated reporting.',
      results: {
        costSavings: '$51,200/year',
        timeSaved: '65% admin time reduction',
        satisfactionScore: 4.7
      },
      testimonial: "We manage 22 properties from one dashboard. Real-time updates, transparent pricing, and detailed reports make month-end reconciliation a breeze.",
      contactName: 'James Patterson',
      contactTitle: 'VP of Property Operations'
    }
  ]

  return (
    <section style={{
      padding: 'var(--spacing-5xl) var(--spacing-2xl)',
      background: 'transparent',
      position: 'relative'
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, transparent 0%, rgba(101, 98, 144, 0.05) 50%, transparent 100%)',
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
            Proven Results Across Industries
          </h2>
          <p style={{
            fontSize: 'var(--font-xl)',
            color: 'var(--text-secondary)',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Real facility managers, real savings, real impact
          </p>
        </motion.div>

        {/* Case Studies */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-3xl)',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {caseStudies.map((study, index) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              style={{
                padding: 'var(--spacing-3xl)',
                background: 'rgba(178, 173, 201, 0.05)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                filter: 'brightness(1.15)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top accent bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
              }} />

              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 'var(--spacing-xl)',
                flexWrap: 'wrap',
                gap: 'var(--spacing-lg)'
              }}>
                <div style={{ flex: '1 1 300px' }}>
                  <h3 style={{
                    fontSize: 'var(--font-2xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    {study.companyName}
                  </h3>
                  <div style={{
                    fontSize: 'var(--font-lg)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    {study.industry}
                  </div>
                  <div style={{
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-secondary)'
                  }}>
                    {study.facilitySize}
                  </div>
                </div>

                {/* Results at a glance */}
                <div style={{
                  display: 'flex',
                  gap: 'var(--spacing-lg)',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    padding: 'var(--spacing-md)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '2px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--btn-corner-radius)',
                    textAlign: 'center',
                    minWidth: '120px'
                  }}>
                    <div style={{
                      fontSize: 'var(--font-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--success)',
                      marginBottom: 'var(--spacing-xs)'
                    }}>
                      {study.results.costSavings}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Saved
                    </div>
                  </div>
                  <div style={{
                    padding: 'var(--spacing-md)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '2px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: 'var(--btn-corner-radius)',
                    textAlign: 'center',
                    minWidth: '120px'
                  }}>
                    <div style={{
                      fontSize: 'var(--font-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: '#3B82F6',
                      marginBottom: 'var(--spacing-xs)'
                    }}>
                      {study.results.satisfactionScore}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Rating
                    </div>
                  </div>
                </div>
              </div>

              {/* Problem  Solution  Result */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--spacing-xl)',
                marginBottom: 'var(--spacing-xl)'
              }}>
                <div>
                  <div style={{
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--error)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Problem
                  </div>
                  <p style={{
                    fontSize: 'var(--font-lg)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6
                  }}>
                    {study.problem}
                  </p>
                </div>
                <div>
                  <div style={{
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--accent-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Solution
                  </div>
                  <p style={{
                    fontSize: 'var(--font-lg)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6
                  }}>
                    {study.solution}
                  </p>
                </div>
                <div>
                  <div style={{
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--success)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Result
                  </div>
                  <p style={{
                    fontSize: 'var(--font-lg)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6
                  }}>
                    {study.results.timeSaved} + {study.results.costSavings} annual savings with {study.results.satisfactionScore}/5.0 satisfaction rating.
                  </p>
                </div>
              </div>

              {/* Testimonial */}
              <div style={{
                padding: 'var(--spacing-xl)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderLeft: '4px solid var(--accent-primary)',
                borderRadius: 'var(--btn-corner-radius)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <p style={{
                  fontSize: 'var(--font-xl)',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  "{study.testimonial}"
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)'
                  }}>
                    {study.contactName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{
                      fontSize: 'var(--font-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)'
                    }}>
                      {study.contactName}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-md)',
                      color: 'var(--text-secondary)'
                    }}>
                      {study.contactTitle}, {study.companyName}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
