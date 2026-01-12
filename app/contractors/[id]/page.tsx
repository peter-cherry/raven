'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { calculateComplianceScore, getComplianceGrade } from '@/lib/contractor-scoring';

// Mock data matching the contractors list
const mockContractors = [
  { id: '1', full_name: 'John Martinez', trade_needed: 'HVAC', average_rating: 4.8, coi_state: 'CA', city: 'Los Angeles', state: 'CA', is_available: true, phone: '(555) 123-4567', email: 'john.martinez@email.com', service_area_radius: 50 },
  { id: '2', full_name: 'Sarah Johnson', trade_needed: 'Plumbing', average_rating: 4.9, coi_state: 'CA', city: 'San Diego', state: 'CA', is_available: true, phone: '(555) 234-5678', email: 'sarah.johnson@email.com', service_area_radius: 40 },
  { id: '3', full_name: 'Mike Chen', trade_needed: 'Electrical', average_rating: 4.6, coi_state: 'CA', city: 'San Francisco', state: 'CA', is_available: true, phone: '(555) 345-6789', email: 'mike.chen@email.com', service_area_radius: 35 },
  { id: '4', full_name: 'Emily Rodriguez', trade_needed: 'HVAC', average_rating: 4.7, coi_state: 'CA', city: 'Sacramento', state: 'CA', is_available: false, phone: '(555) 456-7890', email: 'emily.rodriguez@email.com', service_area_radius: 60 },
  { id: '5', full_name: 'David Park', trade_needed: 'Plumbing', average_rating: 4.5, coi_state: 'CA', city: 'Oakland', state: 'CA', is_available: true, phone: '(555) 567-8901', email: 'david.park@email.com', service_area_radius: 45 },
];

const mockLicenses: any = {
  '1': [
    { id: 'lic-1', license_type: 'HVAC Contractor', license_number: 'CA-HVAC-12345', license_state: 'CA' },
    { id: 'lic-2', license_type: 'EPA 608 Universal', license_number: 'EPA-608-67890', license_state: 'Federal' }
  ],
  '2': [
    { id: 'lic-3', license_type: 'Plumbing Contractor', license_number: 'CA-PLB-23456', license_state: 'CA' }
  ],
  '3': [
    { id: 'lic-4', license_type: 'Electrical Contractor', license_number: 'CA-ELC-34567', license_state: 'CA' },
    { id: 'lic-5', license_type: 'Low Voltage', license_number: 'CA-LV-45678', license_state: 'CA' }
  ],
  '4': [
    { id: 'lic-6', license_type: 'HVAC Contractor', license_number: 'CA-HVAC-56789', license_state: 'CA' }
  ],
  '5': [
    { id: 'lic-7', license_type: 'Plumbing Contractor', license_number: 'CA-PLB-78901', license_state: 'CA' }
  ]
};

const mockCertifications: any = {
  '1': [
    { id: 'cert-1', name: 'EPA 608', expirationDate: '2026-12-31' },
    { id: 'cert-2', name: 'NATE', expirationDate: '2025-06-30' }
  ],
  '2': [
    { id: 'cert-3', name: 'Backflow Prevention', expirationDate: '2025-08-15' }
  ],
  '3': [
    { id: 'cert-4', name: 'Low Voltage', expirationDate: '2026-03-20' },
    { id: 'cert-5', name: 'OSHA 10', expirationDate: '2025-11-10' }
  ],
  '4': [
    { id: 'cert-6', name: 'EPA 608', expirationDate: '2025-09-15' }
  ],
  '5': [
    { id: 'cert-7', name: 'Backflow Prevention', expirationDate: '2026-01-30' }
  ]
};

const mockInsurance: any = {
  '1': [
    { id: 'ins-1', type: 'general_liability', expirationDate: '2025-12-31' },
    { id: 'ins-2', type: 'workers_comp', expirationDate: '2025-12-31' }
  ],
  '2': [
    { id: 'ins-3', type: 'general_liability', expirationDate: '2025-03-15' }
  ],
  '3': [
    { id: 'ins-4', type: 'general_liability', expirationDate: '2024-11-30' } // Expired
  ],
  '4': [
    { id: 'ins-5', type: 'general_liability', expirationDate: '2025-12-20' },
    { id: 'ins-6', type: 'workers_comp', expirationDate: '2025-12-20' }
  ],
  '5': [
    { id: 'ins-7', type: 'general_liability', expirationDate: '2025-12-10' }
  ]
};

interface Certification {
  id: string;
  name: string;
  expirationDate?: string;
}

interface Insurance {
  id: string;
  type: 'general_liability' | 'workers_comp';
  expirationDate: string;
}

