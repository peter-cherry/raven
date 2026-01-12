'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

export interface ProgressStep<T = string> {
  key: T;
  label: string;
  icon?: ReactNode;
  loadingAnimation?: 'bounce' | 'pulse' | 'spin' | 'float';
  fontWeight?: number;
}

export type StepStatus = 'pending' | 'in_progress' | 'completed';

interface ProgressTimelineProps<T = string> {
  /** Array of step objects */
  steps: ProgressStep<T>[];

  /** Current active step key */
  currentStep: T;

  /** Function to get status for each step */
  getStepStatus: (stepKey: T) => StepStatus;

  /** Container height when collapsed (default: 60) */
  containerHeight?: number;

  /** Icon size in pixels (default: 22.5) */
  iconSize?: number;

  /** Font size for step labels (default: 14) */
  fontSize?: number;

  /** Gap between icon and text (default: 16.5) */
  iconTextGap?: number;

  /** Gap between icon and connecting line (default: 16) */
  lineGap?: number;

  /** Height of connecting line (default: 16) */
  lineHeight?: number;

  /** Width of connecting line (default: 2) */
  lineWidth?: number;

  /** Color of connecting line (default: rgba(249, 243, 229, 0.33)) */
  lineColor?: string;

  /** Total spacing between icon start positions (default: 70.5) */
  stepSpacing?: number;

  /** Dot size (default: 8) */
  dotSize?: number;

  /** Dot color (default: #BAB3C4) */
  dotColor?: string;

  /** Line animation duration (default: 0.8s) */
  lineAnimationDuration?: number;

  /** Icon color when completed (default: #83C596) */
  completedIconColor?: string;

  /** Icon color when in progress or pending (default: rgba(249, 243, 229, 0.33)) */
  defaultIconColor?: string;

  /** Custom icon renderer function */
  renderIcon?: (stepKey: T, isCompleted: boolean) => ReactNode;

  /** Show shimmer effect on loading text (default: true) */
  showShimmer?: boolean;

  /** Container vertical centering offset (default: 1.75) */
  centerOffset?: number;
}

// Typing animation component
function TypingText({ text, delay = 0, speed = 30 }: { text: string; delay?: number; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay, speed]);

  return <>{displayedText}</>;
}

