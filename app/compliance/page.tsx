"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createDraftPolicy } from '@/lib/compliance';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';

export default function CompliancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Main requirements
  const [stateLicenseRequired, setStateLicenseRequired] = useState(true);
  const [coiRequired, setCoiRequired] = useState(false); // Now enabled!

  // Confirmation
  const [confirmed, setConfirmed] = useState(false);

  // Insurance coverage amounts
  const [glAmount, setGlAmount] = useState('1000000');
  const [aitoAmount, setAitoAmount] = useState('1000000');
  const [wcAmount, setWcAmount] = useState('1000000');
  const [elAmount, setElAmount] = useState('1000000');
  const [cplAmount, setCplAmount] = useState('500000');

  // Endorsements
  const [additionalInsured, setAdditionalInsured] = useState(true);
  const [waiverOfSubrogation, setWaiverOfSubrogation] = useState(true);
  const [primaryNonContributory, setPrimaryNonContributory] = useState(false);

  // Expiry
  const [minDaysToExpiry, setMinDaysToExpiry] = useState('30');

  useEffect(() => {
    const getOrgId = async () => {
      if (!user) return;

      const { data: membership } = await supabase
        .from('org_memberships')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

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

  const handleClose = () => {
    router.back();
  };

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
      window.location.href = `/jobs/create?policy_id=${policyId}`;
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Modal Overlay */}
      <div className="policy-modal-overlay" onClick={handleClose}>
        <div
          className="policy-modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: 540,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--modal-bg)',
            backdropFilter: 'var(--modal-backdrop-blur)',
            border: 'var(--modal-border)',
            borderRadius: 'var(--modal-border-radius)',
            boxShadow: 'var(--modal-shadow)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div className="modal-header-sidebar-style">
            <h2 style={{
              margin: 0,
              fontSize: 'var(--font-section-title-size)',
              fontWeight: 'var(--font-section-title-weight)',
              fontFamily: 'var(--font-section-title)',
              color: 'var(--text-primary)'
            }}>Compliance Policies</h2>
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 28,
                lineHeight: 1,
                padding: 4
              }}
            >
              ×
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
              Configure compliance requirements for technicians on work orders
            </p>

            {/* Main Requirements */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{
                fontSize: 'var(--font-xl)',
                fontWeight: 600,
                marginBottom: 16,
                fontFamily: 'var(--font-text-body)',
                color: 'var(--text-primary)'
              }}>Requirements</h3>

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
            </div>

            {/* COI Details - Only show when COI is required */}
            {coiRequired && (
              <>
                {/* Coverage Amounts Section */}
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Coverage Amounts</h3>

              <div style={{ display: 'grid', gap: 16 }}>
                {/* GL */}
                <div className="form-field">
                  <label className="form-label">General Liability (GL)</label>
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
                </div>

                {/* AITO */}
                <div className="form-field">
                  <label className="form-label">Auto Insurance (AITO)</label>
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
                </div>

                {/* WC */}
                <div className="form-field">
                  <label className="form-label">Workers Compensation (WC)</label>
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
          </div>

          {/* Footer */}
          <div className="modal-footer-sidebar-style">
            <button
              onClick={handleClose}
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
      </div>
    </>
  );
}