// Helper function to get COI status based on expiration relative to job date
function getCoiStatus(insurance: Insurance[] | undefined, jobDate?: Date): 'expired' | 'expiring_soon' | 'valid' | 'missing' {
  if (!insurance || insurance.length === 0) return 'missing';

  const generalLiability = insurance.find(ins => ins.type === 'general_liability');
  if (!generalLiability || !generalLiability.expirationDate) return 'missing';

  const expirationDate = new Date(generalLiability.expirationDate);
  const now = new Date();
  const targetDate = jobDate || now;

  // Calculate days until expiration
  const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Expired
  if (daysUntilExpiration < 0) return 'expired';

  // If job date provided, check if will expire before job
  if (jobDate) {
    const daysUntilJob = Math.floor((jobDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiration < daysUntilJob) return 'expiring_soon';
  } else {
    // No job date - check if expiring within 30 days
    if (daysUntilExpiration < 30) return 'expiring_soon';
  }

  return 'valid';
}

export default function ContractorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const contractorId = params.id as string;

  const [contractor, setContractor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Try to fetch from database first
    supabase
      .from('technicians')
      .select('*')
      .eq('id', contractorId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.log('Contractor not found in database, checking mock data:', error);

          // Check if this is a mock contractor ID
          const mockContractor = mockContractors.find(t => t.id === contractorId);
          if (mockContractor) {
            // Use mock data
            setContractor({
              ...mockContractor,
              technician_licenses: mockLicenses[contractorId] || [],
              certifications: mockCertifications[contractorId] || [],
              insurance: mockInsurance[contractorId] || [],
              job_assignments: []
            });
          } else {
            setContractor(null);
          }
        } else {
          console.log('Loaded contractor from database:', data.full_name);
          // Add empty arrays for licenses, certifications, insurance, and job assignments since we're not fetching them yet
          setContractor({
            ...data,
            technician_licenses: [],
            certifications: [],
            insurance: [],
            job_assignments: []
          });
        }
        setLoading(false);
      });
  }, [contractorId]);

  const coiStatus = contractor ? getCoiStatus(contractor.insurance) : 'missing';

  // COI status colors
  const coiColors = {
    expired: { bg: 'rgba(239, 68, 68, 0.2)', border: '#EF4444', text: '#EF4444' },
    expiring_soon: { bg: 'rgba(251, 146, 60, 0.2)', border: '#FB923C', text: '#FB923C' },
    valid: { bg: 'rgba(16, 185, 129, 0.2)', border: '#10B981', text: '#10B981' },
    missing: { bg: 'rgba(156, 163, 175, 0.2)', border: '#9CA3AF', text: '#9CA3AF' }
  };

  const coiStatusLabels = {
    expired: 'COI Expired',
    expiring_soon: 'COI Expiring Soon',
    valid: 'COI Valid',
    missing: 'No COI on File'
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-lg)',
          textAlign: 'center'
        }}>
          Loading contractor profile...
        </p>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-section-title)',
            fontSize: 'var(--font-2xl)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            Contractor Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-md)', marginBottom: 'var(--spacing-xl)' }}>
            The contractor you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.back()}
            style={{
              padding: 'var(--spacing-md) var(--spacing-xl)',
              background: 'var(--accent-primary)',
              border: '1px solid var(--accent-primary)',
              borderRadius: 'var(--btn-corner-radius)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-md)',
              fontWeight: 'var(--font-weight-semibold)',
              fontFamily: 'var(--font-text-body)',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: 'var(--spacing-2xl)',
      paddingTop: 'calc(80px + var(--spacing-2xl))' // Account for top bar
    }}>
      <div style={{
        maxWidth: 900,
        margin: '0 auto'
      }}>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-md)',
            fontFamily: 'var(--font-text-body)',
            cursor: 'pointer',
            marginBottom: 'var(--spacing-xl)',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>

        {/* Content Container */}
        <div style={{
          background: 'transparent',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          filter: 'brightness(1.3)',
          border: 'var(--container-border)',
          borderRadius: 'var(--modal-border-radius)',
          padding: 'var(--spacing-2xl)'
        }}>
          {/* Header with Profile Picture */}
          <div style={{ marginBottom: 'var(--spacing-2xl)', display: 'flex', gap: 'var(--spacing-xl)', alignItems: 'flex-start' }}>
            {/* Profile Picture */}
            <div style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: contractor.profile_picture_url
                ? `url(${contractor.profile_picture_url}) center/cover no-repeat`
                : 'linear-gradient(135deg, rgba(101, 98, 144, 0.3) 0%, rgba(101, 98, 144, 0.6) 100%)',
              border: '3px solid rgba(255, 255, 255, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-4xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-section-title)',
              flexShrink: 0,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              {!contractor.profile_picture_url && (contractor.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'C')}
            </div>

            {/* Name and Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontFamily: 'var(--font-section-title)',
                  fontSize: 'var(--font-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  {contractor.full_name}
                </h1>
                <span className={`status-dot ${contractor.is_available ? 'active' : 'inactive'}`} />

                {/* COI Status Badge */}
                <span
                  style={{
                    fontFamily: 'var(--font-text-body)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: coiColors[coiStatus].text,
                    background: coiColors[coiStatus].bg,
                    border: `1px solid ${coiColors[coiStatus].border}`,
                    borderRadius: 4,
                    padding: '4px 10px',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {coiStatusLabels[coiStatus]}
                </span>
              </div>
              <p style={{
                fontSize: 'var(--font-lg)',
                color: 'var(--text-secondary)',
                margin: 0,
                marginBottom: 'var(--spacing-sm)'
              }}>
                {contractor.trade_needed} • {contractor.city}, {contractor.state}
              </p>

              {/* Rating */}
              {contractor.average_rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.51L6 8.885L2.91 10.51L3.5 7.07L1 4.635L4.455 4.13L6 1Z"
                      fill={contractor.average_rating >= 4.5 ? 'var(--tech-rating-high)' : 'var(--tech-rating-medium)'}
                    />
                  </svg>
                  <span style={{
                    fontFamily: 'var(--font-text-body)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-md)',
                    color: contractor.average_rating >= 4.5 ? 'var(--tech-rating-high)' : 'var(--tech-rating-medium)'
                  }}>
                    {contractor.average_rating.toFixed(1)} rating
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Compliance Score Card */}
          <div style={{
            background: 'rgba(101, 98, 144, 0.2)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginTop: 0,
              marginBottom: 'var(--spacing-md)'
            }}>Compliance Score</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)' }}>
              <div>
                <div style={{
                  fontSize: 'var(--font-4xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-section-title)'
                }}>
                  {calculateComplianceScore(contractor)}%
                </div>
                <div style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-text-body)'
                }}>
                  Grade: {getComplianceGrade(calculateComplianceScore(contractor))}
                </div>
              </div>
            </div>

            <p style={{
              fontSize: 'var(--font-sm)',
              color: 'var(--text-secondary)',
              margin: 0,
              fontFamily: 'var(--font-text-body)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Based on uploaded documents only. Verify independently before hiring.
            </p>
          </div>

          {/* Contact Information Card */}
          <div style={{
            background: 'rgba(101, 98, 144, 0.2)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginTop: 0,
              marginBottom: 'var(--spacing-lg)'
            }}>Contact Information</h2>
            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                <span style={{
                  color: 'var(--text-secondary)',
                  minWidth: 140,
                  fontSize: 'var(--font-md)',
                  fontFamily: 'var(--font-text-body)'
                }}>Phone:</span>
                <span style={{
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-md)',
                  fontWeight: 'var(--font-weight-medium)',
                  fontFamily: 'var(--font-text-body)'
                }}>{contractor.phone || 'Not provided'}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                <span style={{
                  color: 'var(--text-secondary)',
                  minWidth: 140,
                  fontSize: 'var(--font-md)',
                  fontFamily: 'var(--font-text-body)'
                }}>Email:</span>
                <span style={{
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-md)',
                  fontWeight: 'var(--font-weight-medium)',
                  fontFamily: 'var(--font-text-body)'
                }}>{contractor.email || 'Not provided'}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                <span style={{
                  color: 'var(--text-secondary)',
                  minWidth: 140,
                  fontSize: 'var(--font-md)',
                  fontFamily: 'var(--font-text-body)'
                }}>Address:</span>
                <span style={{
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-md)',
                  fontWeight: 'var(--font-weight-medium)',
                  fontFamily: 'var(--font-text-body)'
                }}>{contractor.city}, {contractor.state}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                <span style={{
                  color: 'var(--text-secondary)',
                  minWidth: 140,
                  fontSize: 'var(--font-md)',
                  fontFamily: 'var(--font-text-body)'
                }}>Service Radius:</span>
                <span style={{
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-md)',
                  fontWeight: 'var(--font-weight-medium)',
                  fontFamily: 'var(--font-text-body)'
                }}>{contractor.service_area_radius || 0} miles</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                <span style={{
                  color: 'var(--text-secondary)',
                  minWidth: 140,
                  fontSize: 'var(--font-md)',
                  fontFamily: 'var(--font-text-body)'
                }}>Status:</span>
                <span style={{
                  color: contractor.is_available ? 'var(--success)' : 'var(--text-secondary)',
                  fontSize: 'var(--font-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  fontFamily: 'var(--font-text-body)'
                }}>
                  {contractor.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>

          {/* Insurance Details Card */}
          <div style={{
            background: 'rgba(101, 98, 144, 0.2)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginTop: 0,
              marginBottom: 'var(--spacing-lg)'
            }}>Insurance & COI</h2>
            {(contractor.insurance ?? []).length === 0 ? (
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-md)',
                fontFamily: 'var(--font-text-body)'
              }}>No insurance on file</p>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                {(contractor.insurance ?? []).map((ins: Insurance, idx: number) => {
                  const expirationDate = new Date(ins.expirationDate);
                  const now = new Date();
                  const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const isExpired = daysUntilExpiration < 0;
                  const isExpiringSoon = daysUntilExpiration >= 0 && daysUntilExpiration < 30;

                  return (
                    <div
                      key={ins.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: 'var(--spacing-md)',
                        borderBottom: idx < contractor.insurance.length - 1 ? '1px solid rgba(255, 255, 255, 0.3)' : 'none'
                      }}
                    >
                      <div>
                        <div style={{
                          color: 'var(--text-primary)',
                          fontWeight: 'var(--font-weight-semibold)',
                          fontSize: 'var(--font-md)',
                          fontFamily: 'var(--font-text-body)',
                          marginBottom: 4
                        }}>
                          {ins.type === 'general_liability' ? 'General Liability' : 'Workers Compensation'}
                        </div>
                        <div style={{
                          color: 'var(--text-secondary)',
                          fontSize: 'var(--font-sm)',
                          fontFamily: 'var(--font-text-body)'
                        }}>
                          Expires: {expirationDate.toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{
                        background: isExpired ? 'rgba(239, 68, 68, 0.2)' : isExpiringSoon ? 'rgba(251, 146, 60, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        border: `1px solid ${isExpired ? '#EF4444' : isExpiringSoon ? '#FB923C' : '#10B981'}`,
                        padding: '6px 12px',
                        borderRadius: 'var(--container-border-radius)',
                        color: isExpired ? '#EF4444' : isExpiringSoon ? '#FB923C' : '#10B981',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        fontFamily: 'var(--font-text-body)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Valid'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Licenses Card */}
          <div style={{
            background: 'rgba(101, 98, 144, 0.2)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginTop: 0,
              marginBottom: 'var(--spacing-lg)'
            }}>Licenses</h2>
            {(contractor.technician_licenses ?? []).length === 0 ? (
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-md)',
                fontFamily: 'var(--font-text-body)'
              }}>No licenses on file</p>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                {(contractor.technician_licenses ?? []).map((l: any, idx: number) => (
                  <div
                    key={l.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: 'var(--spacing-md)',
                      borderBottom: idx < contractor.technician_licenses.length - 1 ? '1px solid rgba(255, 255, 255, 0.3)' : 'none'
                    }}
                  >
                    <div>
                      <div style={{
                        color: 'var(--text-primary)',
                        fontWeight: 'var(--font-weight-semibold)',
                        fontSize: 'var(--font-md)',
                        fontFamily: 'var(--font-text-body)'
                      }}>
                        {l.license_type}
                      </div>
                      <div style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--font-sm)',
                        fontFamily: 'var(--font-text-body)'
                      }}>
                        {l.license_number}
                      </div>
                    </div>
                    <div style={{
                      background: 'var(--container-bg)',
                      padding: '6px 12px',
                      borderRadius: 'var(--container-border-radius)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontFamily: 'var(--font-text-body)'
                    }}>
                      {l.license_state}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certifications Card */}
          <div style={{
            background: 'rgba(101, 98, 144, 0.2)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginTop: 0,
              marginBottom: 'var(--spacing-lg)'
            }}>Certifications</h2>
            {(contractor.certifications ?? []).length === 0 ? (
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-md)',
                fontFamily: 'var(--font-text-body)'
              }}>No certifications on file</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                {(contractor.certifications ?? []).map((cert: Certification) => (
                  <span
                    key={cert.id}
                    style={{
                      fontFamily: 'var(--font-text-body)',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: '#FFFFFF',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: 4,
                      padding: '6px 12px',
                      whiteSpace: 'nowrap'
                    }}
                    title={cert.expirationDate ? `Expires: ${new Date(cert.expirationDate).toLocaleDateString()}` : 'No expiration date'}
                  >
                    {cert.name}
                    {cert.expirationDate && ` (exp ${new Date(cert.expirationDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })})`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
