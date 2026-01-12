'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ContractorSignup() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-xl)'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: 600,
          width: '100%',
          textAlign: 'center'
        }}
      >
        {/* Logo/Brand */}
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h1 style={{
            fontSize: 'var(--font-4xl)',
            fontWeight: 'var(--font-weight-bold)',
            fontFamily: 'var(--font-section-title)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Ravensearch
          </h1>
          <p style={{
            fontSize: 'var(--font-lg)',
            color: 'var(--text-secondary)'
          }}>
            Contractor Network
          </p>
        </div>

        {/* Welcome Card */}
        <div style={{
          background: 'transparent',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: 'var(--container-border)',
          borderRadius: 'var(--modal-border-radius)',
          padding: 'var(--spacing-2xl)',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <h2 style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            Join Our Network
          </h2>

          <p style={{
            fontSize: 'var(--font-md)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: 'var(--spacing-xl)'
          }}>
            Get connected with commercial service jobs in your area.
            Steady work, competitive pay, easy scheduling, and fast payments.
          </p>

          {/* Benefits List */}
          <div style={{
            textAlign: 'left',
            marginBottom: 'var(--spacing-xl)'
          }}>
            {[
              'Access to commercial service jobs',
              'Competitive pay rates',
              'Flexible scheduling',
              'Fast, reliable payments',
              'No fees for contractors'
            ].map((benefit, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-sm)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-md)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {benefit}
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={() => router.push('/contractors/onboarding')}
            style={{
              width: '100%',
              padding: 'var(--spacing-md) var(--spacing-xl)',
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'white',
              background: 'linear-gradient(135deg, #6C72C9 0%, #9896D5 100%)',
              border: 'none',
              borderRadius: 'var(--btn-corner-radius)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(108, 114, 201, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Get Started
          </button>
        </div>

        {/* Footer Note */}
        <p style={{
          fontSize: 'var(--font-sm)',
          color: 'var(--text-secondary)',
          opacity: 0.7
        }}>
          Takes about 5 minutes to complete
        </p>
      </motion.div>
    </div>
  );
}
