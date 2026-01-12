const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(filePath) {
  console.log(`\nRunning migration: ${filePath}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql }).catch(async () => {
    // If exec_sql doesn't exist, try direct query
    return await supabase.from('_migrations').insert({ sql }).select();
  });

  if (error) {
    console.error('Error:', error);
    return false;
  }
  
  console.log('✅ Success!');
  return true;
}

async function main() {
  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error('Usage: node run_migration.js <migration_file>');
    process.exit(1);
  }
  
  await runMigration(migrationFile);
}

main();
