'use client';

import { useState } from 'react';

interface BackgroundCheckStepProps {
  formData: {
    fullName: string;
    backgroundCheckAuthorized: boolean;
    signature: string;
  };
  updateFormData: (updates: Partial<any>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function BackgroundCheckStep({ formData, updateFormData, onNext, onBack }: BackgroundCheckStepProps) {
  const [agreedToBackgroundCheck, setAgreedToBackgroundCheck] = useState(false);
  const [agreedToAccuracy, setAgreedToAccuracy] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const canProceed = agreedToBackgroundCheck && agreedToAccuracy && agreedToTerms && formData.signature;

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleSubmit = () => {
    updateFormData({ backgroundCheckAuthorized: true });
    onNext();
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
        Background Check Authorization
      </h2>
      <p style={{
        fontSize: 'var(--font-md)',
        color: 'var(--text-secondary)',
        marginBottom: 'var(--spacing-2xl)',
        lineHeight: 1.6
      }}>
        Review and authorize the background check to complete your onboarding.
      </p>

      {/* Background Check Consent */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--btn-corner-radius)',
        padding: 'var(--spacing-2xl)',
        marginBottom: 'var(--spacing-2xl)'
      }}>
        <h3 style={{
          fontSize: 'var(--font-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          Consent for Background Check
        </h3>

        <div style={{
          fontSize: 'var(--font-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 1.8,
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <p style={{ marginBottom: 'var(--spacing-md)' }}>
            By authorizing this background check, you consent to the following:
          </p>

          <ul style={{ paddingLeft: 'var(--spacing-2xl)', marginBottom: 'var(--spacing-md)' }}>
            <li style={{ marginBottom: 'var(--spacing-sm)' }}>
              Verification of your identity, employment history, and professional credentials
            </li>
            <li style={{ marginBottom: 'var(--spacing-sm)' }}>
              Criminal background check in accordance with federal and state laws
            </li>
            <li style={{ marginBottom: 'var(--spacing-sm)' }}>
              Verification of licenses, certifications, and insurance coverage
            </li>
            <li style={{ marginBottom: 'var(--spacing-sm)' }}>
              Review of any professional disciplinary actions or complaints
            </li>
          </ul>

          <p>
            All information will be handled in accordance with the Fair Credit Reporting Act (FCRA)
            and other applicable laws. Your information will be kept confidential and used only for
            verification purposes.
          </p>
        </div>

        {/* Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {/* Background Check Authorization */}
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--spacing-md)',
            cursor: 'pointer'
          }}>
            <div style={{
              width: 20,
              height: 20,
              minWidth: 20,
              borderRadius: 4,
              background: agreedToBackgroundCheck ? '#6C72C9' : 'rgba(255, 255, 255, 0.1)',
              border: agreedToBackgroundCheck ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2
            }}>
              {agreedToBackgroundCheck && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={agreedToBackgroundCheck}
              onChange={(e) => setAgreedToBackgroundCheck(e.target.checked)}
              style={{ display: 'none' }}
            />
            <span style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-primary)',
              lineHeight: 1.6
            }}>
              I authorize a background check to be conducted and understand my rights under the FCRA
            </span>
          </label>

          {/* Information Accuracy */}
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--spacing-md)',
            cursor: 'pointer'
          }}>
            <div style={{
              width: 20,
              height: 20,
              minWidth: 20,
              borderRadius: 4,
              background: agreedToAccuracy ? '#6C72C9' : 'rgba(255, 255, 255, 0.1)',
              border: agreedToAccuracy ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2
            }}>
              {agreedToAccuracy && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={agreedToAccuracy}
              onChange={(e) => setAgreedToAccuracy(e.target.checked)}
              style={{ display: 'none' }}
            />
            <span style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-primary)',
              lineHeight: 1.6
            }}>
              I certify that all information provided in this application is accurate and complete to the best of my knowledge
            </span>
          </label>

          {/* Terms and Conditions */}
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--spacing-md)',
            cursor: 'pointer'
          }}>
            <div style={{
              width: 20,
              height: 20,
              minWidth: 20,
              borderRadius: 4,
              background: agreedToTerms ? '#6C72C9' : 'rgba(255, 255, 255, 0.1)',
              border: agreedToTerms ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 2
            }}>
              {agreedToTerms && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              style={{ display: 'none' }}
            />
            <span style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-primary)',
              lineHeight: 1.6
            }}>
              I agree to the Terms of Service and Privacy Policy
            </span>
          </label>
        </div>
      </div>

      {/* Electronic Signature */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--btn-corner-radius)',
        padding: 'var(--spacing-2xl)',
        marginBottom: 'var(--spacing-2xl)'
      }}>
        <h3 style={{
          fontSize: 'var(--font-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          Electronic Signature
        </h3>

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Full Name (Type to Sign) *
          </label>
          <input
            type="text"
            value={formData.signature}
            onChange={(e) => updateFormData({ signature: e.target.value })}
            placeholder={formData.fullName || 'John Smith'}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--btn-corner-radius)',
              padding: 'var(--spacing-md)',
              fontSize: 'var(--font-xl)',
              fontFamily: 'cursive',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 'var(--font-sm)',
          color: 'var(--text-secondary)'
        }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Date:</strong> {currentDate}
          </div>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Signature:</strong>{' '}
            {formData.signature || '(Not signed)'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-md)',
        justifyContent: 'space-between',
        marginTop: 'var(--spacing-2xl)'
      }}>
        <button
          onClick={onBack}
          className="outline-button"
          style={{
            padding: '12px 32px',
            fontSize: 'var(--font-lg)'
          }}
        >
          ← Back
        </button>

        <button
          onClick={handleSubmit}
          disabled={!canProceed}
          className="primary-button"
          style={{
            padding: '12px 32px',
            fontSize: 'var(--font-lg)',
            opacity: !canProceed ? 0.5 : 1,
            cursor: !canProceed ? 'not-allowed' : 'pointer'
          }}
        >
          I Agree & Complete Onboarding
        </button>
      </div>
    </div>
  );
}
