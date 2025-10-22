#!/usr/bin/env node

/**
 * Verify Database Tables
 * Check which tables exist in the database
 */

import pg from 'pg';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const connectionString = `postgresql://postgres.${projectRef}:${DB_PASSWORD}@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`;

async function verifyTables() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('🔍 Checking database tables...\n');

    // Check for key tables
    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`✅ Found ${rows.length} tables in public schema:\n`);

    const criticalTables = [
      'organizations',
      'org_members',
      'accounts',
      'transactions',
      'ai_insights',
      'bank_connections',
      'categorization_rules',
    ];

    rows.forEach(row => {
      const isCritical = criticalTables.includes(row.table_name);
      const marker = isCritical ? '⭐' : '  ';
      console.log(`${marker} ${row.table_name}`);
    });

    console.log('\n🔍 Checking ai_insights table specifically...\n');

    const { rows: aiInsightsCheck } = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'ai_insights'
      ORDER BY ordinal_position
    `);

    if (aiInsightsCheck.length > 0) {
      console.log('✅ ai_insights table exists with columns:');
      aiInsightsCheck.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('❌ ai_insights table does not exist');
    }

    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyTables();
