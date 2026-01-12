import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, ban, duration } = await req.json();

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

    // Get user info
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (!userData.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (ban) {
      // Calculate ban duration
      let banUntil;
      if (duration === 'permanent') {
        banUntil = new Date('2099-12-31').toISOString();
      } else if (duration) {
        // Duration in hours
        banUntil = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();
      } else {
        // Default 24 hours
        banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }

      // Update user metadata to mark as banned
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: banUntil,
        user_metadata: {
          ...userData.user.user_metadata,
          banned: true,
          banned_until: banUntil,
          banned_at: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Error banning user:', error);
        return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 });
      }

      console.log(`[Admin] Banned user: ${userData.user.email} until ${banUntil}`);
      return NextResponse.json({
        success: true,
        message: `User ${userData.user.email} banned until ${new Date(banUntil).toLocaleString()}`
      });
    } else {
      // Unban user
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
        user_metadata: {
          ...userData.user.user_metadata,
          banned: false,
          banned_until: null,
          unbanned_at: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Error unbanning user:', error);
        return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 });
      }

      console.log(`[Admin] Unbanned user: ${userData.user.email}`);
      return NextResponse.json({
        success: true,
        message: `User ${userData.user.email} unbanned`
      });
    }

  } catch (error: any) {
    console.error('Error in ban-user endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
