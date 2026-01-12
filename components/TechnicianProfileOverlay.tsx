'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CloseButton } from './CloseButton';

// Mock data matching the technicians list page
const mockTechs = [
  { id: '1', full_name: 'John Martinez', trade_needed: 'HVAC', average_rating: 8.5, coi_state: 'CA', city: 'Los Angeles', state: 'CA', is_available: true, phone: '(555) 123-4567', email: 'john.martinez@email.com', service_area_radius: 50 },
  { id: '2', full_name: 'Sarah Johnson', trade_needed: 'Plumbing', average_rating: 9.2, coi_state: 'CA', city: 'San Diego', state: 'CA', is_available: true, phone: '(555) 234-5678', email: 'sarah.johnson@email.com', service_area_radius: 40 },
  { id: '3', full_name: 'Mike Chen', trade_needed: 'Electrical', average_rating: 7.8, coi_state: 'CA', city: 'San Francisco', state: 'CA', is_available: true, phone: '(555) 345-6789', email: 'mike.chen@email.com', service_area_radius: 35 },
  { id: '4', full_name: 'Emily Rodriguez', trade_needed: 'HVAC', average_rating: 8.9, coi_state: 'CA', city: 'Sacramento', state: 'CA', is_available: false, phone: '(555) 456-7890', email: 'emily.rodriguez@email.com', service_area_radius: 60 },
  { id: '5', full_name: 'David Park', trade_needed: 'Plumbing', average_rating: 7.3, coi_state: 'CA', city: 'Oakland', state: 'CA', is_available: true, phone: '(555) 567-8901', email: 'david.park@email.com', service_area_radius: 45 },
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

interface TechnicianProfileOverlayProps {
  techId: string;
  onClose: () => void;
  onAssign?: (techId: string) => void;
}

export default function TechnicianProfileOverlay({ techId, onClose, onAssign }: TechnicianProfileOverlayProps) {
  const [tech, setTech] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ratingData, setRatingData] = useState<any>(null);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // Scroll to top when modal opens
  useEffect(() => {
    window.scrollTo(0, 0);
    // Also prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    setLoading(true);

    // Try to fetch from database first
    supabase
      .from('technicians')
      .select('*')
      .eq('id', techId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.log('Technician not found in database, checking mock data:', error);

          // Check if this is a mock technician ID
          const mockTech = mockTechs.find(t => t.id === techId);
          if (mockTech) {
            // Use mock data
            setTech({
              ...mockTech,
              technician_licenses: mockLicenses[techId] || [],
              job_assignments: []
            });
          } else {
            setTech(null);
          }
        } else {
          console.log('Loaded technician from database:', data.full_name);
          // Add empty arrays for licenses and job assignments since we're not fetching them yet
          setTech({
            ...data,
            technician_licenses: [],
            job_assignments: []
          });
        }
        setLoading(false);
      });
  }, [techId]);

  // Fetch rating breakdown
  useEffect(() => {
    if (!techId) return;

    const fetchRatings = async () => {
      setLoadingRatings(true);
      try {
        const response = await fetch(`/api/technicians/${techId}/ratings`);
        if (response.ok) {
          const data = await response.json();
          setRatingData(data);
        }
      } catch (error) {
        console.error('[RATINGS] Error fetching ratings:', error);
      } finally {
        setLoadingRatings(false);
      }
    };

    fetchRatings();
  }, [techId]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="technician-profile-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: 800,
            maxHeight: '90vh',
            background: 'transparent',
            border: '2px solid rgba(249, 243, 229, 0.33)',
            borderRadius: 'var(--modal-border-radius)',
            overflow: 'auto',
            padding: 'var(--spacing-2xl)',
            position: 'relative',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            filter: 'brightness(1.15)'
          }}
        >
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-lg)',
            textAlign: 'center'
          }}>
            Loading technician profile...
          </p>
        </motion.div>
      </motion.div>
    );
  }

  if (!tech) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="technician-profile-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: 800,
            maxHeight: '90vh',
            background: 'transparent',
            border: '2px solid rgba(249, 243, 229, 0.33)',
            borderRadius: 'var(--modal-border-radius)',
            overflow: 'auto',
            padding: 'var(--spacing-2xl)',
            position: 'relative',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            filter: 'brightness(1.15)',
            textAlign: 'center'
          }}
        >
          <CloseButton onClick={onClose} />
          <h2 style={{
            fontFamily: 'var(--font-section-title)',
            fontSize: 'var(--font-2xl)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            Technician Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-md)' }}>
            The technician you're looking for doesn't exist or has been removed.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="technician-profile-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 800,
          maxHeight: '90vh',
          background: 'transparent',
          border: '2px solid rgba(249, 243, 229, 0.33)',
          borderRadius: 'var(--modal-border-radius)',
          overflow: 'auto',
          padding: 'var(--spacing-2xl)',
          position: 'relative',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          filter: 'brightness(1.15)'
        }}
      >
        {/* Close Button */}
        <CloseButton onClick={onClose} />

        {/* Header with Profile Picture */}
        <div style={{ marginBottom: 'var(--spacing-2xl)', display: 'flex', gap: 'var(--spacing-xl)', alignItems: 'flex-start' }}>
          {/* Profile Picture */}
          <div style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: tech.profile_picture_url
              ? `url(${tech.profile_picture_url}) center/cover no-repeat`
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
            {!tech.profile_picture_url && (tech.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'T')}
          </div>

          {/* Name and Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
              <h1 style={{
                fontFamily: 'var(--font-section-title)',
                fontSize: 'var(--font-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                {tech.full_name}
              </h1>
              <span className={`status-dot ${tech.is_available ? 'active' : 'inactive'}`} />
            </div>
            <p style={{
              fontSize: 'var(--font-lg)',
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              {tech.trade_needed} • {tech.city}, {tech.state}
            </p>
          </div>
        </div>

        {/* Assign Button */}
        {onAssign && (
          <button
            onClick={() => onAssign(techId)}
            style={{
              width: '100%',
              padding: 'var(--spacing-md) var(--spacing-xl)',
              background: 'var(--accent-primary)',
              border: '1px solid var(--accent-primary)',
              borderRadius: 'var(--btn-corner-radius)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              fontFamily: 'var(--font-text-body)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: 'var(--spacing-xl)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-hover)';
              e.currentTarget.style.borderColor = 'var(--accent-hover)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent-primary)';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Assign to Work Order
          </button>
        )}

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
              }}>{tech.phone || 'Not provided'}</span>
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
              }}>{tech.email || 'Not provided'}</span>
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
              }}>{tech.service_area_radius || 0} miles</span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
              <span style={{
                color: 'var(--text-secondary)',
                minWidth: 140,
                fontSize: 'var(--font-md)',
                fontFamily: 'var(--font-text-body)'
              }}>Status:</span>
              <span style={{
                color: tech.is_available ? 'var(--success)' : 'var(--text-secondary)',
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-text-body)'
              }}>
                {tech.is_available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            {tech.average_rating && (
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                <span style={{
                  color: 'var(--text-secondary)',
                  minWidth: 140,
                  fontSize: 'var(--font-md)',
                  fontFamily: 'var(--font-text-body)'
                }}>Average Rating:</span>
                <span className={`score-badge ${tech.average_rating >= 8 ? 'high' : tech.average_rating >= 6 ? 'medium' : 'low'}`}>
                  {tech.average_rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Performance Ratings Card */}
        {ratingData && ratingData.totalRatings > 0 && (
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
            }}>Performance Ratings</h2>

            {/* Overall Rating Summary */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-xl)',
              padding: 'var(--spacing-md)',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 'var(--btn-corner-radius)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span style={{
                  fontFamily: 'var(--font-text-body)',
                  fontSize: 'var(--font-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)'
                }}>
                  {ratingData.averageOverall.toFixed(1)}
                </span>
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-text-body)',
                  fontSize: 'var(--font-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)'
                }}>
                  Overall Rating
                </div>
                <div style={{
                  fontFamily: 'var(--font-text-body)',
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-secondary)'
                }}>
                  Based on {ratingData.totalRatings} {ratingData.totalRatings === 1 ? 'review' : 'reviews'}
                </div>
              </div>
            </div>

            {/* Dimensional Ratings */}
            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
              {/* Quality */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  <span style={{
                    fontFamily: 'var(--font-text-body)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    letterSpacing: '0.5px'
                  }}>
                    QUALITY OF WORK
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-text-body)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: '#F59E0B'
                  }}>
                    {ratingData.averageQuality.toFixed(1)}
                  </span>
                </div>
                <div style={{
                  height: 'var(--progress-bar-height)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--progress-bar-radius)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(ratingData.averageQuality / 5) * 100}%`,
                    background: '#F59E0B',
                    borderRadius: 'var(--progress-bar-radius)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Professionalism */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  <span style={{
                    fontFamily: 'var(--font-text-body)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    letterSpacing: '0.5px'
                  }}>
                    PROFESSIONALISM
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-text-body)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: '#F59E0B'
                  }}>
                    {ratingData.averageProfessionalism.toFixed(1)}
                  </span>
                </div>
                <div style={{
                  height: 'var(--progress-bar-height)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--progress-bar-radius)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(ratingData.averageProfessionalism / 5) * 100}%`,
                    background: '#F59E0B',
                    borderRadius: 'var(--progress-bar-radius)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Timeliness */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  <span style={{
                    fontFamily: 'var(--font-text-body)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    letterSpacing: '0.5px'
                  }}>
                    TIMELINESS
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-text-body)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: '#F59E0B'
                  }}>
                    {ratingData.averageTimeliness.toFixed(1)}
                  </span>
                </div>
                <div style={{
                  height: 'var(--progress-bar-height)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--progress-bar-radius)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(ratingData.averageTimeliness / 5) * 100}%`,
                    background: '#F59E0B',
                    borderRadius: 'var(--progress-bar-radius)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Communication */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  <span style={{
                    fontFamily: 'var(--font-text-body)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    letterSpacing: '0.5px'
                  }}>
                    COMMUNICATION
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-text-body)',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: '#F59E0B'
                  }}>
                    {ratingData.averageCommunication.toFixed(1)}
                  </span>
                </div>
                <div style={{
                  height: 'var(--progress-bar-height)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--progress-bar-radius)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(ratingData.averageCommunication / 5) * 100}%`,
                    background: '#F59E0B',
                    borderRadius: 'var(--progress-bar-radius)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}

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
          }}>Licenses & Certifications</h2>
          {(tech.technician_licenses ?? []).length === 0 ? (
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-md)',
              fontFamily: 'var(--font-text-body)'
            }}>No licenses on file</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
              {(tech.technician_licenses ?? []).map((l: any, idx: number) => (
                <div
                  key={l.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 'var(--spacing-md)',
                    borderBottom: idx < tech.technician_licenses.length - 1 ? '1px solid rgba(255, 255, 255, 0.3)' : 'none'
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

        {/* Job History Card */}
        {tech.job_assignments && tech.job_assignments.length > 0 && (
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
            }}>Job History</h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-md)',
              fontFamily: 'var(--font-text-body)'
            }}>
              {tech.job_assignments.length} job{tech.job_assignments.length !== 1 ? 's' : ''} completed
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
