'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Certification {
  id: string;
  name: string;
  expirationDate?: string;
}

interface Insurance {
  id: string;
  type: 'general_liability' | 'workers_comp';
  expirationDate: string;
}

interface ContractorCardProps {
  id: string;
  name: string;
  distance: number;
  rating: number;
  skills: string[];
  certifications?: Certification[];
  insurance?: Insurance[];
  index: number;
  isMapExpanded?: boolean;
  onAssign?: (contractorId: string) => void;
  showAssignButton?: boolean;
  onCardClick?: (contractorId: string) => void;
  isAssigned?: boolean;
  jobDate?: Date;
}

// Helper function to get COI status based on expiration relative to job date
function getCoiStatus(insurance: Insurance[] | undefined, jobDate?: Date): 'expired' | 'expiring_soon' | 'valid' | 'missing' {
  if (!insurance || insurance.length === 0) return 'missing';

  const generalLiability = insurance.find(ins => ins.type === 'general_liability');
  if (!generalLiability || !generalLiability.expirationDate) return 'missing';

  const expirationDate = new Date(generalLiability.expirationDate);
  const now = new Date();
  const targetDate = jobDate || now;

  // Calculate days until expiration
  const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Expired
  if (daysUntilExpiration < 0) return 'expired';

  // If job date provided, check if will expire before job
  if (jobDate) {
    const daysUntilJob = Math.floor((jobDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiration < daysUntilJob) return 'expiring_soon';
  } else {
    // No job date - check if expiring within 30 days
    if (daysUntilExpiration < 30) return 'expiring_soon';
  }

  return 'valid';
}

export default function ContractorCard({
  id,
  name,
  distance,
  rating,
  skills,
  certifications = [],
  insurance,
  index,
  isMapExpanded = false,
  onAssign,
  showAssignButton = false,
  onCardClick,
  isAssigned = false,
  jobDate
}: ContractorCardProps) {
  const router = useRouter();
  const coiStatus = getCoiStatus(insurance, jobDate);

  // COI status colors
  // COI status colors - Design System
  const coiColors = {
    expired: { bg: 'var(--ds-error-bg)', border: 'var(--ds-error-border)', text: 'var(--ds-error-text)' },
    expiring_soon: { bg: 'var(--ds-warning-bg)', border: 'var(--ds-warning-border)', text: 'var(--ds-warning-text)' },
    valid: { bg: 'var(--ds-success-bg)', border: 'var(--ds-success-border)', text: 'var(--ds-success-text)' },
    missing: { bg: 'var(--ds-bg-muted)', border: 'var(--ds-border-default)', text: 'var(--ds-text-tertiary)' }
  };

  const coiStatusLabels = {
    expired: 'COI Expired',
    expiring_soon: 'COI Expiring',
    valid: 'COI Valid',
    missing: 'No COI'
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(id);
    } else {
      // Default behavior: navigate to contractor profile
      router.push(`/contractors/${id}`);
    }
  };

  const handleVisitProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCardClick) {
      // Use the provided callback (opens overlay)
      onCardClick(id);
    } else {
      // Default behavior: navigate to contractor profile page
      router.push(`/contractors/${id}`);
    }
  };

  return (
    <motion.div
      className="contractor-card card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      onClick={handleCardClick}
      style={{
        background: isAssigned
          ? 'var(--ds-success-bg)'
          : 'var(--ds-bg-surface)',
        border: isAssigned
          ? '1px solid var(--ds-success-border)'
          : '1px solid var(--ds-border-default)',
        borderRadius: 'var(--ds-radius-lg)',
        padding: 'var(--ds-space-4)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--ds-shadow-sm)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--ds-bg-elevated)';
        e.currentTarget.style.borderColor = 'var(--ds-border-strong)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--ds-shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isAssigned ? 'var(--ds-success-bg)' : 'var(--ds-bg-surface)';
        e.currentTarget.style.borderColor = isAssigned ? 'var(--ds-success-border)' : 'var(--ds-border-default)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--ds-shadow-sm)';
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--ds-space-4)', alignItems: 'center' }}>
        {/* Left Section: Profile Picture + Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)', flex: 1, minWidth: 0 }}>
          {/* Profile Picture */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--ds-radius-full)',
            border: '2px solid var(--ds-border-default)',
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--ds-bg-muted)'
          }}>
            {index % 3 === 0 ? (
              <img
                src={`https://i.pravatar.cc/150?img=${(index % 20) + 1}`}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : index % 3 === 1 ? (
              <div style={{
                width: '100%',
                height: '100%',
                background: 'var(--ds-accent-secondary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--ds-text-base)',
                fontWeight: 'var(--ds-font-bold)',
                color: 'var(--ds-accent-secondary)'
              }}>
                {name.substring(0, 2).toUpperCase()}
              </div>
            ) : (
              <img
                src={`https://i.pravatar.cc/150?img=${((index + 10) % 20) + 1}`}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>

          {/* Name, Distance, and Rating */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-1)', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
              <div style={{
                fontWeight: 'var(--ds-font-semibold)',
                fontSize: 'var(--ds-text-sm)',
                color: 'var(--ds-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {name}
              </div>
              {/* Rating Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-1)', flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.51L6 8.885L2.91 10.51L3.5 7.07L1 4.635L4.455 4.13L6 1Z"
                    fill={rating >= 4.5 ? 'var(--ds-success)' : 'var(--ds-warning)'}
                  />
                </svg>
                <span style={{
                  fontWeight: 'var(--ds-font-semibold)',
                  fontSize: 'var(--ds-text-xs)',
                  color: rating >= 4.5 ? 'var(--ds-success-text)' : 'var(--ds-warning-text)'
                }}>
                  {rating.toFixed(1)}
                </span>
              </div>
            </div>
            <div style={{
              fontSize: 'var(--ds-text-xs)',
              color: 'var(--ds-text-secondary)'
            }}>
              {distance.toFixed(1)} mi away
            </div>
          </div>
        </div>

        {/* Right Section: Skills, Certifications, COI, and Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)', justifyContent: 'flex-end', maxWidth: '50%' }}>
          {/* Badges Container */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ds-space-2)', justifyContent: 'flex-end' }}>
            {/* Trade Skills */}
            {skills.map((skill, idx) => (
              <span
                key={`skill-${idx}`}
                className="badge badge-default"
                style={{
                  fontSize: 'var(--ds-text-xs)',
                  fontWeight: 'var(--ds-font-medium)',
                  whiteSpace: 'nowrap'
                }}
              >
                {skill}
              </span>
            ))}

            {/* Certifications (show first 2 only) */}
            {certifications.slice(0, 2).map((cert) => (
              <span
                key={cert.id}
                className="badge badge-info"
                style={{
                  fontSize: 'var(--ds-text-xs)',
                  fontWeight: 'var(--ds-font-medium)',
                  whiteSpace: 'nowrap'
                }}
                title={cert.expirationDate ? `Expires: ${new Date(cert.expirationDate).toLocaleDateString()}` : ''}
              >
                {cert.name}
              </span>
            ))}

            {/* Show "+X more" if there are more than 2 certifications */}
            {certifications.length > 2 && (
              <span
                style={{
                  fontSize: 'var(--ds-text-xs)',
                  fontWeight: 'var(--ds-font-medium)',
                  color: 'var(--ds-text-secondary)',
                  background: 'var(--ds-bg-muted)',
                  border: '1px solid var(--ds-border-default)',
                  borderRadius: 'var(--ds-radius-sm)',
                  padding: '2px 8px',
                  whiteSpace: 'nowrap'
                }}
              >
                +{certifications.length - 2} more
              </span>
            )}

            {/* COI Status Badge */}
            <span
              style={{
                fontSize: 'var(--ds-text-xs)',
                fontWeight: 'var(--ds-font-semibold)',
                color: coiColors[coiStatus].text,
                background: coiColors[coiStatus].bg,
                border: `1px solid ${coiColors[coiStatus].border}`,
                borderRadius: 'var(--ds-radius-sm)',
                padding: '2px 8px',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              title={coiStatusLabels[coiStatus]}
            >
              COI
            </span>
          </div>

          {/* Visit Profile Button (replaces Assign) */}
          {showAssignButton ? (
            <button
              onClick={handleVisitProfile}
              className="btn btn-secondary btn-sm"
              style={{
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              Visit Profile
            </button>
          ) : null}
        </div>
      </div>

      {/* Hover indicator */}
      <div style={{
        position: 'absolute',
        bottom: 'var(--ds-space-2)',
        right: 'var(--ds-space-2)',
        fontSize: 'var(--ds-text-xs)',
        color: 'var(--ds-text-tertiary)',
        opacity: 0,
        transition: 'opacity 0.2s'
      }}
      className="view-profile-hint"
      >
        Click to view profile →
      </div>

      <style jsx>{`
        div:hover .view-profile-hint {
          opacity: 1;
        }
      `}</style>
    </motion.div>
  );
}
