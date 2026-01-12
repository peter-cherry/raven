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

// Request validation schema
const CreateJobSchema = z.object({
  org_id: z.string().uuid(),
  job_title: z.string().min(1, 'Job title is required'),
  description: z.string().optional(),
  trade_needed: z.string().min(1, 'Trade is required'),
  required_certifications: z.array(z.string()).optional(),
  address_text: z.string().min(1, 'Address is required'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  urgency: z.enum(['emergency', 'same_day', 'next_day', 'within_week', 'flexible']),
  scheduled_at: z.string().optional(),
  duration: z.string().optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  pay_rate: z.string().optional(),
  contact_name: z.string().min(1, 'Contact name is required'),
  contact_phone: z.string().min(1, 'Contact phone is required'),
  contact_email: z.string().email('Valid email is required'),
  policy_id: z.string().uuid().optional(),
  sla_config: z.object({
    dispatch: z.number(),
    assignment: z.number(),
    arrival: z.number(),
    completion: z.number(),
  }).optional(),
  dispatch_immediately: z.boolean().optional(),
  idempotency_key: z.string().optional(),
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

    // 4. Create job using lifecycle service
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

    // 4. Query jobs
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
