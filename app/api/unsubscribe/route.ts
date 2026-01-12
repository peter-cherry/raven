import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors when env vars aren't set
let _supabaseAdmin: any = null

const getSupabaseAdmin = (): any => {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Supabase credentials not configured')
    }
    _supabaseAdmin = createClient(url, key)
  }
  return _supabaseAdmin
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get('email')
  const token = searchParams.get('token')
  const type = searchParams.get('type') || 'warm' // 'warm' for technicians, 'cold' for cold_leads

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Basic token validation (in production, use a proper signed token)
  // The token is a simple hash of email + secret to prevent unauthorized unsubscribes
  const expectedToken = Buffer.from(`${email}:${process.env.CRON_SECRET || 'default'}`).toString('base64')

  // For now, we allow unsubscribe without strict token validation for CAN-SPAM compliance
  // CAN-SPAM requires easy unsubscribe - token is optional security layer

  try {
    const now = new Date().toISOString()

    if (type === 'cold') {
      // Unsubscribe cold lead
      const { data, error } = await getSupabaseAdmin()
        .from('cold_leads')
        .update({
          unsubscribed_at: now
        })
        .eq('email', email.toLowerCase())
        .select()
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('[Unsubscribe] Cold lead error:', error)
      }
    } else {
      // Unsubscribe warm technician
      const { data, error } = await getSupabaseAdmin()
        .from('technicians')
        .update({
          unsubscribed_at: now,
          signed_up: false // Also mark as not signed up
        })
        .eq('email', email.toLowerCase())
        .select()
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('[Unsubscribe] Technician error:', error)
      }
    }

    // Also add to global outreach_unsubscribes table for comprehensive tracking
    await getSupabaseAdmin()
      .from('outreach_unsubscribes')
      .upsert({
        email: email.toLowerCase(),
        unsubscribed_at: now,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }, {
        onConflict: 'email'
      })

    // Redirect to confirmation page
    const confirmUrl = new URL('/unsubscribe/confirmed', request.url)
    confirmUrl.searchParams.set('email', email)
    return NextResponse.redirect(confirmUrl)

  } catch (error) {
    console.error('[Unsubscribe] Error:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, reason, type = 'warm' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const now = new Date().toISOString()

    if (type === 'cold') {
      // Unsubscribe cold lead
      await getSupabaseAdmin()
        .from('cold_leads')
        .update({
          unsubscribed_at: now,
          unsubscribe_reason: reason || null
        })
        .eq('email', email.toLowerCase())
    } else {
      // Unsubscribe warm technician
      await getSupabaseAdmin()
        .from('technicians')
        .update({
          unsubscribed_at: now,
          unsubscribe_reason: reason || null,
          signed_up: false
        })
        .eq('email', email.toLowerCase())
    }

    // Also add to global unsubscribes
    await getSupabaseAdmin()
      .from('outreach_unsubscribes')
      .upsert({
        email: email.toLowerCase(),
        reason: reason || null,
        unsubscribed_at: now,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }, {
        onConflict: 'email'
      })

    return NextResponse.json({ success: true, message: 'Successfully unsubscribed' })

  } catch (error) {
    console.error('[Unsubscribe] POST Error:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}
