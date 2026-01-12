'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FAQItem } from '../types'

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: 'How are technicians vetted and verified?',
      answer: 'All technicians undergo a comprehensive screening process including license verification, background checks, insurance validation, and reference checks. We verify current certifications, trade-specific licenses, and general liability insurance before any technician can accept jobs on our platform.'
    },
    {
      id: '2',
      question: 'What if a technician doesn\'t show up or the work is unsatisfactory?',
      answer: 'We have a satisfaction guarantee. If a technician doesn\'t show up, we\'ll immediately dispatch a replacement at no additional cost. If work quality is unsatisfactory, we offer a resolution process including re-work, refunds, or credit towards your next job. You only pay after the work is completed to your satisfaction.'
    },
    {
      id: '3',
      question: 'How does procurement approval work?',
      answer: 'Raven integrates with your existing procurement workflows. You can set approval thresholds, require multi-level sign-offs for jobs above certain amounts, and export detailed reports for compliance. We provide all W-9 forms, insurance certificates, and vendor documentation needed for your procurement department.'
    },
    {
      id: '4',
      question: 'Can we track technicians across multiple properties?',
      answer: 'Yes. Our multi-property dashboard lets you manage maintenance across all your locations from a single account. Assign property managers, track spend by site, and compare performance metrics across your portfolio. Technicians can be assigned to specific properties or work across your entire network.'
    },
    {
      id: '5',
      question: 'What happens in an emergency after-hours situation?',
      answer: 'Raven operates 24/7/365. You can post emergency jobs at any time, and our system automatically notifies available technicians in your area. Emergency jobs are flagged for priority response, typically getting confirmed within 15-30 minutes even during off-hours. Premium technicians with verified emergency response capabilities are highlighted.'
    },
    {
      id: '6',
      question: 'How does insurance and liability coverage work?',
      answer: 'All technicians must carry general liability insurance with minimum coverage amounts (typically $1M/$2M). We verify and track insurance certificates automatically, alerting you if coverage lapses. Workers comp requirements vary by state - we ensure compliance based on your location. You can also require additional insured endorsements for specific jobs.'
    },
    {
      id: '7',
      question: 'What payment terms do you offer?',
      answer: 'We offer net-30, net-60, or net-90 payment terms for established accounts. You can also use our pay-on-completion option for immediate settlement. All invoices include detailed breakdowns by property, trade, and time period. We integrate with QuickBooks, SAP, and other accounting systems for seamless reconciliation.'
    },
    {
      id: '8',
      question: 'Can we use our existing preferred technicians on the platform?',
      answer: 'Absolutely. You can invite your current contractors to join Raven at no cost to them. They\'ll go through our standard verification process, then appear as "Preferred" in your account. You can set rules to auto-assign certain job types to your preferred technicians while still having access to our broader network when needed.'
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
          Frequently Asked Questions
        </h2>
        <p style={{
          fontSize: 'var(--font-xl)',
          color: 'var(--text-secondary)',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          Everything you need to know about working with Raven
        </p>
      </motion.div>

      {/* FAQ Accordion */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {faqs.map((faq, index) => (
          <motion.div
            key={faq.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            style={{
              marginBottom: 'var(--spacing-lg)'
            }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              style={{
                width: '100%',
                padding: 'var(--spacing-xl)',
                background: 'rgba(178, 173, 201, 0.05)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: openIndex === index
                  ? '2px solid var(--accent-primary)'
                  : 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                filter: 'brightness(1.15)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--spacing-lg)'
              }}
              onMouseEnter={(e) => {
                if (openIndex !== index) {
                  e.currentTarget.style.background = 'rgba(178, 173, 201, 0.1)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(178, 173, 201, 0.05)'
              }}
            >
              <h3 style={{
                fontSize: 'var(--font-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                flex: 1
              }}>
                {faq.question}
              </h3>
              <motion.div
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  color: 'var(--accent-primary)',
                  flexShrink: 0
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </motion.div>
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    padding: 'var(--spacing-xl)',
                    paddingTop: 'var(--spacing-lg)',
                    fontSize: 'var(--font-lg)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6
                  }}>
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Still have questions? */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
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
          maxWidth: '700px',
          margin: 'var(--spacing-5xl) auto 0'
        }}
      >
        <h3 style={{
          fontSize: 'var(--font-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-md)'
        }}>
          Still have questions?
        </h3>
        <p style={{
          fontSize: 'var(--font-lg)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: 'var(--spacing-xl)'
        }}>
          Our team is here to help. Schedule a demo or give us a call.
        </p>
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-lg)',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: 'var(--spacing-md) var(--spacing-xl)',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              border: 'none',
              borderRadius: 'var(--btn-corner-radius)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Schedule a Demo
          </motion.button>
          <a
            href="tel:1-800-RAVEN-GO"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-md) var(--spacing-xl)',
              background: 'transparent',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: 'var(--btn-corner-radius)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            1-800-RAVEN-GO
          </a>
        </div>
      </motion.div>
    </section>
  )
}
