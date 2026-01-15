import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createJobLifecycleService,
  JobCreationError,
  DuplicateJobError,
  CreateJobInput,
} from '@/lib/services/job-lifecycle';
import { createRequestLogger, getOrCreateRequestId } from '@/lib/server/logger';
import { getAuthenticatedUser, getUserOrgMembership, requireOrgMembership, ForbiddenError, UnauthorizedError } from '@/lib/server/auth';

// Check if we should use mock mode
function isMockMode(): boolean {
  const mockModeFlag = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
  const missingCredentials = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
  return mockModeFlag || missingCredentials;
}

// Request validation schema - allow any string for org_id in mock mode
// Note: .nullable() allows null values, .optional() allows undefined
const CreateJobSchema = z.object({
  org_id: z.string().min(1),
  job_title: z.string().min(1, 'Job title is required'),
  description: z.string().nullable().optional(),
  trade_needed: z.string().min(1, 'Trade is required'),
  required_certifications: z.array(z.string()).nullable().optional(),
  address_text: z.string().min(1, 'Address is required'),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  urgency: z.enum(['emergency', 'same_day', 'next_day', 'within_week', 'flexible']),
  scheduled_at: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  budget_min: z.number().nullable().optional(),
  budget_max: z.number().nullable().optional(),
  pay_rate: z.string().nullable().optional(),
  contact_name: z.string().nullable().optional().transform(val => val || ''),
  contact_phone: z.string().nullable().optional().transform(val => val || ''),
  contact_email: z.string().nullable().optional().transform(val => val || ''),
  policy_id: z.string().uuid().nullable().optional(),
  sla_config: z.object({
    dispatch: z.number(),
    assignment: z.number(),
    arrival: z.number(),
    completion: z.number(),
  }).nullable().optional(),
  dispatch_immediately: z.boolean().nullable().optional(),
  idempotency_key: z.string().nullable().optional(),
});

/**
 * POST /api/jobs
 * Create a new job with full lifecycle initialization.
 * This is the authoritative endpoint for job creation.
 */
export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const logger = createRequestLogger(request, { requestId });

  try {
    // 1. Authenticate user (handles mock mode automatically)
    const { user, supabase } = await getAuthenticatedUser();

    logger.info('Job creation request received', { userId: user.id });

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = CreateJobSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Job creation validation failed', { errors: validation.error.errors });
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const input: CreateJobInput = validation.data;

    // 3. Verify user has access to the organization
    try {
      await requireOrgMembership(supabase, user.id, input.org_id);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        logger.warn('User not member of organization', { userId: user.id, orgId: input.org_id });
        return NextResponse.json(
          { error: 'Not a member of this organization' },
          { status: 403 }
        );
      }
      throw err;
    }

    // 4. Mock mode - return mock job without database
    if (isMockMode()) {
      logger.info('Mock mode: returning mock job');
      const mockJob = {
        id: `mock-job-${Date.now()}`,
        org_id: input.org_id,
        job_title: input.job_title,
        description: input.description,
        trade_needed: input.trade_needed,
        address_text: input.address_text,
        city: input.city,
        state: input.state,
        lat: input.lat,
        lng: input.lng,
        urgency: input.urgency,
        scheduled_at: input.scheduled_at,
        contact_name: input.contact_name,
        contact_phone: input.contact_phone,
        contact_email: input.contact_email,
        job_status: 'pending',
        created_at: new Date().toISOString(),
        created_by: user.id,
      };
      
      return NextResponse.json(
        {
          job: mockJob,
          dispatch: { warm_sent: 0, cold_sent: 0 },
          sla_timers: null,
          duplicate: false,
          mock: true,
        },
        { status: 201 }
      );
    }

    // 5. Create job using lifecycle service
    const jobService = createJobLifecycleService(supabase, user.id, input.org_id);
    const result = await jobService.createWithDispatch(input);

    if (result.duplicate) {
      logger.info('Duplicate job detected', { jobId: result.job.id });
      return NextResponse.json(
        {
          job: result.job,
          duplicate: true,
          message: 'Job already exists with this idempotency key',
        },
        { status: 200 }
      );
    }

    logger.info('Job created successfully', {
      jobId: result.job.id,
      dispatched: !!result.dispatch,
      warmSent: result.dispatch?.warm_sent,
      coldSent: result.dispatch?.cold_sent,
    });

    return NextResponse.json(
      {
        job: result.job,
        dispatch: result.dispatch,
        sla_timers: result.sla_timers,
        duplicate: false,
      },
      { status: 201 }
    );

  } catch (err) {
    if (err instanceof UnauthorizedError) {
      logger.warn('Unauthorized job creation attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (err instanceof JobCreationError) {
      logger.error('Job creation failed', err);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (err instanceof DuplicateJobError) {
      logger.info('Duplicate job', err, { existingJobId: err.existingJobId });
      return NextResponse.json(
        { error: err.message, existingJobId: err.existingJobId },
        { status: 409 }
      );
    }

    logger.error('Unexpected error during job creation', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs
 * List jobs for the authenticated user's organization.
 */
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const logger = createRequestLogger(request, { requestId });

  try {
    // 1. Authenticate user (handles mock mode automatically)
    const { user, supabase } = await getAuthenticatedUser();

    // 2. Get user's organization
    const membership = await getUserOrgMembership(supabase, user.id);
    if (!membership) {
      return NextResponse.json({ error: 'No organization membership found' }, { status: 403 });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 4. Mock mode - return mock jobs
    if (isMockMode()) {
      logger.info('Mock mode: returning mock jobs');
      const { MOCK_JOBS } = await import('@/lib/mock-supabase');
      let mockJobs = [...MOCK_JOBS];
      
      if (status) {
        mockJobs = mockJobs.filter(job => job.job_status === status);
      }
      
      return NextResponse.json({
        jobs: mockJobs.slice(offset, offset + limit),
        total: mockJobs.length,
        limit,
        offset,
        mock: true,
      });
    }

    // 5. Query jobs
    let query = supabase
      .from('jobs')
      .select('*, technicians(id, full_name, email, phone)', { count: 'exact' })
      .eq('org_id', membership.org_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('job_status', status);
    }

    const { data: jobs, error: jobsError, count } = await query;

    if (jobsError) {
      logger.error('Failed to fetch jobs', jobsError);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    return NextResponse.json({
      jobs: jobs || [],
      total: count || 0,
      limit,
      offset,
    });

  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.error('Unexpected error fetching jobs', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
