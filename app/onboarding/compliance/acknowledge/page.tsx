'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';

/**
 * Sanitize user input to prevent XSS and injection attacks
 * - Strips HTML tags
 * - Removes potentially dangerous characters
 * - Trims whitespace
 * - Limits length
 */
function sanitizeInput(input: string, maxLength: number = 100): string {
  if (!input) return '';

  return input
    .replace(/<[^>]*>/g, '')           // Remove HTML tags
    .replace(/[<>&"'`]/g, '')          // Remove dangerous characters
    .replace(/javascript:/gi, '')       // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '')        // Remove event handlers like onclick=
    .trim()                             // Trim whitespace
    .slice(0, maxLength);               // Limit length
}

export default function ComplianceAcknowledgment() {
  const router = useRouter();
  const { user } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    understand: false,
    willVerify: false,
    acceptLiability: false
  });
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

      // Pre-fill name from user profile
      if (user.user_metadata?.full_name) {
        setName(user.user_metadata.full_name);
      } else if (user.email) {
        setName(user.email.split('@')[0]);
      }
    };
    getOrgId();
  }, [user]);

  const canSubmit =
    checkboxes.understand &&
    checkboxes.willVerify &&
    checkboxes.acceptLiability &&
    name.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !orgId || !user) return;

    setSubmitting(true);
    try {
      console.log('[Acknowledgment] Starting submission...');
      console.log('[Acknowledgment] User ID:', user.id);
      console.log('[Acknowledgment] Org ID:', orgId);

      // Get IP address and user agent
      console.log('[Acknowledgment] Fetching IP address...');
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;
      const userAgent = navigator.userAgent;
      console.log('[Acknowledgment] IP address:', ipAddress);

      // Store acknowledgment record with sanitized input
      const sanitizedName = sanitizeInput(name, 100);
      if (!sanitizedName) {
        alert('Please enter a valid name');
        setSubmitting(false);
        return;
      }

      const acknowledgmentData = {
        organization_id: orgId,
        user_id: user.id,
        user_name: sanitizedName,
        user_email: user.email,
        ip_address: ipAddress,
        user_agent: userAgent,
        acknowledged_at: new Date().toISOString(),
        policy_version: '1.0',
        agreement_version: '1.0',
        full_agreement_text: FULL_AGREEMENT_TEXT
      };

      console.log('[Acknowledgment] Inserting acknowledgment record...');
      const { error: ackError } = await supabase
        .from('compliance_acknowledgments')
        .insert(acknowledgmentData);

      if (ackError) {
        console.error('[Acknowledgment] Insert error:', ackError);
        throw ackError;
      }
      console.log('[Acknowledgment] Acknowledgment record inserted successfully');

      // Update organization to mark compliance as acknowledged
      console.log('[Acknowledgment] Updating organization...');
      const { data: updatedOrg, error: orgError } = await supabase
        .from('organizations')
        .update({
          compliance_policy_acknowledged: true,
          onboarding_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId)
        .select()
        .single();

      if (orgError) {
        console.error('[Acknowledgment] Organization update error:', orgError);
        throw orgError;
      }

      console.log('[Acknowledgment] Organization updated successfully:', updatedOrg);

      // Wait a moment for the database to fully propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to dashboard with onboarding=complete to bypass middleware check
      router.push('/?onboarding=complete');
    } catch (error) {
      console.error('Failed to save acknowledgment:', error);
      alert('Failed to save acknowledgment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-xl)'
    }}>
      {/* Modal Container */}
      <div style={{
        maxWidth: 540,
        width: '100%',
        background: 'rgba(47, 47, 47, 0.3)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        filter: 'brightness(1.15)',
        border: '1px solid rgba(154, 150, 213, 0.3)',
        borderRadius: 'var(--modal-border-radius)',
        padding: 'var(--spacing-2xl)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Warning Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        {/* Header */}
        <h1 style={{
          fontSize: 'var(--font-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          fontFamily: 'var(--font-section-title)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: 'var(--spacing-md)'
        }}>
          Compliance Agreement
        </h1>
        <p style={{
          fontSize: 'var(--font-md)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: 'var(--spacing-2xl)',
          lineHeight: 1.6
        }}>
          Before using the platform, please acknowledge your responsibilities
        </p>

        {/* Scrollable Content Box */}
        <div style={{
          maxHeight: 200,
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--container-border-radius)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <h3 style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            COMPLIANCE RESPONSIBILITY
          </h3>
          <p style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            marginBottom: 'var(--spacing-md)'
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>You are responsible for:</strong>
          </p>
          <ul style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            paddingLeft: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            <li>Determining credential requirements for your work</li>
            <li>Verifying all contractor credentials independently</li>
            <li>Ensuring regulatory compliance in your jurisdictions</li>
            <li>Making final contractor selection decisions</li>
          </ul>
          <p style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            marginBottom: 'var(--spacing-md)'
          }}>
            <strong style={{ color: 'var(--text-primary)' }}>Raven provides tools only:</strong>
          </p>
          <ul style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            paddingLeft: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            <li>Document storage and tracking</li>
            <li>Expiration date reminders</li>
            <li>Compliance scoring dashboards</li>
          </ul>
          <p style={{
            fontSize: 'var(--font-sm)',
            color: '#EF4444',
            lineHeight: 1.8,
            fontWeight: 'var(--font-weight-semibold)'
          }}>
            We do NOT verify credentials. You must verify independently.
          </p>

          {showFullTerms && (
            <div style={{
              marginTop: 'var(--spacing-xl)',
              paddingTop: 'var(--spacing-xl)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h4 style={{
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-sm)'
              }}>
                Full Legal Terms
              </h4>
              <p style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>
                {FULL_AGREEMENT_TEXT}
              </p>
            </div>
          )}
        </div>

        {/* Read Full Terms Link */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <button
            onClick={() => setShowFullTerms(!showFullTerms)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: 'var(--font-sm)',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0
            }}
          >
            {showFullTerms ? 'Hide full terms' : 'Read full terms'}
          </button>
          {' or '}
          <Link
            href="/legal/terms"
            target="_blank"
            style={{
              color: 'var(--accent-primary)',
              fontSize: 'var(--font-sm)',
              textDecoration: 'underline'
            }}
          >
            view Terms of Service
          </Link>
        </div>

        {/* Checkboxes */}
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={checkboxes.understand}
              onChange={(e) => setCheckboxes({ ...checkboxes, understand: e.target.checked })}
              style={{
                width: 18,
                height: 18,
                marginTop: 2,
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-primary)',
              lineHeight: 1.5
            }}>
              I understand my compliance responsibilities
            </span>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={checkboxes.willVerify}
              onChange={(e) => setCheckboxes({ ...checkboxes, willVerify: e.target.checked })}
              style={{
                width: 18,
                height: 18,
                marginTop: 2,
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-primary)',
              lineHeight: 1.5
            }}>
              I will independently verify all contractor credentials
            </span>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--spacing-md)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={checkboxes.acceptLiability}
              onChange={(e) => setCheckboxes({ ...checkboxes, acceptLiability: e.target.checked })}
              style={{
                width: 18,
                height: 18,
                marginTop: 2,
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-primary)',
              lineHeight: 1.5
            }}>
              I accept full liability for contractor selection decisions
            </span>
          </label>
        </div>

        {/* Name Field */}
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Full Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--btn-corner-radius)',
              padding: 'var(--spacing-md)',
              fontSize: 'var(--font-md)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
          <p style={{
            fontSize: 'var(--font-xs)',
            color: 'var(--text-secondary)',
            marginTop: 'var(--spacing-xs)'
          }}>
            Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => router.back()}
            className="outline-button"
            style={{
              flex: 1,
              padding: '12px 24px',
              fontSize: 'var(--font-md)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="primary-button"
            style={{
              flex: 1,
              padding: '12px 24px',
              fontSize: 'var(--font-md)',
              opacity: (!canSubmit || submitting) ? 0.5 : 1,
              cursor: (!canSubmit || submitting) ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Submitting...' : 'I Agree & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Full agreement text for audit trail
const FULL_AGREEMENT_TEXT = `
COMPLIANCE RESPONSIBILITY AGREEMENT

By using the Raven Search platform, you acknowledge and agree that:

1. COMPLIANCE DETERMINATION
You are solely responsible for determining what credentials, licenses, certifications, and insurance coverage are legally required for work performed in your operating jurisdictions, per federal, state, and local regulations.

2. CREDENTIAL VERIFICATION
You must independently verify all contractor credentials before engagement, including:
- Confirming license validity with state licensing boards
- Verifying insurance coverage with insurance carriers
- Reviewing background check results
- Confirming certifications with issuing authorities
- Ensuring credentials are appropriate for specific work to be performed

3. PLATFORM TOOLS
Raven Search provides document storage, expiration tracking, and compliance scoring tools. These are aids only and do NOT constitute:
- Verification of document authenticity
- Confirmation of license validity
- Guarantee of insurance adequacy
- Determination of credential appropriateness
- Compliance monitoring or enforcement

4. INDEPENDENT CONTRACTOR STATUS
All contractors on the platform are independent contractors who maintain their own businesses, set their own rates, and control their own work methods. They are NOT employees of Raven Search or your organization.

5. LIMITATION OF LIABILITY
Raven Search is a technology platform that facilitates connections between clients and contractors. We do not employ, supervise, or control contractors; perform trade services; make compliance determinations; verify credentials; or guarantee work quality or contractor performance.

6. ASSUMPTION OF RISK
You assume all risk in contractor selection, credential verification, and compliance determinations. You agree that Raven Search is not responsible for credential accuracy, contractor qualifications, work quality, or regulatory compliance.

By acknowledging this agreement, you confirm that you have read, understood, and agree to these terms. This acknowledgment will be recorded with your name, IP address, timestamp, and user agent for audit purposes.

Version 1.0 - Last Updated: November 19, 2025
`;
