'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createClientComponentClient, Session, User } from '@supabase/auth-helpers-nextjs';
import { createMockSupabaseClient, MOCK_USER, MOCK_SESSION, isMockMode } from '@/lib/mock-supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string, orgId?: string, isContractor?: boolean) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Use mock client if mock mode enabled or if Supabase credentials are missing
  const shouldUseMock = isMockMode() || 
    !process.env.NEXT_PUBLIC_SUPABASE_URL || 
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
  const supabase = useMemo(() => {
    if (shouldUseMock) {
      return createMockSupabaseClient() as any;
    }
    return createClientComponentClient();
  }, [shouldUseMock]);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In mock mode or when credentials are missing, use mock user/session immediately
    if (shouldUseMock) {
      setSession(MOCK_SESSION as unknown as Session);
      setUser(MOCK_USER as unknown as User);
      setLoading(false);
      return;
    }

    // Always use real Supabase auth - no dev mode bypass
    supabase.auth.getSession().then(({ data }: any) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: any, newSession: any) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (fullName: string, email: string, password: string, orgId?: string, isContractor?: boolean) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          is_contractor: isContractor || false,
          pending_org_id: orgId || null // Store for after email confirmation
        },
        emailRedirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/api/auth/callback`
          : undefined
      },
    });
    if (error) throw error;

    if (!data.user) throw new Error('Failed to create user account');

    // If session is null, email confirmation is required - don't redirect yet
    // The signup page will show the "check your email" screen
    // Organization creation will happen after email confirmation via the callback
    if (!data.session) {
      console.log('[AuthProvider] Email confirmation required, not redirecting');
      return;
    }

    // If we have a session (email confirmation disabled or auto-confirmed), proceed with setup
    const newUserId = data.user.id;

    // Contractors don't need org creation - handled by trigger
    if (isContractor) {
      if (typeof window !== 'undefined') {
        window.location.href = '/contractors/onboarding';
      }
      return;
    }

    // Operators/Clients flow - use API route for org membership (avoids direct DB mutation)
    if (orgId) {
      try {
        const response = await fetch('/api/organizations/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: newUserId,
            userEmail: email,
            existingOrgId: orgId
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to add user to org:', errorData);
        }
      } catch (error) {
        console.error('Failed to add user to org:', error);
      }
    } else {
      // Create a new organization for the user via API
      try {
        const orgResponse = await fetch('/api/organizations/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: newUserId,
            userEmail: email
          })
        });

        if (!orgResponse.ok) {
          const errorData = await orgResponse.json();
          console.error('Failed to create organization:', errorData);
        } else {
          if (typeof window !== 'undefined') {
            window.location.href = '/onboarding/compliance/configure';
          }
        }
      } catch (error) {
        console.error('Failed to create organization:', error);
      }
    }
  };

  const signInWithGoogle = async () => {
    // Get the current origin dynamically (works for both localhost and production)
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    // Check if there's a redirect or returnUrl in the current page's query params
    // Support both 'redirect' (for marketing) and 'returnUrl' (legacy)
    const currentUrl = typeof window !== 'undefined' ? new URL(window.location.href) : null;
    const returnUrl = currentUrl?.searchParams.get('redirect') || currentUrl?.searchParams.get('returnUrl') || '/';

    // Force localhost redirect during development
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const redirectOrigin = isLocalhost ? 'http://localhost:3000' : origin;
    const redirectTo = `${redirectOrigin}/api/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`;

    console.log('[AuthProvider] Google OAuth redirect will go to:', redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo
      }
    });
    if (error) throw error;
  };

  const signInWithApple = async () => {
    // Get the current origin dynamically (works for both localhost and production)
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    // Check if there's a redirect or returnUrl in the current page's query params
    // Support both 'redirect' (for marketing) and 'returnUrl' (legacy)
    const currentUrl = typeof window !== 'undefined' ? new URL(window.location.href) : null;
    const returnUrl = currentUrl?.searchParams.get('redirect') || currentUrl?.searchParams.get('returnUrl') || '/';

    // Force localhost redirect during development
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const redirectOrigin = isLocalhost ? 'http://localhost:3000' : origin;
    const redirectTo = `${redirectOrigin}/api/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`;

    console.log('[AuthProvider] Apple OAuth redirect will go to:', redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (isMockMode()) {
      // In mock mode, just redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value: AuthContextType = { user, session, loading, signIn, signUp, signInWithGoogle, signInWithApple, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
