'use client';

import { SUPPORTED_TRADES } from '@/lib/licensing-requirements';

interface TradeSelectionStepProps {
  formData: {
    trades: string[];
    yearsExperience: string;
  };
  updateFormData: (updates: Partial<any>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function TradeSelectionStep({ formData, updateFormData, onNext, onBack }: TradeSelectionStepProps) {
  const canProceed = formData.trades.length > 0 && formData.yearsExperience;

  const toggleTrade = (tradeId: string) => {
    const currentTrades = formData.trades || [];
    if (currentTrades.includes(tradeId)) {
      updateFormData({ trades: currentTrades.filter(t => t !== tradeId) });
    } else {
      updateFormData({ trades: [...currentTrades, tradeId] });
    }
  };

  return (
    <div style={{
      background: 'var(--container-bg)',
      border: 'var(--container-border)',
      borderRadius: 'var(--container-border-radius)',
      padding: 'var(--spacing-2xl)'
    }}>
      <h2 style={{
        fontSize: 'var(--font-2xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--spacing-md)'
      }}>
        Trade Selection
      </h2>
      <p style={{
        fontSize: 'var(--font-md)',
        color: 'var(--text-secondary)',
        marginBottom: 'var(--spacing-2xl)',
        lineHeight: 1.6
      }}>
        Select the trades you specialize in and your years of experience.
      </p>

      {/* Trades Grid */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <label style={{
          display: 'block',
          fontSize: 'var(--font-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-md)'
        }}>
          Select Your Trades *
        </label>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-md)'
        }}>
          {SUPPORTED_TRADES.map(trade => {
            const isSelected = formData.trades?.includes(trade.id);

            return (
              <div
                key={trade.id}
                onClick={() => toggleTrade(trade.id)}
                style={{
                  background: isSelected ? 'rgba(108, 114, 201, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                  border: isSelected ? '2px solid #6C72C9' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--btn-corner-radius)',
                  padding: 'var(--spacing-lg)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Checkbox indicator */}
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: isSelected ? '#6C72C9' : 'rgba(255, 255, 255, 0.1)',
                  border: isSelected ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                {/* Trade name */}
                <div style={{
                  fontSize: 'var(--font-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  {trade.name}
                </div>

                {/* Trade description */}
                <div style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4
                }}>
                  {trade.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Years of Experience */}
      <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
        <label style={{
          display: 'block',
          fontSize: 'var(--font-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Years of Experience *
        </label>
        <input
          type="number"
          value={formData.yearsExperience}
          onChange={(e) => updateFormData({ yearsExperience: e.target.value })}
          placeholder="5"
          min="0"
          max="50"
          style={{
            width: '200px',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--btn-corner-radius)',
            padding: 'var(--spacing-md)',
            fontSize: 'var(--font-md)',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />
        <div style={{
          fontSize: 'var(--font-xs)',
          color: 'var(--text-secondary)',
          marginTop: 'var(--spacing-sm)'
        }}>
          Total years of professional experience in your selected trades
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-md)',
        justifyContent: 'space-between',
        marginTop: 'var(--spacing-2xl)'
      }}>
        <button
          onClick={onBack}
          className="outline-button"
          style={{
            padding: '12px 32px',
            fontSize: 'var(--font-lg)'
          }}
        >
          ← Back
        </button>

        <button
          onClick={onNext}
          disabled={!canProceed}
          className="primary-button"
          style={{
            padding: '12px 32px',
            fontSize: 'var(--font-lg)',
            opacity: !canProceed ? 0.5 : 1,
            cursor: !canProceed ? 'not-allowed' : 'pointer'
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
