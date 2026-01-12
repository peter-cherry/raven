"use client";

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AdminSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const grantAdminAccess = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/grant-admin', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to grant admin access');
      }

      setMessage(data.message);

      // Redirect to admin page after 2 seconds
      setTimeout(() => {
        router.push('/admin/activity');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to grant admin access');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#1A1A1A',
        color: '#FFFFFF',
        fontFamily: 'var(--font-text-body)',
        padding: 'var(--spacing-xl)'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: 400
        }}>
          <h1 style={{
            fontSize: 'var(--font-3xl)',
            marginBottom: 'var(--spacing-lg)',
            color: '#9a96d5'
          }}>
            Not Authenticated
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Please log in to set up admin access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#1A1A1A',
      color: '#FFFFFF',
      fontFamily: 'var(--font-text-body)',
      padding: 'var(--spacing-xl)'
    }}>
      <div style={{
        background: 'rgba(47, 47, 47, 0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '2px solid rgba(154, 150, 213, 0.3)',
        borderRadius: 'var(--modal-border-radius)',
        padding: 'var(--spacing-5xl)',
        maxWidth: 500,
        width: '100%'
      }}>
        <h1 style={{
          fontFamily: 'var(--font-section-title)',
          fontSize: 'var(--font-3xl)',
          marginBottom: 'var(--spacing-lg)',
          color: '#9a96d5',
          textAlign: 'center'
        }}>
          Admin Setup
        </h1>

        <div style={{
          marginBottom: 'var(--spacing-2xl)',
          padding: 'var(--spacing-lg)',
          background: 'rgba(154, 150, 213, 0.1)',
          border: '1px solid rgba(154, 150, 213, 0.3)',
          borderRadius: 'var(--btn-corner-radius)'
        }}>
          <p style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Current User:
          </p>
          <p style={{
            fontSize: 'var(--font-md)',
            fontWeight: 'var(--font-weight-semibold)',
            color: '#FFFFFF'
          }}>
            {user.email}
          </p>
        </div>

        <p style={{
          fontSize: 'var(--font-md)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--spacing-2xl)',
          textAlign: 'center'
        }}>
          Click the button below to grant yourself admin privileges.
        </p>

        <button
          onClick={grantAdminAccess}
          disabled={loading}
          style={{
            width: '100%',
            padding: 'var(--spacing-md) var(--spacing-xl)',
            background: loading ? 'rgba(154, 150, 213, 0.5)' : 'linear-gradient(135deg, #9a96d5 0%, #7b76b8 100%)',
            border: 'none',
            borderRadius: 'var(--btn-corner-radius)',
            color: '#FFFFFF',
            fontFamily: 'var(--font-text-body)',
            fontSize: 'var(--font-md)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-sm)',
            height: 48
          }}
        >
          {loading && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          )}
          {loading ? 'Granting Access...' : 'Grant Admin Access'}
        </button>

        {message && (
          <div style={{
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--btn-corner-radius)',
            color: '#10B981',
            fontSize: 'var(--font-sm)',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--btn-corner-radius)',
            color: '#EF4444',
            fontSize: 'var(--font-sm)',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
