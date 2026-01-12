'use client';

import { useState, ReactNode } from 'react';

interface ExpandableContainerProps {
  children: ReactNode;
  collapsedHeight?: number;
  expandedHeight?: number;
  collapsedWidth?: number;
  expandedWidth?: number;
  showExpandButton?: boolean;
  showFadeGradient?: boolean;
  defaultExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ExpandableContainer - Glassmorphic container with expand/collapse functionality
 *
 * Based on Raven Search dispatch loader design tokens.
 * Features:
 * - Semi-transparent background with subtle border
 * - Expandable height/width with smooth transitions
 * - Chevron toggle button
 * - Optional fade gradient when collapsed
 * - Hover states
 *
 * @example
 * ```tsx
 * <ExpandableContainer
 *   collapsedHeight={120}
 *   expandedHeight={240}
 *   showFadeGradient={true}
 * >
 *   <YourContent />
 * </ExpandableContainer>
 * ```
 */
export default function ExpandableContainer({
  children,
  collapsedHeight = 120,
  expandedHeight = 240,
  collapsedWidth,
  expandedWidth,
  showExpandButton = true,
  showFadeGradient = true,
  defaultExpanded = false,
  onExpandChange,
  className = '',
  style = {}
}: ExpandableContainerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandChange?.(newState);
  };

  return (
    <div
      className={className}
      style={{
        width: isExpanded && expandedWidth ? expandedWidth : collapsedWidth,
        height: isExpanded ? expandedHeight : collapsedHeight,
        background: 'rgba(178, 173, 201, 0.05)', // var(--container-bg)
        border: '1px solid rgba(249, 243, 229, 0.11)', // var(--container-border)
        borderRadius: 8, // var(--container-border-radius)
        overflow: 'hidden',
        transition: 'all 0.3s ease', // var(--transition-expand)
        position: 'relative',
        ...style
      }}
    >
      {/* Expand/Collapse Button */}
      {showExpandButton && (
        <button
          onClick={handleToggle}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 24, // var(--btn-expand-size)
            height: 24,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            zIndex: 20 // var(--z-chevron-button)
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6L8 10L12 6"
              stroke="#F9F3E5" // var(--text-chevron)
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.6} // var(--text-chevron-opacity)
            />
          </svg>
        </button>
      )}

      {/* Content */}
      {children}

      {/* Bottom Fade Gradient - Only show when collapsed */}
      {!isExpanded && showFadeGradient && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
            background: 'linear-gradient(180deg, rgba(178, 173, 201, 0) 0%, rgba(178, 173, 201, 0.05) 30%, rgba(178, 173, 201, 0.05) 100%)', // var(--container-fade-gradient)
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
}
