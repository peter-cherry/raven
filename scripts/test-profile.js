const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, anonKey);

async function testProfile() {
  const techId = '2df67171-e9e1-4a0e-9e2b-7ea714adeead';

  console.log('Testing profile query for tech ID:', techId);

  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('id', techId)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    console.log('\nThis suggests there might be an RLS issue with related tables.');
  } else if (!data) {
    console.log('❌ No data returned');
  } else {
    console.log('✅ Profile loaded successfully!');
    console.log('\nTechnician:', data.full_name);
    console.log('Trade:', data.trade_needed);
    console.log('Location:', `${data.city}, ${data.state}`);
    console.log('\nLicenses:', data.technician_licenses?.length || 0);
    console.log('Job assignments:', data.job_assignments?.length || 0);
  }
}

testProfile();
