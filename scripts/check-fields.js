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

async function checkFields() {
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Available fields in technicians table:\n');
    const fields = Object.keys(data[0]);
    fields.forEach(field => {
      const value = data[0][field];
      const type = typeof value;
      console.log(`  ${field}: ${type} ${value !== null ? `(example: ${value})` : '(null)'}`);
    });

    console.log('\n\nChecking for profile_picture or avatar fields...');
    if (fields.includes('profile_picture')) {
      console.log('✅ profile_picture field exists!');
    } else if (fields.includes('avatar')) {
      console.log('✅ avatar field exists!');
    } else if (fields.includes('photo_url')) {
      console.log('✅ photo_url field exists!');
    } else if (fields.includes('image_url')) {
      console.log('✅ image_url field exists!');
    } else {
      console.log('❌ No profile picture field found. Using initials avatar instead.');
    }
  }
}

checkFields();
