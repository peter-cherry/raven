'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';

interface ComplianceTemplate {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  is_builtin: boolean;
  gl_amount: number;
  auto_amount: number;
  wc_amount: number;
  el_amount: number;
  cpl_amount: number;
  additional_insured: boolean;
  waiver_of_subrogation: boolean;
  primary_non_contributory: boolean;
  min_days_to_expiry: number;
  show_in_quick?: boolean;
}

// Default templates
const DEFAULT_TEMPLATES: Omit<ComplianceTemplate, 'id' | 'org_id'>[] = [
  {
    name: 'Standard',
    description: 'Recommended for general HVAC, plumbing, and electrical work',
    is_builtin: true,
    gl_amount: 1000000,
    auto_amount: 1000000,
    wc_amount: 1000000,
    el_amount: 1000000,
    cpl_amount: 500000,
    additional_insured: true,
    waiver_of_subrogation: true,
    primary_non_contributory: false,
    min_days_to_expiry: 30,
  },
  {
    name: 'High-Risk',
    description: 'For commercial projects and high-value properties',
    is_builtin: true,
    gl_amount: 2000000,
    auto_amount: 2000000,
    wc_amount: 1000000,
    el_amount: 2000000,
    cpl_amount: 1000000,
    additional_insured: true,
    waiver_of_subrogation: true,
    primary_non_contributory: true,
    min_days_to_expiry: 30,
  },
  {
    name: 'Basic',
    description: 'Minimum requirements for residential work',
    is_builtin: true,
    gl_amount: 500000,
    auto_amount: 500000,
    wc_amount: 500000,
    el_amount: 500000,
    cpl_amount: 250000,
    additional_insured: false,
    waiver_of_subrogation: false,
    primary_non_contributory: false,
    min_days_to_expiry: 30,
  },
];

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

