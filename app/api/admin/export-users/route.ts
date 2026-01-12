import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
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

    // Get all users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error listing users:', authError);
      return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
    }

    // Get org memberships
    const { data: memberships } = await supabaseAdmin
      .from('org_memberships')
      .select('user_id, org_id, organizations(name)');

    // Get admin users
    const { data: adminUsers } = await supabaseAdmin
      .from('admin_users')
      .select('user_id');

    const adminUserIds = new Set(adminUsers?.map(a => a.user_id) || []);

    // Build CSV
    const headers = ['User ID', 'Email', 'Provider', 'Is Admin', 'Email Confirmed', 'Created At', 'Last Sign In', 'Organizations'];

    const rows = authData.users.map(user => {
      const userMemberships = memberships?.filter(m => m.user_id === user.id) || [];
      const orgs = userMemberships.map(m => (m.organizations as any)?.name || 'Unknown').join('; ');

      return [
        user.id,
        user.email || '',
        user.app_metadata?.provider || 'email',
        adminUserIds.has(user.id) ? 'Yes' : 'No',
        user.email_confirmed_at ? 'Yes' : 'No',
        user.created_at,
        user.last_sign_in_at || 'Never',
        orgs
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: any) {
    console.error('Error in export-users endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
