'use client'

interface SLABadgeProps {
  status: 'on-time' | 'warning' | 'breached' | 'completed'
  timeRemaining?: number // minutes
  compact?: boolean
}

export function SLABadge({ status, timeRemaining, compact = false }: SLABadgeProps) {
  const configs = {
    'on-time': {
      bg: 'rgba(16, 185, 129, 0.2)',
      text: 'var(--success)',
      emoji: '🟢',
      label: 'On Time'
    },
    'warning': {
      bg: 'rgba(245, 158, 11, 0.2)',
      text: 'var(--warning)',
      emoji: '⚠️',
      label: timeRemaining !== undefined ? `${Math.round(timeRemaining)}m` : 'Warning'
    },
    'breached': {
      bg: 'rgba(239, 68, 68, 0.2)',
      text: 'var(--error)',
      emoji: '🔴',
      label: 'Breached'
    },
    'completed': {
      bg: 'rgba(108, 114, 201, 0.2)',
      text: 'var(--accent-primary)',
      emoji: '✅',
      label: 'Done'
    }
  }

  const config = configs[status]

  if (compact) {
    return (
      <div
        className="mini-dot"
        style={{
          background: config.text,
          width: 10,
          height: 10
        }}
        title={config.label}
      />
    )
  }

  return (
    <div
      className="score-badge"
      style={{
        background: config.bg,
        color: config.text,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6
      }}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </div>
  )
}
