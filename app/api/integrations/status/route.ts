import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch available platforms
    const { data: platforms, error: platformsError } = await supabase
      .from('integration_platforms')
      .select('*')
      .order('display_name');

    if (platformsError) {
      console.error('[Integrations Status] Failed to fetch platforms:', platformsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch platforms'
      }, { status: 500 });
    }

    // Fetch user's connected platforms
    const { data: credentials, error: credentialsError } = await supabase
      .from('integration_credentials')
      .select(`
        id,
        platform_id,
        connection_status,
        last_sync_at,
        last_error,
        created_at,
        integration_platforms (
          id,
          name,
          display_name,
          api_base_url
        )
      `)
      .eq('user_id', userId);

    if (credentialsError) {
      console.error('[Integrations Status] Failed to fetch credentials:', credentialsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch connected platforms'
      }, { status: 500 });
    }

    // Transform connected platforms data
    const connectedPlatforms = (credentials || []).map(cred => ({
      platform: (cred as any).integration_platforms,
      connection_status: cred.connection_status,
      last_sync_at: cred.last_sync_at,
      last_error: cred.last_error,
      created_at: cred.created_at
    }));

    // Filter out already connected platforms from available list
    const connectedPlatformIds = connectedPlatforms.map(c => c.platform.id);
    const availablePlatforms = (platforms || []).filter(
      p => !connectedPlatformIds.includes(p.id)
    );

    return NextResponse.json({
      success: true,
      availablePlatforms,
      connectedPlatforms
    });
  } catch (error: any) {
    console.error('[Integrations Status] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
