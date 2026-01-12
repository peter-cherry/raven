import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    return NextResponse.json({ session: null, error: error.message }, { status: 401 });
  }

  return NextResponse.json({ session, error: null });
}
