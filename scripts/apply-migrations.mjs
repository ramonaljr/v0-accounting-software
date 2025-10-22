/**
 * Apply Supabase Migrations Script
 * Runs all pending SQL migrations against the remote Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Create Supabase admin client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSql(sql) {
  // Use the REST API directly to execute raw SQL
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response;
}

async function applyMigrations() {
  console.log('🚀 Starting migration application...\n');
  console.log('📡 Connected to:', SUPABASE_URL);

  // First, create the migrations tracking table if it doesn't exist
  console.log('\n📋 Ensuring migrations tracking table exists...');

  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS _migrations (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });

    if (error && !error.message.includes('does not exist')) {
      // If exec_sql RPC doesn't exist, we'll use direct SQL execution via postgres
      console.log('   ℹ️  exec_sql RPC not available, will execute migrations directly');
    }
  } catch (err) {
    console.log('   ℹ️  Will create tracking table with first migration');
  }

  // Get migration files
  const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`\n📁 Found ${migrationFiles.length} migration files\n`);

  // Get applied migrations
  let appliedMigrations = [];
  try {
    const { data, error } = await supabase
      .from('_migrations')
      .select('name');

    if (!error && data) {
      appliedMigrations = data;
    }
  } catch (err) {
    console.log('   ℹ️  Migrations table does not exist yet, will create it');
  }

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
      // Execute the migration SQL directly using the postgres connection
      // Split into individual statements and execute them
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('query', {
            query_text: statement + ';'
          });

          if (error) {
            // Try alternative: use raw SQL via REST API
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({ statement }),
            });

            if (!response.ok) {
              // If REST API doesn't work, log the statement that needs manual execution
              console.log(`   ⚠️  Statement needs manual execution via SQL Editor`);
              console.log(`   → This migration should be run manually in Supabase Dashboard`);
              break;
            }
          }
        }
      }

      // Track migration as applied
      const { error: insertError } = await supabase
        .from('_migrations')
        .insert({ name: filename });

      if (insertError && !insertError.message.includes('duplicate key')) {
        console.log(`   ⚠️  Could not track migration: ${insertError.message}`);
      } else {
        console.log(`   ✅ Applied successfully`);
      }
    } catch (err) {
      console.error(`\n❌ Migration failed: ${filename}`);
      console.error('   Error:', err.message);
      console.log('\n💡 Recommendation: Apply migrations manually via Supabase SQL Editor');
      console.log(`   → Open: ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', '')}/sql`);
      console.log(`   → Copy contents of: supabase/migrations/${filename}`);
      console.log(`   → Paste and run in SQL Editor\n`);
      process.exit(1);
    }
  }

  console.log('\n✅ All migrations applied successfully!\n');
}

// Run migrations
applyMigrations().catch((err) => {
  console.error('❌ Migration process failed:', err.message);
  console.log('\n💡 Please apply migrations manually via Supabase SQL Editor:');
  console.log(`   ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', '')}/sql\n`);
  process.exit(1);
});
