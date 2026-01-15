import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { createMockSupabaseClient, MOCK_USER, MOCK_ORG_MEMBERSHIP } from '../mock-supabase';

export { MOCK_USER, MOCK_ORG_MEMBERSHIP };

// Custom error classes for auth/authorization
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export interface AuthenticatedContext {
  user: User;
  supabase: SupabaseClient;
}

export interface OrgMembership {
  org_id: string;
  role: string;
}

// Check if running in mock mode (explicit flag OR missing credentials)
function isMockMode(): boolean {
  const mockModeFlag = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
  const missingCredentials = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
  return mockModeFlag || missingCredentials;
}

/**
 * Get the authenticated user from the current request context.
 * Throws UnauthorizedError if no valid session exists.
 * In mock mode, returns a mock user and client.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedContext> {
  // Mock mode for local development without Supabase
  if (isMockMode()) {
    const mockClient = createMockSupabaseClient();
    return {
      user: MOCK_USER as unknown as User,
      supabase: mockClient as unknown as SupabaseClient,
    };
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError();
  }

  return { user, supabase };
}

/**
 * Verify that a user is a member of the specified organization.
 * Returns the membership details including role.
 * Throws ForbiddenError if user is not a member.
 */
export async function requireOrgMembership(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<OrgMembership> {
  // Mock mode - allow any org ID
  if (isMockMode()) {
    return {
      org_id: orgId,
      role: 'owner',
    };
  }

  const { data: membership, error } = await supabase
    .from('org_memberships')
    .select('org_id, role')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();

  if (error || !membership) {
    throw new ForbiddenError('Not a member of this organization');
  }

  return membership;
}

/**
 * Get the user's primary organization membership.
 * Returns null if user has no org membership.
 */
export async function getUserOrgMembership(
  supabase: SupabaseClient,
  userId: string
): Promise<OrgMembership | null> {
  // Mock mode for local development
  if (isMockMode()) {
    return {
      org_id: MOCK_ORG_MEMBERSHIP.org_id,
      role: MOCK_ORG_MEMBERSHIP.role,
    };
  }

  const { data: membership, error } = await supabase
    .from('org_memberships')
    .select('org_id, role')
    .eq('user_id', userId)
    .single();

  if (error || !membership) {
    return null;
  }

  return membership;
}

/**
 * Verify that a user has admin privileges.
 * Throws ForbiddenError if user is not an admin.
 */
export async function requireAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: admin, error } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (error || !admin) {
    throw new ForbiddenError('Admin access required');
  }

  return true;
}

/**
 * Check if a user is an admin (non-throwing version).
 */
export async function isAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', userId)
    .single();

  return !!admin;
}

/**
 * Verify that a user owns or has access to a specific job.
 * Checks if the job belongs to an organization the user is a member of.
 */
export async function requireJobAccess(
  supabase: SupabaseClient,
  userId: string,
  jobId: string
): Promise<{ job: any; membership: OrgMembership }> {
  // Get the job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, org_id, job_status, assigned_tech_id')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    throw new ForbiddenError('Job not found');
  }

  // Check org membership
  const membership = await requireOrgMembership(supabase, userId, job.org_id);

  return { job, membership };
}
