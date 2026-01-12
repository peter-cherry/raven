'use client';

import InteractiveDottedMap from './InteractiveDottedMap';

interface MapBackgroundProps {
  onToggleSearch?: () => void;
}

export default function MapBackground({ onToggleSearch }: MapBackgroundProps) {

  return (
    <>
      {/* Dark purple background layer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          background: '#404063'
        }}
      />

      {/* Interactive dotted USA map overlay */}
      <InteractiveDottedMap />

      {/* Toggle search box button - top right corner */}
      <button
        onClick={() => {
          if (onToggleSearch) {
            onToggleSearch();
          }
        }}
        style={{
          position: 'fixed',
          top: '80px',
          right: '70px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#656290',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          pointerEvents: 'auto',
          zIndex: 10,
          transition: 'transform 0.2s, background 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.background = '#7E7AA8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = '#656290';
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="10" y1="5" x2="10" y2="15" />
          <line x1="5" y1="10" x2="15" y2="10" />
        </svg>
      </button>
    </>
  );
}
