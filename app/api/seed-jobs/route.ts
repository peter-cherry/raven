import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
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
  const orgId = '550e8400-e29b-41d4-a716-446655440000';

  const jobs = [
    {
      org_id: orgId,
      job_title: 'Active HVAC Repair',
      job_status: 'active',
      trade_needed: 'HVAC',
      address_text: '123 Main St',
      city: 'Miami',
      state: 'FL',
      contact_name: 'John Doe',
      contact_phone: '555-1234',
      contact_email: 'john@example.com',
      lat: null,
      lng: null,
    },
    {
      org_id: orgId,
      job_title: 'Completed Electrical Work',
      job_status: 'completed',
      trade_needed: 'Electrical',
      address_text: '789 Pine Rd',
      city: 'Miami',
      state: 'FL',
      contact_name: 'Bob Johnson',
      contact_phone: '555-9012',
      contact_email: 'bob@example.com',
      lat: null,
      lng: null,
    },
    {
      org_id: orgId,
      job_title: 'Pending Roofing Job',
      job_status: 'pending',
      trade_needed: 'Roofing',
      address_text: '321 Elm St',
      city: 'Miami',
      state: 'FL',
      contact_name: 'Alice Brown',
      contact_phone: '555-3456',
      contact_email: 'alice@example.com',
      lat: null,
      lng: null,
    },
    {
      org_id: orgId,
      job_title: 'Archived Carpentry Work',
      job_status: 'archived',
      trade_needed: 'Carpentry',
      address_text: '654 Maple Dr',
      city: 'Miami',
      state: 'FL',
      contact_name: 'Charlie Davis',
      contact_phone: '555-7890',
      contact_email: 'charlie@example.com',
      lat: null,
      lng: null,
    },
  ];

  const results = [];

  for (const job of jobs) {
    const { data, error } = await supabase
      .from('jobs')
      .insert([job])
      .select();

    if (error) {
      results.push({ status: job.job_status, error: error.message });
    } else {
      results.push({ status: job.job_status, success: true, id: data[0].id });
    }
  }

  return NextResponse.json({ results });
}
