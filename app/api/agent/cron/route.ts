import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Verify this is coming from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Cron] Running autonomous agent check...')

    // Call the autonomous endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/agent/autonomous`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        autonomous_key: process.env.AUTONOMOUS_AGENT_KEY
      })
    })

    const data = await response.json()

    console.log('[Cron] Autonomous check complete:', data)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: data
    })

  } catch (error) {
    console.error('[Cron] Error running autonomous check:', error)
    return NextResponse.json(
      { error: 'Failed to run cron job' },
      { status: 500 }
    )
  }
}
