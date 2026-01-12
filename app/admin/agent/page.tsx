'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TaskLogsOverlay from '@/components/TaskLogsOverlay'

type SubTask = {
  id: string
  title: string
  completed: boolean
  completed_at: string | null
}

type Task = {
  id: string
  content: string
  activeForm: string
  status: 'pending' | 'in_progress' | 'completed'
  subtasks: SubTask[]
  created_at: string
}

type LogEntry = {
  id: string
  timestamp: string
  type: 'task_created' | 'task_started' | 'task_completed' | 'subtask_added' | 'subtask_completed' | 'status_changed'
  task_id: string
  task_title: string
  message: string
  metadata?: Record<string, any>
}

export default function AgentTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showLogs, setShowLogs] = useState(false)

  useEffect(() => {
    loadTasks()
    // Poll for updates every 30 seconds
    const interval = setInterval(loadTasks, 30000)
    return () => clearInterval(interval)
  }, [])

  const handlePingTask = async (task: Task) => {
    try {
      // Send ping to TodoWrite API
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'ping',
          taskId: task.id,
          taskContent: task.content
        })
      })

      if (!response.ok) {
        throw new Error('Failed to ping task')
      }

      const result = await response.json()
      console.log('Ping result:', result)

      // Add log entry
      const newLog: LogEntry = {
        id: `ping-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'status_changed',
        task_id: task.id,
        task_title: task.content,
        message: `Pinged Claude to work on: ${task.content}`,
        metadata: { action: 'ping', status: task.status, apiResponse: result }
      }

      setLogs(prev => [newLog, ...prev])

      // Update task status to in_progress when pinged
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'in_progress' as const } : t
      ))
    } catch (error) {
      console.error('Error pinging task:', error)

      // Add error log
      const errorLog: LogEntry = {
        id: `ping-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'status_changed',
        task_id: task.id,
        task_title: task.content,
        message: `Failed to ping task: ${task.content}`,
        metadata: { action: 'ping', error: String(error) }
      }

      setLogs(prev => [errorLog, ...prev])
    }
  }

  const loadTasks = async () => {
    try {
      // Fetch real TodoWrite tasks from API
      const response = await fetch('/api/todos')

      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()

      if (data.tasks && Array.isArray(data.tasks)) {
        setTasks(data.tasks)

        // Generate logs from task data
        generateLogsFromTasks(data.tasks)

        setLoading(false)
        return
      }

      throw new Error('Invalid API response format')
    } catch (error) {
      console.error('Error loading tasks:', error)

      // Fallback to mock data if API fails
      const mockTasks: Task[] = [
        {
          id: '1',
          content: 'Polish Agent page UI with design system',
          activeForm: 'Polishing Agent page UI with design system',
          status: 'completed',
          subtasks: [
            { id: '1-1', title: 'Apply glassmorphic effects', completed: true, completed_at: new Date(Date.now() - 3600000).toISOString() },
            { id: '1-2', title: 'Update typography and spacing', completed: true, completed_at: new Date(Date.now() - 2400000).toISOString() },
            { id: '1-3', title: 'Add hover states and transitions', completed: true, completed_at: new Date(Date.now() - 1800000).toISOString() }
          ],
          created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '2',
          content: 'Add sub-checklist functionality to tasks',
          activeForm: 'Adding sub-checklist functionality to tasks',
          status: 'completed',
          subtasks: [],
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          content: 'Add working progress bars for subtasks',
          activeForm: 'Adding working progress bars for subtasks',
          status: 'completed',
          subtasks: [],
          created_at: new Date(Date.now() - 2400000).toISOString()
        },
        {
          id: '4',
          content: 'Add activity logs with timestamps',
          activeForm: 'Adding activity logs with timestamps',
          status: 'completed',
          subtasks: [
            { id: '4-1', title: 'Create TaskLogsOverlay component', completed: true, completed_at: new Date(Date.now() - 600000).toISOString() },
            { id: '4-2', title: 'Add logs icon button to header', completed: true, completed_at: new Date(Date.now() - 300000).toISOString() },
            { id: '4-3', title: 'Generate mock log entries', completed: true, completed_at: new Date(Date.now() - 180000).toISOString() }
          ],
          created_at: new Date(Date.now() - 900000).toISOString()
        },
        {
          id: '5',
          content: 'Integrate TodoWrite API with Agent page',
          activeForm: 'Integrating TodoWrite API with Agent page',
          status: 'pending',
          subtasks: [],
          created_at: new Date(Date.now() - 600000).toISOString()
        }
      ]
      setTasks(mockTasks)

      // Generate mock logs
      const mockLogs = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          type: 'task_created',
          task_id: '1',
          task_title: 'Polish Agent page UI with design system',
          message: 'Created new task: Polish Agent page UI with design system'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 7000000).toISOString(),
          type: 'task_started',
          task_id: '1',
          task_title: 'Polish Agent page UI with design system',
          message: 'Started working on task'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 6800000).toISOString(),
          type: 'subtask_added',
          task_id: '1',
          task_title: 'Polish Agent page UI with design system',
          message: 'Added subtask: Apply glassmorphic effects'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'subtask_completed',
          task_id: '1',
          task_title: 'Polish Agent page UI with design system',
          message: 'Completed subtask: Apply glassmorphic effects'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 2400000).toISOString(),
          type: 'subtask_completed',
          task_id: '1',
          task_title: 'Polish Agent page UI with design system',
          message: 'Completed subtask: Update typography and spacing'
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          type: 'subtask_completed',
          task_id: '1',
          task_title: 'Polish Agent page UI with design system',
          message: 'Completed subtask: Add hover states and transitions'
        },
        {
          id: '7',
          timestamp: new Date(Date.now() - 1700000).toISOString(),
          type: 'task_completed',
          task_id: '1',
          task_title: 'Polish Agent page UI with design system',
          message: 'Completed task: Polish Agent page UI with design system'
        },
        {
          id: '8',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'task_created',
          task_id: '2',
          task_title: 'Add sub-checklist functionality to tasks',
          message: 'Created new task: Add sub-checklist functionality to tasks'
        },
        {
          id: '9',
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          type: 'task_started',
          task_id: '2',
          task_title: 'Add sub-checklist functionality to tasks',
          message: 'Started working on task'
        },
        {
          id: '10',
          timestamp: new Date(Date.now() - 2600000).toISOString(),
          type: 'task_completed',
          task_id: '2',
          task_title: 'Add sub-checklist functionality to tasks',
          message: 'Completed task: Add sub-checklist functionality to tasks'
        },
        {
          id: '11',
          timestamp: new Date(Date.now() - 2400000).toISOString(),
          type: 'task_created',
          task_id: '3',
          task_title: 'Add working progress bars for subtasks',
          message: 'Created new task: Add working progress bars for subtasks'
        },
        {
          id: '12',
          timestamp: new Date(Date.now() - 2300000).toISOString(),
          type: 'task_started',
          task_id: '3',
          task_title: 'Add working progress bars for subtasks',
          message: 'Started working on task'
        },
        {
          id: '13',
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          type: 'task_completed',
          task_id: '3',
          task_title: 'Add working progress bars for subtasks',
          message: 'Completed task: Add working progress bars for subtasks'
        },
        {
          id: '14',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          type: 'task_created',
          task_id: '4',
          task_title: 'Add activity logs with timestamps',
          message: 'Created new task: Add activity logs with timestamps'
        },
        {
          id: '15',
          timestamp: new Date(Date.now() - 850000).toISOString(),
          type: 'task_started',
          task_id: '4',
          task_title: 'Add activity logs with timestamps',
          message: 'Started working on task'
        },
        {
          id: '16',
          timestamp: new Date(Date.now() - 700000).toISOString(),
          type: 'subtask_added',
          task_id: '4',
          task_title: 'Add activity logs with timestamps',
          message: 'Added subtask: Create TaskLogsOverlay component'
        },
        {
          id: '17',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          type: 'subtask_completed',
          task_id: '4',
          task_title: 'Add activity logs with timestamps',
          message: 'Completed subtask: Create TaskLogsOverlay component'
        },
        {
          id: '18',
          timestamp: new Date(Date.now() - 400000).toISOString(),
          type: 'subtask_added',
          task_id: '4',
          task_title: 'Add activity logs with timestamps',
          message: 'Added subtask: Add logs icon button to header'
        },
        {
          id: '19',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          type: 'subtask_completed',
          task_id: '4',
          task_title: 'Add activity logs with timestamps',
          message: 'Completed subtask: Add logs icon button to header'
        },
        {
          id: '20',
          timestamp: new Date(Date.now() - 250000).toISOString(),
          type: 'subtask_added',
          task_id: '4',
          task_title: 'Add activity logs with timestamps',
          message: 'Added subtask: Generate mock log entries'
        },
        {
          id: '21',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          type: 'subtask_completed',
          task_id: '4',
          task_title: 'Add activity logs with timestamps',
          message: 'Completed subtask: Generate mock log entries'
        },
        {
          id: '22',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          type: 'task_completed',
          task_id: '4',
          task_title: 'Add activity logs with timestamps',
          message: 'Completed task: Add activity logs with timestamps'
        },
        {
          id: '23',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          type: 'task_created',
          task_id: '5',
          task_title: 'Integrate TodoWrite API with Agent page',
          message: 'Created new task: Integrate TodoWrite API with Agent page'
        }
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) as LogEntry[]

      setLogs(mockLogs)
      setLoading(false)
    }
  }

  const generateLogsFromTasks = (tasks: Task[]) => {
    const generatedLogs: LogEntry[] = []

    tasks.forEach(task => {
      // Task created
      generatedLogs.push({
        id: `${task.id}-created`,
        timestamp: task.created_at,
        type: 'task_created',
        task_id: task.id,
        task_title: task.content,
        message: `Created new task: ${task.content}`
      })

      // Task started (if not pending)
      if (task.status !== 'pending') {
        generatedLogs.push({
          id: `${task.id}-started`,
          timestamp: task.created_at,
          type: 'task_started',
          task_id: task.id,
          task_title: task.content,
          message: `Started working on task`
        })
      }

      // Subtasks
      task.subtasks?.forEach((subtask, index) => {
        if (subtask.completed) {
          generatedLogs.push({
            id: `${task.id}-subtask-${subtask.id}-completed`,
            timestamp: subtask.completed_at || task.created_at,
            type: 'subtask_completed',
            task_id: task.id,
            task_title: task.content,
            message: `Completed subtask: ${subtask.title}`
          })
        }
      })

      // Task completed
      if (task.status === 'completed') {
        generatedLogs.push({
          id: `${task.id}-completed`,
          timestamp: task.created_at,
          type: 'task_completed',
          task_id: task.id,
          task_title: task.content,
          message: `Completed task: ${task.content}`
        })
      }
    })

    // Sort by timestamp descending (newest first)
    generatedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setLogs(generatedLogs)
  }

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#9DC9B4'
      case 'in_progress': return '#6C72C9'
      case 'pending': return '#9CA3AF'
      default: return '#9CA3AF'
    }
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(157, 201, 180, 0.1)', text: '#9DC9B4', border: 'rgba(157, 201, 180, 0.3)' }
      case 'in_progress':
        return { bg: 'rgba(108, 114, 201, 0.1)', text: '#6C72C9', border: 'rgba(108, 114, 201, 0.3)' }
      case 'pending':
        return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9CA3AF', border: 'rgba(156, 163, 175, 0.3)' }
      default:
        return { bg: 'rgba(156, 163, 175, 0.1)', text: '#9CA3AF', border: 'rgba(156, 163, 175, 0.3)' }
    }
  }

  const calculateProgress = (task: Task): number => {
    if (task.subtasks.length === 0) {
      return task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0
    }
    const completed = task.subtasks.filter(st => st.completed).length
    return Math.round((completed / task.subtasks.length) * 100)
  }

  if (loading) {
    return (
      <div style={{
        height: 'calc(100vh - 100px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 40,
            height: 40,
            border: '4px solid rgba(108, 114, 201, 0.2)',
            borderTop: '4px solid var(--accent-primary)',
            borderRadius: '50%'
          }}
        />
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{
        marginBottom: 'var(--spacing-2xl)',
        display: 'flex',
        alignItems: 'start',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--font-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--ds-text-primary)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Claude Tasks
          </h1>
          <p style={{
            fontSize: 'var(--font-md)',
            color: 'var(--ds-text-secondary)'
          }}>
            {tasks.filter(t => t.status !== 'completed').length} active • {tasks.filter(t => t.status === 'completed').length} done
          </p>
        </div>

        {/* Logs Button */}
        <button
          onClick={() => setShowLogs(true)}
          style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--btn-corner-radius)',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--container-hover-bg)'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--container-bg)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="View Activity Log"
        >
          {/* File/Document Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>

          {/* Badge with log count */}
          {logs.length > 0 && (
            <div style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: 'var(--accent-primary)',
              borderRadius: '50%',
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-xs)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              border: '2px solid var(--bg-primary)'
            }}>
              {logs.length > 9 ? '9+' : logs.length}
            </div>
          )}
        </button>
      </div>

      {/* Task List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)'
      }}>
        <AnimatePresence>
          {tasks.map((task, index) => {
            const isExpanded = expandedTasks.has(task.id)
            const progress = calculateProgress(task)
            const statusStyle = getStatusBadgeStyle(task.status)

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.03 }}
                style={{
                  background: 'var(--container-bg)',
                  border: 'var(--container-border)',
                  borderRadius: 'var(--container-border-radius)',
                  padding: 'var(--spacing-md)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Task Header - Always Visible */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)'
                }}>
                  {/* Checkbox */}
                  <div
                    onClick={() => {/* TODO: Toggle task completion */}}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: `2px solid ${task.status === 'completed' ? '#9DC9B4' : 'var(--accent-primary)'}`,
                      background: task.status === 'completed' ? '#9DC9B4' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {task.status === 'completed' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>

                  {/* Task Title */}
                  <h3 style={{
                    fontSize: 'var(--font-md)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-primary)',
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    opacity: task.status === 'completed' ? 0.6 : 1,
                    flex: 1
                  }}>
                    {task.content}
                  </h3>

                  {/* Right Side Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)'
                  }}>
                    {/* Ping Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePingTask(task)
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 4,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(108, 114, 201, 0.1)'
                        const svg = e.currentTarget.querySelector('svg')
                        if (svg) svg.style.transform = 'rotate(180deg)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        const svg = e.currentTarget.querySelector('svg')
                        if (svg) svg.style.transform = 'rotate(0deg)'
                      }}
                      title="Ping Claude to work on this task"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--text-secondary)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ transition: 'transform 0.3s ease' }}
                      >
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                    </button>

                    {/* Chevron Toggle */}
                    <button
                      onClick={() => toggleTaskExpanded(task.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 4,
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(108, 114, 201, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <motion.svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--text-secondary)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </motion.svg>
                    </button>
                  </div>
                </div>

                {/* Expandable Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        overflow: 'hidden',
                        marginTop: 'var(--spacing-md)'
                      }}
                    >
                      {/* Progress Section */}
                      <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-sm)',
                          marginBottom: 'var(--spacing-xs)'
                        }}>
                          <span style={{
                            fontSize: 'var(--font-xs)',
                            color: 'var(--text-secondary)'
                          }}>
                            Progress
                          </span>
                          <span style={{
                            fontSize: 'var(--font-xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: progress === 100 ? '#9DC9B4' : 'var(--text-secondary)'
                          }}>
                            {progress}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{
                          width: '100%',
                          height: 4,
                          background: 'rgba(108, 114, 201, 0.15)',
                          borderRadius: 2,
                          overflow: 'hidden'
                        }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            style={{
                              height: '100%',
                              background: progress === 100 ? '#9DC9B4' : 'var(--accent-primary)',
                              transition: 'background 0.3s ease'
                            }}
                          />
                        </div>
                      </div>

                      {/* Subtasks Section */}
                      {task.subtasks.length > 0 && (
                        <div>
                          <span style={{
                            fontSize: 'var(--font-xs)',
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--spacing-xs)',
                            display: 'block'
                          }}>
                            Subtasks ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
                          </span>

                          <div style={{
                            background: 'rgba(108, 114, 201, 0.03)',
                            border: '1px solid rgba(108, 114, 201, 0.15)',
                            borderRadius: 'var(--container-border-radius)',
                            padding: 'var(--spacing-sm)'
                          }}>
                            {task.subtasks.map((subtask, subIndex) => (
                              <motion.div
                                key={subtask.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: subIndex * 0.03 }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--spacing-xs)',
                                  padding: 'var(--spacing-xs) 0',
                                  borderBottom: subIndex < task.subtasks.length - 1 ? '1px solid rgba(108, 114, 201, 0.08)' : 'none'
                                }}
                              >
                                {/* Subtask Checkbox */}
                                <div
                                  onClick={() => {/* TODO: Toggle subtask */}}
                                  style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: 3,
                                    border: `1.5px solid ${subtask.completed ? '#9DC9B4' : 'var(--accent-primary)'}`,
                                    background: subtask.completed ? '#9DC9B4' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {subtask.completed && (
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>

                                {/* Subtask Title */}
                                <span style={{
                                  fontSize: 'var(--font-xs)',
                                  color: subtask.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                                  textDecoration: subtask.completed ? 'line-through' : 'none',
                                  flex: 1,
                                  opacity: subtask.completed ? 0.7 : 1
                                }}>
                                  {subtask.title}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div style={{
            padding: 'var(--spacing-5xl)',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <p style={{ fontSize: 'var(--font-lg)' }}>No tasks found</p>
          </div>
        )}
      </div>

      {/* Task Logs Overlay */}
      <TaskLogsOverlay
        isOpen={showLogs}
        onClose={() => setShowLogs(false)}
        logs={logs}
      />
    </div>
  )
}
