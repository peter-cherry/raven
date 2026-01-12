'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(null)

  const faqs = [
    {
      id: '1',
      question: 'How much does Raven cost?',
      answer: 'Raven has a simple flat subscription model. Pay $49/month and keep 100% of your earnings. No commission fees, no hidden charges. Cancel anytime.'
    },
    {
      id: '2',
      question: 'Do I need special licenses or certifications?',
      answer: 'You need to be licensed and insured in your trade (HVAC, plumbing, electrical, etc.). We verify all credentials before activating your profile to ensure quality standards.'
    },
    {
      id: '3',
      question: 'How quickly will I start getting jobs?',
      answer: 'Most technicians receive their first job match within 24-48 hours of completing their profile. The more complete your profile and availability, the faster you\'ll get matched.'
    },
    {
      id: '4',
      question: 'What if a client doesn\'t pay?',
      answer: 'Payment is held in escrow when a job is accepted. Once you complete the work and the client confirms, payment is automatically released to you within 24 hours. You\'re protected.'
    },
    {
      id: '5',
      question: 'Can I choose which jobs to accept?',
      answer: 'Absolutely. You have complete control. Review each job opportunity and accept only the ones that work for your schedule and rates. No penalties for declining.'
    },
    {
      id: '6',
      question: 'What happens if I get a bad review?',
      answer: 'You can respond to all reviews and explain your side. Our support team investigates disputes. One negative review won\'t hurt you - clients see your overall rating and total review count.'
    },
    {
      id: '7',
      question: 'Is there a minimum number of jobs I have to take?',
      answer: 'No minimums. Work as much or as little as you want. Set your availability and only accept jobs when it works for you. Raven fits your lifestyle, not the other way around.'
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
          backgroundImage: 'url(https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2948&auto=format&fit=crop)',
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
          maxWidth: '900px',
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
            Frequently Asked Questions
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
            Everything you need to know about joining Raven
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-lg)'
          }}
        >
          {faqs.map((faq, index) => {
            const isOpen = openId === faq.id

            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                style={{
                  background: 'transparent',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  filter: 'brightness(1.3)',
                  border: isOpen
                    ? '1px solid rgba(108, 114, 201, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: 'var(--container-border-radius)',
                  overflow: 'hidden',
                  transition: 'border-color 0.3s ease'
                }}
              >
                {/* Question Button */}
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-xl)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--spacing-lg)',
                    textAlign: 'left',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isOpen) {
                      e.currentTarget.style.background = 'rgba(108, 114, 201, 0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--font-xl)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: isOpen ? 'var(--accent-primary)' : 'var(--text-primary)',
                      transition: 'color 0.3s ease',
                      flex: 1
                    }}
                  >
                    {faq.question}
                  </span>

                  {/* Plus/Minus Icon */}
                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: isOpen
                        ? 'rgba(108, 114, 201, 0.2)'
                        : 'rgba(255, 255, 255, 0.1)',
                      color: isOpen ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      transition: 'background 0.3s ease, color 0.3s ease',
                      flexShrink: 0
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </motion.div>
                </button>

                {/* Answer Content */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        style={{
                          padding: '0 var(--spacing-xl) var(--spacing-xl) var(--spacing-xl)',
                          fontSize: 'var(--font-lg)',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.6',
                          fontWeight: 'var(--font-weight-regular)',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                          paddingTop: 'var(--spacing-lg)'
                        }}
                      >
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Still Have Questions CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.7 }}
          style={{
            textAlign: 'center',
            marginTop: 'var(--spacing-4xl)',
            padding: 'var(--spacing-3xl)',
            background: 'rgba(108, 114, 201, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(108, 114, 201, 0.3)',
            borderRadius: 'var(--container-border-radius)'
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'var(--font-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}
          >
            Still Have Questions?
          </h3>
          <p
            style={{
              fontSize: 'var(--font-lg)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-lg)',
              lineHeight: '1.6'
            }}
          >
            Our support team is here to help you get started
          </p>
          <button
            style={{
              padding: 'var(--spacing-md) var(--spacing-2xl)',
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              background: 'transparent',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: 'var(--btn-corner-radius)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.7)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
            }}
          >
            Contact Support
          </button>
        </motion.div>
      </div>
    </section>
  )
}
