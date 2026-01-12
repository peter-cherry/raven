import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  // Support both 'redirect' (for marketing) and 'returnUrl' (legacy)
  const returnUrl = requestUrl.searchParams.get('redirect') || requestUrl.searchParams.get('returnUrl');

  console.log('[Auth Callback] Full URL:', req.url);
  console.log('[Auth Callback] Request origin:', requestUrl.origin);
  console.log('[Auth Callback] returnUrl parameter:', returnUrl);

  // Determine redirect origin
  const host = req.headers.get('host') || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  const redirectOrigin = isLocalhost ? 'http://localhost:3000' : requestUrl.origin;

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('[Auth Callback] Error exchanging code:', error);
        return NextResponse.redirect(`${redirectOrigin}/login?error=auth_failed`);
      }

      console.log('[Auth Callback] Session created for user:', data.user?.email);

      // Check if this is a new user who just confirmed their email
      // They need an organization created for them
      if (data.user) {
        const userId = data.user.id;
        const userEmail = data.user.email;
        const userMetadata = data.user.user_metadata || {};
        const isContractor = userMetadata.is_contractor === true;

        // Check if user already has an organization membership
        // Use maybeSingle() instead of single() - single() throws error when 0 rows found
        const { data: existingMembership, error: membershipError } = await supabase
          .from('org_memberships')
          .select('org_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (membershipError) {
          console.error('[Auth Callback] Error checking membership:', membershipError);
        }

        console.log('[Auth Callback] Existing membership check:', { existingMembership, isContractor });

        if (!existingMembership && !isContractor) {
          // New user confirmed email - create organization for them
          console.log('[Auth Callback] New user confirmed, creating organization...');
          console.log('[Auth Callback] User ID:', userId);
          console.log('[Auth Callback] User Email:', userEmail);
          console.log('[Auth Callback] Redirect Origin:', redirectOrigin);

          try {
            // Check if pending_org_id was stored in metadata
            const pendingOrgId = userMetadata.pending_org_id;

            if (pendingOrgId) {
              // Join existing org
              console.log('[Auth Callback] Joining existing org:', pendingOrgId);
              const { error: memberError } = await supabase
                .from('org_memberships')
                .insert({ user_id: userId, org_id: pendingOrgId });

              if (memberError) {
                console.error('[Auth Callback] Failed to add user to org:', memberError);
                return NextResponse.redirect(`${redirectOrigin}/login?error=join_org_failed&message=${encodeURIComponent(memberError.message)}`);
              } else {
                console.log('[Auth Callback] Successfully joined org:', pendingOrgId);
                return NextResponse.redirect(`${redirectOrigin}/onboarding/compliance/configure?auth=success`);
              }
            } else {
              // Create new organization via API
              const orgCreateUrl = `${redirectOrigin}/api/organizations/create`;
              console.log('[Auth Callback] Creating org via:', orgCreateUrl);

              const orgResponse = await fetch(orgCreateUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: userId,
                  userEmail: userEmail
                })
              });

              console.log('[Auth Callback] Org create response status:', orgResponse.status);

              if (!orgResponse.ok) {
                const errorText = await orgResponse.text();
                console.error('[Auth Callback] Failed to create organization. Status:', orgResponse.status);
                console.error('[Auth Callback] Error response:', errorText);
                // Redirect to login with error instead of silently going to homepage
                return NextResponse.redirect(`${redirectOrigin}/login?error=org_creation_failed&details=${encodeURIComponent(errorText)}`);
              } else {
                const orgData = await orgResponse.json();
                console.log('[Auth Callback] Organization created successfully:', orgData);
                // Redirect to onboarding
                return NextResponse.redirect(`${redirectOrigin}/onboarding/compliance/configure?auth=success`);
              }
            }
          } catch (orgError: any) {
            console.error('[Auth Callback] Exception creating organization:', orgError?.message || orgError);
            console.error('[Auth Callback] Exception stack:', orgError?.stack);
            // Redirect to login with error instead of silently going to homepage
            return NextResponse.redirect(`${redirectOrigin}/login?error=org_creation_exception&message=${encodeURIComponent(orgError?.message || 'Unknown error')}`);
          }
        } else if (isContractor && !existingMembership) {
          // Contractor confirmed email - redirect to contractor onboarding
          console.log('[Auth Callback] Contractor confirmed, redirecting to onboarding...');
          return NextResponse.redirect(`${redirectOrigin}/contractors/onboarding?auth=success`);
        }
      }
    } catch (error) {
      console.error('[Auth Callback] Exception during code exchange:', error);
      return NextResponse.redirect(`${redirectOrigin}/login?error=auth_failed`);
    }
  }

  // URL to redirect to after sign in process completes
  const finalReturnUrl = returnUrl || '/';

  console.log('[Auth Callback] Final return URL:', finalReturnUrl);

  // Add a query param to signal successful auth
  const redirectUrl = new URL(finalReturnUrl, redirectOrigin);
  redirectUrl.searchParams.set('auth', 'success');

  console.log('[Auth Callback] Full redirect URL:', redirectUrl.toString());

  return NextResponse.redirect(redirectUrl.toString());
}
