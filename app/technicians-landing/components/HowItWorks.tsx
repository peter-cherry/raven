'use client'

import { motion } from 'framer-motion'

export default function HowItWorks() {
  const steps = [
    {
      id: '1',
      number: 1,
      title: 'Create Your Profile',
      description: 'Sign up in 2 minutes. Add your trade, skills, and service area. Upload your certifications.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    },
    {
      id: '2',
      number: 2,
      title: 'Get Matched to Jobs',
      description: 'Our AI instantly connects you with local jobs that match your skills and availability. Accept the ones you want.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      )
    },
    {
      id: '3',
      number: 3,
      title: 'Get Paid Fast',
      description: 'Complete the job, get 5-star reviews, and receive payment within 24 hours. Build your reputation and grow.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
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
          backgroundImage: 'url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2948&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          filter: 'brightness(0.2)',
          zIndex: 0
        }}
      />

      {/* Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(47, 47, 47, 0.9) 0%, rgba(26, 26, 26, 0.85) 100%)',
          zIndex: 1
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
            How It Works
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
            Start earning more in just 3 simple steps
          </p>
        </motion.div>

        {/* Steps Container */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--spacing-3xl)',
            alignItems: 'start'
          }}
        >
          {steps.map((step, index) => (
            <div key={step.id} style={{ position: 'relative' }}>
              {/* Arrow Between Steps (Desktop Only) */}
              {index < steps.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '80px',
                    right: '-40px',
                    display: 'none',
                    color: 'rgba(108, 114, 201, 0.4)',
                    zIndex: 10
                  }}
                  className="arrow-connector"
                >
                  <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                    <path
                      d="M0 12H38M38 12L28 2M38 12L28 22"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.7 }}
                style={{
                  padding: 'var(--spacing-2xl)',
                  background: 'rgba(47, 47, 47, 0.95)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  filter: 'brightness(1.15)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: 'var(--container-border-radius)',
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Step Number Badge */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(108, 114, 201, 0.95) 0%, rgba(139, 144, 224, 0.95) 100%)',
                    borderRadius: '50%',
                    margin: '0 auto var(--spacing-xl) auto',
                    fontSize: 'var(--font-3xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)',
                    boxShadow: '0 8px 24px rgba(108, 114, 201, 0.4)'
                  }}
                >
                  {step.number}
                </div>

                {/* Icon */}
                <div
                  style={{
                    marginBottom: 'var(--spacing-lg)',
                    color: 'var(--accent-primary)'
                  }}
                >
                  {step.icon}
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
                  {step.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: 'var(--font-lg)',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    fontWeight: 'var(--font-weight-regular)',
                    flex: 1
                  }}
                >
                  {step.description}
                </p>
              </motion.div>
            </div>
          ))}
        </div>

        {/* CTA After Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.7 }}
          style={{
            textAlign: 'center',
            marginTop: 'var(--spacing-4xl)'
          }}
        >
          <button
            className="primary-button"
            style={{
              padding: 'var(--spacing-lg) var(--spacing-3xl)',
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              background: 'linear-gradient(135deg, rgba(108, 114, 201, 0.95) 0%, rgba(139, 144, 224, 0.95) 100%)',
              border: 'none',
              borderRadius: 'var(--btn-corner-radius)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 24px rgba(108, 114, 201, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(108, 114, 201, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(108, 114, 201, 0.4)'
            }}
          >
            Start Earning Today
          </button>
        </motion.div>
      </div>

      {/* Add media query for arrow visibility */}
      <style jsx>{`
        @media (min-width: 1024px) {
          .arrow-connector {
            display: block !important;
          }
        }
      `}</style>
    </section>
  )
}
