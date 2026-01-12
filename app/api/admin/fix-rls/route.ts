import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  console.log('[Fix Admin RLS] Starting...');

  // Drop existing policies
  const dropPolicies = `
    DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
    DROP POLICY IF EXISTS "Admins can insert admin_users" ON admin_users;
    DROP POLICY IF EXISTS "Admins can delete admin_users" ON admin_users;
  `;

  const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies });
  if (dropError) {
    console.error('[Fix Admin RLS] Drop policies error:', dropError);
  }

  // Create security definer function
  const createFunction = `
    CREATE OR REPLACE FUNCTION auth.is_admin()
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid()
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
  `;

  const { error: funcError } = await supabase.rpc('exec_sql', { sql: createFunction });
  if (funcError) {
    console.error('[Fix Admin RLS] Function error:', funcError);
  }

  // Create new policies
  const createPolicies = `
    CREATE POLICY "Anyone can view admin_users"
      ON admin_users FOR SELECT
      USING (true);

    CREATE POLICY "Self or admins can insert admin_users"
      ON admin_users FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        OR auth.is_admin()
      );

    CREATE POLICY "Admins can delete admin_users"
      ON admin_users FOR DELETE
      USING (auth.is_admin());

    GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated;
  `;

  const { error: policyError } = await supabase.rpc('exec_sql', { sql: createPolicies });
  if (policyError) {
    console.error('[Fix Admin RLS] Policy error:', policyError);
    return NextResponse.json({ error: policyError.message }, { status: 500 });
  }

  console.log('[Fix Admin RLS] Success!');

  return NextResponse.json({
    success: true,
    message: 'Admin RLS policies fixed'
  });
}
