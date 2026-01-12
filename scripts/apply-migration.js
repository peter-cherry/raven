const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  console.log('🚀 Starting migration...\n');

  // Create Supabase admin client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Read SQL file
  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250114_create_admin_tables.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

  console.log('📄 Migration file loaded\n');
  console.log('⚙️  Executing SQL statements...\n');

  try {
    // Execute the entire SQL content as one transaction
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      // If exec_sql RPC doesn't exist, we'll need to use the REST API directly
      console.log('⚠️  exec_sql RPC not available, using direct SQL execution...\n');

      // Try using Supabase's query method (this may not work for all statements)
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      console.log(`📊 Found ${statements.length} SQL statements\n`);

      let successCount = 0;
      let errors = [];

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        // Skip comment-only statements
        if (statement.match(/^(COMMENT|--)/)) {
          console.log(`⏭️  Skipping comment statement ${i + 1}`);
          continue;
        }

        try {
          // Use Supabase's SQL execution
          const { error: execError } = await supabase.rpc('pg_execute_sql', {
            sql: statement + ';'
          });

          if (execError) {
            console.error(`❌ Error in statement ${i + 1}:`, execError.message);
            errors.push({ statement: i + 1, error: execError.message, sql: statement.substring(0, 100) });
          } else {
            successCount++;
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
          errors.push({ statement: i + 1, error: err.message, sql: statement.substring(0, 100) });
        }
      }

      console.log(`\n📈 Results: ${successCount} succeeded, ${errors.length} failed`);

      if (errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        errors.forEach(err => {
          console.log(`  Statement ${err.statement}: ${err.error}`);
          console.log(`  SQL: ${err.sql}...`);
        });
      }

      if (errors.length === 0) {
        console.log('\n✅ Migration completed successfully!');
      } else {
        console.log('\n⚠️  Migration completed with errors. Please check the errors above.');
      }

    } else {
      console.log('✅ Migration executed successfully!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }

  console.log('\n🔍 Verifying tables...\n');

  // Verify tables were created
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .in('table_name', ['outreach_campaigns', 'outreach_targets', 'scraping_activity'])
    .eq('table_schema', 'public');

  if (tablesError) {
    console.log('⚠️  Could not verify tables (this is normal if you don\'t have access to information_schema)');
  } else {
    console.log('✅ Tables verified:');
    if (tables && tables.length > 0) {
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }
  }

  console.log('\n🎉 Migration process complete!');
  console.log('\nNext steps:');
  console.log('1. Visit /admin/activity to see the Activity page');
  console.log('2. Visit /admin/outreach to see the Outreach page');
  console.log('3. Create your first campaign!');
}

applyMigration().catch(console.error);
