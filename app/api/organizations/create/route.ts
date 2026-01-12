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
    const { userId, userEmail } = await req.json();

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing userId or userEmail' },
        { status: 400 }
      );
    }

    console.log('[API /organizations/create] Creating org for user:', userId);

    // Check if user already has an organization
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('org_memberships')
      .select('org_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (memberError) {
      console.error('[API /organizations/create] Membership query error:', memberError);
      return NextResponse.json(
        { error: 'Failed to check existing organization' },
        { status: 500 }
      );
    }

    if (membership?.org_id) {
      console.log('[API /organizations/create] User already has org:', membership.org_id);
      return NextResponse.json({ orgId: membership.org_id });
    }

    // Create new organization with retry logic for duplicate names
    const baseOrgName = `${userEmail.split('@')[0]}'s Organization`;
    let orgName = baseOrgName;
    let newOrg = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[API /organizations/create] Attempt ${attempts}: Creating org "${orgName}"`);

      const { data, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({ name: orgName })
        .select()
        .single();

      if (!orgError) {
        newOrg = data;
        break;
      }

      // Check if error is a unique constraint violation (duplicate name)
      const isDuplicate = orgError.code === '23505' ||
                          orgError.message?.includes('duplicate') ||
                          orgError.message?.includes('unique constraint');

      if (isDuplicate && attempts < maxAttempts) {
        // Generate a random 4-character suffix and retry
        const suffix = Math.random().toString(36).substring(2, 6);
        orgName = `${baseOrgName}-${suffix}`;
        console.log(`[API /organizations/create] Duplicate name detected, retrying with: "${orgName}"`);
        continue;
      }

      // Non-duplicate error or max attempts reached
      console.error('[API /organizations/create] Org creation error:', {
        code: orgError.code,
        message: orgError.message,
        details: orgError.details,
        hint: orgError.hint,
        attempt: attempts
      });
      return NextResponse.json(
        { error: 'Failed to create organization', details: orgError.message },
        { status: orgError.code === '23505' ? 409 : 500 }
      );
    }

    if (!newOrg) {
      console.error('[API /organizations/create] Failed after all attempts');
      return NextResponse.json(
        { error: 'Failed to create organization after multiple attempts' },
        { status: 500 }
      );
    }

    console.log('[API /organizations/create] Created org:', newOrg.id);

    // Create organization membership
    const { error: memError } = await supabaseAdmin
      .from('org_memberships')
      .insert({
        org_id: newOrg.id,
        user_id: userId,
        role: 'owner'
      });

    if (memError) {
      console.error('[API /organizations/create] Membership creation error:', memError);
      return NextResponse.json(
        { error: 'Failed to create organization membership' },
        { status: 500 }
      );
    }

    console.log('[API /organizations/create] Success! Org ID:', newOrg.id);
    return NextResponse.json({ orgId: newOrg.id });

  } catch (error: any) {
    console.error('[API /organizations/create] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
