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
const UpdateCertificationSchema = z.object({
  certification_name: z.string().min(1).optional(),
  issuing_organization: z.string().min(1).optional(),
  certification_number: z.string().optional().nullable(),
  issue_date: z.string().optional().nullable(),
  expiration_date: z.string().optional().nullable(),
  verified: z.boolean().optional(),
});

/**
 * GET /api/credentials/certifications/:id
 * Get a specific certification.
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
    const certification = await credentialService.getCertification(id);

    return NextResponse.json({ certification });

  } catch (err) {
    if (err instanceof CredentialNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    logger.error('Failed to fetch certification', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/credentials/certifications/:id
 * Update a certification.
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
    const validation = UpdateCertificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const credentialService = createCredentialService(supabase, user.id);
    const existing = await credentialService.getCertification(id);

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

    const certification = await credentialService.updateCertification(id, validation.data);

    logger.info('Certification updated', { certificationId: id });

    return NextResponse.json({ certification });

  } catch (err) {
    if (err instanceof CredentialNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    if (err instanceof CredentialError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    logger.error('Failed to update certification', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/credentials/certifications/:id
 * Delete a certification.
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
    const existing = await credentialService.getCertification(id);

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

    await credentialService.deleteCertification(id);

    logger.info('Certification deleted', { certificationId: id });

    return NextResponse.json({ success: true });

  } catch (err) {
    if (err instanceof CredentialNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    if (err instanceof CredentialError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    logger.error('Failed to delete certification', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
