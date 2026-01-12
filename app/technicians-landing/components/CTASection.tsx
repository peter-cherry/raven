'use client'

import { motion } from 'framer-motion'

export default function CTASection() {
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
          maxWidth: '900px',
          margin: '0 auto'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-4xl)',
            background: 'transparent',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            filter: 'brightness(1.3)',
            border: '2px solid rgba(108, 114, 201, 0.5)',
            borderRadius: 'var(--modal-border-radius)',
            boxShadow: '0 16px 48px rgba(108, 114, 201, 0.3)'
          }}
        >
          {/* Urgency Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 'var(--btn-corner-radius)',
              marginBottom: 'var(--spacing-2xl)',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--warning)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Limited Slots in Your Area
          </motion.div>

          {/* Main Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7 }}
            style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              lineHeight: '1.2',
              marginBottom: 'var(--spacing-xl)',
              letterSpacing: '-0.5px'
            }}
          >
            Start Earning More Today
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.7 }}
            style={{
              fontSize: 'var(--font-2xl)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              marginBottom: 'var(--spacing-3xl)',
              maxWidth: '700px',
              margin: '0 auto var(--spacing-3xl) auto'
            }}
          >
            Join 2,500+ technicians who doubled their income by taking control of their work
          </motion.p>

          {/* Benefits Checklist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.7 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-3xl)',
              textAlign: 'left'
            }}
          >
            {[
              'Zero commission fees',
              'Get paid in 24 hours',
              'AI job matching',
              'Build your reputation',
              'Set your own rates',
              'Cancel anytime'
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  fontSize: 'var(--font-lg)',
                  color: 'var(--text-primary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--success)', flexShrink: 0 }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {benefit}
              </motion.div>
            ))}
          </motion.div>

          {/* Primary CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.2, duration: 0.7 }}
            style={{ marginBottom: 'var(--spacing-xl)' }}
          >
            <button
              className="primary-button"
              style={{
                padding: 'var(--spacing-xl) var(--spacing-4xl)',
                fontSize: 'var(--font-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                background: 'linear-gradient(135deg, rgba(108, 114, 201, 0.95) 0%, rgba(139, 144, 224, 0.95) 100%)',
                border: 'none',
                borderRadius: 'var(--btn-corner-radius)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 12px 32px rgba(108, 114, 201, 0.5)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(108, 114, 201, 0.6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(108, 114, 201, 0.5)'
              }}
            >
              Get Your First Job
            </button>
          </motion.div>

          {/* Risk Reversal & Trust Signals */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.4, duration: 0.7 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-md)',
              alignItems: 'center'
            }}
          >
            {/* Micro-copy */}
            <p
              style={{
                fontSize: 'var(--font-md)',
                color: 'rgba(249, 243, 229, 0.6)',
                fontWeight: 'var(--font-weight-regular)'
              }}
            >
              No credit card required " Free to join " Cancel anytime
            </p>

            {/* Trust Badges */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xl)',
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: 'var(--spacing-lg)'
              }}
            >
              {/* SSL Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)',
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-secondary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                SSL Secure
              </div>

              {/* Verified Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)',
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-secondary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Verified Platform
              </div>

              {/* Money Back Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)',
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-secondary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                30-Day Guarantee
              </div>
            </div>
          </motion.div>

          {/* Social Proof Counter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.6, duration: 0.7 }}
            style={{
              marginTop: 'var(--spacing-3xl)',
              paddingTop: 'var(--spacing-2xl)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: 'var(--font-sm)',
              color: 'var(--text-secondary)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            <span style={{ color: 'var(--accent-primary)', fontWeight: 'var(--font-weight-bold)' }}>
              127 technicians
            </span>{' '}
            signed up in the last 7 days
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
