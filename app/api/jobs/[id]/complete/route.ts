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
const CompleteJobSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/jobs/:id/complete
 * Mark a job as completed.
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
      logger.warn('Unauthorized complete attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify user has access to the job
    let job: any;
    try {
      const access = await requireJobAccess(supabase, user.id, jobId);
      job = access.job;
    } catch (err) {
      if (err instanceof ForbiddenError) {
        logger.warn('User not authorized to complete job', { userId: user.id, jobId });
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      throw err;
    }

    // 3. Parse and validate request body
    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is acceptable
    }
    
    const validation = CompleteJobSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Complete validation failed', { errors: validation.error.errors });
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { rating, notes } = validation.data;

    // 4. Complete job using lifecycle service
    const jobService = createJobLifecycleService(supabase, user.id, job.org_id);
    const updatedJob = await jobService.complete(jobId, rating, notes);

    logger.info('Job completed successfully', {
      jobId,
      rating,
    });

    return NextResponse.json({
      job: updatedJob,
      message: 'Job completed successfully',
    });

  } catch (err) {
    if (err instanceof InvalidStateError) {
      logger.warn('Invalid job state for completion', err);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (err instanceof JobUpdateError) {
      logger.error('Job completion failed', err);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    logger.error('Unexpected error during job completion', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
