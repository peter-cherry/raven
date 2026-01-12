'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ConfirmedContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

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
        {/* Success Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--spacing-xl)'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-section-title)',
          fontSize: 'var(--font-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-md)'
        }}>
          Unsubscribed Successfully
        </h1>

        {email && (
          <p style={{
            fontSize: 'var(--font-md)',
            color: 'var(--accent-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            {email}
          </p>
        )}

        <p style={{
          fontSize: 'var(--font-md)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: 'var(--spacing-xl)'
        }}>
          You have been successfully unsubscribed from job notifications.
          You will no longer receive emails from Ravensearch about job opportunities.
        </p>

        <p style={{
          fontSize: 'var(--font-sm)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--spacing-xl)'
        }}>
          Changed your mind? You can{' '}
          <Link href="/technicians/signup" style={{ color: 'var(--accent-primary)' }}>
            sign up again
          </Link>
          {' '}at any time to receive job notifications.
        </p>

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
          <p style={{
            fontSize: 'var(--font-xs)',
            color: 'var(--text-secondary)'
          }}>
            Kobayat INC · 9672 VIA TORINO, Burbank, CA
          </p>
        </div>
      </div>
    </div>
  )
}

export default function UnsubscribeConfirmedPage() {
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
