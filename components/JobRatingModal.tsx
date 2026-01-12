'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface JobRatingModalProps {
  jobId: string;
  technicianId: string;
  technicianName: string;
  onClose: () => void;
  onSubmit: (rating: RatingData) => Promise<void>;
}

export interface RatingData {
  job_id: string;
  technician_id: string;
  quality_rating: number;
  professionalism_rating: number;
  timeliness_rating: number;
  communication_rating: number;
  feedback_text?: string;
}

export default function JobRatingModal({
  jobId,
  technicianId,
  technicianName,
  onClose,
  onSubmit
}: JobRatingModalProps) {
  const [qualityRating, setQualityRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hoveredStar, setHoveredStar] = useState<{ dimension: string; star: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const allRatingsSet = qualityRating > 0 && professionalismRating > 0 && timelinessRating > 0 && communicationRating > 0;

  const handleSubmit = async () => {
    if (!allRatingsSet) {
      setError('Please provide all 4 ratings');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        job_id: jobId,
        technician_id: technicianId,
        quality_rating: qualityRating,
        professionalism_rating: professionalismRating,
        timeliness_rating: timelinessRating,
        communication_rating: communicationRating,
        feedback_text: feedback.trim() || undefined
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    currentRating: number,
    setRating: (rating: number) => void,
    dimension: string
  ) => {
    return (
      <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
        {[1, 2, 3, 4, 5].map(star => {
          const isHovered = hoveredStar?.dimension === dimension && hoveredStar.star >= star;
          const isFilled = currentRating >= star;
          const shouldFill = isHovered || isFilled;

          return (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar({ dimension, star })}
              onMouseLeave={() => setHoveredStar(null)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill={shouldFill ? '#F59E0B' : 'none'}
                stroke={shouldFill ? '#F59E0B' : 'var(--input-stroke-color)'}
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--spacing-xl)'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: 600,
            width: '100%',
            background: 'transparent',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            filter: 'brightness(1.3)',
            border: '2px solid #10B981',
            borderRadius: 'var(--modal-border-radius)',
            padding: 'var(--spacing-2xl)',
            position: 'relative'
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 'var(--spacing-lg)',
              right: 'var(--spacing-lg)',
              width: 40,
              height: 40,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="4" y1="4" x2="16" y2="16" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="16" y1="4" x2="4" y2="16" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          {/* Header */}
          <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <h2 style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'var(--font-3xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Rate This Job
            </h2>
            <p style={{
              fontSize: 'var(--font-md)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6
            }}>
              How was your experience with <strong style={{ color: 'var(--text-primary)' }}>{technicianName}</strong>?
            </p>
          </div>

          {/* Rating Dimensions */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-2xl)'
          }}>
            {/* Quality Rating */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-sm)',
                letterSpacing: '0.5px'
              }}>
                QUALITY OF WORK
              </label>
              {renderStars(qualityRating, setQualityRating, 'quality')}
            </div>

            {/* Professionalism Rating */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-sm)',
                letterSpacing: '0.5px'
              }}>
                PROFESSIONALISM
              </label>
              {renderStars(professionalismRating, setProfessionalismRating, 'professionalism')}
            </div>

            {/* Timeliness Rating */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-sm)',
                letterSpacing: '0.5px'
              }}>
                TIMELINESS
              </label>
              {renderStars(timelinessRating, setTimelinessRating, 'timeliness')}
            </div>

            {/* Communication Rating */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-sm)',
                letterSpacing: '0.5px'
              }}>
                COMMUNICATION
              </label>
              {renderStars(communicationRating, setCommunicationRating, 'communication')}
            </div>
          </div>

          {/* Feedback Text (Optional) */}
          <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)',
              letterSpacing: '0.5px'
            }}>
              FEEDBACK (OPTIONAL)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share additional comments about your experience..."
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--input-stroke-color)',
                borderRadius: 'var(--btn-corner-radius)',
                padding: 'var(--spacing-md)',
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-regular)',
                fontFamily: 'var(--font-text-body)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical',
                minHeight: 100
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #EF4444',
              borderRadius: 'var(--btn-corner-radius)',
              padding: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-lg)',
              color: '#EF4444',
              fontSize: 'var(--font-sm)'
            }}>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              className="outline-button"
              style={{
                padding: '12px 24px',
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allRatingsSet || isSubmitting}
              className="primary-button"
              style={{
                padding: '12px 24px',
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                opacity: !allRatingsSet || isSubmitting ? 0.5 : 1,
                cursor: !allRatingsSet || isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)'
              }}
            >
              {isSubmitting && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>

          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
