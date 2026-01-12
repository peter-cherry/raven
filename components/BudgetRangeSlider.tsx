'use client';

import { useState, useRef, useEffect } from 'react';

interface BudgetRangeSliderProps {
  min?: number;
  max?: number;
  onChange: (min: number, max: number) => void;
  defaultMin?: number;
  defaultMax?: number;
}

export default function BudgetRangeSlider({
  min = 0,
  max = 10000,
  onChange,
  defaultMin = 500,
  defaultMax = 2000
}: BudgetRangeSliderProps) {
  const [minValue, setMinValue] = useState(defaultMin);
  const [maxValue, setMaxValue] = useState(defaultMax);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const value = Math.round(min + (max - min) * percentage);

    if (isDragging === 'min') {
      setMinValue(Math.min(value, maxValue - 100));
      onChange(Math.min(value, maxValue - 100), maxValue);
    } else {
      setMaxValue(Math.max(value, minValue + 100));
      onChange(minValue, Math.max(value, minValue + 100));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, minValue, maxValue]);

  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;

  const formatCurrency = (value: number) => {
    if (value >= 10000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div style={{
      padding: 'var(--spacing-lg)',
      userSelect: 'none'
    }}>
      {/* Value Display */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 'var(--spacing-xl)',
        fontFamily: 'var(--font-text-body)'
      }}>
        <div>
          <div style={{
            fontSize: 'var(--font-xs)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Minimum
          </div>
          <div style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)'
          }}>
            {formatCurrency(minValue)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 'var(--font-xs)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Maximum
          </div>
          <div style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)'
          }}>
            {formatCurrency(maxValue)}
          </div>
        </div>
      </div>

      {/* Slider Track */}
      <div
        ref={sliderRef}
        style={{
          position: 'relative',
          height: 40,
          cursor: 'pointer'
        }}
      >
        {/* Background Track */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 6,
          transform: 'translateY(-50%)',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 3
        }} />

        {/* Active Range */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: `${minPercent}%`,
          width: `${maxPercent - minPercent}%`,
          height: 6,
          transform: 'translateY(-50%)',
          background: 'linear-gradient(90deg, #656290, #8B90E0)',
          borderRadius: 3
        }} />

        {/* Min Handle */}
        <div
          onMouseDown={() => setIsDragging('min')}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${minPercent}%`,
            transform: 'translate(-50%, -50%)',
            width: 20,
            height: 20,
            background: '#656290',
            border: '3px solid #FFFFFF',
            borderRadius: '50%',
            cursor: 'grab',
            transition: isDragging === 'min' ? 'none' : 'all 0.1s ease',
            boxShadow: isDragging === 'min' ? '0 0 0 4px rgba(101, 98, 144, 0.3)' : '0 2px 4px rgba(0,0,0,0.3)'
          }}
        />

        {/* Max Handle */}
        <div
          onMouseDown={() => setIsDragging('max')}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${maxPercent}%`,
            transform: 'translate(-50%, -50%)',
            width: 20,
            height: 20,
            background: '#8B90E0',
            border: '3px solid #FFFFFF',
            borderRadius: '50%',
            cursor: 'grab',
            transition: isDragging === 'max' ? 'none' : 'all 0.1s ease',
            boxShadow: isDragging === 'max' ? '0 0 0 4px rgba(139, 144, 224, 0.3)' : '0 2px 4px rgba(0,0,0,0.3)'
          }}
        />
      </div>

      {/* Scale Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 'var(--spacing-md)',
        fontSize: 'var(--font-xs)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-text-body)'
      }}>
        <span>{formatCurrency(min)}</span>
        <span>{formatCurrency(max / 2)}</span>
        <span>{formatCurrency(max)}+</span>
      </div>
    </div>
  );
}
