const { createClient } = require('@supabase/supabase-js');

// Read env from .env.local
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function seed() {
  // Use the default org ID from your system
  const orgId = '550e8400-e29b-41d4-a716-446655440000';
  const jobs = [
    { org_id: orgId, job_title: 'Active HVAC Repair', job_status: 'active', trade_needed: 'HVAC', address_text: '123 Main St', city: 'Miami', state: 'FL', contact_name: 'John Doe', contact_phone: '555-1234', contact_email: 'john@example.com' },
    { org_id: orgId, job_title: 'Assigned Plumbing Job', job_status: 'assigned', trade_needed: 'Plumbing', address_text: '456 Oak Ave', city: 'Miami', state: 'FL', contact_name: 'Jane Smith', contact_phone: '555-5678', contact_email: 'jane@example.com' },
    { org_id: orgId, job_title: 'Completed Electrical Work', job_status: 'completed', trade_needed: 'Electrical', address_text: '789 Pine Rd', city: 'Miami', state: 'FL', contact_name: 'Bob Johnson', contact_phone: '555-9012', contact_email: 'bob@example.com' },
    { org_id: orgId, job_title: 'Pending Roofing Job', job_status: 'pending', trade_needed: 'Roofing', address_text: '321 Elm St', city: 'Miami', state: 'FL', contact_name: 'Alice Brown', contact_phone: '555-3456', contact_email: 'alice@example.com' },
    { org_id: orgId, job_title: 'Archived Carpentry Work', job_status: 'archived', trade_needed: 'Carpentry', address_text: '654 Maple Dr', city: 'Miami', state: 'FL', contact_name: 'Charlie Davis', contact_phone: '555-7890', contact_email: 'charlie@example.com' }
  ];

  for (const job of jobs) {
    const { data, error } = await supabase.from('jobs').insert([job]).select();
    if (error) {
      console.error('Error creating', job.job_status, 'job:', error);
    } else {
      console.log('✓ Created', job.job_status, 'job:', data[0].id.slice(0, 8));
    }
  }
  console.log('\n✨ Done! Refresh your jobs overlay to see all the different card colors!');
}

seed();
