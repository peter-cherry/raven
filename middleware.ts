import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

  // Mock mode or missing config - skip all auth checks
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
  
  // Skip auth if mock mode enabled OR Supabase not configured
  if (isMockMode || !hasSupabaseConfig) {
    // Allow all requests through without auth
    return res;
  }

  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Public paths (no auth required)
  const publicPaths = [
    '/login',
    '/signup',
    '/api/auth/callback',
    '/api/webhooks/',              // Webhooks use API keys
    '/api/unsubscribe',            // Public unsubscribe
    '/api/technicians/signup',     // Public technician signup
    '/technicians-landing',        // Marketing page
    '/operators-landing',          // Marketing page
    '/landing',                    // Landing page
    '/legal',                      // Legal pages
    '/contact',                    // Contact page
  ];

  const isPublicPath = publicPaths.some(p => path.startsWith(p));
  if (isPublicPath) {
    return res;
  }

  // API routes MUST have auth (except public paths above)
  if (path.startsWith('/api/')) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // API routes pass through - individual routes handle authorization
    return res;
  }

  // Protected UI routes - redirect to login if no session
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('returnUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user - check compliance onboarding
  const userId = session.user.id;

  // Get user's organization and compliance status
  const { data: orgMembership } = await supabase
    .from('org_memberships')
    .select('org_id')
    .eq('user_id', userId)
    .single();

  if (orgMembership?.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('onboarding_complete, compliance_policy_acknowledged')
      .eq('id', orgMembership.org_id)
      .single();

    // Paths that don't require compliance onboarding
    const onboardingExemptPaths = [
      '/onboarding/compliance/configure',
      '/onboarding/compliance/acknowledge',
      '/contractors/onboarding',
      '/legal/terms',
      '/settings',
    ];

    const isOnboardingExempt = onboardingExemptPaths.some(p => path.startsWith(p));

    // Redirect to compliance onboarding if not complete (except for exempt paths)
    const justCompletedOnboarding = req.nextUrl.searchParams.get('onboarding') === 'complete';
    const referer = req.headers.get('referer') || '';
    const fromOnboarding = referer.includes('/onboarding/compliance/acknowledge');

    if (!isOnboardingExempt && org && !org.onboarding_complete && !justCompletedOnboarding && !fromOnboarding) {
      const onboardingUrl = new URL('/onboarding/compliance/configure', req.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next|static|.*\\.\\w+$).*)'],
};
