'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createDraftPolicy, ComplianceState } from '@/lib/compliance';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import { CloseButton } from '@/components/CloseButton';

interface ComplianceOverlayProps {
  onClose: () => void;
  initialTemplate?: ComplianceTemplate;
  onEditTemplate?: (template: ComplianceTemplate) => void;
  coiSettingsMode?: boolean; // When true, hides Quick Start Templates and State License (COI-only view)
  onApplyPolicy?: (policyId: string, jobId: string) => void; // Callback with both policy and job IDs
  complianceState?: ComplianceState; // For bidirectional sync with QuickCompliance
  onComplianceStateChange?: (state: ComplianceState) => void; // Notify parent of changes
}

// Template interface matching database schema
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

// Default templates (fallback if no DB templates exist)
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

export default function ComplianceOverlay({ onClose, initialTemplate, onEditTemplate, coiSettingsMode = false, onApplyPolicy, complianceState, onComplianceStateChange }: ComplianceOverlayProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Templates from database
  const [templates, setTemplates] = useState<ComplianceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(initialTemplate?.id || null);

  // Current template being viewed (for edit button)
  const [currentTemplate, setCurrentTemplate] = useState<ComplianceTemplate | null>(initialTemplate || null);

  // Main requirements - initialize from complianceState if provided
  const [stateLicenseRequired, setStateLicenseRequired] = useState(complianceState?.stateLicenseRequired ?? true);
  const [coiRequired, setCoiRequired] = useState(complianceState?.coiRequired ?? false);

  // Confirmation
  const [confirmed, setConfirmed] = useState(false);

  // Insurance coverage amounts - initialize from complianceState if provided
  const [glAmount, setGlAmount] = useState((complianceState?.glAmount ?? 1000000).toString());
  const [aitoAmount, setAitoAmount] = useState((complianceState?.autoAmount ?? 1000000).toString());
  const [wcAmount, setWcAmount] = useState((complianceState?.wcAmount ?? 1000000).toString());
  const [elAmount, setElAmount] = useState((complianceState?.elAmount ?? 1000000).toString());
  const [cplAmount, setCplAmount] = useState((complianceState?.cplAmount ?? 500000).toString());

  // Endorsements - initialize from complianceState if provided
  const [additionalInsured, setAdditionalInsured] = useState(complianceState?.additionalInsured ?? true);
  const [waiverOfSubrogation, setWaiverOfSubrogation] = useState(complianceState?.waiverOfSubrogation ?? true);
  const [primaryNonContributory, setPrimaryNonContributory] = useState(complianceState?.primaryNonContributory ?? false);

  // Expiry - initialize from complianceState if provided
  const [minDaysToExpiry, setMinDaysToExpiry] = useState((complianceState?.minDaysToExpiry ?? 30).toString());

  // Helper to sync state changes back to parent
  const syncToParent = (updates: Partial<ComplianceState>) => {
    if (onComplianceStateChange) {
      onComplianceStateChange({
        stateLicenseRequired,
        coiRequired,
        glAmount: parseInt(glAmount) || 1000000,
        autoAmount: parseInt(aitoAmount) || 1000000,
        wcAmount: parseInt(wcAmount) || 1000000,
        elAmount: parseInt(elAmount) || 1000000,
        cplAmount: parseInt(cplAmount) || 500000,
        additionalInsured,
        waiverOfSubrogation,
        primaryNonContributory,
        minDaysToExpiry: parseInt(minDaysToExpiry) || 30,
        ...updates,
      });
    }
  };

  // Sync state changes back to parent whenever local state changes
  useEffect(() => {
    syncToParent({});
  }, [stateLicenseRequired, coiRequired, glAmount, aitoAmount, wcAmount, elAmount, cplAmount, additionalInsured, waiverOfSubrogation, primaryNonContributory, minDaysToExpiry]);

  // Apply template function
  const applyTemplate = (template: ComplianceTemplate | Omit<ComplianceTemplate, 'id' | 'org_id'>) => {
    setGlAmount(template.gl_amount.toString());
    setAitoAmount(template.auto_amount.toString());
    setWcAmount(template.wc_amount.toString());
    setElAmount(template.el_amount.toString());
    setCplAmount(template.cpl_amount.toString());
    setAdditionalInsured(template.additional_insured);
    setWaiverOfSubrogation(template.waiver_of_subrogation);
    setPrimaryNonContributory(template.primary_non_contributory);
    setMinDaysToExpiry(template.min_days_to_expiry.toString());
    setCoiRequired(true); // Enable COI when template is selected
    if ('id' in template) {
      setSelectedTemplate(template.id);
      setCurrentTemplate(template as ComplianceTemplate);
    }
  };

  // Apply initial template on mount
  useEffect(() => {
    if (initialTemplate) {
      applyTemplate(initialTemplate);
    }
  }, []);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    const getOrgId = async () => {
      if (!user) return;

      // Development mode - use hardcoded org_id since fake user doesn't have real Supabase session
      if (process.env.NODE_ENV === 'development' && user.id === '00000000-0000-0000-0000-000000000001') {
        console.log('[ComplianceOverlay] Dev mode: using hardcoded org_id');
        setOrgId('152ca2e3-a371-4167-99c5-0890afcd83d7');
        return;
      }

      const { data: membership, error } = await supabase
        .from('org_memberships')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('[ComplianceOverlay] Error fetching org_id:', error);
      }

      if (membership?.org_id) {
        setOrgId(membership.org_id);
      } else {
        try {
          const orgResponse = await fetch('/api/organizations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              userEmail: user.email
            })
          });

          if (orgResponse.ok) {
            const orgData = await orgResponse.json();
            setOrgId(orgData.orgId);
          }
        } catch (error) {
          console.error('Failed to create organization:', error);
        }
      }
    };
    getOrgId();
  }, [user]);

  // Fetch templates from database
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

        if (error) {
          console.error('Error fetching templates:', error);
          return;
        }

        if (data && data.length > 0) {
          setTemplates(data);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    fetchTemplates();
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId) return;
    try {
      setSaving(true);
      // Create policy with all insurance requirements
      const items = [
        stateLicenseRequired && { requirement_type: 'LICENSE_STATE', required: true, weight: 50, min_valid_days: 0 },
        coiRequired && { requirement_type: 'GL_COVERAGE', required: true, weight: 20, min_valid_days: parseInt(minDaysToExpiry), metadata: { amount: parseInt(glAmount) } },
        coiRequired && { requirement_type: 'AUTO_COVERAGE', required: true, weight: 20, min_valid_days: parseInt(minDaysToExpiry), metadata: { amount: parseInt(aitoAmount) } },
        coiRequired && { requirement_type: 'WC_COVERAGE', required: true, weight: 20, min_valid_days: parseInt(minDaysToExpiry), metadata: { amount: parseInt(wcAmount) } },
        coiRequired && { requirement_type: 'EL_COVERAGE', required: true, weight: 15, min_valid_days: parseInt(minDaysToExpiry), metadata: { amount: parseInt(elAmount) } },
        coiRequired && { requirement_type: 'CPL_COVERAGE', required: true, weight: 15, min_valid_days: parseInt(minDaysToExpiry), metadata: { amount: parseInt(cplAmount) } },
        coiRequired && additionalInsured && { requirement_type: 'ENDORSEMENT_ADDITIONAL_INSURED', required: true, weight: 3, min_valid_days: 0 },
        coiRequired && waiverOfSubrogation && { requirement_type: 'ENDORSEMENT_WAIVER_SUBROGATION', required: true, weight: 3, min_valid_days: 0 },
        coiRequired && primaryNonContributory && { requirement_type: 'ENDORSEMENT_PRIMARY_NONCONTRIBUTORY', required: true, weight: 4, min_valid_days: 0 },
      ].filter(Boolean) as any[];

      const policyId = await createDraftPolicy(orgId, items);

      // Create empty job with policy attached
      const jobResponse = await fetch('/api/jobs/create-empty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, policy_id: policyId }),
      });

      if (!jobResponse.ok) {
        console.error('[ComplianceOverlay] Failed to create empty job');
        return;
      }

      const { job_id } = await jobResponse.json();

      onClose();
      // Use callback if provided, otherwise fall back to page navigation
      if (onApplyPolicy) {
        onApplyPolicy(policyId, job_id);
      } else {
        window.location.href = `/jobs/create?policy_id=${policyId}&job_id=${job_id}`;
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Modal Overlay Background - Original dark overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="policy-modal-overlay"
        onClick={onClose}
        style={{ zIndex: 10002, background: 'transparent', pointerEvents: 'auto' } as React.CSSProperties}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="policy-modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: 540,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(47, 47, 47, 0.3)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            filter: 'brightness(1.15)',
            border: '1px solid rgba(154, 150, 213, 0.3)',
            borderRadius: 'var(--modal-border-radius)',
            overflow: 'hidden'
          }}
        >
          {/* Close Button - Top Right */}
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
            <CloseButton onClick={onClose} />
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{
                  margin: 0,
                  fontSize: 'var(--font-section-title-size)',
                  fontWeight: 'var(--font-section-title-weight)',
                  fontFamily: 'var(--font-section-title)',
                  color: 'var(--text-primary)'
                }}>{currentTemplate ? currentTemplate.name : 'Compliance Policies'}</h2>
                {/* Edit icon - only show when viewing a template */}
                {currentTemplate && onEditTemplate && (
                  <button
                    onClick={() => onEditTemplate(currentTemplate)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.7,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                    title="Edit template"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                )}
              </div>
              {/* Settings gear icon - navigate to /settings/coi */}
              <button
                onClick={() => {
                  onClose();
                  window.location.href = '/settings/coi';
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.7,
                  transition: 'opacity 0.2s',
                  marginRight: currentTemplate ? 12 : 54,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                title="COI Settings"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>

              {/* Toggle for Quick Compliance - only show when viewing a template */}
              {currentTemplate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 54 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Quick</span>
                  <button
                    onClick={async () => {
                      if (!currentTemplate) return;
                      const newValue = !currentTemplate.show_in_quick;
                      try {
                        const { error } = await supabase
                          .from('compliance_templates')
                          .update({ show_in_quick: newValue })
                          .eq('id', currentTemplate.id);
                        if (!error) {
                          setCurrentTemplate({ ...currentTemplate, show_in_quick: newValue });
                          setTemplates(prev => prev.map(t =>
                            t.id === currentTemplate.id ? { ...t, show_in_quick: newValue } : t
                          ));
                        }
                      } catch (e) {
                        console.error('Failed to toggle quick status:', e);
                      }
                    }}
                    title="Add to Quick Compliance settings"
                    style={{
                      width: 36,
                      height: 20,
                      borderRadius: 10,
                      border: 'none',
                      background: currentTemplate.show_in_quick ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 2,
                      left: currentTemplate.show_in_quick ? 18 : 2,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: 'white',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }} />
                  </button>
                </div>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
              Configure compliance requirements for technicians on work orders
            </p>

            {/* Preset Templates - hidden in COI settings mode */}
            {!coiSettingsMode && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{
                fontSize: 'var(--font-xl)',
                fontWeight: 600,
                marginBottom: 12,
                fontFamily: 'var(--font-text-body)',
                color: 'var(--text-primary)'
              }}>Quick Start Templates</h3>
              <p style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--text-secondary)',
                marginBottom: 16,
                fontFamily: 'var(--font-text-body)'
              }}>
                Choose a template to auto-fill insurance requirements
              </p>
              <div className="quick-templates-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {/* Show DB templates if available, otherwise show defaults */}
                {(templates.length > 0 ? templates : DEFAULT_TEMPLATES.map((t, i) => ({ ...t, id: `default-${i}`, org_id: '', show_in_quick: true } as ComplianceTemplate))).map((template) => {
                  const isSelected = 'id' in template && selectedTemplate === template.id;
                  return (
                    <div
                      key={template.id}
                      className="quick-template-item"
                      onClick={() => applyTemplate(template)}
                      style={{
                        background: isSelected
                          ? 'rgba(108, 114, 201, 0.2)'
                          : 'var(--container-bg)',
                        border: isSelected
                          ? '2px solid var(--accent-primary)'
                          : 'var(--container-border)',
                        borderRadius: 'var(--container-border-radius)',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all var(--transition-hover)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'var(--container-hover-bg)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.7)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'var(--container-bg)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div
                          className="template-name-shrink"
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-text-body)',
                          }}
                        >
                          {template.name}
                        </div>
                        {/* Toggle for Quick Compliance - hidden on mobile */}
                        {'id' in template && !template.id.startsWith('default-') && (
                          <button
                            className="quick-toggle-desktop-only"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const newValue = !(template as ComplianceTemplate).show_in_quick;
                              try {
                                const { error } = await supabase
                                  .from('compliance_templates')
                                  .update({ show_in_quick: newValue })
                                  .eq('id', template.id);
                                if (!error) {
                                  setTemplates(prev => prev.map(t =>
                                    t.id === template.id ? { ...t, show_in_quick: newValue } : t
                                  ));
                                  if (currentTemplate?.id === template.id) {
                                    setCurrentTemplate({ ...currentTemplate, show_in_quick: newValue });
                                  }
                                }
                              } catch (err) {
                                console.error('Failed to toggle quick status:', err);
                              }
                            }}
                            title="Add to Quick Compliance settings"
                            style={{
                              width: 32,
                              height: 18,
                              borderRadius: 9,
                              border: 'none',
                              background: (template as ComplianceTemplate).show_in_quick ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255, 255, 255, 0.2)',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'background 0.2s ease',
                              flexShrink: 0,
                            }}
                          >
                            <div style={{
                              position: 'absolute',
                              top: 2,
                              left: (template as ComplianceTemplate).show_in_quick ? 16 : 2,
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'left 0.2s ease',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            }} />
                          </button>
                        )}
                      </div>
                      <div style={{
                        fontSize: 'var(--font-xs)',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        fontFamily: 'var(--font-text-body)'
                      }}>
                        {template.description || ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )}

            {/* Main Requirements */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{
                fontSize: 'var(--font-xl)',
                fontWeight: 600,
                marginBottom: 16,
                fontFamily: 'var(--font-text-body)',
                color: 'var(--text-primary)'
              }}>Requirements</h3>

              {/* Hide all toggles in COI settings mode - just show the Requirements title */}
              {!coiSettingsMode && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <label className={`checkbox-label ${stateLicenseRequired ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={stateLicenseRequired}
                      onChange={(e) => setStateLicenseRequired(e.target.checked)}
                    />
                    <span className="checkbox-label-text">State License Required</span>
                  </label>

                  <label className={`checkbox-label ${coiRequired ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={coiRequired}
                      onChange={(e) => setCoiRequired(e.target.checked)}
                    />
                    <span className="checkbox-label-text">
                      COI Required
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* COI Details - Show when COI is required OR in COI settings mode */}
            {(coiRequired || coiSettingsMode) && (
              <>
                {/* Coverage Amounts Section */}
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Coverage Amounts</h3>

                  <div style={{ display: 'grid', gap: 16 }}>
                    {/* GL */}
                    <div className="form-field">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        General Liability (GL)
                        <span
                          title="Recommended: $1M for standard jobs, $2M for commercial"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: 'rgba(108, 114, 201, 0.2)',
                            color: 'var(--accent-primary)',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'help',
                          }}
                        >
                          ?
                        </span>
                      </label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>$</span>
                        <input
                          type="text"
                          className="text-input"
                          value={glAmount}
                          onChange={(e) => setGlAmount(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="1000000"
                        />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        Standard: $1M | High-Risk: $2M
                      </div>
                    </div>

                    {/* AITO */}
                    <div className="form-field">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Auto Insurance (AITO)
                        <span
                          title="Coverage for vehicle accidents and property damage"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: 'rgba(108, 114, 201, 0.2)',
                            color: 'var(--accent-primary)',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'help',
                          }}
                        >
                          ?
                        </span>
                      </label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>$</span>
                        <input
                          type="text"
                          className="text-input"
                          value={aitoAmount}
                          onChange={(e) => setAitoAmount(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="1000000"
                        />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        Standard: $1M | High-Risk: $2M
                      </div>
                    </div>

                    {/* WC */}
                    <div className="form-field">
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Workers Compensation (WC)
                        <span
                          title="Required for employees in most states"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: 'rgba(108, 114, 201, 0.2)',
                            color: 'var(--accent-primary)',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'help',
                          }}
                        >
                          ?
                        </span>
                      </label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>$</span>
                        <input
                          type="text"
                          className="text-input"
                          value={wcAmount}
                          onChange={(e) => setWcAmount(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="1000000"
                        />
                      </div>
                    </div>

                    {/* EL */}
                    <div className="form-field">
                      <label className="form-label">Employer's Liability (EL)</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>$</span>
                        <input
                          type="text"
                          className="text-input"
                          value={elAmount}
                          onChange={(e) => setElAmount(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="1000000"
                        />
                      </div>
                    </div>

                    {/* CPL */}
                    <div className="form-field">
                      <label className="form-label">Commercial Property Liability (CPL)</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>$</span>
                        <input
                          type="text"
                          className="text-input"
                          value={cplAmount}
                          onChange={(e) => setCplAmount(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="500000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Endorsements Section */}
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{
                    fontSize: 'var(--font-xl)',
                    fontWeight: 600,
                    marginBottom: 16,
                    fontFamily: 'var(--font-text-body)',
                    color: 'var(--text-primary)'
                  }}>Required Endorsements</h3>

                  <div style={{ display: 'grid', gap: 12 }}>
                    <label className={`checkbox-card ${additionalInsured ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        className="checkbox-input-small"
                        checked={additionalInsured}
                        onChange={(e) => setAdditionalInsured(e.target.checked)}
                      />
                      <span className="checkbox-label-text">Additional Insured</span>
                    </label>

                    <label className={`checkbox-card ${waiverOfSubrogation ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        className="checkbox-input-small"
                        checked={waiverOfSubrogation}
                        onChange={(e) => setWaiverOfSubrogation(e.target.checked)}
                      />
                      <span className="checkbox-label-text">Waiver of Subrogation</span>
                    </label>

                    <label className={`checkbox-card ${primaryNonContributory ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        className="checkbox-input-small"
                        checked={primaryNonContributory}
                        onChange={(e) => setPrimaryNonContributory(e.target.checked)}
                      />
                      <span className="checkbox-label-text">Primary and Non-Contributory</span>
                    </label>
                  </div>
                </div>

                {/* Expiry Section */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Expiry Requirements</h3>

                  <div className="form-field">
                    <label className="form-label">Minimum Days to Expiry</label>
                    <input
                      type="number"
                      className="text-input"
                      value={minDaysToExpiry}
                      onChange={(e) => setMinDaysToExpiry(e.target.value)}
                      placeholder="30"
                      min="0"
                    />
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Insurance must be valid for at least this many days
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Confirmation */}
            <div style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  className="checkbox-input-small"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  I have reviewed and confirm the accuracy of these compliance requirements
                </div>
              </label>
            </div>
            {/* Action Buttons - Inline at bottom of content */}
            <div style={{
              display: 'flex',
              gap: 12,
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                onClick={onClose}
                className="outline-button"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !orgId || !confirmed}
                className="primary-button"
              >
                {saving ? 'Saving...' : 'Apply to Work Order'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
