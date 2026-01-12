const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utpmtlzqpyewpwzgsbdu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cG10bHpxcHlld3B3emdzYmR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3ODM4NywiZXhwIjoyMDc1NDU0Mzg3fQ.HTS-L1s8NpR3dhnUSgQu-YqRMiMUMv5tMpcABK6LKA0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEV_ORG_ID = '152ca2e3-a371-4167-99c5-0890afcd83d7';

async function addTestTechnicians() {
  console.log('Adding test Plumbing technicians...\n');

  const testTechnicians = [
    {
      org_id: DEV_ORG_ID,
      full_name: 'Mike Johnson',
      email: 'mike.johnson@test.com',
      phone: '407-555-0101',
      trade_needed: 'Plumbing',
      city: 'Orlando',
      state: 'FL',
      lat: 28.5383,
      lng: -81.3792,
      is_available: true,
      signed_up: true,
      average_rating: 4.8
    },
    {
      org_id: DEV_ORG_ID,
      full_name: 'Sarah Williams',
      email: 'sarah.williams@test.com',
      phone: '407-555-0102',
      trade_needed: 'Plumbing',
      city: 'Winter Park',
      state: 'FL',
      lat: 28.5999,
      lng: -81.3392,
      is_available: true,
      signed_up: true,
      average_rating: 4.5
    },
    {
      org_id: DEV_ORG_ID,
      full_name: 'Tom Rodriguez',
      email: 'tom.rodriguez@test.com',
      phone: '407-555-0103',
      trade_needed: 'Plumbing',
      city: 'Kissimmee',
      state: 'FL',
      lat: 28.2920,
      lng: -81.4076,
      is_available: true,
      signed_up: true,
      average_rating: 4.7
    }
  ];

  // First, check what trades already exist
  console.log('Current technicians by trade:');
  const { data: existing, error: existingError } = await supabase
    .from('technicians')
    .select('trade_needed')
    .eq('org_id', DEV_ORG_ID)
    .eq('is_available', true)
    .eq('signed_up', true);

  if (existingError) {
    console.error('Error fetching existing:', existingError);
    return;
  }

  // Count by trade
  const tradeCounts = {};
  existing?.forEach(t => {
    tradeCounts[t.trade_needed] = (tradeCounts[t.trade_needed] || 0) + 1;
  });
  console.log(tradeCounts);

  // Insert new technicians
  console.log('\nInserting test Plumbing technicians...');
  const { data, error } = await supabase
    .from('technicians')
    .insert(testTechnicians)
    .select('id, full_name, email, trade_needed, city');

  if (error) {
    console.error('Error inserting:', error);
    return;
  }

  console.log('\nInserted technicians:');
  data.forEach(t => {
    console.log(`  - ${t.full_name} (${t.email}) - ${t.trade_needed} in ${t.city}`);
  });

  console.log('\n✓ Done! You can now test the Plumbing dispatch.');
}

addTestTechnicians().catch(console.error);
