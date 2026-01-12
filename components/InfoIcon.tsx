"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface InfoIconProps {
  tooltip: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function InfoIcon({ tooltip, position = 'top' }: InfoIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isHovered && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top + scrollY - 8;
          left = rect.left + scrollX + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + scrollY + 8;
          left = rect.left + scrollX + rect.width / 2;
          break;
        case 'left':
          top = rect.top + scrollY + rect.height / 2;
          left = rect.left + scrollX - 8;
          break;
        case 'right':
          top = rect.top + scrollY + rect.height / 2;
          left = rect.right + scrollX + 8;
          break;
      }

      setTooltipPos({ top, left });
    }
  }, [isHovered, position, mounted]);

  // Calculate tooltip position based on prop (for transform)
  const getTooltipTransform = () => {
    switch (position) {
      case 'top':
        return 'translate(-50%, -100%)';
      case 'bottom':
        return 'translate(-50%, 0%)';
      case 'left':
        return 'translate(-100%, -50%)';
      case 'right':
        return 'translate(0%, -50%)';
    }
  };

  const tooltipContent = (isHovered && mounted) ? (
    <div
      style={{
        position: 'fixed',
        top: `${tooltipPos.top}px`,
        left: `${tooltipPos.left}px`,
        transform: getTooltipTransform(),
        minWidth: '200px',
        maxWidth: '280px',
        padding: '12px',
        background: 'rgba(47, 47, 47, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(154, 150, 213, 0.3)',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 999999,
        pointerEvents: 'none',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        color: '#FFFFFF',
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.5
      }}
    >
      {tooltip}
    </div>
  ) : null;

  return (
    <>
      <div
        ref={iconRef}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto'  // Ensure this div can receive pointer events
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Info Icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: '#9a96d5',
            cursor: 'help',
            opacity: 0.7,
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>

      {/* Tooltip Portal */}
      {mounted && typeof document !== 'undefined' && tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  );
}
