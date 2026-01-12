import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { MOCK_USER, isMockMode } from '@/lib/mock-supabase';

// Check if we should use mock mode (env var or missing credentials)
function shouldUseMockMode(): boolean {
  if (isMockMode()) return true;
  
  // Auto-enable mock mode if Supabase credentials are missing
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey || !serviceKey) {
    console.log('[Check Admin] Auto-enabling mock mode: Supabase credentials not found');
    return true;
  }
  
  return false;
}

export async function GET() {
  // Mock mode - grant admin access to demo user
  if (shouldUseMockMode()) {
    return NextResponse.json({
      isAdmin: true,
      user: {
        id: MOCK_USER.id,
        email: MOCK_USER.email
      }
    });
  }

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ isAdmin: false, error: 'Not authenticated' });
  }

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

  // Check if user is admin using service role (bypasses RLS)
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminError) {
    console.error('[Check Admin] Error:', adminError);
    return NextResponse.json({ isAdmin: false, error: adminError.message });
  }

  const isAdmin = !!adminData;

  return NextResponse.json({
    isAdmin,
    user: {
      id: user.id,
      email: user.email
    }
  });
}
