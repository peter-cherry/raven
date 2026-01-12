'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: 'var(--spacing-2xl)',
      paddingTop: 'var(--spacing-5xl)'
    }}>
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        color: 'var(--text-primary)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--spacing-5xl)' }}>
          <Link
            href="/"
            style={{
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              fontSize: 'var(--font-md)',
              marginBottom: 'var(--spacing-lg)',
              display: 'inline-block'
            }}
          >
            ← Back to Home
          </Link>
          <h1 style={{
            fontSize: 'var(--font-4xl)',
            fontWeight: 'var(--font-weight-bold)',
            fontFamily: 'var(--font-section-title)',
            marginBottom: 'var(--spacing-md)',
            color: 'var(--text-primary)'
          }}>
            Terms of Service
          </h1>
          <p style={{
            fontSize: 'var(--font-lg)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Last Updated: November 19, 2025
          </p>
          <p style={{
            fontSize: 'var(--font-md)',
            color: 'var(--text-secondary)',
            marginTop: 'var(--spacing-lg)',
            lineHeight: 1.6
          }}>
            Version 1.0
          </p>
        </div>

        {/* Table of Contents */}
        <div style={{
          background: 'var(--container-bg)',
          border: 'var(--container-border)',
          borderRadius: 'var(--container-border-radius)',
          padding: 'var(--spacing-xl)',
          marginBottom: 'var(--spacing-5xl)'
        }}>
          <h2 style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--spacing-lg)',
            color: 'var(--text-primary)'
          }}>
            Table of Contents
          </h2>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            {[
              { id: 'section-1', title: 'Platform Definition & Services' },
              { id: 'section-2', title: 'Client Responsibilities & Compliance' },
              { id: 'section-3', title: 'Contractor Responsibilities' },
              { id: 'section-4', title: 'Limitation of Liability' },
              { id: 'section-5', title: 'Indemnification' },
              { id: 'section-6', title: 'Disclaimer of Warranties' },
              { id: 'section-7', title: 'Term and Termination' },
              { id: 'section-8', title: 'Governing Law' },
              { id: 'section-9', title: 'Contact Information' }
            ].map(item => (
              <li key={item.id} style={{ marginBottom: 'var(--spacing-sm)' }}>
                <a
                  href={`#${item.id}`}
                  style={{
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    fontSize: 'var(--font-md)',
                    display: 'block',
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--btn-corner-radius)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--container-hover-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 1: Platform Definition & Services */}
        <section id="section-1" style={{ marginBottom: 'var(--spacing-5xl)' }}>
          <h2 style={{
            fontSize: 'var(--font-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--spacing-xl)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-section-title)'
          }}>
            1. Platform Definition & Services
          </h2>

          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h3 style={{
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)'
            }}>
              1.1 SERVICE DESCRIPTION
            </h3>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              marginBottom: 'var(--spacing-lg)'
            }}>
              Raven Search operates a technology platform ("Platform") that connects facility management companies ("Clients") with independent contractors ("Contractors") for trade and maintenance services.
            </p>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              marginBottom: 'var(--spacing-md)'
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>The Platform provides:</strong>
            </p>
            <ul style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 'var(--spacing-xl)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <li>Contractor network access and search functionality</li>
              <li>Document storage and tracking tools</li>
              <li>Compliance policy configuration tools</li>
              <li>Work order posting and matching tools</li>
              <li>Communication facilitation between Clients and Contractors</li>
            </ul>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              marginBottom: 'var(--spacing-md)'
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>The Platform DOES NOT provide:</strong>
            </p>
            <ul style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 'var(--spacing-xl)'
            }}>
              <li>Trade services or labor</li>
              <li>Employment relationships</li>
              <li>Credential verification or validation</li>
              <li>Compliance monitoring or enforcement</li>
              <li>Legal or regulatory advice</li>
              <li>Guarantees of contractor qualifications</li>
            </ul>
          </div>

          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h3 style={{
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)'
            }}>
              1.2 RAVEN'S ROLE
            </h3>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              marginBottom: 'var(--spacing-md)'
            }}>
              Raven Search is a technology service provider that facilitates connections between Clients and Contractors. Raven does not:
            </p>
            <ul style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 'var(--spacing-xl)'
            }}>
              <li>Employ, supervise, or control Contractors</li>
              <li>Perform trade services or facility maintenance</li>
              <li>Make compliance determinations</li>
              <li>Verify credentials, licenses, or insurance policies</li>
              <li>Guarantee work quality or contractor performance</li>
              <li>Act as employer, staffing agency, or general contractor</li>
            </ul>
          </div>

          <div>
            <h3 style={{
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)'
            }}>
              1.3 INDEPENDENT CONTRACTOR STATUS
            </h3>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              marginBottom: 'var(--spacing-md)'
            }}>
              All Contractors on the Platform are independent contractors who:
            </p>
            <ul style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 'var(--spacing-xl)'
            }}>
              <li>Maintain their own separate businesses</li>
              <li>Set their own rates and terms</li>
              <li>Control their own work methods</li>
              <li>Are responsible for their own taxes</li>
              <li>Maintain their own insurance and licenses</li>
              <li>Are NOT employees of Raven Search or Clients</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Client Responsibilities */}
        <section id="section-2" style={{ marginBottom: 'var(--spacing-5xl)' }}>
          <h2 style={{
            fontSize: 'var(--font-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--spacing-xl)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-section-title)'
          }}>
            2. Client Responsibilities & Compliance
          </h2>

          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <p style={{
              fontSize: 'var(--font-lg)',
              color: '#EF4444',
              fontWeight: 'var(--font-weight-bold)',
              marginBottom: 'var(--spacing-md)'
            }}>
              ⚠️ CRITICAL: CLIENT IS SOLELY RESPONSIBLE FOR COMPLIANCE
            </p>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8
            }}>
              You, the Client, are fully responsible for determining credential requirements, verifying contractors, and ensuring regulatory compliance. Raven provides tools only—not guarantees.
            </p>
          </div>

          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h3 style={{
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)'
            }}>
              2.1 CLIENT COMPLIANCE OBLIGATIONS
            </h3>

            <h4 style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginTop: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)'
            }}>
              A. Regulatory Compliance
            </h4>
            <ul style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 'var(--spacing-xl)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <li>Determining what credentials are legally required for work performed per federal, state, and local regulations</li>
              <li>Understanding and complying with licensing requirements in their operating jurisdictions</li>
              <li>Ensuring work is performed by appropriately credentialed individuals</li>
              <li>Obtaining necessary permits and approvals</li>
              <li>Complying with OSHA, EPA, and other regulatory requirements</li>
            </ul>

            <h4 style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginTop: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)'
            }}>
              B. Credential Verification
            </h4>
            <ul style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 'var(--spacing-xl)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <li>Independently verifying all contractor credentials before engagement</li>
              <li>Confirming license validity with state licensing boards</li>
              <li>Verifying insurance coverage with insurance carriers</li>
              <li>Reviewing background check results</li>
              <li>Confirming certifications with issuing authorities</li>
              <li>Ensuring credentials are appropriate for specific work</li>
            </ul>

            <h4 style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginTop: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)'
            }}>
              C. Risk Assessment
            </h4>
            <ul style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 'var(--spacing-xl)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <li>Evaluating contractor qualifications for specific work</li>
              <li>Assessing risk levels of work to be performed</li>
              <li>Determining appropriate credential requirements</li>
              <li>Making final contractor selection decisions</li>
              <li>Supervising and managing contractor work</li>
            </ul>

            <h4 style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginTop: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)'
            }}>
              D. Documentation
            </h4>
            <ul style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 'var(--spacing-xl)'
            }}>
              <li>Maintaining records of credential verification</li>
              <li>Documenting contractor selection rationale</li>
              <li>Keeping compliance audit trails</li>
              <li>Retaining contracts and agreements</li>
            </ul>
          </div>

          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h3 style={{
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)'
            }}>
              2.2 PLATFORM TOOLS (NOT GUARANTEES)
            </h3>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              marginBottom: 'var(--spacing-lg)',
              fontStyle: 'italic'
            }}>
              The Platform provides compliance TOOLS only. These are aids, not substitutes for your due diligence.
            </p>

            <div style={{
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <h4 style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-sm)',
                color: 'var(--text-primary)'
              }}>
                Document Storage
              </h4>
              <ul style={{
                fontSize: 'var(--font-md)',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                paddingLeft: 'var(--spacing-xl)',
                margin: 0
              }}>
                <li>Contractors upload credential documents</li>
                <li>Platform stores documents securely</li>
                <li>NO VERIFICATION of document authenticity, validity, or appropriateness</li>
                <li>Documents are "as provided" by Contractors</li>
              </ul>
            </div>

            <div style={{
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <h4 style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-sm)',
                color: 'var(--text-primary)'
              }}>
                Document Tracking
              </h4>
              <ul style={{
                fontSize: 'var(--font-md)',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                paddingLeft: 'var(--spacing-xl)',
                margin: 0
              }}>
                <li>Platform parses expiration dates using OCR technology</li>
                <li>Automated reminders sent to Contractors before expiration</li>
                <li>Compliance dashboard shows document status</li>
                <li>Status reflects DOCUMENT PRESENCE only, not regulatory compliance</li>
              </ul>
            </div>

            <div style={{
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <h4 style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-sm)',
                color: 'var(--text-primary)'
              }}>
                Compliance Scoring
              </h4>
              <ul style={{
                fontSize: 'var(--font-md)',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                paddingLeft: 'var(--spacing-xl)',
                margin: 0
              }}>
                <li>System generates scores based on document presence and expiration</li>
                <li>Scores are TOOLS for Client's internal use</li>
                <li>Scores do NOT represent regulatory compliance</li>
                <li>Scores do NOT guarantee contractor qualifications</li>
                <li>Client must independently verify compliance</li>
              </ul>
            </div>

            <div style={{
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-lg)'
            }}>
              <h4 style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-sm)',
                color: 'var(--text-primary)'
              }}>
                Policy Configuration
              </h4>
              <ul style={{
                fontSize: 'var(--font-md)',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                paddingLeft: 'var(--spacing-xl)',
                margin: 0
              }}>
                <li>Client configures their own compliance requirements</li>
                <li>Client sets enforcement levels (required/recommended/optional)</li>
                <li>Client determines what credentials are necessary</li>
                <li>Platform filters Contractors based on CLIENT'S configured policy</li>
                <li>Raven does NOT determine appropriate requirements</li>
              </ul>
            </div>
          </div>

          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-xl)'
          }}>
            <h3 style={{
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-md)',
              color: '#EF4444'
            }}>
              2.3 EXPLICIT DISCLAIMERS
            </h3>
            <p style={{
              fontSize: 'var(--font-lg)',
              color: 'var(--text-primary)',
              fontWeight: 'var(--font-weight-bold)',
              marginBottom: 'var(--spacing-md)'
            }}>
              RAVEN SEARCH DOES NOT AND CANNOT:
            </p>
            <ul style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 'var(--spacing-xl)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <li>Verify that uploaded documents are authentic</li>
              <li>Confirm licenses are valid or in good standing</li>
              <li>Guarantee insurance policies provide adequate coverage</li>
              <li>Determine if credentials are appropriate for specific work</li>
              <li>Monitor ongoing regulatory compliance</li>
              <li>Act as licensing authority or compliance auditor</li>
              <li>Guarantee contractor qualifications or fitness for work</li>
              <li>Ensure work meets code requirements or industry standards</li>
            </ul>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>Client acknowledges that:</strong>
            </p>
            <ul style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              paddingLeft: 'var(--spacing-xl)'
            }}>
              <li>Platform tools are aids only, not substitutes for due diligence</li>
              <li>Client must perform independent verification</li>
              <li>Raven is not responsible for credential accuracy</li>
              <li>Client assumes all risk in contractor selection</li>
            </ul>
          </div>
        </section>

        {/* Sections 3-9 collapsed/expandable for brevity */}
        <section id="section-3" style={{ marginBottom: 'var(--spacing-5xl)' }}>
          <button
            onClick={() => toggleSection('section-3')}
            style={{
              width: '100%',
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-lg)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
          >
            <h2 style={{
              fontSize: 'var(--font-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              3. Contractor Responsibilities
            </h2>
            <span style={{
              fontSize: 'var(--font-3xl)',
              color: 'var(--text-secondary)',
              transform: expandedSection === 'section-3' ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}>
              ▼
            </span>
          </button>
          {expandedSection === 'section-3' && (
            <div style={{
              background: 'var(--container-bg)',
              border: 'var(--container-border)',
              borderTop: 'none',
              borderRadius: '0 0 var(--container-border-radius) var(--container-border-radius)',
              padding: 'var(--spacing-xl)',
              marginTop: '-8px'
            }}>
              <p style={{
                fontSize: 'var(--font-md)',
                color: 'var(--text-secondary)',
                lineHeight: 1.8
              }}>
                Contractors are responsible for maintaining valid licenses, accurate credentials, appropriate insurance coverage, and professional service delivery. Full details available upon request or during onboarding.
              </p>
            </div>
          )}
        </section>

        {/* Remaining sections as expandable */}
        {[
          { id: 'section-4', title: '4. Limitation of Liability', summary: 'Raven Search liability is limited to the fees paid in the 12 months prior to any claim. We are not liable for indirect, incidental, or consequential damages.' },
          { id: 'section-5', title: '5. Indemnification', summary: 'Clients and Contractors agree to indemnify Raven Search against claims arising from their use of the Platform or breach of these Terms.' },
          { id: 'section-6', title: '6. Disclaimer of Warranties', summary: 'Platform provided "AS IS" without warranties. We do not guarantee accuracy, reliability, or fitness for any particular purpose.' },
          { id: 'section-7', title: '7. Term and Termination', summary: 'Terms effective until terminated. Either party may terminate with 30 days notice. Certain provisions survive termination.' },
          { id: 'section-8', title: '8. Governing Law', summary: 'These Terms are governed by the laws of the State of Florida. Disputes resolved through binding arbitration.' },
          { id: 'section-9', title: '9. Contact Information', summary: 'Questions? Contact us at legal@ravensearch.com' }
        ].map(section => (
          <section key={section.id} id={section.id} style={{ marginBottom: 'var(--spacing-xl)' }}>
            <button
              onClick={() => toggleSection(section.id)}
              style={{
                width: '100%',
                background: 'var(--container-bg)',
                border: 'var(--container-border)',
                borderRadius: 'var(--container-border-radius)',
                padding: 'var(--spacing-lg)',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
            >
              <h2 style={{
                fontSize: 'var(--font-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                {section.title}
              </h2>
              <span style={{
                fontSize: 'var(--font-3xl)',
                color: 'var(--text-secondary)',
                transform: expandedSection === section.id ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>
                ▼
              </span>
            </button>
            {expandedSection === section.id && (
              <div style={{
                background: 'var(--container-bg)',
                border: 'var(--container-border)',
                borderTop: 'none',
                borderRadius: '0 0 var(--container-border-radius) var(--container-border-radius)',
                padding: 'var(--spacing-xl)',
                marginTop: '-8px'
              }}>
                <p style={{
                  fontSize: 'var(--font-md)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8
                }}>
                  {section.summary}
                </p>
              </div>
            )}
          </section>
        ))}

        {/* Footer */}
        <div style={{
          marginTop: 'var(--spacing-5xl)',
          paddingTop: 'var(--spacing-2xl)',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            © 2025 Raven Search. All rights reserved.
          </p>
          <Link
            href="/"
            style={{
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              fontSize: 'var(--font-md)'
            }}
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
