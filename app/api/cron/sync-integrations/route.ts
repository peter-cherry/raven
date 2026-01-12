import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

/**
 * Cron job to automatically sync all active integrations
 * Runs daily at 2 AM UTC
 * Schedule: 0 2 * * * (defined in vercel.json)
 */
export async function GET(request: NextRequest) {
  console.log('[Cron] Integration sync started at', new Date().toISOString());

  // Verify this is actually a cron request (Vercel adds this header)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('[Cron] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create server-side Supabase client with service role key for cron jobs
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get all active connections
    const { data: connections, error: connError } = await supabase
      .from('platform_connections')
      .select(`
        *,
        platform:platforms(*)
      `)
      .eq('connection_status', 'active');

    if (connError) {
      console.error('[Cron] Error fetching connections:', connError);
      return NextResponse.json({ error: connError.message }, { status: 500 });
    }

    if (!connections || connections.length === 0) {
      console.log('[Cron] No active connections to sync');
      return NextResponse.json({
        success: true,
        message: 'No active connections',
        synced: 0
      });
    }

    console.log(`[Cron] Found ${connections.length} active connections to sync`);

    const results = [];

    // Sync each connection
    for (const conn of connections) {
      try {
        console.log(`[Cron] Syncing ${conn.platform.name} for org ${conn.org_id}`);

        // Call the import API for each connection
        const importResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platform_name: conn.platform.name,
            org_id: conn.org_id
          })
        });

        const importData = await importResponse.json();

        if (importData.success) {
          console.log(`[Cron] Successfully synced ${conn.platform.name}: ${importData.imported_count} technicians`);
          results.push({
            platform: conn.platform.name,
            org_id: conn.org_id,
            success: true,
            imported: importData.imported_count,
            duplicates: importData.duplicates_found
          });

          // Update last_sync_at timestamp
          await supabase
            .from('platform_connections')
            .update({ last_sync_at: new Date().toISOString() })
            .eq('id', conn.id);
        } else {
          console.error(`[Cron] Failed to sync ${conn.platform.name}:`, importData.error);
          results.push({
            platform: conn.platform.name,
            org_id: conn.org_id,
            success: false,
            error: importData.error
          });
        }
      } catch (error) {
        console.error(`[Cron] Error syncing ${conn.platform.name}:`, error);
        results.push({
          platform: conn.platform.name,
          org_id: conn.org_id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[Cron] Sync completed: ${successCount} succeeded, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total_connections: connections.length,
      succeeded: successCount,
      failed: failCount,
      results
    });

  } catch (error) {
    console.error('[Cron] Sync error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
