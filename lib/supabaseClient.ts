import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createMockSupabaseClient, isMockMode } from './mock-supabase';

// Create a client component client that automatically handles session cookies
// This ensures the client is authenticated when the user is logged in
let supabaseInstance: SupabaseClient | null = null;
let mockClientInstance: ReturnType<typeof createMockSupabaseClient> | null = null;

function getSupabaseClient(): SupabaseClient {
  // Use mock client in mock mode (for local dev without Supabase)
  // Also auto-enable mock mode if credentials are missing
  const shouldUseMock = isMockMode() || 
    !process.env.NEXT_PUBLIC_SUPABASE_URL || 
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
  if (shouldUseMock) {
    if (!mockClientInstance) {
      mockClientInstance = createMockSupabaseClient();
    }
    return mockClientInstance as unknown as SupabaseClient;
  }

  if (!supabaseInstance) {
    // Use auth helpers to create a client that automatically uses cookies
    // @ts-ignore - Type mismatch between auth-helpers and supabase-js generics
    supabaseInstance = createClientComponentClient();
  }

  // Non-null assertion since we always initialize above
  return supabaseInstance!;
}

// Export as a getter property so existing code can use `supabase` directly
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

// Anonymous client for public operations (e.g., contractor onboarding)
// This client explicitly uses the anon key and doesn't require authentication
// Lazy initialization to avoid build-time errors when env vars aren't set
let _supabaseAnon: SupabaseClient | null = null;

export const getSupabaseAnon = (): SupabaseClient => {
  // Use mock client in mock mode (for local dev without Supabase)
  if (isMockMode()) {
    if (!mockClientInstance) {
      mockClientInstance = createMockSupabaseClient();
    }
    return mockClientInstance as unknown as SupabaseClient;
  }

  if (!_supabaseAnon) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error('Supabase credentials not configured');
    }
    _supabaseAnon = createClient(url, anonKey, {
      auth: {
        persistSession: false, // Don't persist session for anonymous operations
      }
    });
  }
  return _supabaseAnon;
};

// Backward compatible export as proxy
export const supabaseAnon = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseAnon();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});
