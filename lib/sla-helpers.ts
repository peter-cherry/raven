// SLA Helper Functions

export interface SLATimer {
  id: string
  stage: string
  target_minutes: number
  started_at: string
  completed_at: string | null
  breached: boolean
}

export type SLAStatus = 'on-time' | 'warning' | 'breached' | 'completed' | 'no-sla'

export function calculateSLAStatus(timers: SLATimer[]): SLAStatus {
  if (!timers || timers.length === 0) return 'no-sla'

  // Check if any timer is breached
  const hasBreached = timers.some(t => t.breached && !t.completed_at)
  if (hasBreached) return 'breached'

  // Check if all timers are completed
  const allCompleted = timers.every(t => t.completed_at !== null)
  if (allCompleted) return 'completed'

  // Check active timers
  const activeTimer = timers.find(t => !t.completed_at && !t.breached)
  if (!activeTimer) return 'on-time'

  const elapsed = (Date.now() - new Date(activeTimer.started_at).getTime()) / 60000
  const remaining = activeTimer.target_minutes - elapsed

  // Warning if less than 25% time remaining
  if (remaining > 0 && remaining < activeTimer.target_minutes * 0.25) {
    return 'warning'
  }

  return 'on-time'
}

export function getActiveTimer(timers: SLATimer[]): SLATimer | null {
  return timers.find(t => !t.completed_at && !t.breached) || null
}

export function getTimeRemaining(timer: SLATimer): number {
  if (timer.completed_at || timer.breached) return 0
  const elapsed = (Date.now() - new Date(timer.started_at).getTime()) / 60000
  return Math.max(0, timer.target_minutes - elapsed)
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
