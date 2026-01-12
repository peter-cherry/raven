'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';

interface ComplianceRequirement {
  id: string;
  category: 'license' | 'certification' | 'insurance' | 'background';
  name: string;
  description: string;
  enforcement: 'required' | 'recommended' | 'optional';
  enabled: boolean;
  metadata?: {
    minimumCoverage?: number;
    states?: string[];
    expirationMonths?: number;
  };
}

const DEFAULT_REQUIREMENTS: ComplianceRequirement[] = [
  // Trade Licenses
  {
    id: 'hvac-license',
    category: 'license',
    name: 'HVAC License',
    description: 'State-issued HVAC contractor license',
    enforcement: 'required',
    enabled: true
  },
  {
    id: 'plumbing-license',
    category: 'license',
    name: 'Plumbing License',
    description: 'State-issued plumbing contractor license',
    enforcement: 'required',
    enabled: true
  },
  {
    id: 'electrical-license',
    category: 'license',
    name: 'Electrical License',
    description: 'State-issued electrical contractor license',
    enforcement: 'required',
    enabled: true
  },
  {
    id: 'general-contractor',
    category: 'license',
    name: 'General Contractor',
    description: 'General contractor license',
    enforcement: 'optional',
    enabled: false
  },

  // Certifications
  {
    id: 'epa-608',
    category: 'certification',
    name: 'EPA 608',
    description: 'Universal refrigerant handling certification',
    enforcement: 'required',
    enabled: true
  },
  {
    id: 'osha-10',
    category: 'certification',
    name: 'OSHA 10',
    description: '10-hour safety training certification',
    enforcement: 'recommended',
    enabled: false
  },
  {
    id: 'osha-30',
    category: 'certification',
    name: 'OSHA 30',
    description: '30-hour safety training certification',
    enforcement: 'optional',
    enabled: false
  },

  // Insurance & Background
  {
    id: 'general-liability',
    category: 'insurance',
    name: 'General Liability',
    description: 'General liability insurance coverage',
    enforcement: 'required',
    enabled: true,
    metadata: { minimumCoverage: 2000000 }
  },
  {
    id: 'workers-comp',
    category: 'insurance',
    name: 'Workers Compensation',
    description: 'Workers compensation insurance',
    enforcement: 'required',
    enabled: true
  },
  {
    id: 'background-check',
    category: 'background',
    name: 'Background Check',
    description: 'Criminal background check',
    enforcement: 'required',
    enabled: true
  },
  {
    id: 'drug-testing',
    category: 'background',
    name: 'Drug Testing',
    description: 'Pre-employment drug screening',
    enforcement: 'optional',
    enabled: false
  }
];

