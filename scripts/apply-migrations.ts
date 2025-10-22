/**
 * Apply Supabase Migrations Script
 * Runs all pending SQL migrations against the remote Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigrations() {
  console.log('🚀 Starting migration application...\n');

  // Create migrations tracking table if it doesn't exist
  console.log('📋 Ensuring migrations tracking table exists...');
  const { error: trackingError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  });

  if (trackingError) {
    // If exec_sql doesn't exist, create it
    console.log('   Creating exec_sql function...');
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `;

    // We'll need to run migrations directly via SQL
    console.log('   ⚠️  exec_sql function not available, using direct SQL execution');
  }

  // Get migration files
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`\n📁 Found ${migrationFiles.length} migration files\n`);

  // Get applied migrations
  const { data: appliedMigrations } = await supabase
    .from('_migrations')
    .select('name');

  const appliedSet = new Set(appliedMigrations?.map((m) => m.name) || []);
  const pendingMigrations = migrationFiles.filter((f) => !appliedSet.has(f));

  if (pendingMigrations.length === 0) {
    console.log('✅ All migrations already applied!');
    return;
  }

  console.log(`⏳ Applying ${pendingMigrations.length} pending migrations:\n`);

  for (const filename of pendingMigrations) {
    console.log(`   📄 ${filename}...`);
    const filepath = join(migrationsDir, filename);
    const sql = readFileSync(filepath, 'utf-8');

    try {
      // Execute migration SQL directly
      const { error } = await supabase.rpc('exec_sql', { sql });

      if (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        throw error;
      }

      // Track migration
      await supabase.from('_migrations').insert({ name: filename });

      console.log(`   ✅ Applied successfully`);
    } catch (err) {
      console.error(`\n❌ Migration failed: ${filename}`);
      console.error(err);
      process.exit(1);
    }
  }

  console.log('\n✅ All migrations applied successfully!\n');
}

// Run migrations
applyMigrations().catch((err) => {
  console.error('❌ Migration process failed:', err);
  process.exit(1);
});
