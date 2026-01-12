'use client'

import { motion } from 'framer-motion'

export default function FeaturesSection() {
  const features = [
    {
      id: '1',
      title: 'AI-Powered Job Matching',
      benefit: 'Stop wasting time scrolling through irrelevant postings',
      description: 'Our intelligent algorithm instantly connects you with jobs that match your exact skills, location, and availability. Only see jobs you actually want.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      )
    },
    {
      id: '2',
      title: 'Zero Commission Fees',
      benefit: 'Keep 100% of what you earn - no hidden cuts',
      description: 'Unlike traditional platforms that take 30-40% commission, Raven charges a simple flat monthly subscription. Your earnings are yours.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      )
    },
    {
      id: '3',
      title: 'Instant Payment Processing',
      benefit: 'Get paid within 24 hours of job completion',
      description: 'No more waiting weeks for payment. Complete a job, get your review, and receive payment the next business day. Fast, reliable, automatic.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      )
    },
    {
      id: '4',
      title: 'Verified Client Reviews',
      benefit: 'Build a reputation that brings repeat customers',
      description: 'Every completed job earns you a verified review. Clients can see your star rating, specialties, and past work. Quality work gets rewarded.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      )
    },
    {
      id: '5',
      title: 'Flexible Schedule Control',
      benefit: 'Accept jobs only when it works for YOU',
      description: 'Set your availability, block off time, take vacations. You are in complete control of when and where you work. No mandatory shifts.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      )
    },
    {
      id: '6',
      title: 'Smart Route Optimization',
      benefit: 'Maximize earnings by minimizing drive time',
      description: 'Our system prioritizes jobs near you and helps batch nearby appointments. Spend more time working, less time driving.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="10" r="3"/>
          <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/>
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
          backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2940&auto=format&fit=crop)',
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
          maxWidth: '1400px',
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
            Everything You Need to Succeed
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
            Powerful features designed specifically for independent technicians
          </p>
        </motion.div>

        {/* Features Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: 'var(--spacing-2xl)'
          }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.7 }}
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
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column'
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
                {feature.icon}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: 'var(--font-text-body)',
                  fontSize: 'var(--font-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-sm)',
                  letterSpacing: '-0.3px'
                }}
              >
                {feature.title}
              </h3>

              {/* Benefit Badge */}
              <div
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--btn-corner-radius)',
                  marginBottom: 'var(--spacing-md)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--success)',
                  display: 'inline-block'
                }}
              >
                {feature.benefit}
              </div>

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
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Feature Highlight CTA */}
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
              fontSize: 'var(--font-3xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-md)'
            }}
          >
            Ready to Take Control of Your Career?
          </h3>
          <p
            style={{
              fontSize: 'var(--font-lg)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-xl)',
              lineHeight: '1.6'
            }}
          >
            Start getting matched to high-quality local jobs today
          </p>
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
            Join 2,500+ Technicians
          </button>
        </motion.div>
      </div>
    </section>
  )
}
