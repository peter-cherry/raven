import { supabase } from '@/lib/supabaseClient';

// Shared compliance state for bidirectional sync between overlays
export interface ComplianceState {
  stateLicenseRequired: boolean;
  coiRequired: boolean;
  glAmount: number;
  autoAmount: number;
  wcAmount: number;
  elAmount: number;
  cplAmount: number;
  additionalInsured: boolean;
  waiverOfSubrogation: boolean;
  primaryNonContributory: boolean;
  minDaysToExpiry: number;
}

export const DEFAULT_COMPLIANCE_STATE: ComplianceState = {
  stateLicenseRequired: false,
  coiRequired: false,
  glAmount: 1000000,
  autoAmount: 1000000,
  wcAmount: 1000000,
  elAmount: 1000000,
  cplAmount: 500000,
  additionalInsured: false,
  waiverOfSubrogation: false,
  primaryNonContributory: false,
  minDaysToExpiry: 30,
};

export type PolicyItemInput = {
  requirement_type: 'COI_VALID' | 'LICENSE_STATE' | string;
  required: boolean;
  weight: number;
  min_valid_days?: number;
};

export async function ensureRequirement(orgId: string, requirement_type: string, weight = 0, min_valid_days = 0) {
  const { data, error } = await supabase
    .from('compliance_requirements')
    .upsert({ org_id: orgId, requirement_type, weight, min_valid_days, enforcement: 'WARNING' }, { onConflict: 'org_id,requirement_type' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function createDraftPolicy(orgId: string, items: PolicyItemInput[]) {
  // Use API route for policy creation - handles auth and dev mode properly
  const response = await fetch('/api/policies/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ org_id: orgId, items })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create policy');
  }

  const data = await response.json();
  return data.policy_id as string;
}

export async function getPolicyScores(policyId: string) {
  const { data, error } = await supabase.rpc('technician_meets_policy', { p_policy_id: policyId });
  if (error) throw error;
  return data as { technician_id: string; meets_all: boolean; score: number; failed_requirements: any }[];
}

export async function attachPolicyToJob(policyId: string, jobId: string) {
  const { error } = await supabase.from('compliance_policies').update({ job_id: jobId }).eq('id', policyId);
  if (error) throw error;
}
