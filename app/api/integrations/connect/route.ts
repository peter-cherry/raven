import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { callMCPTool } from '@/lib/mcp-client';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { platform_name, credentials } = await request.json();

    if (!platform_name || !credentials) {
      return NextResponse.json({
        success: false,
        error: 'Missing platform_name or credentials'
      }, { status: 400 });
    }

    // Call MCP integration_connect tool
    console.log('[Integrations Connect] Calling MCP tool with:', { userId, platform_name });

    const mcpResponse = await callMCPTool('integration_connect', {
      user_id: userId,
      platform_name,
      credentials
    });

    if (!mcpResponse.success) {
      console.error('[Integrations Connect] MCP error:', mcpResponse.error);
      return NextResponse.json({
        success: false,
        error: mcpResponse.error || 'Failed to connect to platform'
      }, { status: 500 });
    }

    // Log the sync operation
    await supabase.from('integration_sync_logs').insert({
      user_id: userId,
      platform_name,
      operation: 'connect',
      status: 'success',
      details: { connection_established: true }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${platform_name}`,
      data: mcpResponse.data
    });
  } catch (error: any) {
    console.error('[Integrations Connect] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
