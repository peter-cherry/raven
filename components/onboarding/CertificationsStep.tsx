'use client';

interface Certification {
  name: string;
  number: string;
  expirationDate: string;
}

interface CertificationsStepProps {
  formData: {
    certifications: Certification[];
  };
  updateFormData: (updates: Partial<any>) => void;
  onNext: () => void;
  onBack: () => void;
}

const COMMON_CERTIFICATIONS = [
  { id: 'epa608_universal', name: 'EPA 608 (Universal)', description: 'Universal refrigerant handling certification' },
  { id: 'epa608_type1', name: 'EPA 608 Type I', description: 'Small appliances refrigerant handling' },
  { id: 'epa608_type2', name: 'EPA 608 Type II', description: 'High-pressure refrigerant handling' },
  { id: 'epa608_type3', name: 'EPA 608 Type III', description: 'Low-pressure refrigerant handling' },
  { id: 'osha10', name: 'OSHA 10', description: '10-hour safety training certification' },
  { id: 'osha30', name: 'OSHA 30', description: '30-hour safety training certification' },
  { id: 'nate', name: 'NATE', description: 'North American Technician Excellence certification' },
];

export default function CertificationsStep({ formData, updateFormData, onNext, onBack }: CertificationsStepProps) {
  const addCertification = (certName: string) => {
    const newCert: Certification = {
      name: certName,
      number: '',
      expirationDate: ''
    };
    updateFormData({ certifications: [...formData.certifications, newCert] });
  };

  const addCustomCertification = () => {
    const newCert: Certification = {
      name: '',
      number: '',
      expirationDate: ''
    };
    updateFormData({ certifications: [...formData.certifications, newCert] });
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updatedCerts = [...formData.certifications];
    updatedCerts[index] = { ...updatedCerts[index], [field]: value };
    updateFormData({ certifications: updatedCerts });
  };

  const removeCertification = (index: number) => {
    const updatedCerts = formData.certifications.filter((_, i) => i !== index);
    updateFormData({ certifications: updatedCerts });
  };

  // Check which common certifications have already been added
  const addedCertNames = formData.certifications.map(c => c.name);

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
        Certifications
      </h2>
      <p style={{
        fontSize: 'var(--font-md)',
        color: 'var(--text-secondary)',
        marginBottom: 'var(--spacing-2xl)',
        lineHeight: 1.6
      }}>
        Add any professional certifications you hold. This helps demonstrate your expertise.
      </p>

      {/* Common Certifications */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <h3 style={{
          fontSize: 'var(--font-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-md)'
        }}>
          Common Certifications
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          {COMMON_CERTIFICATIONS.map(cert => {
            const isAdded = addedCertNames.includes(cert.name);

            return (
              <button
                key={cert.id}
                onClick={() => !isAdded && addCertification(cert.name)}
                disabled={isAdded}
                style={{
                  background: isAdded ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                  border: isAdded ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--btn-corner-radius)',
                  padding: 'var(--spacing-md)',
                  textAlign: 'left',
                  cursor: isAdded ? 'not-allowed' : 'pointer',
                  opacity: isAdded ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: 'var(--font-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  {cert.name} {isAdded && '✓'}
                </div>
                <div style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-secondary)'
                }}>
                  {cert.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom certification button */}
        <button
          onClick={addCustomCertification}
          className="outline-button"
          style={{
            padding: '10px 20px',
            fontSize: 'var(--font-md)'
          }}
        >
          + Add Custom Certification
        </button>
      </div>

      {/* Added Certifications List */}
      {formData.certifications.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h3 style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            Your Certifications ({formData.certifications.length})
          </h3>

          {formData.certifications.map((cert, index) => {
            const isCustom = !COMMON_CERTIFICATIONS.some(c => c.name === cert.name);

            return (
              <div
                key={index}
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--btn-corner-radius)',
                  padding: 'var(--spacing-lg)',
                  marginBottom: 'var(--spacing-md)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  <div style={{
                    fontSize: 'var(--font-md)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)'
                  }}>
                    {isCustom ? 'Custom Certification' : cert.name}
                  </div>
                  <button
                    onClick={() => removeCertification(index)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: 'var(--font-sm)',
                      cursor: 'pointer',
                      padding: '6px 12px'
                    }}
                  >
                    Remove
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isCustom ? '1fr 1fr 1fr' : '1fr 1fr',
                  gap: 'var(--spacing-md)'
                }}>
                  {/* Certification Name (for custom certs only) */}
                  {isCustom && (
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 'var(--font-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--text-primary)',
                        marginBottom: 'var(--spacing-sm)'
                      }}>
                        Certification Name
                      </label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => updateCertification(index, 'name', e.target.value)}
                        placeholder="Enter certification name"
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

                  {/* Certification Number */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-sm)'
                    }}>
                      Certification Number
                    </label>
                    <input
                      type="text"
                      value={cert.number}
                      onChange={(e) => updateCertification(index, 'number', e.target.value)}
                      placeholder="CER-123456"
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
                      value={cert.expirationDate}
                      onChange={(e) => updateCertification(index, 'expirationDate', e.target.value)}
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
            );
          })}
        </div>
      )}

      {/* No certifications message */}
      {formData.certifications.length === 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--btn-corner-radius)',
          padding: 'var(--spacing-2xl)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          Click a certification above to add it, or add a custom certification.
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
          className="primary-button"
          style={{
            padding: '12px 32px',
            fontSize: 'var(--font-lg)'
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
