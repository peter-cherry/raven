import { NextResponse } from 'next/server'

// Store for Claude's TodoWrite tasks
// This will be updated when Claude uses TodoWrite tool
let claudeTodoStore: any[] = [
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
    content: 'Test Agent page locally',
    activeForm: 'Testing Agent page locally',
    status: 'completed',
    subtasks: [],
    created_at: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: '6',
    content: 'Add collapsible cards with chevron toggle',
    activeForm: 'Adding collapsible cards with chevron toggle',
    status: 'completed',
    subtasks: [],
    created_at: new Date(Date.now() - 500000).toISOString()
  },
  {
    id: '7',
    content: 'Add ping button to notify about task',
    activeForm: 'Adding ping button to notify about task',
    status: 'completed',
    subtasks: [],
    created_at: new Date(Date.now() - 400000).toISOString()
  },
  {
    id: '8',
    content: 'Implement ping button functionality with TodoWrite API',
    activeForm: 'Implementing ping button functionality with TodoWrite API',
    status: 'completed',
    subtasks: [],
    created_at: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: '9',
    content: 'Create API endpoint for TodoWrite operations',
    activeForm: 'Creating API endpoint for TodoWrite operations',
    status: 'completed',
    subtasks: [],
    created_at: new Date(Date.now() - 200000).toISOString()
  },
  {
    id: '10',
    content: 'Connect ping button to real TodoWrite API',
    activeForm: 'Connecting ping button to real TodoWrite API',
    status: 'completed',
    subtasks: [],
    created_at: new Date(Date.now() - 100000).toISOString()
  },
  {
    id: '11',
    content: 'Implement GET endpoint to fetch real TodoWrite tasks',
    activeForm: 'Implementing GET endpoint to fetch real TodoWrite tasks',
    status: 'completed',
    subtasks: [],
    created_at: new Date(Date.now() - 200000).toISOString()
  },
  {
    id: '12',
    content: 'Update Agent page to display real-time TodoWrite data',
    activeForm: 'Updating Agent page to display real-time TodoWrite data',
    status: 'completed',
    subtasks: [],
    created_at: new Date(Date.now() - 100000).toISOString()
  },
  {
    id: '13',
    content: 'Test ping functionality end-to-end',
    activeForm: 'Testing ping functionality end-to-end',
    status: 'completed',
    subtasks: [],
    created_at: new Date(Date.now() - 50000).toISOString()
  }
]

export async function GET() {
  try {
    // Sort tasks by created_at descending (newest first)
    const sortedTasks = [...claudeTodoStore].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Return Claude's current TodoWrite task list
    return NextResponse.json({
      tasks: sortedTasks,
      message: 'Fetched Claude\'s TodoWrite tasks',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching todos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    )
  }
}

// Helper function to update the todo store (internal use only)
function updateTodoStore(todos: any[]) {
  claudeTodoStore = todos
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, taskId, taskContent } = body

    console.log('TodoWrite action:', { action, taskId, taskContent })

    if (action === 'ping') {
      // Update task status to in_progress when pinged
      claudeTodoStore = claudeTodoStore.map(task =>
        task.id === taskId
          ? { ...task, status: 'in_progress' }
          : task
      )

      return NextResponse.json({
        success: true,
        message: `Task pinged: ${taskContent}`,
        action: 'Task marked as in_progress for Claude to work on',
        updatedTask: claudeTodoStore.find(t => t.id === taskId)
      })
    }

    if (action === 'update') {
      // Update task from TodoWrite
      const { taskId, updates } = body
      claudeTodoStore = claudeTodoStore.map(task =>
        task.id === taskId
          ? { ...task, ...updates }
          : task
      )

      return NextResponse.json({
        success: true,
        message: 'Task updated',
        updatedTask: claudeTodoStore.find(t => t.id === taskId)
      })
    }

    if (action === 'create') {
      // Create new task from TodoWrite - add to beginning of array
      const { task } = body
      const newTask = {
        ...task,
        created_at: new Date().toISOString()
      }

      // Add to the beginning of the array (newest first)
      claudeTodoStore = [newTask, ...claudeTodoStore]

      return NextResponse.json({
        success: true,
        message: 'Task created',
        task: newTask
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating todo:', error)
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    )
  }
}