export default function ProgressTimeline<T extends string = string>({
  steps,
  currentStep,
  getStepStatus,
  containerHeight = 60,
  iconSize = 22.5,
  fontSize = 14,
  iconTextGap = 45,
  lineGap = 18.75,
  lineHeight = 20,
  lineWidth = 2,
  lineColor = 'rgba(249, 243, 229, 0.33)',
  stepSpacing = 80,
  dotSize = 8,
  dotColor = '#BAB3C4',
  lineAnimationDuration = 0.8,
  completedIconColor = '#83C596',
  defaultIconColor = 'rgba(249, 243, 229, 0.33)',
  renderIcon,
  showShimmer = true,
  centerOffset = 1.75
}: ProgressTimelineProps<T>) {

  // Calculate positions for each step
  const stepPositions = steps.reduce((acc, step, index) => {
    acc[step.key] = index * stepSpacing;
    return acc;
  }, {} as Record<T, number>);

  const currentIndex = steps.findIndex(s => s.key === currentStep);
  const currentStepY = stepPositions[currentStep] || 0;

  // Calculate total container height based on steps
  const totalHeight = (steps.length - 1) * stepSpacing + iconSize;

  // Calculate centering offset for smooth scrolling
  const topOffset = centerOffset - currentStepY;

  // Default icon renderer using SVG checkmark
  const defaultRenderIcon = (stepKey: T, isCompleted: boolean) => {
    const step = steps.find(s => s.key === stepKey);
    if (step?.icon) return step.icon;

    const iconColor = isCompleted ? completedIconColor : defaultIconColor;

    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 18 18" fill="none">
        <path
          d="M14 5L7 12L4 9"
          stroke={iconColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const iconRenderer = renderIcon || defaultRenderIcon;

  // Get loading animation config for step
  const getLoadingAnimation = (step: ProgressStep<T>) => {
    const animationType = step.loadingAnimation || 'pulse';

    switch (animationType) {
      case 'bounce':
        // Perfect circular motion using sin/cos pattern - smooth orbit
        const radius = 3;
        return {
          animate: {
            x: [0, radius, radius * 0.707, 0, -radius * 0.707, -radius, -radius * 0.707, 0, radius * 0.707, radius, 0],
            y: [0, 0, radius * 0.707, radius, radius * 0.707, 0, -radius * 0.707, -radius, -radius * 0.707, 0, 0],
            opacity: 1
          },
          transition: {
            duration: 2.5,
            repeat: Infinity
          }
        };
      case 'pulse':
        return {
          animate: { scale: [1, 1.15, 1] },
          transition: { duration: 1.5, repeat: Infinity }
        };
      case 'spin':
        return {
          animate: { rotate: [0, 360] },
          transition: { duration: 3, repeat: Infinity }
        };
      case 'float':
        return {
          animate: { y: [0, -4, 0] },
          transition: { duration: 0.8, repeat: Infinity }
        };
      default:
        return { animate: {}, transition: {} };
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: containerHeight,
      overflow: 'visible'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: totalHeight,
        left: 0, // Respects parent container padding
        top: topOffset,
        transition: 'top 0.5s ease-out'
      }}>
        {steps.map((step, index) => {
          const status = getStepStatus(step.key);
          const stepIndex = index;

          // Only show up to current step
          const isVisible = stepIndex <= currentIndex;
          const isLoading = status === 'in_progress';
          const isCompleted = status === 'completed';

          if (!isVisible) return null;

          const yPos = stepPositions[step.key];
          const loadingAnim = getLoadingAnimation(step);

          return (
            <motion.div
              key={String(step.key)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ position: 'relative', overflow: 'visible' }}
            >
              {/* Connecting Line extending DOWN from this icon to next step */}
              {index < steps.length - 1 && isCompleted && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{
                    height: lineHeight,
                    opacity: 1
                  }}
                  transition={{
                    duration: lineAnimationDuration,
                    ease: "easeOut"
                  }}
                  style={{
                    position: 'absolute',
                    left: (iconSize / 2) - (lineWidth / 2), // Center line with icon
                    top: yPos + iconSize + lineGap, // Below icon + gap
                    width: lineWidth,
                    background: lineColor,
                    borderRadius: '1px',
                    transformOrigin: 'top'
                  }}
                />
              )}

              {/* Dot that morphs into Icon */}
              <motion.div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: yPos,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'visible'
                }}
              >
                {/* Dot - scales up from 0, then scales away when icon appears */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: (isLoading || isCompleted) ? 0 : (isVisible ? 1 : 0),
                    scale: (isLoading || isCompleted) ? 0 : (isVisible ? 1 : 0)
                  }}
                  transition={{
                    delay: index > 0 ? 0.3 : 0,
                    duration: 0.25,
                    ease: "easeOut"
                  }}
                  style={{
                    position: 'absolute',
                    width: dotSize,
                    height: dotSize,
                    borderRadius: '50%',
                    background: dotColor
                  }}
                />

                {/* Icon - appears as dot fades */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{
                    opacity: isLoading || isCompleted ? 1 : 0,
                    scale: isLoading || isCompleted ? 1 : 0.3,
                    ...(isLoading ? loadingAnim.animate : {})
                  }}
                  transition={{
                    opacity: {
                      delay: index > 0 ? 0.5 : 0.2,
                      duration: 0.3
                    },
                    scale: {
                      delay: index > 0 ? 0.5 : 0.2,
                      duration: 0.3
                    },
                    ...(isLoading ? loadingAnim.transition : {})
                  }}
                  style={{
                    width: iconSize,
                    height: iconSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {/* Icon wrapper for completion scale animation */}
                  <motion.div
                    animate={{
                      scale: isCompleted ? [1, 1.2, 1] : 1
                    }}
                    transition={{
                      duration: 0.6,
                      ease: "easeOut"
                    }}
                  >
                    {iconRenderer(step.key, isCompleted)}
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Text Label */}
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                transition={{
                  delay: index > 0 ? 0.7 : 0.4,
                  duration: 0.4,
                  ease: "easeOut"
                }}
                style={{
                  position: 'absolute',
                  left: iconSize + iconTextGap,
                  top: yPos - 2,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                  fontSize: step.label.length > 50 ? fontSize * 0.9 : fontSize,
                  fontWeight: step.fontWeight || 400,
                  lineHeight: step.label.length > 50 ? `${fontSize * 1.2}px` : `${fontSize * 1.3}px`,
                  color: '#FFFFFF',
                  whiteSpace: 'normal',
                  wordWrap: 'break-word',
                  maxWidth: '280px',
                  paddingRight: '40px',
                  overflow: 'visible'
                }}
              >
                <TypingText
                  text={step.label}
                  delay={(index > 0 ? 700 : 400) + 200}
                  speed={30}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
