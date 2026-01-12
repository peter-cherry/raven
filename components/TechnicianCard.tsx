'use client';

import { motion } from 'framer-motion';

interface TechnicianCardProps {
  id: string;
  name: string;
  distance: number;
  rating: number;
  skills: string[];
  index: number;
  isMapExpanded?: boolean;
  onAssign?: (techId: string) => void;
  showAssignButton?: boolean;
  onCardClick?: (techId: string) => void;
  isAssigned?: boolean;
}

export default function TechnicianCard({
  id,
  name,
  distance,
  rating,
  skills,
  index,
  isMapExpanded = false,
  onAssign,
  showAssignButton = false,
  onCardClick,
  isAssigned = false
}: TechnicianCardProps) {
  console.log('[TECH-CARD] Rendering card for:', name, 'isAssigned:', isAssigned, 'showAssignButton:', showAssignButton, 'onAssign:', !!onAssign);
  return (
    <motion.div
      className="technician-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      onClick={() => onCardClick?.(id)}
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
        // Restore original background based on isAssigned state
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
          {/* Profile Picture with mockup images */}
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'var(--container-border)',
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--tech-avatar-bg)'
          }}>
            {/* Use different images based on index for variety */}
            {index % 3 === 0 ? (
              // Portrait photo
              <img
                src={`https://i.pravatar.cc/150?img=${(index % 20) + 1}`}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : index % 3 === 1 ? (
              // Company logo placeholder
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
              // Another portrait variation
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
              {/* Rating Badge inline */}
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

        {/* Right Section: Skills and Assign Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', maxWidth: '45%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
            {skills.map((skill, idx) => (
              <span
                key={idx}
                style={{
                  fontFamily: 'var(--font-text-body)',
                  fontSize: 'var(--font-sm)',
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
          </div>

          {/* Assign Button */}
          {showAssignButton && onAssign && (
            <button
              onClick={(e) => {
                console.log('[BUTTON] Assign button clicked for tech:', id);
                e.stopPropagation();
                console.log('[BUTTON] About to call onAssign');
                onAssign(id);
                console.log('[BUTTON] onAssign called');
              }}
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
              Assign
            </button>
          )}
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
