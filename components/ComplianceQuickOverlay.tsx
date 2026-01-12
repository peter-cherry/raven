'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CloseButton } from '@/components/CloseButton';
import { createDraftPolicy, ComplianceState, DEFAULT_COMPLIANCE_STATE } from '@/lib/compliance';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

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
  show_in_quick: boolean;
}

// Default built-in templates (always available)
const DEFAULT_TEMPLATES: ComplianceTemplate[] = [
  {
    id: 'default-standard',
    org_id: '',
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
    show_in_quick: true,
  },
  {
    id: 'default-high-risk',
    org_id: '',
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
    show_in_quick: true,
  },
  {
    id: 'default-basic',
    org_id: '',
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
    show_in_quick: true,
  },
];

interface ComplianceQuickOverlayProps {
  onClose: () => void;
  onApply?: (policyId: string, jobId: string) => void; // Updated: Now passes both policyId and jobId
  onOpenFullCompliance?: () => void; // Optional callback to open ComplianceOverlay instead of routing
  onOpenCreateJob?: (policyId: string) => void; // Optional callback to open CreateJobForm overlay with policy_id
  searchText?: string; // Optional search text from homepage
  onComplianceSaved?: (policyId: string, jobId: string) => void; // Updated: Now passes both policyId and jobId
  complianceState?: ComplianceState; // Bidirectional sync: Initialize from parent state
  onComplianceStateChange?: (state: ComplianceState) => void; // Bidirectional sync: Notify parent of changes
}

