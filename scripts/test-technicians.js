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

async function testTechnicians() {
  console.log('Testing technicians query with anon key...');
  console.log('URL:', url);

  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .order('average_rating', { ascending: false });

  if (error) {
    console.error('Error:', error);
    console.log('\nThe error suggests RLS is still enabled or there\'s a permission issue.');
  } else if (!data || data.length === 0) {
    console.log('No data returned. This could mean:');
    console.log('1. RLS is still blocking access');
    console.log('2. The table is actually empty');
    console.log('3. There\'s an org_id filter issue');
  } else {
    console.log(`✅ Successfully loaded ${data.length} technicians!`);
    console.log('\nFirst 3 technicians:');
    data.slice(0, 3).forEach(tech => {
      console.log(`  - ${tech.full_name} (${tech.trade_needed}) - ${tech.city}, ${tech.state}`);
    });
  }
}

testTechnicians();
