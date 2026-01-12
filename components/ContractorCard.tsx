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
  const coiColors = {
    expired: { bg: 'rgba(239, 68, 68, 0.2)', border: '#EF4444', text: '#EF4444' },
    expiring_soon: { bg: 'rgba(251, 146, 60, 0.2)', border: '#FB923C', text: '#FB923C' },
    valid: { bg: 'rgba(16, 185, 129, 0.2)', border: '#10B981', text: '#10B981' },
    missing: { bg: 'rgba(156, 163, 175, 0.2)', border: '#9CA3AF', text: '#9CA3AF' }
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
      className="contractor-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      onClick={handleCardClick}
      style={{
        background: isAssigned
          ? 'rgba(16, 185, 129, 0.14)'
          : (isMapExpanded ? 'var(--tech-card-bg)' : 'var(--tech-card-bg-collapsed)'),
        backdropFilter: isMapExpanded ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: isMapExpanded ? 'blur(8px)' : 'none',
        border: 'var(--container-border)',
        borderRadius: 'var(--container-border-radius)',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.6s ease',
        position: 'relative',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        filter: 'brightness(1.15)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--tech-card-hover-bg)';
        e.currentTarget.style.borderColor = 'var(--container-hover-border)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        const originalBg = isAssigned
          ? 'rgba(16, 185, 129, 0.14)'
          : (isMapExpanded ? 'var(--tech-card-bg)' : 'var(--tech-card-bg-collapsed)');
        e.currentTarget.style.background = originalBg;
        e.currentTarget.style.borderColor = 'var(--stroke-subtle)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {/* Left Section: Profile Picture + Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          {/* Profile Picture */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'var(--container-border)',
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--tech-avatar-bg)'
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
                background: 'linear-gradient(135deg, var(--tech-gradient-overlay) 0%, rgba(178, 173, 201, 0.4) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-xl)',
                fontWeight: 700,
                color: 'var(--text-primary)'
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                color: '#FFFFFF',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {name}
              </div>
              {/* Rating Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.51L6 8.885L2.91 10.51L3.5 7.07L1 4.635L4.455 4.13L6 1Z"
                    fill={rating >= 4.5 ? 'var(--tech-rating-high)' : 'var(--tech-rating-medium)'}
                  />
                </svg>
                <span style={{
                  fontFamily: 'var(--font-text-body)',
                  fontWeight: 600,
                  fontSize: 12,
                  color: rating >= 4.5 ? 'var(--tech-rating-high)' : 'var(--tech-rating-medium)'
                }}>
                  {rating.toFixed(1)}
                </span>
              </div>
            </div>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: 12,
              color: '#FFFFFF'
            }}>
              {distance.toFixed(1)} mi away
            </div>
          </div>
        </div>

        {/* Right Section: Skills, Certifications, COI, and Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', maxWidth: '50%' }}>
          {/* Badges Container */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
            {/* Trade Skills */}
            {skills.map((skill, idx) => (
              <span
                key={`skill-${idx}`}
                style={{
                  fontFamily: 'var(--font-text-body)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  background: 'var(--tech-skill-badge-bg)',
                  border: '1px solid var(--tech-skill-badge-border)',
                  borderRadius: 4,
                  padding: '2px 8px',
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
                style={{
                  fontFamily: 'var(--font-text-body)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 500,
                  color: '#FFFFFF',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: 4,
                  padding: '2px 8px',
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
                  fontFamily: 'var(--font-text-body)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 4,
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
                fontFamily: 'var(--font-text-body)',
                fontSize: 'var(--font-xs)',
                fontWeight: 600,
                color: coiColors[coiStatus].text,
                background: coiColors[coiStatus].bg,
                border: `1px solid ${coiColors[coiStatus].border}`,
                borderRadius: 4,
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
              style={{
                fontFamily: 'var(--font-text-body)',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                background: 'transparent',
                border: '1px solid rgba(249, 243, 229, 0.5)',
                borderRadius: 6,
                padding: '6px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(249, 243, 229, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(249, 243, 229, 0.8)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(249, 243, 229, 0.5)';
                e.currentTarget.style.transform = 'translateY(0)';
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
        bottom: 8,
        right: 8,
        fontFamily: 'var(--font-text-body)',
        fontSize: 'var(--font-xs)',
        color: 'var(--text-placeholder)',
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
