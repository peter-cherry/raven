import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  createJobLifecycleService,
  JobUpdateError,
  InvalidStateError,
} from '@/lib/services/job-lifecycle';
import { createRequestLogger, getOrCreateRequestId } from '@/lib/server/logger';
import { requireJobAccess, ForbiddenError } from '@/lib/server/auth';

// Request validation schema
const AssignJobSchema = z.object({
  technician_id: z.string().uuid('Valid technician ID is required'),
});

/**
 * POST /api/jobs/:id/assign
 * Assign a technician to a job.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const requestId = getOrCreateRequestId(request);
  const logger = createRequestLogger(request, { requestId, jobId });

  try {
    // 1. Authenticate user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized assign attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify user has access to the job
    let job: any;
    let membership: any;
    try {
      const access = await requireJobAccess(supabase, user.id, jobId);
      job = access.job;
      membership = access.membership;
    } catch (err) {
      if (err instanceof ForbiddenError) {
        logger.warn('User not authorized to assign job', { userId: user.id, jobId });
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      throw err;
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validation = AssignJobSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Assign validation failed', { errors: validation.error.errors });
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { technician_id } = validation.data;

    // 4. Assign technician using lifecycle service
    const jobService = createJobLifecycleService(supabase, user.id, job.org_id);
    const updatedJob = await jobService.assign(jobId, technician_id);

    logger.info('Job assigned successfully', {
      jobId,
      technicianId: technician_id,
    });

    return NextResponse.json({
      job: updatedJob,
      message: 'Technician assigned successfully',
    });

  } catch (err) {
    if (err instanceof InvalidStateError) {
      logger.warn('Invalid job state for assignment', err);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (err instanceof JobUpdateError) {
      logger.error('Job assignment failed', err);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    logger.error('Unexpected error during job assignment', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/:id/assign
 * Unassign a technician from a job.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const requestId = getOrCreateRequestId(request);
  const logger = createRequestLogger(request, { requestId, jobId });

  try {
    // 1. Authenticate user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify user has access to the job
    let job: any;
    try {
      const access = await requireJobAccess(supabase, user.id, jobId);
      job = access.job;
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      throw err;
    }

    // 3. Unassign using lifecycle service
    const jobService = createJobLifecycleService(supabase, user.id, job.org_id);
    const updatedJob = await jobService.unassign(jobId);

    logger.info('Job unassigned successfully', { jobId });

    return NextResponse.json({
      job: updatedJob,
      message: 'Technician unassigned successfully',
    });

  } catch (err) {
    if (err instanceof InvalidStateError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (err instanceof JobUpdateError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    logger.error('Unexpected error during job unassignment', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
