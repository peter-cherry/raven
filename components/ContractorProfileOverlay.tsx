'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { calculateComplianceScore, getComplianceGrade } from '@/lib/contractor-scoring';
import { MOCK_TECHNICIANS, isMockMode } from '@/lib/mock-supabase';

// Mock data matching the contractors list
const mockContractors = [
  { id: '1', full_name: 'John Smith', trade_needed: 'HVAC', average_rating: 4.8, coi_state: 'CA', city: 'Miami', state: 'FL', is_available: true, phone: '(555) 123-4567', email: 'john.smith@email.com', service_area_radius: 50, company_name: 'Smith HVAC', jobs_completed: 87 },
  { id: '2', full_name: 'Maria Garcia', trade_needed: 'Plumbing', average_rating: 4.5, coi_state: 'CA', city: 'Fort Lauderdale', state: 'FL', is_available: true, phone: '(555) 234-5678', email: 'maria.garcia@email.com', service_area_radius: 40, company_name: 'Garcia Plumbing', jobs_completed: 124 },
  { id: '3', full_name: 'James Wilson', trade_needed: 'Electrical', average_rating: 4.2, coi_state: 'CA', city: 'Tampa', state: 'FL', is_available: false, phone: '(555) 345-6789', email: 'james.wilson@email.com', service_area_radius: 35, company_name: 'Wilson Electric', jobs_completed: 56 },
  // Add mock technicians from the mock-supabase module
  ...MOCK_TECHNICIANS.map((t) => ({
    id: t.id,
    full_name: t.full_name,
    trade_needed: t.trade_needed,
    average_rating: t.rating || 4.5,
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
    { id: 'lic-1', license_type: 'HVAC Contractor', license_number: 'FL-HVAC-12345', license_state: 'FL', expiry_date: '2025-12-31' },
    { id: 'lic-2', license_type: 'EPA 608 Universal', license_number: 'EPA-608-67890', license_state: 'Federal', expiry_date: '2026-06-30' }
  ],
  '2': [
    { id: 'lic-3', license_type: 'Plumbing Contractor', license_number: 'FL-PLB-23456', license_state: 'FL', expiry_date: '2025-08-15' }
  ],
  '3': [
    { id: 'lic-4', license_type: 'Electrical Contractor', license_number: 'FL-ELC-34567', license_state: 'FL', expiry_date: '2025-11-20' },
    { id: 'lic-5', license_type: 'Low Voltage', license_number: 'FL-LV-45678', license_state: 'FL', expiry_date: '2026-03-01' }
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
    { id: 'ins-4', type: 'general_liability', expirationDate: '2024-11-30' }
  ]
};

interface Insurance {
  id: string;
  type: 'general_liability' | 'workers_comp';
  expirationDate: string;
}

interface ContractorProfileOverlayProps {
  contractorId: string;
  onClose: () => void;
  onAssign?: (contractorId: string) => void;
  jobDate?: Date;
}

function getCoiStatus(insurance: Insurance[] | undefined, jobDate?: Date): 'expired' | 'expiring_soon' | 'valid' | 'missing' {
  if (!insurance || insurance.length === 0) return 'missing';
  const generalLiability = insurance.find(ins => ins.type === 'general_liability');
  if (!generalLiability || !generalLiability.expirationDate) return 'missing';
  const expirationDate = new Date(generalLiability.expirationDate);
  const now = new Date();
  const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiration < 0) return 'expired';
  if (jobDate) {
    const daysUntilJob = Math.floor((jobDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiration < daysUntilJob) return 'expiring_soon';
  } else {
    if (daysUntilExpiration < 30) return 'expiring_soon';
  }
  return 'valid';
}

export default function ContractorProfileOverlay({ contractorId, onClose, onAssign, jobDate }: ContractorProfileOverlayProps) {
  const [contractor, setContractor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    setLoading(true);

    // In mock mode, use mock data directly
    if (isMockMode() || process.env.NODE_ENV === 'development') {
      const mockContractor = mockContractors.find(t => t.id === contractorId);
      if (mockContractor) {
        setContractor({
          ...mockContractor,
          technician_licenses: mockLicenses[contractorId] || [],
          certifications: mockContractor.certifications || [],
          insurance: mockInsurance[contractorId] || [],
          job_assignments: []
        });
      } else {
        setContractor(null);
      }
      setLoading(false);
      return;
    }

    supabase
      .from('technicians')
      .select('*')
      .eq('id', contractorId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          const mockContractor = mockContractors.find(t => t.id === contractorId);
          if (mockContractor) {
            setContractor({
              ...mockContractor,
              technician_licenses: mockLicenses[contractorId] || [],
              certifications: [],
              insurance: mockInsurance[contractorId] || [],
              job_assignments: []
            });
          } else {
            setContractor(null);
          }
        } else {
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

  const coiStatus = contractor ? getCoiStatus(contractor.insurance, jobDate) : 'missing';

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'C';
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
          <div className="modal-body" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: 'var(--ds-space-10)'
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
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
          <div className="modal-header modal-header-sidebar-style">
            <h2 className="modal-title">Contractor Not Found</h2>
            <button onClick={onClose} className="modal-close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="modal-body" style={{ textAlign: 'center', padding: 'var(--ds-space-8)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ds-text-tertiary)" strokeWidth="1.5" style={{ marginBottom: 'var(--ds-space-4)' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ color: 'var(--ds-text-secondary)' }}>
              The contractor you're looking for doesn't exist or has been removed.
            </p>
          </div>
          <div className="modal-footer modal-footer-sidebar-style">
            <button onClick={onClose} className="btn btn-primary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header modal-header-sidebar-style">
          <h2 className="modal-title">Contractor Profile</h2>
          <button onClick={onClose} className="modal-close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Profile Header */}
          <div style={{ display: 'flex', gap: 'var(--ds-space-5)', marginBottom: 'var(--ds-space-6)', alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: 'var(--ds-radius-full)',
              background: contractor.profile_picture_url
                ? `url(${contractor.profile_picture_url}) center/cover no-repeat`
                : 'var(--ds-accent-primary-light)',
              border: '2px solid var(--ds-border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'var(--ds-font-bold)',
              color: 'var(--ds-accent-primary)',
              flexShrink: 0
            }}>
              {!contractor.profile_picture_url && getInitials(contractor.full_name)}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)', marginBottom: 'var(--ds-space-1)', flexWrap: 'wrap' }}>
                <h3 style={{ 
                  fontSize: 'var(--ds-text-xl)', 
                  fontWeight: 'var(--ds-font-bold)',
                  color: 'var(--ds-text-primary)',
                  margin: 0
                }}>
                  {contractor.full_name}
                </h3>
                <span className={`badge ${contractor.is_available ? 'badge-success' : 'badge-default'}`}>
                  {contractor.is_available ? 'Available' : 'Unavailable'}
                </span>
                <span className={`badge ${coiStatus === 'valid' ? 'badge-success' : coiStatus === 'expiring_soon' ? 'badge-warning' : 'badge-error'}`}>
                  {coiStatus === 'valid' ? 'COI Valid' : coiStatus === 'expiring_soon' ? 'COI Expiring' : coiStatus === 'expired' ? 'COI Expired' : 'No COI'}
                </span>
              </div>
              
              {contractor.company_name && (
                <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)', marginBottom: '4px' }}>
                  {contractor.company_name}
                </p>
              )}
              
              <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-tertiary)', margin: 0 }}>
                {contractor.trade_needed} • {contractor.city}, {contractor.state}
              </p>

              {/* Stats */}
              <div style={{ 
                display: 'flex', 
                gap: 'var(--ds-space-5)', 
                marginTop: 'var(--ds-space-3)',
                paddingTop: 'var(--ds-space-3)',
                borderTop: '1px solid var(--ds-border-subtle)'
              }}>
                {contractor.average_rating && (
                  <div>
                    <div style={{ fontSize: 'var(--ds-text-lg)', fontWeight: 'var(--ds-font-bold)', color: 'var(--ds-success)' }}>
                      {contractor.average_rating.toFixed(1)}
                    </div>
                    <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', textTransform: 'uppercase' }}>Rating</div>
                  </div>
                )}
                {contractor.jobs_completed !== undefined && (
                  <div>
                    <div style={{ fontSize: 'var(--ds-text-lg)', fontWeight: 'var(--ds-font-bold)', color: 'var(--ds-text-primary)' }}>
                      {contractor.jobs_completed}
                    </div>
                    <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', textTransform: 'uppercase' }}>Jobs</div>
                  </div>
                )}
                {contractor.service_area_radius && (
                  <div>
                    <div style={{ fontSize: 'var(--ds-text-lg)', fontWeight: 'var(--ds-font-bold)', color: 'var(--ds-text-primary)' }}>
                      {contractor.service_area_radius}mi
                    </div>
                    <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', textTransform: 'uppercase' }}>Radius</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compliance Score */}
          <div style={{
            background: 'var(--ds-bg-muted)',
            border: '1px solid var(--ds-border-default)',
            borderRadius: 'var(--ds-radius-lg)',
            padding: 'var(--ds-space-4)',
            marginBottom: 'var(--ds-space-5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Compliance Score
                </div>
                <div style={{ fontSize: 'var(--ds-text-2xl)', fontWeight: 'var(--ds-font-bold)', color: 'var(--ds-text-primary)' }}>
                  {calculateComplianceScore(contractor, jobDate)}%
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--ds-radius-full)',
                background: 'var(--ds-success-bg)',
                color: 'var(--ds-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--ds-text-lg)',
                fontWeight: 'var(--ds-font-bold)'
              }}>
                {getComplianceGrade(calculateComplianceScore(contractor, jobDate))}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="form-section" style={{ marginBottom: 'var(--ds-space-5)' }}>
            <h4 className="form-section-title">Contact Information</h4>
            <div style={{ display: 'grid', gap: 'var(--ds-space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: 'var(--ds-radius-md)',
                  background: 'var(--ds-bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ds-text-secondary)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)' }}>Phone</div>
                  <div style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-primary)', fontWeight: 'var(--ds-font-medium)' }}>
                    {contractor.phone || 'Not provided'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: 'var(--ds-radius-md)',
                  background: 'var(--ds-bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ds-text-secondary)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)' }}>Email</div>
                  <div style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-primary)', fontWeight: 'var(--ds-font-medium)' }}>
                    {contractor.email || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="form-section" style={{ marginBottom: 'var(--ds-space-5)' }}>
            <h4 className="form-section-title">Insurance & COI</h4>
            {(contractor.insurance ?? []).length === 0 ? (
              <div style={{ padding: 'var(--ds-space-4)', textAlign: 'center', color: 'var(--ds-text-tertiary)', fontSize: 'var(--ds-text-sm)' }}>
                No insurance on file
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-2)' }}>
                {(contractor.insurance ?? []).map((ins: Insurance) => {
                  const expirationDate = new Date(ins.expirationDate);
                  const now = new Date();
                  const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const isExpired = daysUntilExpiration < 0;
                  const isExpiringSoon = daysUntilExpiration >= 0 && daysUntilExpiration < 30;

                  return (
                    <div key={ins.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: 'var(--ds-space-3)', background: 'var(--ds-bg-muted)', borderRadius: 'var(--ds-radius-md)'
                    }}>
                      <div>
                        <div style={{ fontSize: 'var(--ds-text-sm)', fontWeight: 'var(--ds-font-medium)', color: 'var(--ds-text-primary)' }}>
                          {ins.type === 'general_liability' ? 'General Liability' : 'Workers Compensation'}
                        </div>
                        <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)' }}>
                          Expires: {expirationDate.toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`badge ${isExpired ? 'badge-error' : isExpiringSoon ? 'badge-warning' : 'badge-success'}`}>
                        {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Valid'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Licenses */}
          <div className="form-section">
            <h4 className="form-section-title">Licenses</h4>
            {(contractor.technician_licenses ?? []).length === 0 ? (
              <div style={{ padding: 'var(--ds-space-4)', textAlign: 'center', color: 'var(--ds-text-tertiary)', fontSize: 'var(--ds-text-sm)' }}>
                No licenses on file
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-2)' }}>
                {(contractor.technician_licenses ?? []).map((l: any) => (
                  <div key={l.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: 'var(--ds-space-3)', background: 'var(--ds-bg-muted)', borderRadius: 'var(--ds-radius-md)'
                  }}>
                    <div>
                      <div style={{ fontSize: 'var(--ds-text-sm)', fontWeight: 'var(--ds-font-medium)', color: 'var(--ds-text-primary)' }}>
                        {l.license_type}
                      </div>
                      <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)' }}>
                        {l.license_number}
                      </div>
                    </div>
                    <span className="badge badge-default">{l.license_state}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer modal-footer-sidebar-style">
          <button onClick={onClose} className="btn btn-secondary">Close</button>
          {onAssign && (
            <button onClick={() => onAssign(contractorId)} className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Assign to Job
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
