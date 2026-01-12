'use client'

import { motion } from 'framer-motion'
import ROICalculator from './ROICalculator'

export default function PricingSection() {
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
          Transparent Pricing That Saves You Money
        </h2>
        <p style={{
          fontSize: 'var(--font-xl)',
          color: 'var(--text-secondary)',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          No hidden fees, no surprise charges, no long-term contracts
        </p>
      </motion.div>

      {/* ROI Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          maxWidth: '1000px',
          margin: '0 auto var(--spacing-5xl)'
        }}
      >
        <ROICalculator />
      </motion.div>

      {/* Pricing Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        <h3 style={{
          fontSize: 'var(--font-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-2xl)',
          textAlign: 'center'
        }}>
          How Raven Pricing Works
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--spacing-2xl)'
        }}>
          {/* Platform Fee */}
          <div style={{
            padding: 'var(--spacing-3xl)',
            background: 'rgba(178, 173, 201, 0.05)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            filter: 'brightness(1.15)'
          }}>
            <div style={{
              fontSize: 'var(--font-4xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--accent-primary)',
              marginBottom: 'var(--spacing-md)'
            }}>
              5%
            </div>
            <h4 style={{
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-md)'
            }}>
              Platform Fee
            </h4>
            <p style={{
              fontSize: 'var(--font-lg)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6
            }}>
              Simple 5% fee on completed jobs. No monthly subscriptions, no setup fees, no hidden charges.
            </p>
          </div>

          {/* What's Included */}
          <div style={{
            padding: 'var(--spacing-3xl)',
            background: 'rgba(178, 173, 201, 0.05)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            filter: 'brightness(1.15)'
          }}>
            <div style={{
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--success)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 'var(--spacing-lg)'
            }}>
              What's Included
            </div>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {[
                'Unlimited job postings',
                'Technician verification',
                'Real-time tracking',
                'Automated billing',
                'Multi-property dashboard',
                'Performance analytics',
                'Email & phone support',
                'Integration with your tools'
              ].map((item, index) => (
                <li key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  marginBottom: 'var(--spacing-md)',
                  fontSize: 'var(--font-lg)',
                  color: 'var(--text-secondary)'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Comparison */}
          <div style={{
            padding: 'var(--spacing-3xl)',
            background: 'rgba(178, 173, 201, 0.05)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            filter: 'brightness(1.15)'
          }}>
            <div style={{
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--error)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Traditional Agencies Charge
            </div>
            <div style={{
              fontSize: 'var(--font-4xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--error)',
              marginBottom: 'var(--spacing-md)',
              textDecoration: 'line-through',
              opacity: 0.7
            }}>
              30-40%
            </div>
            <p style={{
              fontSize: 'var(--font-lg)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 'var(--spacing-xl)'
            }}>
              Plus hidden fees, monthly minimums, and long-term contracts.
            </p>
            <div style={{
              padding: 'var(--spacing-md)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--btn-corner-radius)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: 'var(--font-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--success)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Save 25%
              </div>
              <div style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--text-secondary)'
              }}>
                on every job with Raven
              </div>
            </div>
          </div>
        </div>

        {/* No Hidden Fees Callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{
            marginTop: 'var(--spacing-5xl)',
            padding: 'var(--spacing-3xl)',
            background: 'rgba(101, 98, 144, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '2px solid var(--accent-primary)',
            borderRadius: 'var(--container-border-radius)',
            textAlign: 'center'
          }}
        >
          <h3 style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            No Hidden Fees Promise
          </h3>
          <p style={{
            fontSize: 'var(--font-xl)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            The price you see is the price you pay. No setup fees, no monthly minimums,
            no cancellation charges. Cancel anytime with zero penalties.
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
