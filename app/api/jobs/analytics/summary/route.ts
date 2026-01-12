import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// TypeScript interfaces for type safety
interface JobStatusCounts {
  pending: number;
  assigned: number;
  completed: number;
  archived: number;
}

interface JobTradeCounts {
  [key: string]: number;
}

interface RecentJob {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface AnalyticsSummary {
  total: number;
  byStatus: JobStatusCounts;
  byTrade: JobTradeCounts;
  thisMonth: number;
  lastMonth: number;
  percentChange: number;
  recentJobs: RecentJob[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization from org_memberships table
    const { data: membership, error: membershipError } = await supabase
      .from('org_memberships')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      console.error('[Analytics API] Membership lookup error:', membershipError);
      return NextResponse.json(
        { error: 'User not associated with any organization' },
        { status: 404 }
      );
    }

    const orgId = membership.org_id;

    // Fetch all jobs for the organization
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, job_title, job_status, trade_needed, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error('[Analytics API] Jobs query error:', jobsError);
      return NextResponse.json(
        { error: 'Failed to fetch jobs data' },
        { status: 500 }
      );
    }

    // Initialize analytics data
    const analytics: AnalyticsSummary = {
      total: jobs?.length || 0,
      byStatus: {
        pending: 0,
        assigned: 0,
        completed: 0,
        archived: 0
      },
      byTrade: {},
      thisMonth: 0,
      lastMonth: 0,
      percentChange: 0,
      recentJobs: []
    };

    // Calculate date ranges for this month and last month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Process jobs data
    if (jobs && jobs.length > 0) {
      jobs.forEach((job) => {
        const createdAt = new Date(job.created_at);

        // Count by status (normalize status names)
        const status = (job.job_status || 'pending').toLowerCase();
        if (status === 'pending' || status === 'unassigned' || status === 'matching') {
          analytics.byStatus.pending++;
        } else if (status === 'assigned' || status === 'active' || status === 'in_progress') {
          analytics.byStatus.assigned++;
        } else if (status === 'completed' || status === 'done') {
          analytics.byStatus.completed++;
        } else if (status === 'archived' || status === 'cancelled') {
          analytics.byStatus.archived++;
        }

        // Count by trade
        const trade = job.trade_needed || 'unknown';
        analytics.byTrade[trade] = (analytics.byTrade[trade] || 0) + 1;

        // Count jobs by month
        if (createdAt >= thisMonthStart) {
          analytics.thisMonth++;
        } else if (createdAt >= lastMonthStart && createdAt <= lastMonthEnd) {
          analytics.lastMonth++;
        }
      });

      // Calculate percent change
      if (analytics.lastMonth > 0) {
        analytics.percentChange =
          ((analytics.thisMonth - analytics.lastMonth) / analytics.lastMonth) * 100;
      } else if (analytics.thisMonth > 0) {
        analytics.percentChange = 100; // 100% increase from zero
      }

      // Get recent 5 jobs
      analytics.recentJobs = jobs.slice(0, 5).map((job) => ({
        id: job.id,
        title: job.job_title || 'Untitled Job',
        status: job.job_status || 'pending',
        created_at: job.created_at
      }));
    }

    return NextResponse.json({
      success: true,
      data: analytics
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Analytics API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}
