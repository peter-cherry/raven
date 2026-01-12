import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Resend confirmation email
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (error) {
      console.error('Error resending confirmation:', error);
      return NextResponse.json({ error: 'Failed to resend confirmation email' }, { status: 500 });
    }

    console.log(`[Admin] Resent confirmation email to: ${email}`);
    return NextResponse.json({
      success: true,
      message: `Confirmation email sent to ${email}`
    });

  } catch (error: any) {
    console.error('Error in resend-confirmation endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
