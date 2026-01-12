'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface JobDetails {
  id: string
  job_title: string
  trade_needed: string
  city: string
  state: string
  urgency: string
  scheduled_at: string | null
  duration: string | null
  budget_min: number | null
  budget_max: number | null
  description: string | null
}

function ResponseForm() {
  const params = useParams()
  const searchParams = useSearchParams()
  const jobId = params.id as string
  const techId = searchParams.get('tech')
  const recipientId = searchParams.get('r')

  const [job, setJob] = useState<JobDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [response, setResponse] = useState<'interested' | 'decline' | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${jobId}/respond?tech=${techId}&r=${recipientId}`)
        const data = await res.json()

        if (res.ok && data.job) {
          setJob(data.job)
        } else {
          setError(data.error || 'Job not found')
        }
      } catch (err) {
        setError('Failed to load job details')
      } finally {
        setLoading(false)
      }
    }

    if (jobId) {
      fetchJob()
    }
  }, [jobId, techId, recipientId])

  const handleSubmit = async (responseType: 'interested' | 'decline') => {
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/jobs/${jobId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId,
          techId,
          response: responseType
        })
      })

      if (res.ok) {
        setResponse(responseType)
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit response')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatBudget = (min: number | null, max: number | null) => {
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    } else if (min) {
      return `From $${min.toLocaleString()}`
    } else if (max) {
      return `Up to $${max.toLocaleString()}`
    }
    return 'Competitive Rate'
  }

  const formatUrgency = (urgency: string) => {
    const urgencyMap: Record<string, string> = {
      'emergency': 'Emergency',
      'same_day': 'Same Day',
      'next_day': 'Next Day',
      'within_week': 'Within Week',
      'flexible': 'Flexible'
    }
    return urgencyMap[urgency] || urgency
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Flexible'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid var(--accent-primary)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto var(--spacing-md)'
          }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading job details...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error && !job) {
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
          border: 'var(--container-border)',
          borderRadius: 'var(--modal-border-radius)',
          padding: 'var(--spacing-2xl)',
          textAlign: 'center'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--spacing-xl)'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-section-title)',
            fontSize: 'var(--font-2xl)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            Job Not Found
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
            {error}
          </p>
          <Link href="/" style={{
            display: 'inline-block',
            padding: 'var(--spacing-md) var(--spacing-xl)',
            background: 'var(--accent-primary)',
            color: 'white',
            borderRadius: 'var(--btn-corner-radius)',
            textDecoration: 'none'
          }}>
            Return to Homepage
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
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
          border: 'var(--container-border)',
          borderRadius: 'var(--modal-border-radius)',
          padding: 'var(--spacing-2xl)',
          textAlign: 'center'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: response === 'interested' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--spacing-xl)'
          }}>
            {response === 'interested' ? (
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
            {response === 'interested' ? 'Thanks for your interest!' : 'Response Recorded'}
          </h1>

          <p style={{
            fontSize: 'var(--font-md)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: 'var(--spacing-xl)'
          }}>
            {response === 'interested'
              ? "We've received your response. The client will be notified and may reach out to you soon with more details."
              : "We've noted that you're not available for this job. We'll keep you in mind for future opportunities that match your skills."
            }
          </p>

          <Link href="/" style={{
            display: 'inline-block',
            padding: 'var(--spacing-md) var(--spacing-xl)',
            background: 'var(--accent-primary)',
            color: 'white',
            borderRadius: 'var(--btn-corner-radius)',
            textDecoration: 'none',
            fontWeight: 'var(--font-weight-semibold)'
          }}>
            Return to Homepage
          </Link>

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
        maxWidth: 540,
        width: '100%',
        background: 'rgba(47, 47, 47, 0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: 'var(--container-border)',
        borderRadius: 'var(--modal-border-radius)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--spacing-xl)',
          background: 'linear-gradient(135deg, rgba(101, 98, 144, 0.3), rgba(74, 72, 117, 0.3))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <p style={{
            fontSize: 'var(--font-xs)',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: 'var(--spacing-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            RAVENSEARCH
          </p>
          <h1 style={{
            fontFamily: 'var(--font-section-title)',
            fontSize: 'var(--font-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-xs)'
          }}>
            New Job Opportunity
          </h1>
          <p style={{ fontSize: 'var(--font-md)', color: 'var(--text-secondary)' }}>
            {job?.job_title}
          </p>
        </div>

        {/* Job Details */}
        <div style={{ padding: 'var(--spacing-xl)' }}>
          {/* Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            {/* Trade */}
            <div style={{
              background: 'rgba(101, 98, 144, 0.1)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-md)'
            }}>
              <p style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-xs)',
                textTransform: 'uppercase'
              }}>
                Trade
              </p>
              <p style={{
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)'
              }}>
                {job?.trade_needed}
              </p>
            </div>

            {/* Urgency */}
            <div style={{
              background: 'rgba(101, 98, 144, 0.1)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-md)'
            }}>
              <p style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-xs)',
                textTransform: 'uppercase'
              }}>
                Urgency
              </p>
              <p style={{
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)'
              }}>
                {formatUrgency(job?.urgency || '')}
              </p>
            </div>

            {/* Location */}
            <div style={{
              background: 'rgba(101, 98, 144, 0.1)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-md)'
            }}>
              <p style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-xs)',
                textTransform: 'uppercase'
              }}>
                Location
              </p>
              <p style={{
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)'
              }}>
                {job?.city}, {job?.state}
              </p>
            </div>

            {/* Schedule */}
            <div style={{
              background: 'rgba(101, 98, 144, 0.1)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-md)'
            }}>
              <p style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-xs)',
                textTransform: 'uppercase'
              }}>
                Schedule
              </p>
              <p style={{
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)'
              }}>
                {formatDate(job?.scheduled_at || null)}
              </p>
            </div>

            {/* Duration */}
            <div style={{
              background: 'rgba(101, 98, 144, 0.1)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-md)'
            }}>
              <p style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-xs)',
                textTransform: 'uppercase'
              }}>
                Duration
              </p>
              <p style={{
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)'
              }}>
                {job?.duration || 'TBD'}
              </p>
            </div>

            {/* Budget */}
            <div style={{
              background: 'rgba(101, 98, 144, 0.1)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-md)'
            }}>
              <p style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-xs)',
                textTransform: 'uppercase'
              }}>
                Budget
              </p>
              <p style={{
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)'
              }}>
                {formatBudget(job?.budget_min || null, job?.budget_max || null)}
              </p>
            </div>
          </div>

          {/* Description */}
          {job?.description && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-xl)'
            }}>
              <p style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-sm)',
                textTransform: 'uppercase'
              }}>
                Description
              </p>
              <p style={{
                fontSize: 'var(--font-md)',
                color: 'var(--text-primary)',
                lineHeight: 1.6
              }}>
                {job.description}
              </p>
            </div>
          )}

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

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-md)'
          }}>
            <button
              onClick={() => handleSubmit('decline')}
              disabled={submitting}
              style={{
                flex: 1,
                padding: 'var(--spacing-md)',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 'var(--btn-corner-radius)',
                color: 'var(--text-secondary)',
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--font-md)',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1
              }}
            >
              Not Available
            </button>

            <button
              onClick={() => handleSubmit('interested')}
              disabled={submitting}
              style={{
                flex: 2,
                padding: 'var(--spacing-md)',
                background: 'linear-gradient(135deg, var(--accent-primary), #8B90E0)',
                border: 'none',
                borderRadius: 'var(--btn-corner-radius)',
                color: 'white',
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: 'var(--font-md)',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1
              }}
            >
              {submitting ? 'Submitting...' : "I'm Interested"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: 'var(--spacing-lg)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
            Kobayat INC · 9672 VIA TORINO, Burbank, CA
          </p>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
            <Link href={`/unsubscribe?email=&type=warm`} style={{ color: 'var(--accent-primary)' }}>
              Unsubscribe
            </Link>
            {' · '}
            <Link href="/legal/privacy" style={{ color: 'var(--accent-primary)' }}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RespondPage() {
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
      <ResponseForm />
    </Suspense>
  )
}