export default function PoliciesPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [templates, setTemplates] = useState<ComplianceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ComplianceTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gl_amount: '1000000',
    auto_amount: '1000000',
    wc_amount: '1000000',
    el_amount: '1000000',
    cpl_amount: '500000',
    additional_insured: true,
    waiver_of_subrogation: true,
    primary_non_contributory: false,
    min_days_to_expiry: '30',
  });

  // Redirect if not authenticated (skip in mock mode)
  useEffect(() => {
    const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
    if (!user && !isMockMode) {
      router.push('/login?returnUrl=/policies');
    }
  }, [user, router]);

  // Get org_id
  useEffect(() => {
    const getOrgId = async () => {
      if (!user) return;

      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
        setOrgId('152ca2e3-a371-4167-99c5-0890afcd83d7');
        setLoading(false);
        return;
      }

      const { data: membership } = await supabase
        .from('org_memberships')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (membership?.org_id) {
        setOrgId(membership.org_id);
      }
      setLoading(false);
    };
    getOrgId();
  }, [user]);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!orgId) return;

      try {
        const { data, error } = await supabase
          .from('compliance_templates')
          .select('*')
          .eq('org_id', orgId)
          .order('is_builtin', { ascending: false })
          .order('name');

        if (!error && data && data.length > 0) {
          setTemplates(data);
        } else {
          // Use default templates
          setTemplates(DEFAULT_TEMPLATES.map((t, i) => ({
            ...t,
            id: `default-${i}`,
            org_id: orgId,
            show_in_quick: true
          })));
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    fetchTemplates();
  }, [orgId]);

  // Get risk level badge
  const getRiskLevel = (template: ComplianceTemplate | Omit<ComplianceTemplate, 'id' | 'org_id'>) => {
    const total = template.gl_amount + template.auto_amount + template.wc_amount;
    if (total >= 4000000) return { label: 'High Coverage', class: 'badge-error' };
    if (total >= 2500000) return { label: 'Standard Coverage', class: 'badge-warning' };
    return { label: 'Basic Coverage', class: 'badge-default' };
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      gl_amount: '1000000',
      auto_amount: '1000000',
      wc_amount: '1000000',
      el_amount: '1000000',
      cpl_amount: '500000',
      additional_insured: true,
      waiver_of_subrogation: true,
      primary_non_contributory: false,
      min_days_to_expiry: '30',
    });
  };

  // Create template
  const handleCreateTemplate = async () => {
    if (!formData.name.trim() || !orgId) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('compliance_templates')
        .insert({
          org_id: orgId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_builtin: false,
          gl_amount: parseInt(formData.gl_amount) || 1000000,
          auto_amount: parseInt(formData.auto_amount) || 1000000,
          wc_amount: parseInt(formData.wc_amount) || 1000000,
          el_amount: parseInt(formData.el_amount) || 1000000,
          cpl_amount: parseInt(formData.cpl_amount) || 500000,
          additional_insured: formData.additional_insured,
          waiver_of_subrogation: formData.waiver_of_subrogation,
          primary_non_contributory: formData.primary_non_contributory,
          min_days_to_expiry: parseInt(formData.min_days_to_expiry) || 30,
          show_in_quick: true
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTemplates(prev => [...prev, data]);
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create policy template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
  if (!user && !isMockMode) return null;

  return (
    <main className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-info">
            <h1 className="page-header-title">Compliance Policies</h1>
            <p className="page-header-description">
              Define and manage insurance requirements for technicians on work orders
            </p>
          </div>
          <div className="page-header-actions">
            <Link href="/settings/coi" className="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              COI Settings
            </Link>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Policy
            </button>
          </div>
        </div>
      </div>

      {/* Policy Templates Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
        gap: 'var(--ds-space-5)' 
      }}>
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card" style={{ opacity: 0.5 }}>
              <div className="card-body">
                <div style={{ height: '24px', background: 'var(--ds-bg-elevated)', borderRadius: '4px', width: '60%', marginBottom: '12px' }} />
                <div style={{ height: '16px', background: 'var(--ds-bg-elevated)', borderRadius: '4px', width: '90%' }} />
              </div>
            </div>
          ))
        ) : templates.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <h3 className="empty-state-title">No compliance policies yet</h3>
              <p className="empty-state-description">
                Create a policy template to define insurance requirements for your technicians
              </p>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                Create Policy
              </button>
            </div>
          </div>
        ) : (
          templates.map((template) => {
            const risk = getRiskLevel(template);
            return (
              <div 
                key={template.id} 
                className="card"
                style={{ cursor: 'pointer', transition: 'all var(--ds-transition-base)' }}
                onClick={() => setSelectedTemplate(template)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--ds-shadow-elevated)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.transform = '';
                }}
              >
                <div className="card-header">
                  <div>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                      {template.name}
                      {template.is_builtin && (
                        <span style={{ 
                          fontSize: '10px', 
                          background: 'var(--ds-accent-primary-light)', 
                          color: 'var(--ds-accent-primary)', 
                          padding: '2px 6px', 
                          borderRadius: 'var(--ds-radius-full)' 
                        }}>
                          Built-in
                        </span>
                      )}
                    </h3>
                    <p className="card-description">{template.description}</p>
                  </div>
                  <span className={`badge ${risk.class}`}>{risk.label}</span>
                </div>
                <div className="card-body">
                  {/* Coverage amounts */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--ds-space-4)' }}>
                    <div>
                      <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', marginBottom: '4px' }}>
                        General Liability
                      </div>
                      <div style={{ fontSize: 'var(--ds-text-md)', fontWeight: 'var(--ds-font-semibold)', color: 'var(--ds-text-primary)' }}>
                        {formatCurrency(template.gl_amount)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', marginBottom: '4px' }}>
                        Auto Liability
                      </div>
                      <div style={{ fontSize: 'var(--ds-text-md)', fontWeight: 'var(--ds-font-semibold)', color: 'var(--ds-text-primary)' }}>
                        {formatCurrency(template.auto_amount)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', marginBottom: '4px' }}>
                        Workers Comp
                      </div>
                      <div style={{ fontSize: 'var(--ds-text-md)', fontWeight: 'var(--ds-font-semibold)', color: 'var(--ds-text-primary)' }}>
                        {formatCurrency(template.wc_amount)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', marginBottom: '4px' }}>
                        Employers Liability
                      </div>
                      <div style={{ fontSize: 'var(--ds-text-md)', fontWeight: 'var(--ds-font-semibold)', color: 'var(--ds-text-primary)' }}>
                        {formatCurrency(template.el_amount)}
                      </div>
                    </div>
                  </div>

                  {/* Endorsements */}
                  <div style={{ marginTop: 'var(--ds-space-5)', paddingTop: 'var(--ds-space-4)', borderTop: '1px solid var(--ds-border-subtle)' }}>
                    <div style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)', marginBottom: 'var(--ds-space-2)' }}>
                      ENDORSEMENTS
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ds-space-2)' }}>
                      {template.additional_insured && (
                        <span className="badge badge-success">Additional Insured</span>
                      )}
                      {template.waiver_of_subrogation && (
                        <span className="badge badge-success">Waiver of Subrogation</span>
                      )}
                      {template.primary_non_contributory && (
                        <span className="badge badge-success">Primary & Non-Contributory</span>
                      )}
                      {!template.additional_insured && !template.waiver_of_subrogation && !template.primary_non_contributory && (
                        <span className="badge badge-default">No endorsements required</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <span style={{ fontSize: 'var(--ds-text-xs)', color: 'var(--ds-text-tertiary)' }}>
                    Min. {template.min_days_to_expiry} days before expiry
                  </span>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/?policy=${template.id}&create=true`);
                    }}
                  >
                    Use Template
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Policy Detail Panel */}
      {selectedTemplate && (
        <>
          <div 
            className="panel-overlay" 
            onClick={() => setSelectedTemplate(null)}
          />
          <div className="panel panel--lg">
            <div className="panel-header">
              <h2 className="panel-title">{selectedTemplate.name}</h2>
              <button 
                className="modal-close"
                onClick={() => setSelectedTemplate(null)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="panel-body">
              <p style={{ color: 'var(--ds-text-secondary)', marginBottom: 'var(--ds-space-6)' }}>
                {selectedTemplate.description}
              </p>

              {/* Coverage Details */}
              <div style={{ marginBottom: 'var(--ds-space-8)' }}>
                <h3 style={{ fontSize: 'var(--ds-text-md)', fontWeight: 'var(--ds-font-semibold)', marginBottom: 'var(--ds-space-4)' }}>
                  Insurance Coverage Requirements
                </h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Coverage Type</th>
                        <th>Minimum Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>General Liability (GL)</td>
                        <td style={{ fontWeight: 'var(--ds-font-semibold)' }}>{formatCurrency(selectedTemplate.gl_amount)}</td>
                      </tr>
                      <tr>
                        <td>Auto Liability</td>
                        <td style={{ fontWeight: 'var(--ds-font-semibold)' }}>{formatCurrency(selectedTemplate.auto_amount)}</td>
                      </tr>
                      <tr>
                        <td>Workers Compensation</td>
                        <td style={{ fontWeight: 'var(--ds-font-semibold)' }}>{formatCurrency(selectedTemplate.wc_amount)}</td>
                      </tr>
                      <tr>
                        <td>Employers Liability</td>
                        <td style={{ fontWeight: 'var(--ds-font-semibold)' }}>{formatCurrency(selectedTemplate.el_amount)}</td>
                      </tr>
                      <tr>
                        <td>Contractor's Pollution Liability</td>
                        <td style={{ fontWeight: 'var(--ds-font-semibold)' }}>{formatCurrency(selectedTemplate.cpl_amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Endorsement Requirements */}
              <div>
                <h3 style={{ fontSize: 'var(--ds-text-md)', fontWeight: 'var(--ds-font-semibold)', marginBottom: 'var(--ds-space-4)' }}>
                  Endorsement Requirements
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-3)' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: 'var(--ds-space-3) var(--ds-space-4)',
                    background: 'var(--ds-bg-muted)',
                    borderRadius: 'var(--ds-radius-lg)'
                  }}>
                    <span>Additional Insured</span>
                    <span className={`badge ${selectedTemplate.additional_insured ? 'badge-success' : 'badge-default'}`}>
                      {selectedTemplate.additional_insured ? 'Required' : 'Not Required'}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: 'var(--ds-space-3) var(--ds-space-4)',
                    background: 'var(--ds-bg-muted)',
                    borderRadius: 'var(--ds-radius-lg)'
                  }}>
                    <span>Waiver of Subrogation</span>
                    <span className={`badge ${selectedTemplate.waiver_of_subrogation ? 'badge-success' : 'badge-default'}`}>
                      {selectedTemplate.waiver_of_subrogation ? 'Required' : 'Not Required'}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: 'var(--ds-space-3) var(--ds-space-4)',
                    background: 'var(--ds-bg-muted)',
                    borderRadius: 'var(--ds-radius-lg)'
                  }}>
                    <span>Primary & Non-Contributory</span>
                    <span className={`badge ${selectedTemplate.primary_non_contributory ? 'badge-success' : 'badge-default'}`}>
                      {selectedTemplate.primary_non_contributory ? 'Required' : 'Not Required'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="panel-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedTemplate(null)}
              >
                Close
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => router.push(`/?policy=${selectedTemplate.id}&create=true`)}
              >
                Create Job with Policy
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Policy Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header modal-header-sidebar-style">
              <h2 className="modal-title">Create Custom Policy</h2>
              <button onClick={() => setShowCreateModal(false)} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-secondary)', marginBottom: 'var(--ds-space-6)' }}>
                Define custom insurance requirements for your work orders.
              </p>

              {/* Template Info */}
              <div className="form-section">
                <h3 className="form-section-title">Template Details</h3>
                <div className="form-grid-col-1">
                  <div className="form-field">
                    <label className="form-label">Policy Name *</label>
                    <input
                      type="text"
                      className="text-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Commercial HVAC High-Rise"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Description</label>
                    <textarea
                      className="textarea-input"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description of when to use this policy"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Coverage Amounts */}
              <div className="form-section">
                <h3 className="form-section-title">Coverage Amounts</h3>
                <div className="form-grid-col-2">
                  <div className="form-field">
                    <label className="form-label">General Liability (GL)</label>
                    <div className="input-with-addon">
                      <span className="input-addon">$</span>
                      <input
                        type="text"
                        className="text-input"
                        value={formData.gl_amount}
                        onChange={(e) => setFormData({ ...formData, gl_amount: e.target.value.replace(/[^0-9]/g, '') })}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Auto Liability</label>
                    <div className="input-with-addon">
                      <span className="input-addon">$</span>
                      <input
                        type="text"
                        className="text-input"
                        value={formData.auto_amount}
                        onChange={(e) => setFormData({ ...formData, auto_amount: e.target.value.replace(/[^0-9]/g, '') })}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Workers Compensation</label>
                    <div className="input-with-addon">
                      <span className="input-addon">$</span>
                      <input
                        type="text"
                        className="text-input"
                        value={formData.wc_amount}
                        onChange={(e) => setFormData({ ...formData, wc_amount: e.target.value.replace(/[^0-9]/g, '') })}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Employers Liability</label>
                    <div className="input-with-addon">
                      <span className="input-addon">$</span>
                      <input
                        type="text"
                        className="text-input"
                        value={formData.el_amount}
                        onChange={(e) => setFormData({ ...formData, el_amount: e.target.value.replace(/[^0-9]/g, '') })}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Contractor's Pollution Liability</label>
                    <div className="input-with-addon">
                      <span className="input-addon">$</span>
                      <input
                        type="text"
                        className="text-input"
                        value={formData.cpl_amount}
                        onChange={(e) => setFormData({ ...formData, cpl_amount: e.target.value.replace(/[^0-9]/g, '') })}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Min Days to Expiry</label>
                    <input
                      type="number"
                      className="text-input"
                      value={formData.min_days_to_expiry}
                      onChange={(e) => setFormData({ ...formData, min_days_to_expiry: e.target.value })}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Endorsements */}
              <div className="form-section">
                <h3 className="form-section-title">Required Endorsements</h3>
                <div className="form-grid-col-1">
                  <label className="checkbox-card">
                    <input
                      type="checkbox"
                      checked={formData.additional_insured}
                      onChange={(e) => setFormData({ ...formData, additional_insured: e.target.checked })}
                    />
                    <span>Additional Insured</span>
                  </label>

                  <label className="checkbox-card">
                    <input
                      type="checkbox"
                      checked={formData.waiver_of_subrogation}
                      onChange={(e) => setFormData({ ...formData, waiver_of_subrogation: e.target.checked })}
                    />
                    <span>Waiver of Subrogation</span>
                  </label>

                  <label className="checkbox-card">
                    <input
                      type="checkbox"
                      checked={formData.primary_non_contributory}
                      onChange={(e) => setFormData({ ...formData, primary_non_contributory: e.target.checked })}
                    />
                    <span>Primary and Non-Contributory</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer modal-footer-sidebar-style">
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="btn btn-primary"
                disabled={saving || !formData.name.trim()}
              >
                {saving ? 'Creating...' : 'Create Policy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
