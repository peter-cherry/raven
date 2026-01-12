import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { platform_name } = await request.json();

    if (!platform_name) {
      return NextResponse.json({
        success: false,
        error: 'Missing platform_name'
      }, { status: 400 });
    }

    // Get platform ID
    const { data: platform, error: platformError } = await supabase
      .from('integration_platforms')
      .select('id')
      .eq('name', platform_name)
      .single();

    if (platformError || !platform) {
      return NextResponse.json({
        success: false,
        error: 'Platform not found'
      }, { status: 404 });
    }

    // Delete credentials
    const { error: deleteError } = await supabase
      .from('integration_credentials')
      .delete()
      .eq('user_id', userId)
      .eq('platform_id', platform.id);

    if (deleteError) {
      console.error('[Integrations Disconnect] Failed to delete credentials:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Failed to disconnect'
      }, { status: 500 });
    }

    // Log the disconnection
    await supabase.from('integration_sync_logs').insert({
      user_id: userId,
      platform_name,
      operation: 'disconnect',
      status: 'success',
      details: { disconnected_at: new Date().toISOString() }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected from ${platform_name}`
    });
  } catch (error: any) {
    console.error('[Integrations Disconnect] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
