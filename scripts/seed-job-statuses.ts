import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedJobStatuses() {
  // Get the first org_id from the database
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.error('No organization found. Please create an organization first.');
    return;
  }

  const orgId = orgs[0].id;

  const jobsToCreate = [
    {
      org_id: orgId,
      job_title: 'Active HVAC Repair',
      job_status: 'active',
      trade_needed: 'HVAC',
      address_text: '123 Main St, Miami, FL',
      city: 'Miami',
      state: 'FL',
      contact_name: 'John Doe',
      contact_phone: '555-1234',
      contact_email: 'john@example.com',
    },
    {
      org_id: orgId,
      job_title: 'Assigned Plumbing Job',
      job_status: 'assigned',
      trade_needed: 'Plumbing',
      address_text: '456 Oak Ave, Miami, FL',
      city: 'Miami',
      state: 'FL',
      contact_name: 'Jane Smith',
      contact_phone: '555-5678',
      contact_email: 'jane@example.com',
    },
    {
      org_id: orgId,
      job_title: 'Completed Electrical Work',
      job_status: 'completed',
      trade_needed: 'Electrical',
      address_text: '789 Pine Rd, Miami, FL',
      city: 'Miami',
      state: 'FL',
      contact_name: 'Bob Johnson',
      contact_phone: '555-9012',
      contact_email: 'bob@example.com',
    },
    {
      org_id: orgId,
      job_title: 'Pending Roofing Job',
      job_status: 'pending',
      trade_needed: 'Roofing',
      address_text: '321 Elm St, Miami, FL',
      city: 'Miami',
      state: 'FL',
      contact_name: 'Alice Brown',
      contact_phone: '555-3456',
      contact_email: 'alice@example.com',
    },
    {
      org_id: orgId,
      job_title: 'Archived Carpentry Work',
      job_status: 'archived',
      trade_needed: 'Carpentry',
      address_text: '654 Maple Dr, Miami, FL',
      city: 'Miami',
      state: 'FL',
      contact_name: 'Charlie Davis',
      contact_phone: '555-7890',
      contact_email: 'charlie@example.com',
    },
  ];

  for (const job of jobsToCreate) {
    const { data, error } = await supabase
      .from('jobs')
      .insert([job])
      .select();

    if (error) {
      console.error(`Error creating ${job.job_status} job:`, error);
    } else {
      console.log(`✓ Created ${job.job_status} job:`, data[0].id);
    }
  }

  console.log('\n✨ Done! Created jobs with all different statuses.');
}

seedJobStatuses();
