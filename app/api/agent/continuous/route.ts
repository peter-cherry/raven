import { NextResponse } from 'next/server'

// Global state to track if agent is running
let isRunning = false
let stopRequested = false
let currentStatus = 'idle'
let lastActivity = ''
let iterationCount = 0

// POST /api/agent/continuous - Start continuous agent execution
export async function POST(request: Request) {
  if (isRunning) {
    return NextResponse.json(
      { error: 'Agent is already running' },
      { status: 400 }
    )
  }

  isRunning = true
  stopRequested = false

  // Start continuous execution in background
  runContinuously().catch(error => {
    console.error('[Continuous Agent] Fatal error:', error)
    isRunning = false
  })

  return NextResponse.json({
    success: true,
    message: 'Continuous agent started'
  })
}

// DELETE /api/agent/continuous - Stop continuous execution
export async function DELETE(request: Request) {
  if (!isRunning) {
    return NextResponse.json(
      { error: 'Agent is not running' },
      { status: 400 }
    )
  }

  stopRequested = true

  return NextResponse.json({
    success: true,
    message: 'Stop requested - agent will finish current iteration'
  })
}

// GET /api/agent/continuous - Check if agent is running
export async function GET(request: Request) {
  return NextResponse.json({
    isRunning,
    stopRequested,
    currentStatus,
    lastActivity,
    iterationCount
  })
}

async function runContinuously() {
  console.log('[Continuous Agent] Starting continuous execution...')
  currentStatus = 'starting'
  iterationCount = 0

  while (!stopRequested) {
    try {
      iterationCount++
      currentStatus = 'working'
      lastActivity = `Iteration ${iterationCount} - Calling autonomous agent...`

      // Call the autonomous agent endpoint with 5 minute timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agent/autonomous`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      if (!response.ok) {
        console.error('[Continuous Agent] Error:', result)
        currentStatus = 'error'
        lastActivity = `Error: ${result.error || 'Unknown error'}`
        // Wait 30 seconds before retrying on error
        await new Promise(resolve => setTimeout(resolve, 30000))
        continue
      }

      console.log('[Continuous Agent] Iteration complete:', {
        workItem: result.workItem?.title,
        toolsUsed: result.toolsUsed?.length || 0,
        timestamp: new Date().toISOString()
      })

      const toolsList = result.toolsUsed?.join(', ') || 'none'
      lastActivity = `Iteration ${iterationCount} complete - Tools: ${toolsList}`

      // Check if work item is completed
      if (result.workItem?.status === 'completed') {
        console.log('[Continuous Agent] Work item completed! Stopping.')
        currentStatus = 'completed'
        lastActivity = 'Task completed! 🎉'
        break
      }

      // Wait 10 seconds between iterations (configurable)
      currentStatus = 'waiting'
      const delayMs = parseInt(process.env.AGENT_ITERATION_DELAY_MS || '10000')
      lastActivity = `Waiting ${delayMs/1000}s before next iteration...`
      await new Promise(resolve => setTimeout(resolve, delayMs))

    } catch (error) {
      console.error('[Continuous Agent] Iteration error:', error)
      currentStatus = 'error'
      lastActivity = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      // Wait 30 seconds before retrying on error
      await new Promise(resolve => setTimeout(resolve, 30000))
    }
  }

  console.log('[Continuous Agent] Stopped')
  currentStatus = stopRequested ? 'stopped' : 'completed'
  isRunning = false
  stopRequested = false
}
