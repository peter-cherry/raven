import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  console.log('[Grant Admin] User:', user.id, user.email);

  // Use service role client to bypass RLS
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

  // Insert the user as admin using service role (bypasses RLS)
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('admin_users')
    .insert({
      user_id: user.id,
      email: user.email || '',
      granted_by: user.id
    })
    .select()
    .single();

  if (adminError) {
    // Check if already admin
    if (adminError.code === '23505') { // Unique constraint violation
      console.log('[Grant Admin] User already admin');
      return NextResponse.json({
        success: true,
        message: 'Already an admin',
        admin: { user_id: user.id, email: user.email }
      });
    }

    console.error('[Grant Admin] Error:', adminError);
    return NextResponse.json({ error: adminError.message }, { status: 500 });
  }

  console.log('[Grant Admin] Success:', adminData);

  return NextResponse.json({
    success: true,
    message: 'Admin access granted',
    admin: adminData
  });
}
