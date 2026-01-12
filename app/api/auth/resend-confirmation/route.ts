import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting (reset on server restart)
// For production, consider Redis or database-backed rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3; // 3 requests per minute per email

function checkRateLimit(email: string): { allowed: boolean; resetIn?: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(email);

  if (!existing || now > existing.resetAt) {
    // First request or window expired - allow and reset
    rateLimitMap.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (existing.count >= MAX_REQUESTS) {
    // Rate limit exceeded
    const resetIn = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, resetIn };
  }

  // Increment count and allow
  existing.count++;
  return { allowed: true };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit(email);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Please wait ${rateLimitResult.resetIn} seconds before trying again`,
          retryAfter: rateLimitResult.resetIn
        },
        { status: 429 }
      );
    }

    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Resend confirmation email
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase()
    });

    if (error) {
      console.error('[Resend Confirmation] Supabase error:', error);

      // Handle specific error cases
      if (error.message.includes('already confirmed')) {
        return NextResponse.json(
          { error: 'Email already confirmed. Please try logging in.' },
          { status: 400 }
        );
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'No account found with this email address.' },
          { status: 404 }
        );
      }

      // Generic error
      return NextResponse.json(
        { error: 'Failed to resend confirmation email. Please try again.' },
        { status: 500 }
      );
    }

    console.log('[Resend Confirmation] Email sent successfully to:', email);

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent. Please check your inbox.'
    });

  } catch (error: any) {
    console.error('[Resend Confirmation] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
