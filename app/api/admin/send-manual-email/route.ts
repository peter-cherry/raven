import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'jobs@raven-search.com'
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Raven Jobs'

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

interface Target {
  id: string
  email: string
  business_name: string
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verify user is authenticated and is admin
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { targets, subject, body } = await request.json()

    if (!targets || targets.length === 0) {
      return NextResponse.json(
        { error: 'No recipients provided' },
        { status: 400 }
      )
    }

    if (!subject || !body) {
      return NextResponse.json(
        { error: 'Subject and body are required' },
        { status: 400 }
      )
    }

    if (!SENDGRID_API_KEY) {
      return NextResponse.json(
        { error: 'SendGrid is not configured. Add SENDGRID_API_KEY to environment variables.' },
        { status: 500 }
      )
    }

    let sent = 0
    let failed = 0
    const errors: any[] = []

    // Send emails
    for (const target of targets as Target[]) {
      try {
        // Prepare email
        const msg = {
          to: target.email,
          from: {
            email: FROM_EMAIL,
            name: FROM_NAME
          },
          subject,
          html: body,
          trackingSettings: {
            clickTracking: {
              enable: true,
              enableText: false
            },
            openTracking: {
              enable: true
            }
          }
        }

        // Send via SendGrid
        await sgMail.send(msg)

        // Record in database
        await supabase
          .from('manual_emails')
          .insert({
            target_id: target.id,
            recipient_email: target.email,
            recipient_name: target.business_name,
            subject,
            body,
            sent_by: session.user.id,
            status: 'sent',
            sent_at: new Date().toISOString()
          })

        sent++

      } catch (error: any) {
        console.error(`Failed to send email to ${target.email}:`, error)
        failed++
        errors.push({
          email: target.email,
          error: error.message
        })

        // Record failure
        await supabase
          .from('manual_emails')
          .insert({
            target_id: target.id,
            recipient_email: target.email,
            recipient_name: target.business_name,
            subject,
            body,
            sent_by: session.user.id,
            status: 'failed',
            error_message: error.message
          })
      }

      // Rate limiting - wait 100ms between emails
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('Send manual email error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send emails' },
      { status: 500 }
    )
  }
}
