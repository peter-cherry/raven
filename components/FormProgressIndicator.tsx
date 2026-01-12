'use client';

interface FormProgressIndicatorProps {
  currentStep: number;
  steps: Array<{ label: string; icon?: string }>;
  onStepClick?: (stepIndex: number) => void;
}

export default function FormProgressIndicator({ currentStep, steps, onStepClick }: FormProgressIndicatorProps) {
  console.log('[FormProgressIndicator] Rendering - onStepClick:', !!onStepClick, 'currentStep:', currentStep);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--spacing-md)'
    }}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;
        const isClickable = !!onStepClick;

        return (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)'
            }}
          >
            {/* Step Circle - Clickable */}
            <div
              onClick={() => {
                console.log('[FormProgressIndicator] Clicked step:', index, 'isClickable:', isClickable);
                if (isClickable) {
                  onStepClick(index);
                }
              }}
              onMouseEnter={(e) => {
                console.log('[FormProgressIndicator] Mouse enter step:', index, 'isClickable:', isClickable);
                if (isClickable) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                console.log('[FormProgressIndicator] Mouse leave step:', index);
                if (isClickable) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                cursor: isClickable ? 'pointer' : 'default',
                transition: 'transform 0.2s ease',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: isCompleted
                  ? 'linear-gradient(135deg, #656290, #8B90E0)'
                  : isCurrent
                  ? 'rgba(101, 98, 144, 0.3)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: isCurrent ? '2px solid #656290' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCompleted || isCurrent ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                fontFamily: 'var(--font-text-body)',
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                transition: 'all 0.3s ease'
              }}>
                {isCompleted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Step Label */}
              <div style={{
                fontSize: 'var(--font-xs)',
                color: isCurrent ? 'var(--text-primary)' : isPending ? 'var(--text-secondary)' : '#8B90E0',
                fontFamily: 'var(--font-text-body)',
                fontWeight: isCurrent ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                textAlign: 'center',
                maxWidth: 80,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'color 0.3s ease'
              }}>
                {step.label}
              </div>
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div style={{
                width: 40,
                height: 2,
                background: isCompleted
                  ? 'linear-gradient(90deg, #8B90E0, rgba(101, 98, 144, 0.3))'
                  : 'rgba(255, 255, 255, 0.1)',
                marginBottom: 24,
                transition: 'background 0.3s ease'
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
