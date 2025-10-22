/**
 * Apply RLS recursion fix to remote Supabase database
 * This script executes the migration SQL directly
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20250122000003_fix_org_members_rls_recursion.sql'
    );

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Applying RLS recursion fix migration...');
    console.log('Migration file:', migrationPath);

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('RLS policies have been fixed to prevent infinite recursion.');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