export default function CompliancePolicySetup() {
  const router = useRouter();
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>(DEFAULT_REQUIREMENTS);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      }
    };
    getOrgId();
  }, [user]);

  const toggleRequirement = (id: string) => {
    setRequirements(requirements.map(req =>
      req.id === id ? { ...req, enabled: !req.enabled } : req
    ));
  };

  const updateEnforcement = (id: string, enforcement: 'required' | 'recommended' | 'optional') => {
    setRequirements(requirements.map(req =>
      req.id === id ? { ...req, enforcement } : req
    ));
  };

  const handleContinue = async () => {
    if (!orgId) return;

    setSaving(true);
    try {
      // Save compliance policy to database
      const policyData = {
        org_id: orgId,
        requirements: requirements.filter(r => r.enabled),
        created_at: new Date().toISOString(),
        version: '1.0'
      };

      const { error } = await supabase
        .from('compliance_policies')
        .insert(policyData);

      if (error) throw error;

      // Navigate to acknowledgment page
      router.push('/onboarding/compliance/acknowledge');
    } catch (error) {
      console.error('Failed to save compliance policy:', error);
      alert('Failed to save policy. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const groupedRequirements = {
    license: requirements.filter(r => r.category === 'license'),
    certification: requirements.filter(r => r.category === 'certification'),
    insurance: requirements.filter(r => r.category === 'insurance'),
    background: requirements.filter(r => r.category === 'background')
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: 'var(--spacing-2xl)',
      paddingTop: 'var(--spacing-5xl)'
    }}>
      <div style={{
        maxWidth: 800,
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--spacing-5xl)' }}>
          <h1 style={{
            fontSize: 'var(--font-4xl)',
            fontWeight: 'var(--font-weight-bold)',
            fontFamily: 'var(--font-section-title)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            Set Your Compliance Requirements
          </h1>
          <p style={{
            fontSize: 'var(--font-lg)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Choose which credentials your contractors must have. You can change these anytime.
          </p>
        </div>

        {/* Trade Licenses */}
        <div style={{ marginBottom: 'var(--spacing-5xl)' }}>
          <h2 style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            Trade Licenses
          </h2>
          <div style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)'
          }}>
            {groupedRequirements.license.map(req => (
              <div key={req.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-lg)',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={req.enabled}
                    onChange={() => toggleRequirement(req.id)}
                  />
                  <div>
                    <div style={{
                      fontSize: 'var(--font-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-xs)'
                    }}>
                      {req.name}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      {req.description}
                    </div>
                  </div>
                </div>
                {req.enabled && (
                  <select
                    value={req.enforcement}
                    onChange={(e) => updateEnforcement(req.id, e.target.value as any)}
                    style={{
                      background: 'var(--bg-primary)',
                      border: 'var(--container-border)',
                      borderRadius: 'var(--btn-corner-radius)',
                      color: 'var(--text-primary)',
                      padding: '8px 16px',
                      fontSize: 'var(--font-md)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="required">Required</option>
                    <option value="recommended">Recommended</option>
                    <option value="optional">Optional</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div style={{ marginBottom: 'var(--spacing-5xl)' }}>
          <h2 style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            Certifications
          </h2>
          <div style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)'
          }}>
            {groupedRequirements.certification.map(req => (
              <div key={req.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-lg)',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={req.enabled}
                    onChange={() => toggleRequirement(req.id)}
                  />
                  <div>
                    <div style={{
                      fontSize: 'var(--font-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-xs)'
                    }}>
                      {req.name}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      {req.description}
                    </div>
                  </div>
                </div>
                {req.enabled && (
                  <select
                    value={req.enforcement}
                    onChange={(e) => updateEnforcement(req.id, e.target.value as any)}
                    style={{
                      background: 'var(--bg-primary)',
                      border: 'var(--container-border)',
                      borderRadius: 'var(--btn-corner-radius)',
                      color: 'var(--text-primary)',
                      padding: '8px 16px',
                      fontSize: 'var(--font-md)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="required">Required</option>
                    <option value="recommended">Recommended</option>
                    <option value="optional">Optional</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Insurance & Background */}
        <div style={{ marginBottom: 'var(--spacing-5xl)' }}>
          <h2 style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            Insurance & Background
          </h2>
          <div style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)'
          }}>
            {[...groupedRequirements.insurance, ...groupedRequirements.background].map(req => (
              <div key={req.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-lg)',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={req.enabled}
                    onChange={() => toggleRequirement(req.id)}
                  />
                  <div>
                    <div style={{
                      fontSize: 'var(--font-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-xs)'
                    }}>
                      {req.name}
                      {req.metadata?.minimumCoverage && (
                        <span style={{
                          fontSize: 'var(--font-sm)',
                          color: 'var(--text-secondary)',
                          fontWeight: 'var(--font-weight-regular)',
                          marginLeft: 'var(--spacing-sm)'
                        }}>
                          (${(req.metadata.minimumCoverage / 1000000).toFixed(0)}M minimum)
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      {req.description}
                    </div>
                  </div>
                </div>
                {req.enabled && (
                  <select
                    value={req.enforcement}
                    onChange={(e) => updateEnforcement(req.id, e.target.value as any)}
                    style={{
                      background: 'var(--bg-primary)',
                      border: 'var(--container-border)',
                      borderRadius: 'var(--btn-corner-radius)',
                      color: 'var(--text-primary)',
                      padding: '8px 16px',
                      fontSize: 'var(--font-md)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="required">Required</option>
                    <option value="recommended">Recommended</option>
                    <option value="optional">Optional</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div style={{
          background: 'rgba(108, 114, 201, 0.1)',
          border: '1px solid rgba(108, 114, 201, 0.3)',
          borderRadius: 'var(--container-border-radius)',
          padding: 'var(--spacing-xl)',
          marginBottom: 'var(--spacing-5xl)'
        }}>
          <h3 style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            Enforcement Levels
          </h3>
          <ul style={{
            fontSize: 'var(--font-md)',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            paddingLeft: 'var(--spacing-xl)',
            margin: 0
          }}>
            <li><strong style={{ color: 'var(--text-primary)' }}>Required:</strong> Contractors must have this credential to appear in search results</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Recommended:</strong> Preferred credential, shown as a badge on contractor profiles</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Optional:</strong> Nice to have, doesn't affect search results</li>
          </ul>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleContinue}
            disabled={saving || !orgId}
            className="primary-button"
            style={{
              padding: '12px 32px',
              fontSize: 'var(--font-lg)',
              opacity: (saving || !orgId) ? 0.5 : 1,
              cursor: (saving || !orgId) ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
