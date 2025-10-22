#!/usr/bin/env node

/**
 * Database Migration Script (Skip Storage)
 * Applies all pending migrations except storage buckets
 */

import pg from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const connectionString = `postgresql://postgres.${projectRef}:${DB_PASSWORD}@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`;

console.log('🚀 Supabase Migration Tool (Skip Storage)\n');
console.log('📡 Project:', projectRef);
console.log('🌍 Region: ap-southeast-1\n');

// Migrations to skip (require dashboard or special permissions)
const SKIP_MIGRATIONS = [
  '20250101000001_init_storage_buckets.sql',  // Requires storage permissions
  '20250122000002_configure_pg_cron.sql',      // Requires pg_cron extension
];

async function applyMigrations() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Create migrations tracking table
    console.log('📋 Creating migrations tracking table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Tracking table ready\n');

    // Get applied migrations
    const { rows: appliedRows } = await client.query('SELECT name FROM _migrations ORDER BY applied_at');
    const appliedSet = new Set(appliedRows.map(r => r.name));

    // Get migration files
    const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
    const allFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .filter(f => !SKIP_MIGRATIONS.includes(f))  // Skip storage migrations
      .sort();

    const pendingFiles = allFiles.filter(f => !appliedSet.has(f));

    console.log(`📁 Total migrations: ${allFiles.length} (${SKIP_MIGRATIONS.length} skipped)`);
    console.log(`✅ Already applied: ${appliedRows.length}`);
    console.log(`⏳ Pending: ${pendingFiles.length}\n`);

    if (SKIP_MIGRATIONS.length > 0) {
      console.log('⚠️  Skipped migrations (apply via Dashboard):');
      SKIP_MIGRATIONS.forEach(f => console.log(`   - ${f}`));
      console.log();
    }

    if (pendingFiles.length === 0) {
      console.log('🎉 All migrations are up to date!\n');
      return;
    }

    console.log('🔄 Applying pending migrations:\n');

    for (const filename of pendingFiles) {
      process.stdout.write(`   📄 ${filename}... `);

      const filepath = join(migrationsDir, filename);
      const sql = readFileSync(filepath, 'utf-8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [filename]);
        await client.query('COMMIT');

        console.log('✅');
      } catch (error) {
        await client.query('ROLLBACK');

        console.log('❌');
        console.error(`\n   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);

        if (error.position) {
          console.error(`   Position: ${error.position}`);
        }

        console.log('\n💡 Migration failed. Skipping to next...\n');
        // Continue with next migration instead of stopping
        continue;
      }
    }

    console.log(`\n🎉 Migration process complete!\n`);

    if (SKIP_MIGRATIONS.length > 0) {
      console.log('📝 Next steps:');
      console.log('   Apply skipped migrations via Supabase Dashboard SQL Editor:');
      console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql\n`);
    }

  } catch (error) {
    if (error.code === '28P01') {
      console.error('\n❌ Authentication failed');
    } else {
      console.error('\n❌ Error:', error.message);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigrations();
