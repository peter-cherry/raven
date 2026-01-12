import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  createCredentialService,
  CredentialError,
} from '@/lib/services/credential-service';
import { createRequestLogger, getOrCreateRequestId } from '@/lib/server/logger';

// Request validation schema
const CreateInsuranceSchema = z.object({
  contractor_id: z.string().uuid(),
  insurance_type: z.string().min(1),
  provider: z.string().min(1),
  policy_number: z.string().min(1),
  coverage_amount: z.number().optional(),
  expiration_date: z.string().optional(),
  verified: z.boolean().optional(),
});

/**
 * POST /api/credentials/insurance
 * Create a new insurance record for a contractor.
 */
export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const logger = createRequestLogger(request, { requestId });

  try {
    // 1. Authenticate user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = CreateInsuranceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // 3. Verify user has access to this contractor
    const { data: contractor } = await supabase
      .from('technicians')
      .select('id, user_id')
      .eq('id', validation.data.contractor_id)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const isOwner = contractor.user_id === user.id;
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!isOwner && !admin) {
      return NextResponse.json(
        { error: 'Not authorized to manage this contractor\'s credentials' },
        { status: 403 }
      );
    }

    // 4. Create insurance
    const credentialService = createCredentialService(supabase, user.id);
    const insurance = await credentialService.createInsurance(validation.data);

    logger.info('Insurance created', { insuranceId: insurance.id, contractorId: validation.data.contractor_id });

    return NextResponse.json({ insurance }, { status: 201 });

  } catch (err) {
    if (err instanceof CredentialError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    logger.error('Failed to create insurance', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/credentials/insurance
 * Get insurance records for a contractor.
 */
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const logger = createRequestLogger(request, { requestId });

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractorId = searchParams.get('contractor_id');

    if (!contractorId) {
      return NextResponse.json({ error: 'contractor_id is required' }, { status: 400 });
    }

    const credentialService = createCredentialService(supabase, user.id);
    const insurance = await credentialService.getContractorInsurance(contractorId);

    return NextResponse.json({ insurance });

  } catch (err) {
    logger.error('Failed to fetch insurance', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
