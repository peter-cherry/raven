import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  // Admin authentication check
  const supabaseAuth = createRouteHandlerClient({ cookies });
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: admin } = await supabaseAuth
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    // Check if compliance_acknowledgments table exists
    const { data: ackData, error: ackError } = await supabase
      .from('compliance_acknowledgments')
      .select('count')
      .limit(1);

    // Check if compliance_policies table exists
    const { data: policyData, error: policyError } = await supabase
      .from('compliance_policies')
      .select('count')
      .limit(1);

    // Check organizations table for compliance columns
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, compliance_policy_acknowledged, onboarding_complete')
      .limit(1);

    return NextResponse.json({
      tables: {
        compliance_acknowledgments: {
          exists: !ackError,
          error: ackError?.message || null
        },
        compliance_policies: {
          exists: !policyError,
          error: policyError?.message || null
        },
        organizations: {
          hasComplianceColumns: !orgError && orgData && orgData.length > 0,
          error: orgError?.message || null,
          sample: orgData?.[0] || null
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
