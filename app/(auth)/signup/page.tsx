"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (!agree) { setError('You must accept Terms & Conditions'); return; }
    setLoading(true);
    try {
      await signUp(fullName, email, password);
      setShowConfirmation(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Unable to sign up');
      setLoading(false);
    }
  };

  // Show confirmation screen after successful signup
  if (showConfirmation) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            {/* Success Icon */}
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--ds-success-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--ds-space-6) auto'
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--ds-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>

            <h1 className="auth-title" style={{ textAlign: 'center', marginBottom: 'var(--ds-space-3)' }}>
              Check your email
            </h1>

            <p style={{
              fontSize: 'var(--ds-text-sm)',
              color: 'var(--ds-text-secondary)',
              marginBottom: 'var(--ds-space-4)'
            }}>
              We've sent a confirmation link to
            </p>

            <div style={{
              background: 'var(--ds-bg-elevated)',
              border: '1px solid var(--ds-border-default)',
              borderRadius: 'var(--ds-radius-lg)',
              padding: 'var(--ds-space-3) var(--ds-space-4)',
              marginBottom: 'var(--ds-space-6)'
            }}>
              <span style={{
                fontSize: 'var(--ds-text-sm)',
                fontWeight: 'var(--ds-font-semibold)',
                color: 'var(--ds-text-primary)'
              }}>
                {email}
              </span>
            </div>

            <p style={{
              fontSize: 'var(--ds-text-sm)',
              color: 'var(--ds-text-secondary)',
              lineHeight: 1.6,
              marginBottom: 'var(--ds-space-6)'
            }}>
              Click the link in the email to confirm your account and complete your registration.
            </p>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 'var(--ds-space-4)' }}
              onClick={async () => {
                try {
                  const res = await fetch('/api/auth/resend-confirmation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                  });
                  if (res.ok) {
                    alert('Confirmation email sent! Check your inbox.');
                  } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to resend email');
                  }
                } catch (err) {
                  alert('Failed to resend email. Please try again.');
                }
              }}
            >
              Resend confirmation email
            </button>

            <div className="auth-footer">
              <Link href="/login" className="auth-link">
                <span>Back to login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Logo and Title */}
          <div className="auth-header">
            <div className="auth-logo">
              <svg width="28" height="40" viewBox="0 0 27 39" fill="none">
                <path d="M26.9919 15.1313C26.9593 15.0361 26.9267 14.9409 26.8901 14.8457C26.9593 15.0361 26.9959 15.1486 27 15.1529C27 15.1529 27 15.1443 26.9919 15.1313ZM19.5845 2.63232L19.5682 2.66693V2.67558C15.018 -1.11867 11.53 -0.374526 8.44094 1.80598C5.25415 4.04705 4.70877 7.46058 4.70877 7.46058C4.70877 7.46058 3.79303 8.32153 2.12841 10.0391C0.447516 11.7913 -0.199609 13.8593 0.0527288 14.9279C0.0934285 15.0577 4.489 12.6349 5.8036 12.2369C7.14262 11.8562 9.12062 12.3927 9.95497 15.1789C10.7975 17.9045 8.05022 37.1396 25.5918 39C21.7619 34.5179 13.0115 24.0393 11.8434 20.5479C10.3416 16.0658 12.3888 10.9087 16.6297 9.30362C19.9997 8.02733 23.6341 9.64108 25.7342 12.6436V11.9038C24.4848 9.0224 22.3602 4.92963 19.5886 2.63664L19.5845 2.63232ZM10.4434 9.05269C9.5032 9.35554 8.52234 8.81041 8.23744 7.81101C7.95254 6.81162 8.46536 5.76896 9.40552 5.46611C10.3457 5.16326 11.3265 5.70839 11.6114 6.70778C11.8963 7.70718 11.3835 8.74984 10.4434 9.05269ZM25.3842 15.6937C24.1754 12.159 20.5491 9.83144 17.2239 11.1077C13.8988 12.3927 12.2667 16.4292 13.4429 19.9725C14.375 22.7328 25.3557 36.5599 25.6569 36.5772L25.7302 17.4286C25.6488 16.6974 25.5348 16.1177 25.3883 15.6937H25.3842Z" fill="var(--ds-accent-primary)"/>
              </svg>
            </div>
            <div className="auth-title-group">
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Join Raven today</p>
            </div>
          </div>

          {/* OAuth Providers */}
          <div className="auth-oauth-buttons">
            <button
              onClick={async () => {
                setGoogleLoading(true);
                try {
                  await signInWithGoogle();
                } catch (err) {
                  setGoogleLoading(false);
                }
              }}
              disabled={googleLoading || appleLoading || loading}
              className="auth-oauth-btn auth-oauth-btn--google"
            >
              {googleLoading ? (
                <span className="auth-spinner" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {googleLoading ? 'Signing up...' : 'Sign up with Google'}
            </button>

            <button
              onClick={async () => {
                setAppleLoading(true);
                try {
                  await signInWithApple();
                } catch (err) {
                  setAppleLoading(false);
                }
              }}
              disabled={googleLoading || appleLoading || loading}
              className="auth-oauth-btn auth-oauth-btn--apple"
            >
              {appleLoading ? (
                <span className="auth-spinner" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09l-.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              {appleLoading ? 'Signing up...' : 'Sign up with Apple'}
            </button>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Signup Form */}
          <form onSubmit={onSubmit} className="auth-form">
            <div className="form-field">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                id="name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="form-input"
                placeholder="John Doe"
              />
            </div>

            <div className="form-field">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                placeholder="you@company.com"
              />
            </div>

            <div className="form-field">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            <div className="form-field">
              <label htmlFor="confirm" className="form-label">Confirm Password</label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            <label className="auth-checkbox">
              <input 
                type="checkbox" 
                checked={agree} 
                onChange={(e) => setAgree(e.target.checked)} 
              />
              <span>
                I agree to the{' '}
                <Link href="/legal/terms" target="_blank" className="auth-terms-link">
                  Terms & Conditions
                </Link>
              </span>
            </label>

            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary auth-submit-btn"
            >
              {loading && <span className="auth-spinner" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer Link */}
          <div className="auth-footer">
            <Link href="/login" className="auth-link">
              Already have an account? <span>Sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
