'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAnon } from '@/lib/supabaseClient';
import AddLicenseModal from '@/components/credentials/AddLicenseModal';
import EditLicenseModal from '@/components/credentials/EditLicenseModal';
import AddCertificationModal from '@/components/credentials/AddCertificationModal';
import EditCertificationModal from '@/components/credentials/EditCertificationModal';
import AddInsuranceModal from '@/components/credentials/AddInsuranceModal';
import EditInsuranceModal from '@/components/credentials/EditInsuranceModal';

type TabType = 'overview' | 'profile' | 'credentials' | 'jobs' | 'performance';

export default function TechnicianDashboard() {
  const router = useRouter();
  const [contractor, setContractor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isAvailable, setIsAvailable] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any>({});

  // Credentials state
  const [licenses, setLicenses] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [insurance, setInsurance] = useState<any[]>([]);
  const [showComplianceBreakdown, setShowComplianceBreakdown] = useState(false);

  // Modal states
  const [showAddLicense, setShowAddLicense] = useState(false);
  const [showEditLicense, setShowEditLicense] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);

  const [showAddCertification, setShowAddCertification] = useState(false);
  const [showEditCertification, setShowEditCertification] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<any>(null);

  const [showAddInsurance, setShowAddInsurance] = useState(false);
  const [showEditInsurance, setShowEditInsurance] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<any>(null);

  // Fetch credentials function - extracted so modals can call it
  const fetchCredentials = async (contractorId: string) => {
    if (!contractorId) return;

    // Fetch licenses
    const { data: licensesData } = await supabaseAnon
      .from('contractor_licenses')
      .select('*')
      .eq('contractor_id', contractorId);

    if (licensesData) setLicenses(licensesData);

    // Fetch certifications
    const { data: certificationsData } = await supabaseAnon
      .from('contractor_certifications')
      .select('*')
      .eq('contractor_id', contractorId);

    if (certificationsData) setCertifications(certificationsData);

    // Fetch insurance
    const { data: insuranceData } = await supabaseAnon
      .from('contractor_insurance')
      .select('*')
      .eq('contractor_id', contractorId);

    if (insuranceData) setInsurance(insuranceData);
  };

  useEffect(() => {
    // Fetch contractor details by authenticated user
    const fetchContractor = async () => {
      // Check if we just came from OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const justAuthed = urlParams.get('auth') === 'success';

      if (justAuthed) {
        // Wait for OAuth callback to complete
        console.log('Just authenticated via OAuth, waiting for session...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Remove the auth param from URL
        window.history.replaceState({}, '', '/contractors/dashboard');
      }

      // Use server-side session check via API route (more reliable than client-side after OAuth)
      console.log('Checking session via server API...');
      const sessionResponse = await fetch('/api/auth/session', {
        credentials: 'include', // Important: include cookies
        cache: 'no-store'
      });

      const { session, error: sessionError } = await sessionResponse.json();

      if (!session?.user || sessionError) {
        // Not authenticated - redirect to login
        console.log('No authenticated user, redirecting to login...', sessionError);
        router.push('/login?returnUrl=/contractors/dashboard');
        return;
      }

      console.log('Authenticated user found:', session.user.email);
      const user = session.user;

      // Fetch contractor record by user_id
      const { data, error } = await supabaseAnon
        .from('technicians')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        console.error('Error fetching contractor:', error);
        // No technician record found - redirect to onboarding
        router.push('/contractors/onboarding');
        return;
      }

      setContractor(data);
      setIsAvailable(data.is_available ?? true);
      setEditedData(data);
      setLoading(false);

      // Fetch credentials
      fetchCredentials(data.id);
    };

    fetchContractor();
  }, [router]);

  const handleSaveProfile = async () => {
    // Save edited data to database
    const { error } = await supabaseAnon
      .from('technicians')
      .update(editedData)
      .eq('id', contractor.id);

    if (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
      return;
    }

    setContractor(editedData);
    setEditMode(false);
    alert('Profile updated successfully!');
  };

  const handleAvailabilityToggle = async () => {
    const newAvailability = !isAvailable;

    const { error } = await supabaseAnon
      .from('technicians')
      .update({ is_available: newAvailability })
      .eq('id', contractor.id);

    if (error) {
      console.error('Error updating availability:', error);
      return;
    }

    setIsAvailable(newAvailability);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: 'var(--font-xl)',
          color: 'var(--text-secondary)'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: 'var(--spacing-2xl)',
      paddingTop: 'var(--spacing-5xl)'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-2xl)'
        }}>
          <div>
            <h1 style={{
              fontSize: 'var(--font-4xl)',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: 'var(--font-section-title)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-xs)'
            }}>
              {contractor?.full_name || 'Technician Dashboard'}
            </h1>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)'
            }}>
              Manage your profile, credentials, and jobs
            </p>
          </div>

          {/* Availability Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-md)'
          }}>
            <span style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-primary)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              Available for Work
            </span>
            <button
              onClick={handleAvailabilityToggle}
              style={{
                width: 50,
                height: 28,
                borderRadius: 14,
                background: isAvailable ? '#10B981' : '#6B7280',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s'
              }}
            >
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: 3,
                left: isAvailable ? 25 : 3,
                transition: 'left 0.2s'
              }}/>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-xs)',
          marginBottom: 'var(--spacing-2xl)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'profile', label: 'Profile' },
            { key: 'credentials', label: 'Credentials' },
            { key: 'jobs', label: 'Jobs' },
            { key: 'performance', label: 'Performance' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #6C72C9' : '2px solid transparent',
                color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Quick Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-2xl)'
            }}>
              {/* Compliance Score */}
              <div style={{
                background: 'var(--container-bg)',
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: 'var(--spacing-lg)',
                gridColumn: 'span 2'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  <div style={{
                    fontSize: 'var(--font-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Compliance Score
                  </div>
                  <button
                    onClick={() => setShowComplianceBreakdown(!showComplianceBreakdown)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6C72C9',
                      fontSize: 'var(--font-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {showComplianceBreakdown ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                <div style={{
                  fontSize: 'var(--font-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  marginBottom: showComplianceBreakdown ? 'var(--spacing-lg)' : 0
                }}>
                  {contractor?.compliance_score || 85}% <span style={{ fontSize: 'var(--font-xl)', color: '#10B981' }}>(A)</span>
                </div>

                {showComplianceBreakdown && (
                  <div style={{
                    display: 'grid',
                    gap: 'var(--spacing-sm)'
                  }}>
                    {/* Licenses */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)',
                      paddingBottom: 'var(--spacing-xs)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={licenses.length > 0 ? '#10B981' : '#EF4444'} strokeWidth="2">
                          {licenses.length > 0 ? (
                            <polyline points="20 6 9 17 4 12"/>
                          ) : (
                            <>
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </>
                          )}
                        </svg>
                        <span>Licenses</span>
                      </div>
                      <span style={{ fontWeight: 'var(--font-weight-semibold)', color: licenses.length > 0 ? '#10B981' : '#EF4444' }}>
                        {licenses.length} {licenses.length === 1 ? 'license' : 'licenses'}
                      </span>
                    </div>

                    {/* Certifications */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)',
                      paddingBottom: 'var(--spacing-xs)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={certifications.length > 0 ? '#10B981' : '#F59E0B'} strokeWidth="2">
                          {certifications.length > 0 ? (
                            <polyline points="20 6 9 17 4 12"/>
                          ) : (
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                          )}
                        </svg>
                        <span>Certifications</span>
                      </div>
                      <span style={{ fontWeight: 'var(--font-weight-semibold)', color: certifications.length > 0 ? '#10B981' : '#F59E0B' }}>
                        {certifications.length} {certifications.length === 1 ? 'cert' : 'certs'}
                      </span>
                    </div>

                    {/* Insurance */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)',
                      paddingBottom: 'var(--spacing-xs)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={insurance.length > 0 ? '#10B981' : '#EF4444'} strokeWidth="2">
                          {insurance.length > 0 ? (
                            <polyline points="20 6 9 17 4 12"/>
                          ) : (
                            <>
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                              <line x1="9" y1="12" x2="15" y2="12"/>
                            </>
                          )}
                        </svg>
                        <span>Insurance</span>
                      </div>
                      <span style={{ fontWeight: 'var(--font-weight-semibold)', color: insurance.length > 0 ? '#10B981' : '#EF4444' }}>
                        {insurance.length} {insurance.length === 1 ? 'policy' : 'policies'}
                      </span>
                    </div>

                    {/* Background Check */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={contractor?.background_check_authorized ? '#10B981' : '#6B7280'} strokeWidth="2">
                          {contractor?.background_check_authorized ? (
                            <polyline points="20 6 9 17 4 12"/>
                          ) : (
                            <circle cx="12" cy="12" r="10"/>
                          )}
                        </svg>
                        <span>Background Check</span>
                      </div>
                      <span style={{ fontWeight: 'var(--font-weight-semibold)', color: contractor?.background_check_authorized ? '#10B981' : '#6B7280' }}>
                        {contractor?.background_check_authorized ? 'Authorized' : 'Pending'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Average Rating */}
              <div style={{
                background: 'var(--container-bg)',
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: 'var(--spacing-lg)'
              }}>
                <div style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Average Rating
                </div>
                <div style={{
                  fontSize: 'var(--font-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#F59E0B">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {contractor?.average_rating || '4.8'}
                </div>
              </div>

              {/* Jobs Completed */}
              <div style={{
                background: 'var(--container-bg)',
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: 'var(--spacing-lg)'
              }}>
                <div style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Jobs Completed
                </div>
                <div style={{
                  fontSize: 'var(--font-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)'
                }}>
                  {contractor?.total_jobs_completed || 0}
                </div>
              </div>

              {/* Response Rate */}
              <div style={{
                background: 'var(--container-bg)',
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: 'var(--spacing-lg)'
              }}>
                <div style={{
                  fontSize: 'var(--font-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Response Rate
                </div>
                <div style={{
                  fontSize: 'var(--font-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)'
                }}>
                  {contractor?.response_rate || 95}%
                </div>
              </div>
            </div>

            {/* Profile Summary */}
            <div style={{
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-2xl)',
              marginBottom: 'var(--spacing-2xl)'
            }}>
              <h2 style={{
                fontSize: 'var(--font-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                Profile Summary
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 'var(--spacing-lg)'
              }}>
                <div>
                  <div style={{
                    fontSize: 'var(--font-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Email
                  </div>
                  <div style={{
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-primary)'
                  }}>
                    {contractor?.email}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: 'var(--font-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Phone
                  </div>
                  <div style={{
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-primary)'
                  }}>
                    {contractor?.phone}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: 'var(--font-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Location
                  </div>
                  <div style={{
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-primary)'
                  }}>
                    {contractor?.city}, {contractor?.state} {contractor?.zip_code}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: 'var(--font-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 'var(--spacing-sm)'
                  }}>
                    Trades
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-xs)'
                  }}>
                    {contractor?.trades?.map((trade: string) => (
                      <span
                        key={trade}
                        style={{
                          background: 'rgba(108, 114, 201, 0.2)',
                          border: '1px solid rgba(108, 114, 201, 0.4)',
                          borderRadius: 'var(--btn-corner-radius)',
                          padding: '4px 12px',
                          fontSize: 'var(--font-sm)',
                          color: 'var(--text-primary)',
                          textTransform: 'capitalize'
                        }}
                      >
                        {trade}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-2xl)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--spacing-2xl)'
            }}>
              <h2 style={{
                fontSize: 'var(--font-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)'
              }}>
                Edit Profile
              </h2>

              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="primary-button"
                  style={{ padding: '8px 24px' }}
                >
                  Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setEditedData(contractor);
                    }}
                    className="outline-button"
                    style={{ padding: '8px 24px' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="primary-button"
                    style={{ padding: '8px 24px' }}
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--spacing-lg)'
            }}>
              {/* Full Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Full Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    className="text-input"
                    value={editedData.full_name || ''}
                    onChange={(e) => setEditedData({ ...editedData, full_name: e.target.value })}
                  />
                ) : (
                  <div style={{
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-primary)',
                    padding: '12px 0'
                  }}>
                    {contractor?.full_name}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Email
                </label>
                {editMode ? (
                  <input
                    type="email"
                    className="text-input"
                    value={editedData.email || ''}
                    onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                  />
                ) : (
                  <div style={{
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-primary)',
                    padding: '12px 0'
                  }}>
                    {contractor?.email}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  Phone
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    className="text-input"
                    value={editedData.phone || ''}
                    onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                  />
                ) : (
                  <div style={{
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-primary)',
                    padding: '12px 0'
                  }}>
                    {contractor?.phone}
                  </div>
                )}
              </div>

              {/* City */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  City
                </label>
                {editMode ? (
                  <input
                    type="text"
                    className="text-input"
                    value={editedData.city || ''}
                    onChange={(e) => setEditedData({ ...editedData, city: e.target.value })}
                  />
                ) : (
                  <div style={{
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-primary)',
                    padding: '12px 0'
                  }}>
                    {contractor?.city}
                  </div>
                )}
              </div>

              {/* State */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  State
                </label>
                {editMode ? (
                  <input
                    type="text"
                    className="text-input"
                    value={editedData.state || ''}
                    onChange={(e) => setEditedData({ ...editedData, state: e.target.value })}
                  />
                ) : (
                  <div style={{
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-primary)',
                    padding: '12px 0'
                  }}>
                    {contractor?.state}
                  </div>
                )}
              </div>

              {/* ZIP Code */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  ZIP Code
                </label>
                {editMode ? (
                  <input
                    type="text"
                    className="text-input"
                    value={editedData.zip_code || ''}
                    onChange={(e) => setEditedData({ ...editedData, zip_code: e.target.value })}
                  />
                ) : (
                  <div style={{
                    fontSize: 'var(--font-md)',
                    color: 'var(--text-primary)',
                    padding: '12px 0'
                  }}>
                    {contractor?.zip_code}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'credentials' && (
          <div>
            {/* Licenses Section */}
            <div style={{
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-2xl)',
              marginBottom: 'var(--spacing-2xl)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <h2 style={{
                  fontSize: 'var(--font-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)'
                }}>
                  Licenses
                </h2>
                <button
                  className="primary-button"
                  style={{ padding: '8px 24px' }}
                  onClick={() => setShowAddLicense(true)}
                >
                  + Add License
                </button>
              </div>

              {licenses.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-5xl)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--font-md)'
                }}>
                  No licenses added yet
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: 'var(--spacing-md)'
                }}>
                  {licenses.map((license) => {
                    const daysUntilExpiry = license.expiration_date
                      ? Math.floor((new Date(license.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry < 90;
                    const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

                    return (
                      <div
                        key={license.id}
                        style={{
                          background: 'rgba(178, 173, 201, 0.05)',
                          border: isExpired ? '1px solid #EF4444' : isExpiringSoon ? '1px solid #F59E0B' : 'var(--container-border)',
                          borderRadius: 'var(--container-border-radius)',
                          padding: 'var(--spacing-lg)',
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          gap: 'var(--spacing-lg)',
                          alignItems: 'start'
                        }}
                      >
                        <div>
                          <div style={{
                            fontSize: 'var(--font-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--spacing-sm)'
                          }}>
                            {license.license_name}
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 'var(--spacing-md)',
                            fontSize: 'var(--font-sm)',
                            color: 'var(--text-secondary)'
                          }}>
                            <div>
                              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>License #:</span> {license.license_number}
                            </div>
                            <div>
                              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>State:</span> {license.state}
                            </div>
                            <div>
                              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Expires:</span>{' '}
                              <span style={{ color: isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : 'inherit' }}>
                                {license.expiration_date ? new Date(license.expiration_date).toLocaleDateString() : 'N/A'}
                                {daysUntilExpiry !== null && daysUntilExpiry >= 0 && (
                                  <> ({daysUntilExpiry} days)</>
                                )}
                                {isExpired && <> (EXPIRED)</>}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                          <button
                            className="outline-button"
                            style={{ padding: '6px 16px', fontSize: 'var(--font-sm)' }}
                            onClick={() => {
                              setSelectedLicense(license);
                              setShowEditLicense(true);
                            }}
                          >
                            Edit
                          </button>
                          {isExpiringSoon && (
                            <div style={{
                              padding: '6px 12px',
                              background: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              border: isExpired ? '1px solid #EF4444' : '1px solid #F59E0B',
                              borderRadius: 'var(--btn-corner-radius)',
                              fontSize: 'var(--font-xs)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: isExpired ? '#EF4444' : '#F59E0B'
                            }}>
                              {isExpired ? 'EXPIRED' : 'EXPIRING SOON'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Certifications Section */}
            <div style={{
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-2xl)',
              marginBottom: 'var(--spacing-2xl)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <h2 style={{
                  fontSize: 'var(--font-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)'
                }}>
                  Certifications
                </h2>
                <button
                  className="primary-button"
                  style={{ padding: '8px 24px' }}
                  onClick={() => setShowAddCertification(true)}
                >
                  + Add Certification
                </button>
              </div>

              {certifications.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-5xl)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--font-md)'
                }}>
                  No certifications added yet
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 'var(--spacing-md)'
                }}>
                  {certifications.map((cert) => {
                    const daysUntilExpiry = cert.expiration_date
                      ? Math.floor((new Date(cert.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry < 90;
                    const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

                    return (
                      <div
                        key={cert.id}
                        style={{
                          background: 'rgba(178, 173, 201, 0.05)',
                          border: isExpired ? '1px solid #EF4444' : isExpiringSoon ? '1px solid #F59E0B' : 'var(--container-border)',
                          borderRadius: 'var(--container-border-radius)',
                          padding: 'var(--spacing-lg)'
                        }}
                      >
                        <div style={{
                          fontSize: 'var(--font-md)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--text-primary)',
                          marginBottom: 'var(--spacing-sm)'
                        }}>
                          {cert.certification_name}
                        </div>
                        <div style={{
                          fontSize: 'var(--font-sm)',
                          color: 'var(--text-secondary)',
                          marginBottom: 'var(--spacing-sm)'
                        }}>
                          {cert.certification_number && (
                            <div>
                              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Cert #:</span> {cert.certification_number}
                            </div>
                          )}
                          {cert.expiration_date && (
                            <div style={{ color: isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : 'inherit' }}>
                              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Expires:</span>{' '}
                              {new Date(cert.expiration_date).toLocaleDateString()}
                              {daysUntilExpiry !== null && daysUntilExpiry >= 0 && <> ({daysUntilExpiry} days)</>}
                              {isExpired && <> (EXPIRED)</>}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'space-between', alignItems: 'center' }}>
                          <button
                            className="outline-button"
                            style={{ padding: '6px 16px', fontSize: 'var(--font-sm)' }}
                            onClick={() => {
                              setSelectedCertification(cert);
                              setShowEditCertification(true);
                            }}
                          >
                            Edit
                          </button>
                          {isExpiringSoon && (
                            <div style={{
                              padding: '4px 8px',
                              background: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              border: isExpired ? '1px solid #EF4444' : '1px solid #F59E0B',
                              borderRadius: 'var(--btn-corner-radius)',
                              fontSize: 'var(--font-xs)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: isExpired ? '#EF4444' : '#F59E0B'
                            }}>
                              {isExpired ? 'EXPIRED' : 'SOON'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Insurance Section */}
            <div style={{
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-2xl)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <h2 style={{
                  fontSize: 'var(--font-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)'
                }}>
                  Insurance
                </h2>
                <button
                  className="primary-button"
                  style={{ padding: '8px 24px' }}
                  onClick={() => setShowAddInsurance(true)}
                >
                  + Add Insurance
                </button>
              </div>

              {insurance.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-5xl)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--font-md)'
                }}>
                  No insurance policies added yet
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: 'var(--spacing-md)'
                }}>
                  {insurance.map((policy) => {
                    const daysUntilExpiry = policy.expiration_date
                      ? Math.floor((new Date(policy.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry < 90;
                    const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

                    const insuranceTypeLabels: { [key: string]: string } = {
                      'general_liability': 'General Liability',
                      'workers_comp': 'Workers Compensation',
                      'auto': 'Auto Insurance',
                      'professional_liability': 'Professional Liability'
                    };

                    return (
                      <div
                        key={policy.id}
                        style={{
                          background: 'rgba(178, 173, 201, 0.05)',
                          border: isExpired ? '1px solid #EF4444' : isExpiringSoon ? '1px solid #F59E0B' : 'var(--container-border)',
                          borderRadius: 'var(--container-border-radius)',
                          padding: 'var(--spacing-lg)',
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          gap: 'var(--spacing-lg)',
                          alignItems: 'start'
                        }}
                      >
                        <div>
                          <div style={{
                            fontSize: 'var(--font-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--spacing-sm)'
                          }}>
                            {insuranceTypeLabels[policy.insurance_type] || policy.insurance_type}
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 'var(--spacing-md)',
                            fontSize: 'var(--font-sm)',
                            color: 'var(--text-secondary)'
                          }}>
                            <div>
                              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Carrier:</span> {policy.carrier}
                            </div>
                            <div>
                              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Policy #:</span> {policy.policy_number}
                            </div>
                            {policy.coverage_amount && (
                              <div>
                                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Coverage:</span> ${policy.coverage_amount.toLocaleString()}
                              </div>
                            )}
                            <div>
                              <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>Expires:</span>{' '}
                              <span style={{ color: isExpired ? '#EF4444' : isExpiringSoon ? '#F59E0B' : 'inherit' }}>
                                {policy.expiration_date ? new Date(policy.expiration_date).toLocaleDateString() : 'N/A'}
                                {daysUntilExpiry !== null && daysUntilExpiry >= 0 && (
                                  <> ({daysUntilExpiry} days)</>
                                )}
                                {isExpired && <> (EXPIRED)</>}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                          <button
                            className="outline-button"
                            style={{ padding: '6px 16px', fontSize: 'var(--font-sm)' }}
                            onClick={() => {
                              setSelectedInsurance(policy);
                              setShowEditInsurance(true);
                            }}
                          >
                            Edit
                          </button>
                          {isExpiringSoon && (
                            <div style={{
                              padding: '6px 12px',
                              background: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              border: isExpired ? '1px solid #EF4444' : '1px solid #F59E0B',
                              borderRadius: 'var(--btn-corner-radius)',
                              fontSize: 'var(--font-xs)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: isExpired ? '#EF4444' : '#F59E0B'
                            }}>
                              {isExpired ? 'EXPIRED' : 'EXPIRING SOON'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-2xl)'
          }}>
            <h2 style={{
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              My Jobs
            </h2>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-2xl)'
            }}>
              View your active and completed jobs
            </p>

            <div style={{
              fontSize: 'var(--font-lg)',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              padding: 'var(--spacing-5xl)'
            }}>
              No jobs yet. You'll see job notifications here once clients assign work to you.
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-2xl)'
          }}>
            <h2 style={{
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Performance & Reviews
            </h2>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-2xl)'
            }}>
              Track your ratings, reviews, and performance metrics
            </p>

            <div style={{
              fontSize: 'var(--font-lg)',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              padding: 'var(--spacing-5xl)'
            }}>
              Performance metrics coming soon...
            </div>
          </div>
        )}
      </div>

      {/* Credential Modals */}
      <AddLicenseModal
        isOpen={showAddLicense}
        onClose={() => setShowAddLicense(false)}
        contractorId={contractor?.id}
        onSuccess={() => {
          fetchCredentials(contractor?.id);
          setShowAddLicense(false);
        }}
      />

      <EditLicenseModal
        isOpen={showEditLicense}
        onClose={() => setShowEditLicense(false)}
        license={selectedLicense}
        onSuccess={() => {
          fetchCredentials(contractor?.id);
          setShowEditLicense(false);
        }}
      />

      <AddCertificationModal
        isOpen={showAddCertification}
        onClose={() => setShowAddCertification(false)}
        contractorId={contractor?.id}
        onSuccess={() => {
          fetchCredentials(contractor?.id);
          setShowAddCertification(false);
        }}
      />

      <EditCertificationModal
        isOpen={showEditCertification}
        onClose={() => setShowEditCertification(false)}
        certification={selectedCertification}
        onSuccess={() => {
          fetchCredentials(contractor?.id);
          setShowEditCertification(false);
        }}
      />

      <AddInsuranceModal
        isOpen={showAddInsurance}
        onClose={() => setShowAddInsurance(false)}
        contractorId={contractor?.id}
        onSuccess={() => {
          fetchCredentials(contractor?.id);
          setShowAddInsurance(false);
        }}
      />

      <EditInsuranceModal
        isOpen={showEditInsurance}
        onClose={() => setShowEditInsurance(false)}
        insurance={selectedInsurance}
        onSuccess={() => {
          fetchCredentials(contractor?.id);
          setShowEditInsurance(false);
        }}
      />
    </div>
  );
}
