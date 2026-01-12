'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function ROICalculator() {
  const [monthlyJobs, setMonthlyJobs] = useState<number>(10)
  const [avgJobCost, setAvgJobCost] = useState<number>(500)

  const agencyCost = monthlyJobs * avgJobCost * 1.3 // 30% markup
  const ravenCost = monthlyJobs * avgJobCost * 1.05 // 5% platform fee
  const monthlySavings = agencyCost - ravenCost
  const annualSavings = monthlySavings * 12

  return (
    <div style={{
      padding: 'var(--spacing-3xl)',
      background: 'rgba(178, 173, 201, 0.05)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: 'var(--container-border)',
      borderRadius: 'var(--container-border-radius)',
      filter: 'brightness(1.15)'
    }}>
      <h3 style={{
        fontSize: 'var(--font-2xl)',
        fontWeight: 'var(--font-weight-bold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--spacing-xl)',
        textAlign: 'center'
      }}>
        Calculate Your Savings
      </h3>

      {/* Input Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-2xl)'
      }}>
        {/* Monthly Jobs Input */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-md)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-sm)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Monthly Maintenance Jobs
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={monthlyJobs}
            onChange={(e) => setMonthlyJobs(parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: 'var(--spacing-md)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 'var(--btn-corner-radius)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-bold)',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
          />
          <input
            type="range"
            min="1"
            max="100"
            value={monthlyJobs}
            onChange={(e) => setMonthlyJobs(parseInt(e.target.value))}
            style={{
              width: '100%',
              marginTop: 'var(--spacing-md)',
              accentColor: 'var(--accent-primary)'
            }}
          />
        </div>

        {/* Avg Job Cost Input */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-md)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-sm)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Average Job Cost ($)
          </label>
          <input
            type="number"
            min="50"
            max="10000"
            step="50"
            value={avgJobCost}
            onChange={(e) => setAvgJobCost(parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: 'var(--spacing-md)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 'var(--btn-corner-radius)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-xl)',
              fontWeight: 'var(--font-weight-bold)',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
          />
          <input
            type="range"
            min="50"
            max="2000"
            step="50"
            value={avgJobCost}
            onChange={(e) => setAvgJobCost(parseInt(e.target.value))}
            style={{
              width: '100%',
              marginTop: 'var(--spacing-md)',
              accentColor: 'var(--accent-primary)'
            }}
          />
        </div>
      </div>

      {/* Cost Comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-2xl)'
      }}>
        <div style={{
          padding: 'var(--spacing-xl)',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--btn-corner-radius)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-sm)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Traditional Agency
          </div>
          <div style={{
            fontSize: 'var(--font-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--error)'
          }}>
            ${agencyCost.toLocaleString()}<span style={{ fontSize: 'var(--font-lg)' }}>/mo</span>
          </div>
          <div style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            marginTop: 'var(--spacing-xs)'
          }}>
            30% markup
          </div>
        </div>

        <div style={{
          padding: 'var(--spacing-xl)',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--btn-corner-radius)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-sm)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            With Raven
          </div>
          <div style={{
            fontSize: 'var(--font-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--success)'
          }}>
            ${ravenCost.toLocaleString()}<span style={{ fontSize: 'var(--font-lg)' }}>/mo</span>
          </div>
          <div style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            marginTop: 'var(--spacing-xs)'
          }}>
            5% platform fee
          </div>
        </div>
      </div>

      {/* Savings Display */}
      <motion.div
        key={annualSavings}
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          padding: 'var(--spacing-3xl)',
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
          borderRadius: 'var(--container-border-radius)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            fontSize: 'var(--font-lg)',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Your Estimated Savings
          </div>
          <div style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            ${monthlySavings.toLocaleString()}/month
          </div>
          <div style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            ${annualSavings.toLocaleString()}/year
          </div>
        </div>
      </motion.div>

      <p style={{
        marginTop: 'var(--spacing-xl)',
        fontSize: 'var(--font-md)',
        color: 'var(--text-secondary)',
        textAlign: 'center',
        lineHeight: 1.6
      }}>
        Based on average agency markup of 30% vs Raven's 5% platform fee. Actual savings may vary.
      </p>
    </div>
  )
}
