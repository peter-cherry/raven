'use client';

import { useState, useEffect } from 'react';
import { SUPPORTED_STATES } from '@/lib/licensing-requirements';
import { supabaseAnon } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';

interface BasicInfoStepProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    password?: string;
  };
  updateFormData: (updates: Partial<any>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function BasicInfoStep({ formData, updateFormData, onNext, onBack }: BasicInfoStepProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState(formData.password || '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  // Check if user is already authenticated (e.g., from OAuth)
  useEffect(() => {
    if (user) {
      // Pre-fill from OAuth user data
      const updates: Record<string, string> = {};
      if (user.email && !formData.email) {
        updates.email = user.email;
      }
      if (user.user_metadata?.full_name && !formData.fullName) {
        updates.fullName = user.user_metadata.full_name;
      }
      if (Object.keys(updates).length > 0) {
        updateFormData(updates);
      }
      // Mark as OAuth user (no password needed)
      setIsOAuthUser(true);
      // Store user ID for linking
      localStorage.setItem('technicianAuthUserId', user.id);
    }
  }, [user]);

  // For OAuth users, don't require password
  // Password must be 8+ chars with uppercase and number
  const isPasswordValid = password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
  const canProceed = isOAuthUser
    ? (formData.fullName && formData.email && formData.phone && formData.address && formData.city && formData.state)
    : (formData.fullName && formData.email && formData.phone && formData.address && formData.city && formData.state && isPasswordValid);

  const handleContinue = async () => {
    setError('');

    // OAuth users already have an account - just proceed
    if (isOAuthUser) {
      setLoading(true);
      onNext();
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Password complexity requirements:
    // - At least 8 characters
    // - At least one uppercase letter
    // - At least one number
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/\d/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists
      const { data: existingUser } = await supabaseAnon.auth.signInWithPassword({
        email: formData.email,
        password: 'dummy' // This will fail, but tells us if user exists
      });

      // If we get here without error, user might exist - let them try to continue
      // The actual signup will fail if email is taken
    } catch (err: any) {
      // Expected - user doesn't exist or wrong password
    }

    // Create Supabase Auth account
    try {
      const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
        email: formData.email,
        password: password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone
          }
        }
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Store user ID in localStorage for linking to technician record
      if (authData.user) {
        localStorage.setItem('technicianAuthUserId', authData.user.id);
      }

      // SECURITY: Clear any stored onboarding data that might contain the password
      // Password should never be persisted in localStorage
      try {
        const storedData = localStorage.getItem('contractorOnboardingData');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          if (parsed.password) {
            delete parsed.password;
            localStorage.setItem('contractorOnboardingData', JSON.stringify(parsed));
          }
        }
      } catch (e) {
        // Ignore parsing errors - just proceed
      }

      // Don't store password in formData - it was only needed for signup
      // updateFormData({ password }); // REMOVED - security risk

      setLoading(false);
      onNext();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--container-bg)',
      border: 'var(--container-border)',
      borderRadius: 'var(--container-border-radius)',
      padding: 'var(--spacing-2xl)'
    }}>
      <h2 style={{
        fontSize: 'var(--font-2xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--spacing-md)'
      }}>
        Basic Information
      </h2>
      <p style={{
        fontSize: 'var(--font-md)',
        color: 'var(--text-secondary)',
        marginBottom: 'var(--spacing-2xl)',
        lineHeight: 1.6
      }}>
        Let's start with your contact information and service area.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        {/* Full Name */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Full Name *
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => updateFormData({ fullName: e.target.value })}
            placeholder="John Smith"
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--btn-corner-radius)',
              padding: 'var(--spacing-md)',
              fontSize: 'var(--font-md)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* Email */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            placeholder="john@example.com"
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--btn-corner-radius)',
              padding: 'var(--spacing-md)',
              fontSize: 'var(--font-md)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* Phone */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Phone *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="(555) 123-4567"
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--btn-corner-radius)',
              padding: 'var(--spacing-md)',
              fontSize: 'var(--font-md)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* Password - only shown for non-OAuth users */}
        {!isOAuthUser && (
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Create Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ chars, uppercase, and number"
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--btn-corner-radius)',
                padding: 'var(--spacing-md)',
                fontSize: 'var(--font-md)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>
        )}

        {/* Confirm Password - only shown for non-OAuth users */}
        {!isOAuthUser && (
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Confirm Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--btn-corner-radius)',
                padding: 'var(--spacing-md)',
                fontSize: 'var(--font-md)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #EF4444',
            borderRadius: 'var(--btn-corner-radius)',
            padding: 'var(--spacing-md)',
            color: '#EF4444',
            fontSize: 'var(--font-sm)'
          }}>
            {error}
          </div>
        )}

        {/* Business Address */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Business Address *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateFormData({ address: e.target.value })}
            placeholder="123 Main St"
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--btn-corner-radius)',
              padding: 'var(--spacing-md)',
              fontSize: 'var(--font-md)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* City, State, Zip - Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
          {/* City */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              City *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => updateFormData({ city: e.target.value })}
              placeholder="Orlando"
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--btn-corner-radius)',
                padding: 'var(--spacing-md)',
                fontSize: 'var(--font-md)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          {/* State */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              State *
            </label>
            <select
              value={formData.state}
              onChange={(e) => updateFormData({ state: e.target.value })}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--btn-corner-radius)',
                padding: 'var(--spacing-md)',
                fontSize: 'var(--font-md)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">Select...</option>
              {SUPPORTED_STATES.map(state => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>

          {/* Zip Code */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Zip Code
            </label>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => updateFormData({ zipCode: e.target.value })}
              placeholder="32801"
              maxLength={5}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--btn-corner-radius)',
                padding: 'var(--spacing-md)',
                fontSize: 'var(--font-md)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-md)',
        justifyContent: 'flex-end',
        marginTop: 'var(--spacing-2xl)'
      }}>
        <button
          onClick={handleContinue}
          disabled={!canProceed || loading}
          className="primary-button"
          style={{
            padding: '12px 32px',
            fontSize: 'var(--font-lg)',
            opacity: !canProceed || loading ? 0.5 : 1,
            cursor: !canProceed || loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)'
          }}
        >
          {loading && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          )}
          {loading ? 'Creating Account...' : 'Continue →'}
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
