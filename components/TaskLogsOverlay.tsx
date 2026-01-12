'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CloseButton } from '@/components/CloseButton'

type LogEntry = {
  id: string
  timestamp: string
  type: 'task_created' | 'task_started' | 'task_completed' | 'subtask_added' | 'subtask_completed' | 'status_changed'
  task_id: string
  task_title: string
  message: string
  metadata?: Record<string, any>
}

interface TaskLogsOverlayProps {
  isOpen: boolean
  onClose: () => void
  logs: LogEntry[]
}

export default function TaskLogsOverlay({ isOpen, onClose, logs }: TaskLogsOverlayProps) {
  const getLogIcon = (type: string) => {
    switch (type) {
      case 'task_created':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C72C9" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        )
      case 'task_started':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )
      case 'task_completed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )
      case 'subtask_added':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B90E0" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        )
      case 'subtask_completed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <polyline points="9 11 12 14 15 10" />
          </svg>
        )
      case 'status_changed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        )
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        )
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getDateLabel = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    // Check if same day (today)
    if (date.toDateString() === now.toDateString()) {
      return 'Today'
    }

    // Check if yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }

    // Check if within this week (last 7 days)
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' })
    }

    // Older dates
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const groupLogsByDay = () => {
    const groups: { [key: string]: LogEntry[] } = {}

    logs.forEach(log => {
      const dateLabel = getDateLabel(log.timestamp)
      if (!groups[dateLabel]) {
        groups[dateLabel] = []
      }
      groups[dateLabel].push(log)
    })

    return groups
  }

  const logGroups = groupLogsByDay()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--spacing-xl)'
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'transparent',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              filter: 'brightness(1.3)',
              border: 'var(--container-border)',
              borderRadius: 'var(--modal-border-radius)',
              maxWidth: 700,
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: 'var(--spacing-xl)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-section-title)',
                  fontSize: 'var(--font-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  Task Activity Log
                </h2>
                <p style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-secondary)'
                }}>
                  {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
              <CloseButton onClick={onClose} />
            </div>

            {/* Logs List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: 'var(--spacing-lg)'
            }}>
              {logs.length === 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  padding: 'var(--spacing-4xl)'
                }}>
                  <div>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto var(--spacing-md)' }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    <p style={{ fontSize: 'var(--font-md)' }}>No activity yet</p>
                    <p style={{ fontSize: 'var(--font-sm)', marginTop: 'var(--spacing-xs)', opacity: 0.7 }}>
                      Task events will appear here
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
                  {Object.entries(logGroups).map(([dateLabel, groupLogs]) => (
                    <div key={dateLabel}>
                      {/* Date Header */}
                      <div style={{
                        fontSize: 'var(--font-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--spacing-md)',
                        paddingBottom: 'var(--spacing-xs)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>
                        {dateLabel}
                      </div>

                      {/* Logs for this day */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {groupLogs.map((log, index) => (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            style={{
                              background: 'rgba(108, 114, 201, 0.05)',
                              border: '1px solid rgba(108, 114, 201, 0.15)',
                              borderRadius: 'var(--container-border-radius)',
                              padding: 'var(--spacing-md)',
                              display: 'flex',
                              gap: 'var(--spacing-md)',
                              alignItems: 'start'
                            }}
                          >
                            {/* Icon */}
                            <div style={{
                              flexShrink: 0,
                              marginTop: 2
                            }}>
                              {getLogIcon(log.type)}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 'var(--font-sm)',
                                color: 'var(--text-primary)',
                                marginBottom: 'var(--spacing-xs)',
                                wordBreak: 'break-word'
                              }}>
                                {log.message}
                              </div>
                              <div style={{
                                fontSize: 'var(--font-xs)',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)'
                              }}>
                                <span>{log.task_title}</span>
                                <span style={{ opacity: 0.5 }}>•</span>
                                <span>{formatTimestamp(log.timestamp)}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: 'var(--spacing-lg)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={onClose}
                className="primary-button"
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-lg)'
                }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
