"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { MOCK_TECHNICIANS, isMockMode } from '@/lib/mock-supabase';

// Mock data for development
const mockTechs = [
  { id: '1', full_name: 'John Martinez', trade_needed: 'HVAC', average_rating: 8.5, coi_state: 'CA', city: 'Los Angeles', state: 'CA', is_available: true, phone: '(555) 123-4567', email: 'john.martinez@email.com', service_area_radius: 50, company_name: 'Martinez HVAC', jobs_completed: 87 },
  { id: '2', full_name: 'Sarah Johnson', trade_needed: 'Plumbing', average_rating: 9.2, coi_state: 'CA', city: 'San Diego', state: 'CA', is_available: true, phone: '(555) 234-5678', email: 'sarah.johnson@email.com', service_area_radius: 40, company_name: 'Johnson Plumbing', jobs_completed: 124 },
  { id: '3', full_name: 'Mike Chen', trade_needed: 'Electrical', average_rating: 7.8, coi_state: 'CA', city: 'San Francisco', state: 'CA', is_available: true, phone: '(555) 345-6789', email: 'mike.chen@email.com', service_area_radius: 35, company_name: 'Chen Electric', jobs_completed: 56 },
  { id: '4', full_name: 'Emily Rodriguez', trade_needed: 'HVAC', average_rating: 8.9, coi_state: 'CA', city: 'Sacramento', state: 'CA', is_available: false, phone: '(555) 456-7890', email: 'emily.rodriguez@email.com', service_area_radius: 60, company_name: 'Rodriguez Cooling', jobs_completed: 203 },
  { id: '5', full_name: 'David Park', trade_needed: 'Plumbing', average_rating: 7.3, coi_state: 'CA', city: 'Oakland', state: 'CA', is_available: true, phone: '(555) 567-8901', email: 'david.park@email.com', service_area_radius: 45, company_name: 'Park Plumbing Co', jobs_completed: 67 },
  // Add mock technicians from the mock-supabase module
  ...MOCK_TECHNICIANS.map((t, idx) => ({
    id: t.id,
    full_name: t.full_name,
    trade_needed: t.trade_needed,
    average_rating: t.rating ? t.rating * 2 : 8.0, // Convert 5-star to 10-point scale
    coi_state: t.state,
    city: t.city,
    state: t.state,
    is_available: t.is_available,
    phone: t.phone,
    email: t.email,
    service_area_radius: t.service_radius || 30,
    company_name: t.company_name || `${t.full_name.split(' ')[1]} Services`,
    jobs_completed: t.jobs_completed || 0,
    certifications: t.certifications || [],
    hourly_rate: t.hourly_rate || 75,
  }))
];

const mockLicenses: any = {
  '1': [
    { id: 'lic-1', license_type: 'HVAC Contractor', license_number: 'CA-HVAC-12345', license_state: 'CA', expiry_date: '2025-12-31' },
    { id: 'lic-2', license_type: 'EPA 608 Universal', license_number: 'EPA-608-67890', license_state: 'Federal', expiry_date: '2026-06-30' }
  ],
  '2': [
    { id: 'lic-3', license_type: 'Plumbing Contractor', license_number: 'CA-PLB-23456', license_state: 'CA', expiry_date: '2025-08-15' }
  ],
  '3': [
    { id: 'lic-4', license_type: 'Electrical Contractor', license_number: 'CA-ELC-34567', license_state: 'CA', expiry_date: '2025-11-20' },
    { id: 'lic-5', license_type: 'Low Voltage', license_number: 'CA-LV-45678', license_state: 'CA', expiry_date: '2026-03-01' }
  ],
  '4': [
    { id: 'lic-6', license_type: 'HVAC Contractor', license_number: 'CA-HVAC-56789', license_state: 'CA', expiry_date: '2025-09-30' }
  ],
  '5': [
    { id: 'lic-7', license_type: 'Plumbing Contractor', license_number: 'CA-PLB-78901', license_state: 'CA', expiry_date: '2026-01-15' }
  ]
};

