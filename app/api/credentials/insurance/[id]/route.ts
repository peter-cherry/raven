import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  createCredentialService,
  CredentialError,
  CredentialNotFoundError,
} from '@/lib/services/credential-service';
import { createRequestLogger, getOrCreateRequestId } from '@/lib/server/logger';

// Update validation schema
const UpdateInsuranceSchema = z.object({
  insurance_type: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  policy_number: z.string().min(1).optional(),
  coverage_amount: z.number().optional().nullable(),
  expiration_date: z.string().optional().nullable(),
  verified: z.boolean().optional(),
});

/**
 * GET /api/credentials/insurance/:id
 * Get a specific insurance record.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestId = getOrCreateRequestId(request);
  const logger = createRequestLogger(request, { requestId });

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credentialService = createCredentialService(supabase, user.id);
    const insurance = await credentialService.getInsurance(id);

    return NextResponse.json({ insurance });

  } catch (err) {
    if (err instanceof CredentialNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    logger.error('Failed to fetch insurance', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/credentials/insurance/:id
 * Update an insurance record.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestId = getOrCreateRequestId(request);
  const logger = createRequestLogger(request, { requestId });

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = UpdateInsuranceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const credentialService = createCredentialService(supabase, user.id);
    const existing = await credentialService.getInsurance(id);

    // Verify user has access
    const { data: contractor } = await supabase
      .from('technicians')
      .select('id, user_id')
      .eq('id', existing.contractor_id)
      .single();

    const isOwner = contractor?.user_id === user.id;
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!isOwner && !admin) {
      return NextResponse.json(
        { error: 'Not authorized to update this credential' },
        { status: 403 }
      );
    }

    const insurance = await credentialService.updateInsurance(id, validation.data);

    logger.info('Insurance updated', { insuranceId: id });

    return NextResponse.json({ insurance });

  } catch (err) {
    if (err instanceof CredentialNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    if (err instanceof CredentialError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    logger.error('Failed to update insurance', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/credentials/insurance/:id
 * Delete an insurance record.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestId = getOrCreateRequestId(request);
  const logger = createRequestLogger(request, { requestId });

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credentialService = createCredentialService(supabase, user.id);
    const existing = await credentialService.getInsurance(id);

    // Verify user has access
    const { data: contractor } = await supabase
      .from('technicians')
      .select('id, user_id')
      .eq('id', existing.contractor_id)
      .single();

    const isOwner = contractor?.user_id === user.id;
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!isOwner && !admin) {
      return NextResponse.json(
        { error: 'Not authorized to delete this credential' },
        { status: 403 }
      );
    }

    await credentialService.deleteInsurance(id);

    logger.info('Insurance deleted', { insuranceId: id });

    return NextResponse.json({ success: true });

  } catch (err) {
    if (err instanceof CredentialNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    if (err instanceof CredentialError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    logger.error('Failed to delete insurance', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
