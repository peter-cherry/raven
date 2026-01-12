'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ConfirmedContent() {
  const searchParams = useSearchParams()
  const response = searchParams.get('response')
  const isInterested = response === 'interested'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-xl)'
    }}>
      <div style={{
        maxWidth: 480,
        width: '100%',
        background: 'rgba(47, 47, 47, 0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: 'var(--container-border)',
        borderRadius: 'var(--modal-border-radius)',
        padding: 'var(--spacing-2xl)',
        textAlign: 'center'
      }}>
        {/* Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: isInterested ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--spacing-xl)'
        }}>
          {isInterested ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          )}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-section-title)',
          fontSize: 'var(--font-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-md)'
        }}>
          {isInterested ? 'Thanks for your interest!' : 'Response Recorded'}
        </h1>

        <p style={{
          fontSize: 'var(--font-md)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: 'var(--spacing-xl)'
        }}>
          {isInterested
            ? "We've received your response. The client will be notified and may reach out to you soon with more details about this job opportunity."
            : "We've noted that you're not available for this job. We'll keep you in mind for future opportunities that match your skills and location."
          }
        </p>

        {isInterested && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <p style={{
              fontSize: 'var(--font-sm)',
              color: '#10B981',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              What happens next?
            </p>
            <p style={{
              fontSize: 'var(--font-sm)',
              color: 'var(--text-secondary)',
              marginTop: 'var(--spacing-xs)'
            }}>
              The client will review your profile and may contact you directly to discuss the job details, schedule, and compensation.
            </p>
          </div>
        )}

        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: 'var(--spacing-md) var(--spacing-xl)',
            background: 'var(--accent-primary)',
            color: 'white',
            borderRadius: 'var(--btn-corner-radius)',
            textDecoration: 'none',
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--font-md)'
          }}
        >
          Return to Homepage
        </Link>

        {/* Footer */}
        <div style={{
          marginTop: 'var(--spacing-2xl)',
          paddingTop: 'var(--spacing-lg)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
            Kobayat INC · 9672 VIA TORINO, Burbank, CA
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResponseConfirmedPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    }>
      <ConfirmedContent />
    </Suspense>
  )
}
