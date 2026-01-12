'use client';

import { useState } from 'react';

interface InsuranceStepProps {
  formData: {
    trades: string[];
    skipInsurance?: boolean;
    generalLiability: {
      carrier: string;
      policyNumber: string;
      coverage: string;
      expirationDate: string;
    };
    workersComp: {
      carrier: string;
      policyNumber: string;
      expirationDate: string;
    };
  };
  updateFormData: (updates: Partial<any>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function InsuranceStep({ formData, updateFormData, onNext, onBack }: InsuranceStepProps) {
  // Check if handyman is one of the selected trades
  const isHandyman = formData.trades?.includes('handyman') || false;
  const [skipInsurance, setSkipInsurance] = useState(formData.skipInsurance || false);

  const handleSkipInsurance = (checked: boolean) => {
    setSkipInsurance(checked);
    updateFormData({ skipInsurance: checked });

    // Clear insurance fields if skipping
    // Note: Use empty strings instead of fake dates (2099-12-31) to avoid
    // creating misleading data that could bypass expiration checks
    if (checked) {
      updateFormData({
        skipInsurance: true,
        generalLiability: {
          carrier: 'N/A - Skipped',
          policyNumber: 'N/A',
          coverage: '0',
          expirationDate: ''  // Empty instead of fake 2099 date
        },
        workersComp: {
          carrier: 'N/A - Skipped',
          policyNumber: 'N/A',
          expirationDate: ''  // Empty instead of fake 2099 date
        }
      });
    } else {
      updateFormData({
        skipInsurance: false,
        generalLiability: {
          carrier: '',
          policyNumber: '',
          coverage: '',
          expirationDate: ''
        },
        workersComp: {
          carrier: '',
          policyNumber: '',
          expirationDate: ''
        }
      });
    }
  };

  const canProceed = skipInsurance || (
    formData.generalLiability.carrier &&
    formData.generalLiability.policyNumber &&
    formData.generalLiability.coverage &&
    formData.generalLiability.expirationDate &&
    formData.workersComp.carrier &&
    formData.workersComp.policyNumber &&
    formData.workersComp.expirationDate
  );

  const updateGL = (field: string, value: string) => {
    updateFormData({
      generalLiability: {
        ...formData.generalLiability,
        [field]: value
      }
    });
  };

  const updateWC = (field: string, value: string) => {
    updateFormData({
      workersComp: {
        ...formData.workersComp,
        [field]: value
      }
    });
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
        Insurance Information
      </h2>
      <p style={{
        fontSize: 'var(--font-md)',
        color: 'var(--text-secondary)',
        marginBottom: 'var(--spacing-lg)',
        lineHeight: 1.6
      }}>
        Provide your insurance details. This is required to work with most organizations.
      </p>

      {/* Skip Insurance Option (Handyman only) */}
      {isHandyman && (
        <div style={{
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: 'var(--btn-corner-radius)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            cursor: 'pointer'
          }}>
            <div style={{
              width: 24,
              height: 24,
              minWidth: 24,
              borderRadius: 4,
              background: skipInsurance ? '#6C72C9' : 'rgba(255, 255, 255, 0.1)',
              border: skipInsurance ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {skipInsurance && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 7L6 11L12 3"
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
              checked={skipInsurance}
              onChange={(e) => handleSkipInsurance(e.target.checked)}
              style={{ display: 'none' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                I don't have insurance yet (Handyman only)
              </div>
              <div style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                As a handyman, you can skip insurance for now. Note that some jobs may require proof of insurance before you can be assigned.
              </div>
            </div>
          </label>
        </div>
      )}

      {/* General Liability Insurance */}
      {!skipInsurance && (
      <div style={{
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: 'var(--btn-corner-radius)',
        padding: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-2xl)'
      }}>
        <h3 style={{
          fontSize: 'var(--font-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-xs)'
        }}>
          General Liability Insurance *
        </h3>
        <p style={{
          fontSize: 'var(--font-sm)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          Required - Protects against third-party bodily injury and property damage claims
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--spacing-md)'
        }}>
          {/* Insurance Carrier */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Insurance Carrier *
            </label>
            <input
              type="text"
              value={formData.generalLiability.carrier}
              onChange={(e) => updateGL('carrier', e.target.value)}
              placeholder="State Farm"
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

          {/* Policy Number */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Policy Number *
            </label>
            <input
              type="text"
              value={formData.generalLiability.policyNumber}
              onChange={(e) => updateGL('policyNumber', e.target.value)}
              placeholder="GL-123456789"
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

          {/* Coverage Amount */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Coverage Amount *
            </label>
            <select
              value={formData.generalLiability.coverage}
              onChange={(e) => updateGL('coverage', e.target.value)}
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
              <option value="">Select amount...</option>
              <option value="500000">$500,000</option>
              <option value="1000000">$1,000,000</option>
              <option value="2000000">$2,000,000</option>
              <option value="5000000">$5,000,000</option>
            </select>
          </div>

          {/* Expiration Date */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Expiration Date *
            </label>
            <input
              type="date"
              value={formData.generalLiability.expirationDate}
              onChange={(e) => updateGL('expirationDate', e.target.value)}
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
      )}

      {/* Workers Compensation Insurance */}
      {!skipInsurance && (
      <div style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 'var(--btn-corner-radius)',
        padding: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-2xl)'
      }}>
        <h3 style={{
          fontSize: 'var(--font-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-xs)'
        }}>
          Workers' Compensation Insurance *
        </h3>
        <p style={{
          fontSize: 'var(--font-sm)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          Required - Covers medical costs and lost wages for work-related injuries
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 'var(--spacing-md)'
        }}>
          {/* Insurance Carrier */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Insurance Carrier *
            </label>
            <input
              type="text"
              value={formData.workersComp.carrier}
              onChange={(e) => updateWC('carrier', e.target.value)}
              placeholder="State Farm"
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

          {/* Policy Number */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Policy Number *
            </label>
            <input
              type="text"
              value={formData.workersComp.policyNumber}
              onChange={(e) => updateWC('policyNumber', e.target.value)}
              placeholder="WC-123456789"
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

          {/* Expiration Date */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Expiration Date *
            </label>
            <input
              type="date"
              value={formData.workersComp.expirationDate}
              onChange={(e) => updateWC('expirationDate', e.target.value)}
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

      )}

      {/* Info Box */}
      {!skipInsurance && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--btn-corner-radius)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <div style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>Note:</strong> You may be asked to provide
            Certificate of Insurance (COI) documents during the verification process. Make sure your
            policies are current and meet minimum coverage requirements.
          </div>
        </div>
      )}

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
          onClick={onNext}
          disabled={!canProceed}
          className="primary-button"
          style={{
            padding: '12px 32px',
            fontSize: 'var(--font-lg)',
            opacity: !canProceed ? 0.5 : 1,
            cursor: !canProceed ? 'not-allowed' : 'pointer'
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
