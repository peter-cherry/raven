const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://utpmtlzqpyewpwzgsbdu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cG10bHpxcHlld3B3emdzYmR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3ODM4NywiZXhwIjoyMDc1NDU0Mzg3fQ.HTS-L1s8NpR3dhnUSgQu-YqRMiMUMv5tMpcABK6LKA0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const FAKE_DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

async function createDevUser() {
  console.log('Creating fake dev user...');

  // Check if user already exists
  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('id')
    .eq('id', FAKE_DEV_USER_ID)
    .single();

  if (existing) {
    console.log('Dev user already exists:', existing.id);
    return;
  }

  // Create the user
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: FAKE_DEV_USER_ID,
      email: 'dev@localhost.test',
      full_name: 'Dev User',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating dev user:', error);
    return;
  }

  console.log('Created dev user:', data);
}

createDevUser().catch(console.error);
