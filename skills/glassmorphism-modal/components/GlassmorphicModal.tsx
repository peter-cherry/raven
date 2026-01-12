'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlassmorphicModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  height?: number;
  showCloseButton?: boolean;
  backgroundImage?: string;
  backgroundOpacity?: number;
  backgroundBlur?: string;
  animateFrom?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
}

/**
 * GlassmorphicModal - Reusable modal with glassmorphism effect
 *
 * Based on Raven Search dispatch loader design tokens.
 * Provides backdrop blur, semi-transparent background, and smooth animations.
 *
 * @example
 * ```tsx
 * <GlassmorphicModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   width={915}
 *   height={800}
 * >
 *   <YourContent />
 * </GlassmorphicModal>
 * ```
 */
export default function GlassmorphicModal({
  isOpen,
  onClose,
  children,
  width = 915,
  height = 800,
  showCloseButton = true,
  backgroundImage = 'url("https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920&h=1080&fit=crop&q=90")',
  backgroundOpacity = 0.2,
  backgroundBlur = '4px',
  animateFrom
}: GlassmorphicModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 68, // Sidebar offset
            right: 0,
            bottom: 0,
            zIndex: 9999, // var(--z-modal-backdrop)
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto'
          }}
        >
          {/* Background Image with Blur */}
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: backgroundOpacity, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: `blur(${backgroundBlur})`,
              zIndex: -1,
              pointerEvents: 'none'
            }}
          />

          {/* Modal Container with Glassmorphism */}
          <motion.div
            initial={animateFrom ? {
              width: animateFrom.width || width,
              height: animateFrom.height || height,
              x: animateFrom.x || 0,
              y: animateFrom.y || 0,
              opacity: 0.8,
              scale: 0.95
            } : {
              opacity: 0,
              scale: 0.95
            }}
            animate={{
              width,
              height,
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1
            }}
            exit={{
              opacity: 0,
              scale: 0.95
            }}
            transition={{
              duration: 1,
              ease: [0.22, 1, 0.36, 1],
              width: { duration: 0.8 },
              x: { duration: 1 },
              y: { duration: 1 }
            }}
            style={{
              position: 'relative',
              background: 'rgba(47, 47, 47, 0.3)', // var(--modal-bg)
              backdropFilter: 'blur(12px)', // var(--modal-backdrop-blur)
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(154, 150, 213, 0.3)', // var(--modal-border)
              borderRadius: 16, // var(--modal-border-radius)
              boxShadow: '0px 0px 22.9px rgba(0, 0, 0, 0.21)', // var(--modal-shadow)
              padding: 40, // var(--modal-padding)
              overflow: 'visible',
              zIndex: 10000 // var(--z-modal-content)
            }}
          >
            {/* Close Button */}
            {showCloseButton && (
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  width: 32, // var(--btn-close-size)
                  height: 32,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s', // var(--transition-hover)
                  zIndex: 1000 // var(--z-close-button)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M5 5L15 15M15 5L5 15"
                    stroke="#B4B4C4" // var(--text-close-btn)
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}

            {/* Content */}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
