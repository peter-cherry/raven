'use client';

import { useState, useEffect } from 'react';
import { getLicensesForStateTrade, getRequiredLicenses, getOptionalLicenses } from '@/lib/licensing-requirements';

interface License {
  name: string;
  number: string;
  state: string;
  expirationDate: string;
}

interface LicensesStepProps {
  formData: {
    state: string;
    trades: string[];
    licenses: License[];
  };
  updateFormData: (updates: Partial<any>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function LicensesStep({ formData, updateFormData, onNext, onBack }: LicensesStepProps) {
  const [requiredLicenses, setRequiredLicenses] = useState<any[]>([]);
  const [optionalLicenses, setOptionalLicenses] = useState<any[]>([]);

  // Calculate required licenses based on state and selected trades
  useEffect(() => {
    const allRequired: any[] = [];
    const allOptional: any[] = [];

    formData.trades.forEach(trade => {
      const required = getRequiredLicenses(formData.state, trade);
      const optional = getOptionalLicenses(formData.state, trade);

      required.forEach(lic => {
        if (!allRequired.find(l => l.name === lic.name)) {
          allRequired.push({ ...lic, trade });
        }
      });

      optional.forEach(lic => {
        if (!allOptional.find(l => l.name === lic.name)) {
          allOptional.push({ ...lic, trade });
        }
      });
    });

    setRequiredLicenses(allRequired);
    setOptionalLicenses(allOptional);
  }, [formData.state, formData.trades]);

  // Check if all required licenses have been filled
  const canProceed = requiredLicenses.every(reqLic => {
    return formData.licenses.some(
      userLic => userLic.name === reqLic.name && userLic.number && userLic.expirationDate
    );
  });

  const addLicense = (licenseName: string) => {
    const newLicense: License = {
      name: licenseName,
      number: '',
      state: formData.state,
      expirationDate: ''
    };
    updateFormData({ licenses: [...formData.licenses, newLicense] });
  };

  const updateLicense = (index: number, field: keyof License, value: string) => {
    const updatedLicenses = [...formData.licenses];
    updatedLicenses[index] = { ...updatedLicenses[index], [field]: value };
    updateFormData({ licenses: updatedLicenses });
  };

  const removeLicense = (index: number) => {
    const updatedLicenses = formData.licenses.filter((_, i) => i !== index);
    updateFormData({ licenses: updatedLicenses });
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
        State-Specific Licenses
      </h2>
      <p style={{
        fontSize: 'var(--font-md)',
        color: 'var(--text-secondary)',
        marginBottom: 'var(--spacing-2xl)',
        lineHeight: 1.6
      }}>
        Based on your location and selected trades, these are the required licenses:
      </p>

      {/* Required Licenses */}
      {requiredLicenses.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            Required Licenses
          </h3>

          {requiredLicenses.map((reqLic, idx) => {
            const userLicense = formData.licenses.find(l => l.name === reqLic.name);
            const licenseIndex = formData.licenses.findIndex(l => l.name === reqLic.name);

            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(108, 114, 201, 0.1)',
                  border: '1px solid rgba(108, 114, 201, 0.3)',
                  borderRadius: 'var(--btn-corner-radius)',
                  padding: 'var(--spacing-lg)',
                  marginBottom: 'var(--spacing-md)'
                }}
              >
                {/* License header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  <div>
                    <div style={{
                      fontSize: 'var(--font-md)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-xs)'
                    }}>
                      {reqLic.name}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      {reqLic.description}
                    </div>
                    {reqLic.verificationUrl && (
                      <a
                        href={reqLic.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 'var(--font-xs)',
                          color: '#6C72C9',
                          textDecoration: 'none',
                          marginTop: 'var(--spacing-xs)',
                          display: 'inline-block'
                        }}
                      >
                        Check License on State Website →
                      </a>
                    )}
                  </div>

                  {!userLicense && (
                    <button
                      onClick={() => addLicense(reqLic.name)}
                      className="outline-button"
                      style={{
                        padding: '6px 16px',
                        fontSize: 'var(--font-sm)'
                      }}
                    >
                      Add License
                    </button>
                  )}
                </div>

                {/* License form (shown when added) */}
                {userLicense && licenseIndex !== -1 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--spacing-md)',
                    marginTop: 'var(--spacing-md)'
                  }}>
                    {/* License Number */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 'var(--font-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--text-primary)',
                        marginBottom: 'var(--spacing-sm)'
                      }}>
                        License Number *
                      </label>
                      <input
                        type="text"
                        value={userLicense.number}
                        onChange={(e) => updateLicense(licenseIndex, 'number', e.target.value)}
                        placeholder="ABC123456"
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
                        value={userLicense.expirationDate}
                        onChange={(e) => updateLicense(licenseIndex, 'expirationDate', e.target.value)}
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Optional Licenses */}
      {optionalLicenses.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            Optional Licenses
          </h3>

          {optionalLicenses.map((optLic, idx) => {
            const userLicense = formData.licenses.find(l => l.name === optLic.name);
            const licenseIndex = formData.licenses.findIndex(l => l.name === optLic.name);

            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--btn-corner-radius)',
                  padding: 'var(--spacing-lg)',
                  marginBottom: 'var(--spacing-md)'
                }}
              >
                {/* License header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  <div>
                    <div style={{
                      fontSize: 'var(--font-md)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-xs)'
                    }}>
                      {optLic.name}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      {optLic.description}
                    </div>
                  </div>

                  {!userLicense ? (
                    <button
                      onClick={() => addLicense(optLic.name)}
                      className="outline-button"
                      style={{
                        padding: '6px 16px',
                        fontSize: 'var(--font-sm)'
                      }}
                    >
                      Add License
                    </button>
                  ) : (
                    <button
                      onClick={() => removeLicense(licenseIndex)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        fontSize: 'var(--font-sm)',
                        cursor: 'pointer',
                        padding: '6px 16px'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* License form (shown when added) */}
                {userLicense && licenseIndex !== -1 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--spacing-md)',
                    marginTop: 'var(--spacing-md)'
                  }}>
                    {/* License Number */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 'var(--font-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--text-primary)',
                        marginBottom: 'var(--spacing-sm)'
                      }}>
                        License Number
                      </label>
                      <input
                        type="text"
                        value={userLicense.number}
                        onChange={(e) => updateLicense(licenseIndex, 'number', e.target.value)}
                        placeholder="ABC123456"
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
                        Expiration Date
                      </label>
                      <input
                        type="date"
                        value={userLicense.expirationDate}
                        onChange={(e) => updateLicense(licenseIndex, 'expirationDate', e.target.value)}
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No licenses required message */}
      {requiredLicenses.length === 0 && optionalLicenses.length === 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--btn-corner-radius)',
          padding: 'var(--spacing-2xl)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          No specific licenses are required for your selected state and trades. You can continue to the next step.
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
          disabled={!canProceed && requiredLicenses.length > 0}
          className="primary-button"
          style={{
            padding: '12px 32px',
            fontSize: 'var(--font-lg)',
            opacity: (!canProceed && requiredLicenses.length > 0) ? 0.5 : 1,
            cursor: (!canProceed && requiredLicenses.length > 0) ? 'not-allowed' : 'pointer'
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
