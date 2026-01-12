'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export type ProgressStepStatus = 'completed' | 'in_progress' | 'pending';

export interface ProgressStep {
  key: string;
  label: string;
  icon?: ReactNode;
  fontWeight?: number;
}

interface ProgressTimelineProps {
  steps: ProgressStep[];
  currentStepIndex: number;
  stepSpacing?: number;
  dotSize?: number;
  lineWidth?: number;
  lineHeight?: number;
  iconSize?: number;
  showIcons?: boolean;
  showShimmer?: boolean;
}

/**
 * ProgressTimeline - Vertical timeline with animated progress steps
 *
 * Based on Raven Search dispatch loader design tokens.
 * Features:
 * - Vertical timeline with dots and connecting lines
 * - Smooth reveal animations (line → dot → text → icon)
 * - Shimmer effect for active step
 * - Custom icons per step
 * - State-based styling (completed, in_progress, pending)
 *
 * @example
 * ```tsx
 * <ProgressTimeline
 *   steps={[
 *     { key: 'created', label: 'Order Created', icon: <CheckIcon /> },
 *     { key: 'searching', label: 'Searching...', icon: <SearchIcon /> }
 *   ]}
 *   currentStepIndex={1}
 *   showShimmer={true}
 * />
 * ```
 */
export default function ProgressTimeline({
  steps,
  currentStepIndex,
  stepSpacing = 35,
  dotSize = 8,
  lineWidth = 2,
  lineHeight = 17,
  iconSize = 18,
  showIcons = true,
  showShimmer = true
}: ProgressTimelineProps) {

  const getStepStatus = (stepIndex: number): ProgressStepStatus => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'in_progress';
    return 'pending';
  };

  return (
    <div style={{
      position: 'relative',
      width: 350,
      minHeight: steps.length * stepSpacing
    }}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isVisible = index <= currentStepIndex;
        const isLoading = status === 'in_progress';
        const yPos = index * stepSpacing;

        if (!isVisible) return null;

        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'relative'
            }}
          >
            {/* Connecting Line from previous step */}
            {index > 0 && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: lineHeight }}
                transition={{
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1]
                }}
                style={{
                  position: 'absolute',
                  left: (dotSize - lineWidth) / 2,
                  top: yPos - (stepSpacing - lineHeight),
                  width: lineWidth,
                  background: '#BAB3C4', // var(--progress-line-color)
                  borderRadius: '1px',
                  transformOrigin: 'top'
                }}
              />
            )}

            {/* Dot */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index > 0 ? 0.3 : 0,
                duration: 0.2,
                ease: [0.22, 1, 0.36, 1]
              }}
              style={{
                position: 'absolute',
                left: 0,
                top: yPos,
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                background: '#BAB3C4' // var(--progress-dot-color)
              }}
            />

            {/* Text Label */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: index > 0 ? 0.5 : 0.2,
                duration: 0.3
              }}
              style={{
                position: 'absolute',
                left: 25,
                top: yPos - 5,
                fontFamily: 'Roboto Mono, monospace', // var(--font-progress-step)
                fontSize: 10, // var(--font-progress-step-size)
                fontWeight: step.fontWeight || 400,
                lineHeight: '1.31884765625em', // var(--font-progress-step-line-height)
                color: '#FFFFFF', // var(--text-primary)
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                animation: isLoading && showShimmer ? 'shimmer 1.5s ease-in-out infinite' : 'none'
              }}
            >
              {step.label}

              {/* Icon */}
              {showIcons && step.icon && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: 1,
                    scale: 1
                  }}
                  transition={{
                    delay: index > 0 ? 0.5 : 0.2,
                    duration: 0.3
                  }}
                  style={{
                    width: iconSize,
                    height: iconSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {step.icon}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
