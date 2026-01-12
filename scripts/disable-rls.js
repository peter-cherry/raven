const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function disableRLS() {
  console.log('Disabling RLS on technicians table...');

  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view technicians from their org" ON technicians;
    `
  });

  if (error) {
    console.error('Error:', error);

    // Try alternative approach using raw SQL endpoint
    console.log('Trying alternative approach...');
    const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        query: 'ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;'
      })
    });

    if (!response.ok) {
      console.error('Alternative approach failed:', await response.text());
      process.exit(1);
    }

    console.log('Alternative approach succeeded!');
  } else {
    console.log('RLS disabled successfully!');
    console.log(data);
  }
}

disableRLS().catch(console.error);
