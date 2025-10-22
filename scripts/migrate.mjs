#!/usr/bin/env node

/**
 * Database Migration Script
 * Applies all pending migrations to Supabase using direct Postgres connection
 */

import pg from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables in .env.local');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Invalid SUPABASE_URL format');
  process.exit(1);
}

// Construct connection string
// Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || '[YOUR_DB_PASSWORD]';

const connectionString = `postgresql://postgres.${projectRef}:${DB_PASSWORD}@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`;

console.log('🚀 Supabase Migration Tool\n');
console.log('📡 Project:', projectRef);
console.log('🌍 Region: ap-southeast-1\n');

if (DB_PASSWORD === '[YOUR_DB_PASSWORD]') {
  console.error('❌ Database password not set');
  console.error('\n💡 To fix this, add to your .env.local:');
  console.error('   SUPABASE_DB_PASSWORD=your_database_password');
  console.error('\n📖 Find your password at:');
  console.error(`   https://supabase.com/dashboard/project/${projectRef}/settings/database`);
  console.error('   (or reset it if you don\'t have it)\n');
  process.exit(1);
}

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
      .sort();

    const pendingFiles = allFiles.filter(f => !appliedSet.has(f));

    console.log(`📁 Total migrations: ${allFiles.length}`);
    console.log(`✅ Already applied: ${appliedRows.length}`);
    console.log(`⏳ Pending: ${pendingFiles.length}\n`);

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
        // Begin transaction
        await client.query('BEGIN');

        // Execute migration
        await client.query(sql);

        // Record migration
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [filename]);

        // Commit transaction
        await client.query('COMMIT');

        console.log('✅');
      } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');

        console.log('❌');
        console.error(`\n   Error: ${error.message}`);
        console.error(`   Code: ${error.code}`);

        if (error.position) {
          console.error(`   Position: ${error.position}`);
        }

        console.log('\n💡 Migration failed. Please fix the error and try again.\n');
        throw error;
      }
    }

    console.log(`\n🎉 Successfully applied ${pendingFiles.length} migrations!\n`);

  } catch (error) {
    if (error.code === '28P01') {
      console.error('\n❌ Authentication failed - invalid database password');
      console.error('\n💡 Reset your password at:');
      console.error(`   https://supabase.com/dashboard/project/${projectRef}/settings/database\n`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.error('\n❌ Could not connect to database');
      console.error('   Check your internet connection and Supabase project status\n');
    } else if (!error.code) {
      // Already logged above
    } else {
      console.error('\n❌ Unexpected error:', error.message);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migrations
applyMigrations();
