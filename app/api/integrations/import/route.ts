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
    const { platform_name } = await request.json();

    if (!platform_name) {
      return NextResponse.json({
        success: false,
        error: 'Missing platform_name'
      }, { status: 400 });
    }

    // Call MCP integration_import_technicians tool
    console.log('[Integrations Import] Calling MCP tool with:', { userId, platform_name });

    const mcpResponse = await callMCPTool('integration_import_technicians', {
      user_id: userId,
      platform_name
    });

    if (!mcpResponse.success) {
      console.error('[Integrations Import] MCP error:', mcpResponse.error);

      // Log failed import
      await supabase.from('integration_sync_logs').insert({
        user_id: userId,
        platform_name,
        operation: 'import_technicians',
        status: 'error',
        error_message: mcpResponse.error || 'Import failed'
      });

      return NextResponse.json({
        success: false,
        error: mcpResponse.error || 'Failed to import technicians'
      }, { status: 500 });
    }

    const importData = mcpResponse.data;

    // Log successful import
    await supabase.from('integration_sync_logs').insert({
      user_id: userId,
      platform_name,
      operation: 'import_technicians',
      status: 'success',
      records_processed: importData.imported_count || 0,
      records_successful: importData.imported_count || 0,
      details: {
        duplicates_found: importData.duplicates_found || 0,
        technicians_imported: importData.technicians || []
      }
    });

    // Update last_sync_at for the credential
    const { data: platform } = await supabase
      .from('integration_platforms')
      .select('id')
      .eq('name', platform_name)
      .single();

    if (platform) {
      await supabase
        .from('integration_credentials')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('platform_id', platform.id);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importData.imported_count || 0} technicians`,
      imported_count: importData.imported_count || 0,
      duplicates_found: importData.duplicates_found || 0,
      technicians: importData.technicians || []
    });
  } catch (error: any) {
    console.error('[Integrations Import] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
