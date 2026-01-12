'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function UnsubscribeForm() {
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get('email') || ''
  const typeFromUrl = searchParams.get('type') || 'warm'

  const [email, setEmail] = useState(emailFromUrl)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          reason,
          type: typeFromUrl
        })
      })

      if (response.ok) {
        setIsComplete(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to unsubscribe. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
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

          <p style={{
            fontSize: 'var(--font-md)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: 'var(--spacing-xl)'
          }}>
            You have been unsubscribed from job notifications. You will no longer receive emails from Ravensearch.
          </p>

          <p style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            If you unsubscribed by mistake, you can{' '}
            <Link href="/technicians/signup" style={{ color: 'var(--accent-primary)' }}>
              sign up again
            </Link>
            {' '}at any time.
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
        </div>
      </div>
    )
  }

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
        padding: 'var(--spacing-2xl)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 style={{
            fontFamily: 'var(--font-section-title)',
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Unsubscribe
          </h1>
          <p style={{
            fontSize: 'var(--font-md)',
            color: 'var(--text-secondary)'
          }}>
            We're sorry to see you go
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-xs)'
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--btn-corner-radius)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-md)'
              }}
            />
          </div>

          {/* Reason Field (Optional) */}
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <label
              htmlFor="reason"
              style={{
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-xs)'
              }}
            >
              Reason (Optional)
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--btn-corner-radius)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-md)'
              }}
            >
              <option value="">Select a reason...</option>
              <option value="too_many_emails">Too many emails</option>
              <option value="not_relevant">Jobs not relevant to my area</option>
              <option value="found_work">Found steady work elsewhere</option>
              <option value="not_interested">No longer interested</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: 'var(--spacing-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--btn-corner-radius)',
              color: '#EF4444',
              fontSize: 'var(--font-sm)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !email}
            style={{
              width: '100%',
              padding: 'var(--spacing-md)',
              background: isSubmitting ? 'rgba(239, 68, 68, 0.5)' : '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--btn-corner-radius)',
              fontWeight: 'var(--font-weight-semibold)',
              fontSize: 'var(--font-md)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: (!email || isSubmitting) ? 0.6 : 1
            }}
          >
            {isSubmitting ? 'Unsubscribing...' : 'Unsubscribe'}
          </button>

          {/* Cancel Link */}
          <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
            <Link
              href="/"
              style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-sm)',
                textDecoration: 'none'
              }}
            >
              Cancel and return to homepage
            </Link>
          </div>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: 'var(--spacing-xl)',
          paddingTop: 'var(--spacing-lg)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
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

export default function UnsubscribePage() {
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
      <UnsubscribeForm />
    </Suspense>
  )
}
