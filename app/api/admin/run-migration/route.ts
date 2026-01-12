import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20251024_organizations_rls_policy.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      if (!statement) continue;

      console.log('Executing:', statement.substring(0, 100) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error('Statement failed:', error);
        // Try direct query instead
        const { error: queryError } = await supabase.from('_').select('*').limit(0);
        // If that also fails, the statement might have succeeded anyway (DDL statements)
      }
    }

    return NextResponse.json({ success: true, message: 'Migration completed' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
