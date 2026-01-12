'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        // Use API endpoint to check admin status (bypasses RLS)
        const response = await fetch('/api/admin/check-admin');
        const data = await response.json();

        setIsAdmin(data.isAdmin === true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [user])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 72px)',
        padding: 'var(--ds-space-6)'
      }}>
        <div style={{ 
          background: 'var(--ds-bg-surface)', 
          border: '1px solid var(--ds-border-default)',
          borderRadius: 'var(--ds-radius-xl)',
          textAlign: 'center', 
          padding: 'var(--ds-space-8)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ 
            width: 32, 
            height: 32, 
            border: '3px solid var(--ds-border-default)', 
            borderTopColor: 'var(--ds-accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto var(--ds-space-4)'
          }} />
          <div style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)' }}>
            Checking permissions...
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 72px)',
        padding: 'var(--ds-space-6)'
      }}>
        <div style={{ 
          background: 'var(--ds-bg-surface)', 
          border: '1px solid var(--ds-border-default)',
          borderRadius: 'var(--ds-radius-xl)',
          textAlign: 'center', 
          padding: 'var(--ds-space-8)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{ 
            fontSize: 'var(--ds-text-xl)', 
            fontWeight: 'var(--ds-font-bold)',
            color: 'var(--ds-text-primary)',
            marginBottom: 'var(--ds-space-2)'
          }}>Authentication Required</h1>
          <p style={{ 
            fontSize: 'var(--ds-text-sm)',
            color: 'var(--ds-text-secondary)',
            marginBottom: 'var(--ds-space-5)'
          }}>Please log in to access admin features</p>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 72px)',
        padding: 'var(--ds-space-6)'
      }}>
        <div style={{ 
          background: 'var(--ds-bg-surface)', 
          border: '1px solid var(--ds-border-default)',
          borderRadius: 'var(--ds-radius-xl)',
          textAlign: 'center', 
          padding: 'var(--ds-space-8)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: '50%', 
            background: 'var(--ds-error-bg)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto var(--ds-space-4)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ds-error)" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 style={{ 
            fontSize: 'var(--ds-text-xl)', 
            fontWeight: 'var(--ds-font-bold)',
            color: 'var(--ds-text-primary)',
            marginBottom: 'var(--ds-space-2)'
          }}>Access Denied</h1>
          <p style={{ 
            fontSize: 'var(--ds-text-sm)',
            color: 'var(--ds-text-secondary)',
            marginBottom: 'var(--ds-space-4)'
          }}>
            This page is restricted to administrators only.
          </p>
          <div style={{ 
            padding: 'var(--ds-space-3)', 
            background: 'var(--ds-error-bg)', 
            borderRadius: 'var(--ds-radius-md)',
            marginBottom: 'var(--ds-space-5)'
          }}>
            <div style={{ color: 'var(--ds-error)', fontSize: 'var(--ds-text-sm)' }}>
              Your account ({user?.email || 'Unknown'}) does not have admin privileges.
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => router.push('/')}
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
