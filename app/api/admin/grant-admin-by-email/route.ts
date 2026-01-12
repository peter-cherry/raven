import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Parse request body
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  console.log('[Grant Admin By Email] Granting admin to:', email);

  // Use service role client to query auth.users and grant admin
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

  // Find user by email in auth.users
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.listUsers();

  if (authError) {
    console.error('[Grant Admin By Email] Error listing users:', authError);
    return NextResponse.json({ error: 'Failed to find user' }, { status: 500 });
  }

  const targetUser = authUser.users.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());

  if (!targetUser) {
    return NextResponse.json({
      error: `No user found with email: ${email}. The user must sign up first.`
    }, { status: 404 });
  }

  // Grant admin access
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('admin_users')
    .insert({
      user_id: targetUser.id,
      email: targetUser.email || '',
      granted_by: user.id
    })
    .select()
    .single();

  if (adminError) {
    // Check if already admin
    if (adminError.code === '23505') { // Unique constraint violation
      console.log('[Grant Admin By Email] User already admin');
      return NextResponse.json({
        error: 'This user is already an admin'
      }, { status: 400 });
    }

    console.error('[Grant Admin By Email] Error:', adminError);
    return NextResponse.json({ error: adminError.message }, { status: 500 });
  }

  console.log('[Grant Admin By Email] Success:', adminData);

  return NextResponse.json({
    success: true,
    message: `Admin access granted to ${email}`,
    admin: adminData
  });
}
