import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const org_id: string | undefined = body.org_id;
    const items: Array<{ requirement_type: string; required: boolean; weight?: number; min_valid_days?: number; metadata?: any }> = Array.isArray(body.items) ? body.items : [];

    if (!org_id || !items.length) {
      return NextResponse.json({ error: 'org_id and items are required' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';

    // Prefer Authorization header if present; fallback to cookie-based auth
    let supabase: ReturnType<typeof createRouteHandlerClient> | ReturnType<typeof createClient> | any;
    let userId: string | null = null;

    // Development mode bypass - use service role key for database operations
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.log('[Draft Policy API] Dev mode: using service role key');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
      supabase = createClient(url, serviceKey);
      userId = '00000000-0000-0000-0000-000000000001'; // Fake dev user ID
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      supabase = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
      const { data: userRes } = await supabase.auth.getUser(token);
      userId = userRes?.user?.id ?? null;
    } else {
      supabase = createRouteHandlerClient({ cookies });
      const { data: sess } = await supabase.auth.getSession();
      userId = sess.session?.user?.id ?? null;
    }

    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Try to ensure membership but do not block on failure (RLS varies per table)
    await supabase
      .from('org_memberships')
      .upsert({ user_id: userId, org_id }, { onConflict: 'user_id,org_id' });

    const { data: policy, error: pErr, status: pStatus } = await supabase
      .from('compliance_policies')
      .insert({ org_id, status: 'draft' })
      .select('id')
      .single();
    if (pErr || !policy) return NextResponse.json({ error: pErr?.message || 'Insert policy failed' }, { status: pStatus || 400 });
    if (pErr) throw pErr;

    for (const it of items) {
      const { data: reqRow, error: rErr } = await supabase
        .from('compliance_requirements')
        .upsert({ org_id, requirement_type: it.requirement_type, weight: it.weight ?? 0, min_valid_days: it.min_valid_days ?? 0, enforcement: 'WARNING' }, { onConflict: 'org_id,requirement_type' })
        .select('id')
        .single();
      if (rErr) throw rErr;

      const { error: iErr } = await supabase
        .from('compliance_policy_items')
        .upsert({ policy_id: policy.id, requirement_id: reqRow.id, required: !!it.required, min_valid_days: it.min_valid_days ?? 0, weight: it.weight ?? 0 }, { onConflict: 'policy_id,requirement_id' });
      if (iErr) throw iErr;
    }

    return NextResponse.json({ policy_id: policy.id });
  } catch (e: any) {
    console.error('Create draft policy error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
