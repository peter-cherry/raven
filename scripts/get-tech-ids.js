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

async function getTechIds() {
  const { data, error } = await supabase
    .from('technicians')
    .select('id, full_name, trade_needed, city, state')
    .order('average_rating', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('First 10 technicians with IDs:\n');
    data.forEach((tech, idx) => {
      console.log(`${idx + 1}. ${tech.full_name} (${tech.trade_needed}) - ${tech.city}, ${tech.state}`);
      console.log(`   ID: ${tech.id}\n`);
    });
  }
}

getTechIds();
