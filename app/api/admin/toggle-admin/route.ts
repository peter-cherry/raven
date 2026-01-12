import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, grant } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
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

    // Get user email
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (!userData.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (grant) {
      // Grant admin privileges
      const { error } = await supabaseAdmin
        .from('admin_users')
        .insert({
          user_id: userId,
          email: userData.user.email,
          granted_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error granting admin:', error);
        return NextResponse.json({ error: 'Failed to grant admin privileges' }, { status: 500 });
      }

      console.log(`[Admin] Granted admin to user: ${userData.user.email}`);
      return NextResponse.json({ success: true, message: `Admin granted to ${userData.user.email}` });
    } else {
      // Revoke admin privileges
      const { error } = await supabaseAdmin
        .from('admin_users')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error revoking admin:', error);
        return NextResponse.json({ error: 'Failed to revoke admin privileges' }, { status: 500 });
      }

      console.log(`[Admin] Revoked admin from user: ${userData.user.email}`);
      return NextResponse.json({ success: true, message: `Admin revoked from ${userData.user.email}` });
    }

  } catch (error: any) {
    console.error('Error in toggle-admin endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
