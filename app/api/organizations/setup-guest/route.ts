import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force this route to use Node.js runtime (not Edge)
export const runtime = 'nodejs';

// Lazy initialization - create client only when needed
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  try {
    // Check if guest org exists
    const { data: existing } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('name', 'Guest Organization')
      .maybeSingle();

    if (existing) {
      console.log('[Guest Org Setup] Already exists:', existing.id);
      return NextResponse.json({
        success: true,
        orgId: existing.id,
        message: 'Guest organization already exists'
      });
    }

    // Create guest organization
    const { data: newOrg, error } = await supabaseAdmin
      .from('organizations')
      .insert({ name: 'Guest Organization' })
      .select('id, name')
      .single();

    if (error) {
      console.error('[Guest Org Setup] Creation error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create guest organization' },
        { status: 500 }
      );
    }

    console.log('[Guest Org Setup] Created:', newOrg.id);
    return NextResponse.json({
      success: true,
      orgId: newOrg.id,
      message: 'Guest organization created successfully'
    });

  } catch (error: any) {
    console.error('[Guest Org Setup] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