export default function ComplianceQuickOverlay({
  onClose,
  onApply,
  onOpenFullCompliance,
  onOpenCreateJob,
  searchText,
  onComplianceSaved,
  complianceState,
  onComplianceStateChange
}: ComplianceQuickOverlayProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<ComplianceTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ComplianceTemplate | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Main requirements - Initialize from complianceState prop if provided
  const [stateLicenseRequired, setStateLicenseRequired] = useState(
    complianceState?.stateLicenseRequired ?? DEFAULT_COMPLIANCE_STATE.stateLicenseRequired
  );
  const [coiRequired, setCoiRequired] = useState(
    complianceState?.coiRequired ?? DEFAULT_COMPLIANCE_STATE.coiRequired
  );

  // COI values (from selected template, complianceState prop, or defaults)
  const [glAmount, setGlAmount] = useState(complianceState?.glAmount ?? DEFAULT_COMPLIANCE_STATE.glAmount);
  const [autoAmount, setAutoAmount] = useState(complianceState?.autoAmount ?? DEFAULT_COMPLIANCE_STATE.autoAmount);
  const [wcAmount, setWcAmount] = useState(complianceState?.wcAmount ?? DEFAULT_COMPLIANCE_STATE.wcAmount);
  const [elAmount, setElAmount] = useState(complianceState?.elAmount ?? DEFAULT_COMPLIANCE_STATE.elAmount);
  const [cplAmount, setCplAmount] = useState(complianceState?.cplAmount ?? DEFAULT_COMPLIANCE_STATE.cplAmount);
  const [additionalInsured, setAdditionalInsured] = useState(
    complianceState?.additionalInsured ?? DEFAULT_COMPLIANCE_STATE.additionalInsured
  );
  const [waiverOfSubrogation, setWaiverOfSubrogation] = useState(
    complianceState?.waiverOfSubrogation ?? DEFAULT_COMPLIANCE_STATE.waiverOfSubrogation
  );
  const [primaryNonContributory, setPrimaryNonContributory] = useState(
    complianceState?.primaryNonContributory ?? DEFAULT_COMPLIANCE_STATE.primaryNonContributory
  );
  const [minDaysToExpiry, setMinDaysToExpiry] = useState(
    complianceState?.minDaysToExpiry ?? DEFAULT_COMPLIANCE_STATE.minDaysToExpiry
  );

  // Bidirectional sync: Notify parent of state changes
  const syncToParent = () => {
    if (onComplianceStateChange) {
      onComplianceStateChange({
        stateLicenseRequired,
        coiRequired,
        glAmount,
        autoAmount,
        wcAmount,
        elAmount,
        cplAmount,
        additionalInsured,
        waiverOfSubrogation,
        primaryNonContributory,
        minDaysToExpiry,
      });
    }
  };

  // Sync state to parent whenever compliance values change
  useEffect(() => {
    syncToParent();
  }, [
    stateLicenseRequired,
    coiRequired,
    glAmount,
    autoAmount,
    wcAmount,
    elAmount,
    cplAmount,
    additionalInsured,
    waiverOfSubrogation,
    primaryNonContributory,
    minDaysToExpiry,
  ]);

  // Get org_id on mount
  useEffect(() => {
    const getOrgId = async () => {
      if (!user) return;

      // Development mode - use hardcoded org_id since fake user doesn't have real Supabase session
      if (process.env.NODE_ENV === 'development' && user.id === '00000000-0000-0000-0000-000000000001') {
        console.log('[ComplianceQuickOverlay] Dev mode: using hardcoded org_id');
        setOrgId('152ca2e3-a371-4167-99c5-0890afcd83d7');
        return;
      }

      const { data: membership, error } = await supabase
        .from('org_memberships')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('[ComplianceQuickOverlay] Error fetching org_id:', error);
      }

      if (membership?.org_id) {
        setOrgId(membership.org_id);
      }
    };
    getOrgId();
  }, [user]);

  // Fetch templates from database
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!orgId) return;

      setLoadingTemplates(true);
      try {
        const { data, error } = await supabase
          .from('compliance_templates')
          .select('*')
          .eq('org_id', orgId)
          .order('is_builtin', { ascending: false })
          .order('name');

        if (error) {
          console.error('[ComplianceQuickOverlay] Failed to fetch templates:', error);
        } else {
          setTemplates(data || []);
        }
      } catch (error) {
        console.error('[ComplianceQuickOverlay] Error:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [orgId]);

  const handleRequirementClick = (requirement: 'license' | 'coi') => {
    if (requirement === 'coi') {
      setCoiRequired(!coiRequired);
      if (!coiRequired) {
        // When enabling COI, apply first template (from database or default)
        const availableTemplates = templates.length > 0 ? templates : DEFAULT_TEMPLATES;
        const firstTemplate = availableTemplates[0];
        if (firstTemplate) {
          applyTemplate(firstTemplate);
        }
      }
    } else {
      setStateLicenseRequired(!stateLicenseRequired);
    }
  };

  const applyTemplate = (template: ComplianceTemplate) => {
    setSelectedTemplate(template);
    setCoiRequired(true);
    setGlAmount(template.gl_amount);
    setAutoAmount(template.auto_amount);
    setWcAmount(template.wc_amount);
    setElAmount(template.el_amount);
    setCplAmount(template.cpl_amount);
    setAdditionalInsured(template.additional_insured);
    setWaiverOfSubrogation(template.waiver_of_subrogation);
    setPrimaryNonContributory(template.primary_non_contributory);
    setMinDaysToExpiry(template.min_days_to_expiry);
  };

  const handleContinue = async () => {
    try {
      setSaving(true);

      if (!orgId) {
        alert('Organization not found');
        return;
      }

      // Create policy with selected requirements
      const items = [
        stateLicenseRequired && {
          requirement_type: 'LICENSE_STATE',
          required: true,
          weight: 50,
          min_valid_days: 0
        },
        // COI requirements (use values from selected template or current state)
        coiRequired && {
          requirement_type: 'GL_COVERAGE',
          required: true,
          weight: 20,
          min_valid_days: minDaysToExpiry,
          metadata: { amount: glAmount }
        },
        coiRequired && {
          requirement_type: 'AUTO_COVERAGE',
          required: true,
          weight: 20,
          min_valid_days: minDaysToExpiry,
          metadata: { amount: autoAmount }
        },
        coiRequired && {
          requirement_type: 'WC_COVERAGE',
          required: true,
          weight: 20,
          min_valid_days: minDaysToExpiry,
          metadata: { amount: wcAmount }
        },
        coiRequired && {
          requirement_type: 'EL_COVERAGE',
          required: true,
          weight: 15,
          min_valid_days: minDaysToExpiry,
          metadata: { amount: elAmount }
        },
        coiRequired && {
          requirement_type: 'CPL_COVERAGE',
          required: true,
          weight: 15,
          min_valid_days: minDaysToExpiry,
          metadata: { amount: cplAmount }
        },
        coiRequired && additionalInsured && {
          requirement_type: 'ENDORSEMENT_ADDITIONAL_INSURED',
          required: true,
          weight: 3,
          min_valid_days: 0
        },
        coiRequired && waiverOfSubrogation && {
          requirement_type: 'ENDORSEMENT_WAIVER_SUBROGATION',
          required: true,
          weight: 3,
          min_valid_days: 0
        },
        coiRequired && primaryNonContributory && {
          requirement_type: 'ENDORSEMENT_PRIMARY_NONCONTRIBUTORY',
          required: true,
          weight: 4,
          min_valid_days: 0
        },
      ].filter(Boolean) as any[];

      const policyId = await createDraftPolicy(orgId, items);

      // Create empty job with policy attached
      const jobResponse = await fetch('/api/jobs/create-empty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, policy_id: policyId }),
      });

      if (!jobResponse.ok) {
        const errorData = await jobResponse.json();
        throw new Error(errorData.error || 'Failed to create job');
      }

      const { job_id: jobId } = await jobResponse.json();

      // Priority order:
      // 1. If onComplianceSaved provided (from homepage), use it to handle both cases
      // 2. If onApply callback provided (called from Create Job Form), use it
      // 3. If onOpenCreateJob callback provided, use it to open overlay
      // 4. Otherwise, fallback to route navigation
      if (onComplianceSaved) {
        onComplianceSaved(policyId, jobId);
      } else if (onApply) {
        onApply(policyId, jobId);
        onClose();
      } else if (onOpenCreateJob) {
        onClose();
        onOpenCreateJob(policyId);
      } else {
        // Fallback to route navigation
        onClose();
        router.push(`/jobs/create?policy_id=${policyId}&job_id=${jobId}`);
      }
    } catch (error) {
      console.error('Failed to create compliance policy:', error);
      alert('Failed to save compliance requirements');
    } finally {
      setSaving(false);
    }
  };

  // Helper to format currency for display
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  return (
    <>
      {/* Overlay backdrop to close on outside click - BEHIND panel */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10001,
          pointerEvents: 'auto',
          background: 'transparent'
        }}
        onClick={onClose}
      />

      {/* Compliance Quick Panel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="compliance-quick-overlay"
        style={{
          position: 'fixed',
          top: 'calc(50% - 91.5px + 39px)',
          right: 'calc(50% - 34px - 615px/2 + 19px)',
          width: 280,
          maxWidth: 'calc(100vw - 32px)',
          background: 'rgba(47, 47, 47, 0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '2px solid rgba(154, 150, 213, 0.3)',
          borderRadius: 16,
          boxShadow: '0px 0px 22.9px rgba(0, 0, 0, 0.21)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '22px',
          zIndex: 10003,
          pointerEvents: 'auto',
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontWeight: 400
        }}
      >
        {/* Close Button */}
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <CloseButton onClick={onClose} />
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: 'Futura, -apple-system, sans-serif',
            fontSize: 17,
            fontWeight: 700,
            color: '#F9F3E5',
            marginBottom: 6
          }}
        >
          Quick Compliance
        </div>

        <p style={{
          color: '#BAB3C4',
          fontSize: 10,
          marginBottom: 16,
          lineHeight: 1.5
        }}>
          Toggle compliance requirements for work orders
        </p>

        {/* Quick Templates - use database templates or fallback to built-in defaults */}
        <div style={{ marginBottom: 22 }}>
          <div style={{
            fontSize: 9,
            color: '#BAB3C4',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Quick Templates
          </div>
          {loadingTemplates ? (
            <div style={{ fontSize: 10, color: '#BAB3C4' }}>Loading templates...</div>
          ) : (
            <div
              className="quick-templates-grid"
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'nowrap',
                overflowX: 'auto',
                paddingBottom: 8,
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
              }}
            >
              {/* Use database templates, otherwise show built-in defaults */}
              {(templates.length > 0
                ? templates.filter(t => t.show_in_quick)
                : DEFAULT_TEMPLATES
              ).map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="outline-button quick-template-btn"
                  style={{
                    flex: '0 0 auto',
                    padding: '6px 12px',
                    fontSize: 10,
                    background: selectedTemplate?.id === template.id
                      ? 'rgba(34, 197, 94, 0.2)'
                      : 'rgba(101, 98, 144, 0.1)',
                    border: selectedTemplate?.id === template.id
                      ? '2px solid rgba(34, 197, 94, 0.6)'
                      : '1px solid rgba(101, 98, 144, 0.3)',
                    borderRadius: 6,
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                  title={`${template.description || template.name} - GL: ${formatCurrency(template.gl_amount)}`}
                >
                  {template.name.length > 15 ? template.name.slice(0, 15) + '...' : template.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Requirements Grid */}
        <div style={{ display: 'grid', gap: 11 }}>
          {/* State License */}
          <label
            htmlFor="license-checkbox"
            onClick={(e) => {
              // Ensure the entire row is clickable, not just the checkbox
              if (e.target instanceof HTMLInputElement) return; // Let checkbox handle its own click
              handleRequirementClick('license');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              cursor: 'pointer',
              padding: 11,
              background: stateLicenseRequired ? 'rgba(101, 98, 144, 0.2)' : 'rgba(47, 47, 47, 0.5)',
              border: `2px solid ${stateLicenseRequired ? '#656290' : '#3C3C42'}`,
              borderRadius: 8,
              transition: 'all 0.2s',
              userSelect: 'none'
            }}
          >
            <input
              id="license-checkbox"
              type="checkbox"
              checked={stateLicenseRequired}
              onChange={() => handleRequirementClick('license')}
              style={{ cursor: 'pointer' }}
            />
            <div style={{ flex: 1, cursor: 'pointer' }}>
              <div style={{
                fontWeight: 600,
                fontSize: 11,
                color: '#F9F3E5',
                marginBottom: 3
              }}>
                State License Required
              </div>
              <div style={{
                fontSize: 8,
                color: '#BAB3C4'
              }}>
                Technicians must have valid state license
              </div>
            </div>
          </label>

          {/* COI Required */}
          <label
            htmlFor="coi-checkbox"
            onClick={(e) => {
              // Ensure the entire row is clickable, not just the checkbox
              if (e.target instanceof HTMLInputElement) return; // Let checkbox handle its own click
              handleRequirementClick('coi');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              cursor: 'pointer',
              padding: 11,
              background: coiRequired ? 'rgba(101, 98, 144, 0.2)' : 'rgba(47, 47, 47, 0.5)',
              border: `2px solid ${coiRequired ? '#656290' : '#3C3C42'}`,
              borderRadius: 8,
              transition: 'all 0.2s',
              userSelect: 'none'
            }}
          >
            <input
              id="coi-checkbox"
              type="checkbox"
              checked={coiRequired}
              onChange={() => handleRequirementClick('coi')}
              style={{ cursor: 'pointer' }}
            />
            <div style={{ flex: 1, cursor: 'pointer' }}>
              <div style={{
                fontWeight: 600,
                fontSize: 11,
                color: '#F9F3E5',
                marginBottom: 3
              }}>
                COI Required
              </div>
              <div style={{
                fontSize: 8,
                color: '#BAB3C4'
              }}>
                Certificate of Insurance must be provided
              </div>
            </div>
          </label>
        </div>

        {/* Info message when COI is toggled on */}
        {coiRequired && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: 17,
              padding: 11,
              background: 'rgba(101, 98, 144, 0.1)',
              border: '1px solid rgba(101, 98, 144, 0.3)',
              borderRadius: 6,
              fontSize: 9,
              color: '#BAB3C4',
              lineHeight: 1.5
            }}
          >
            {selectedTemplate ? (
              <>
                <strong style={{ color: '#9392AF' }}>Using: {selectedTemplate.name}</strong>
                <div style={{ marginTop: 4 }}>
                  GL: {formatCurrency(glAmount)} | Auto: {formatCurrency(autoAmount)} | WC: {formatCurrency(wcAmount)}
                </div>
              </>
            ) : (
              <>
                <strong style={{ color: '#9392AF' }}>Note:</strong> For detailed COI settings (coverage amounts, endorsements, expiry), visit the full{' '}
                <button
                  onClick={() => {
                    if (onOpenFullCompliance) {
                      // Use callback to open ComplianceOverlay
                      onOpenFullCompliance();
                    } else {
                      // Fallback to route navigation
                      onClose();
                      router.push('/compliance');
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8083AE',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit'
                  }}
                >
                  Compliance page
                </button>
                .
              </>
            )}
          </motion.div>
        )}

        {/* Done Button */}
        <button
          onClick={handleContinue}
          disabled={saving}
          className="primary-button"
          style={{
            marginTop: 22,
            width: '100%',
            padding: '12px 24px',
            fontSize: 13,
            fontWeight: 600,
            opacity: saving ? 0.5 : 1,
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'done'}
        </button>
      </motion.div>
    </>
  );
}
