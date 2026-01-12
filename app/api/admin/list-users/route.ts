import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Create Supabase admin client (bypasses RLS)
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

    // Get all users from auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error listing users:', authError);
      return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
    }

    // Get org memberships for all users
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('org_memberships')
      .select('user_id, org_id, organizations(name)');

    if (membershipError) {
      console.error('Error fetching org memberships:', membershipError);
    }

    // Get admin users
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('user_id');

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
    }

    const adminUserIds = new Set(adminUsers?.map(a => a.user_id) || []);

    // Combine data
    const users = authData.users.map(user => {
      const userMemberships = memberships?.filter(m => m.user_id === user.id) || [];
      const isAdmin = adminUserIds.has(user.id);

      return {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider || 'email',
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        emailConfirmed: user.email_confirmed_at !== null,
        organizations: userMemberships.map(m => ({
          id: m.org_id,
          name: (m.organizations as any)?.name || 'Unknown'
        })),
        isAdmin,
        metadata: user.user_metadata
      };
    });

    // Sort by most recent first
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      users,
      total: users.length
    });

  } catch (error: any) {
    console.error('Error in list-users endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
