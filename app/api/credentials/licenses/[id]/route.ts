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
const UpdateLicenseSchema = z.object({
  license_type: z.string().min(1).optional(),
  license_number: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  expiration_date: z.string().optional().nullable(),
  verified: z.boolean().optional(),
});

/**
 * GET /api/credentials/licenses/:id
 * Get a specific license.
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
    const license = await credentialService.getLicense(id);

    return NextResponse.json({ license });

  } catch (err) {
    if (err instanceof CredentialNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    logger.error('Failed to fetch license', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/credentials/licenses/:id
 * Update a license.
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

    // Parse and validate request body
    const body = await request.json();
    const validation = UpdateLicenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Get existing license to check authorization
    const credentialService = createCredentialService(supabase, user.id);
    const existing = await credentialService.getLicense(id);

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

    const license = await credentialService.updateLicense(id, validation.data);

    logger.info('License updated', { licenseId: id });

    return NextResponse.json({ license });

  } catch (err) {
    if (err instanceof CredentialNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    if (err instanceof CredentialError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    logger.error('Failed to update license', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/credentials/licenses/:id
 * Delete a license.
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

    // Get existing license to check authorization
    const credentialService = createCredentialService(supabase, user.id);
    const existing = await credentialService.getLicense(id);

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

    await credentialService.deleteLicense(id);

    logger.info('License deleted', { licenseId: id });

    return NextResponse.json({ success: true });

  } catch (err) {
    if (err instanceof CredentialNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    if (err instanceof CredentialError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    logger.error('Failed to delete license', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