export default function TechnicianProfilePage() {
  const pathname = usePathname();
  const router = useRouter();
  const techId = pathname?.split('/').pop() || '';
  const [tech, setTech] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // In mock mode, use mock data directly
    if (isMockMode() || process.env.NODE_ENV === 'development') {
      const mockTech = mockTechs.find(t => t.id === techId);
      if (mockTech) {
        setTech({
          ...mockTech,
          technician_licenses: mockLicenses[techId] || [],
          job_assignments: []
        });
      } else {
        setTech(null);
      }
      setLoading(false);
      return;
    }

    // Try to fetch from database
    supabase
      .from('technicians')
      .select('*')
      .eq('id', techId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          const mockTech = mockTechs.find(t => t.id === techId);
          if (mockTech) {
            setTech({
              ...mockTech,
              technician_licenses: mockLicenses[techId] || [],
              job_assignments: []
            });
          } else {
            setTech(null);
          }
        } else {
          setTech({
            ...data,
            technician_licenses: [],
            job_assignments: []
          });
        }
        setLoading(false);
      });
  }, [techId]);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px'
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid var(--ds-border-default)', 
            borderTopColor: 'var(--ds-accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!tech) {
    return (
      <div className="page-container">
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: 'var(--ds-space-10)',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ds-text-tertiary)" strokeWidth="1.5" style={{ marginBottom: 'var(--ds-space-4)' }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2 style={{ 
            fontSize: 'var(--ds-text-xl)', 
            fontWeight: 'var(--ds-font-semibold)',
            color: 'var(--ds-text-primary)',
            marginBottom: 'var(--ds-space-2)'
          }}>
            Technician Not Found
          </h2>
          <p style={{ 
            color: 'var(--ds-text-secondary)',
            marginBottom: 'var(--ds-space-6)'
          }}>
            The technician you're looking for doesn't exist or has been removed.
          </p>
          <button 
            onClick={() => router.push('/technicians')} 
            className="btn btn-primary"
          >
            Back to Technicians
          </button>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'var(--ds-success)';
    if (rating >= 6) return 'var(--ds-warning)';
    return 'var(--ds-error)';
  };

  return (
    <div className="page-container" style={{ maxWidth: '900px' }}>
      {/* Back Button */}
      <button
        onClick={() => router.push('/technicians')}
        className="btn btn-ghost"
        style={{ marginBottom: 'var(--ds-space-4)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to Technicians
      </button>

      {/* Profile Header Card */}
      <div className="card" style={{ marginBottom: 'var(--ds-space-6)' }}>
        <div className="card-body" style={{ display: 'flex', gap: 'var(--ds-space-6)', alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: 'var(--ds-radius-full)',
            background: tech.profile_picture_url
              ? `url(${tech.profile_picture_url}) center/cover no-repeat`
              : 'var(--ds-accent-primary-light)',
            border: '3px solid var(--ds-border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 'var(--ds-font-bold)',
            color: 'var(--ds-accent-primary)',
            flexShrink: 0
          }}>
            {!tech.profile_picture_url && getInitials(tech.full_name)}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)', marginBottom: 'var(--ds-space-2)', flexWrap: 'wrap' }}>
              <h1 style={{ 
                fontSize: 'var(--ds-text-2xl)', 
                fontWeight: 'var(--ds-font-bold)',
                color: 'var(--ds-text-primary)',
                margin: 0
              }}>
                {tech.full_name}
              </h1>
              <span className={`badge ${tech.is_available ? 'badge-success' : 'badge-default'}`}>
                {tech.is_available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            
            {tech.company_name && (
              <p style={{ 
                fontSize: 'var(--ds-text-md)',
                color: 'var(--ds-text-secondary)',
                marginBottom: 'var(--ds-space-1)'
              }}>
                {tech.company_name}
              </p>
            )}
            
            <p style={{ 
              fontSize: 'var(--ds-text-sm)',
              color: 'var(--ds-text-tertiary)',
              margin: 0
            }}>
              {tech.trade_needed} • {tech.city}, {tech.state}
            </p>

            {/* Stats Row */}
            <div style={{ 
              display: 'flex', 
              gap: 'var(--ds-space-6)', 
              marginTop: 'var(--ds-space-4)',
              paddingTop: 'var(--ds-space-4)',
              borderTop: '1px solid var(--ds-border-subtle)'
            }}>
              {tech.average_rating && (
                <div>
                  <div style={{ 
                    fontSize: 'var(--ds-text-xl)', 
                    fontWeight: 'var(--ds-font-bold)',
                    color: getRatingColor(tech.average_rating)
                  }}>
                    {tech.average_rating.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', textTransform: 'uppercase' }}>
                    Rating
                  </div>
                </div>
              )}
              {tech.jobs_completed !== undefined && (
                <div>
                  <div style={{ 
                    fontSize: 'var(--ds-text-xl)', 
                    fontWeight: 'var(--ds-font-bold)',
                    color: 'var(--ds-text-primary)'
                  }}>
                    {tech.jobs_completed}
                  </div>
                  <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', textTransform: 'uppercase' }}>
                    Jobs Done
                  </div>
                </div>
              )}
              {tech.service_area_radius && (
                <div>
                  <div style={{ 
                    fontSize: 'var(--ds-text-xl)', 
                    fontWeight: 'var(--ds-font-bold)',
                    color: 'var(--ds-text-primary)'
                  }}>
                    {tech.service_area_radius}mi
                  </div>
                  <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', textTransform: 'uppercase' }}>
                    Service Radius
                  </div>
                </div>
              )}
              {tech.hourly_rate && (
                <div>
                  <div style={{ 
                    fontSize: 'var(--ds-text-xl)', 
                    fontWeight: 'var(--ds-font-bold)',
                    color: 'var(--ds-text-primary)'
                  }}>
                    ${tech.hourly_rate}
                  </div>
                  <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', textTransform: 'uppercase' }}>
                    Hourly Rate
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--ds-space-6)' }}>
        {/* Contact Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Contact Information</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: 'var(--ds-radius-md)',
                  background: 'var(--ds-bg-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ds-text-secondary)',
                  flexShrink: 0
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', marginBottom: '2px' }}>Phone</div>
                  <div style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-primary)', fontWeight: 'var(--ds-font-medium)' }}>
                    {tech.phone || 'Not provided'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: 'var(--ds-radius-md)',
                  background: 'var(--ds-bg-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ds-text-secondary)',
                  flexShrink: 0
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', marginBottom: '2px' }}>Email</div>
                  <div style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-primary)', fontWeight: 'var(--ds-font-medium)' }}>
                    {tech.email || 'Not provided'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: 'var(--ds-radius-md)',
                  background: 'var(--ds-bg-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ds-text-secondary)',
                  flexShrink: 0
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', marginBottom: '2px' }}>Location</div>
                  <div style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-primary)', fontWeight: 'var(--ds-font-medium)' }}>
                    {tech.city}, {tech.state}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Licenses & Certifications */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Licenses & Certifications</h3>
          </div>
          <div className="card-body">
            {(tech.technician_licenses ?? []).length === 0 && !(tech.certifications?.length) ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 'var(--ds-space-6)',
                color: 'var(--ds-text-tertiary)'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 'var(--ds-space-2)', opacity: 0.5 }}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="8" y1="8" x2="16" y2="8"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <div style={{ fontSize: 'var(--ds-text-sm)' }}>No licenses on file</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-3)' }}>
                {(tech.technician_licenses ?? []).map((l: any) => (
                  <div
                    key={l.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--ds-space-3)',
                      background: 'var(--ds-bg-muted)',
                      borderRadius: 'var(--ds-radius-md)'
                    }}
                  >
                    <div>
                      <div style={{ 
                        fontSize: 'var(--ds-text-sm)',
                        fontWeight: 'var(--ds-font-medium)',
                        color: 'var(--ds-text-primary)'
                      }}>
                        {l.license_type}
                      </div>
                      <div style={{ 
                        fontSize: 'var(--ds-text-xs)',
                        color: 'var(--ds-text-tertiary)'
                      }}>
                        {l.license_number}
                      </div>
                    </div>
                    <span className="badge badge-default">{l.license_state}</span>
                  </div>
                ))}
                {tech.certifications?.map((cert: string, idx: number) => (
                  <div
                    key={`cert-${idx}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--ds-space-3)',
                      background: 'var(--ds-bg-muted)',
                      borderRadius: 'var(--ds-radius-md)'
                    }}
                  >
                    <div style={{ 
                      fontSize: 'var(--ds-text-sm)',
                      fontWeight: 'var(--ds-font-medium)',
                      color: 'var(--ds-text-primary)'
                    }}>
                      {cert}
                    </div>
                    <span className="badge badge-success">Certified</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card" style={{ marginTop: 'var(--ds-space-6)' }}>
        <div className="card-body" style={{ 
          display: 'flex', 
          gap: 'var(--ds-space-3)',
          justifyContent: 'flex-end'
        }}>
          <button className="btn btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Send Message
          </button>
          <button className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Assign to Job
          </button>
        </div>
      </div>
    </div>
  );
}
