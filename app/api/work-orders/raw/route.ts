import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { raw_text, source = 'search_input' } = body;

    if (!raw_text || !raw_text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Work order text cannot be empty' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: request.headers.get('Authorization') || ''
          }
        }
      }
    );

    // Get the authenticated user
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    // Get or create organization for the user
    let orgId = null;
    if (user) {
      // Get or create organization via API
      try {
        const orgResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/organizations/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            userEmail: user.email
          })
        });

        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          orgId = orgData.orgId;
        }
      } catch (error) {
        console.error('Failed to create organization:', error);
      }
    }

    // Insert raw work order (org_id can be null for unauthenticated users)
    const { data, error } = await supabase
      .from('raw_work_orders')
      .insert({
        org_id: orgId,
        raw_text: raw_text.trim(),
        source,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating raw work order:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      return NextResponse.json(
        { success: false, error: `${error.message} (${error.code})` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        raw_work_order_id: data.id,
        message: 'Work order submitted for parsing',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
