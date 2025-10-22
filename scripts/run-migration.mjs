#!/usr/bin/env node

/**
 * Simple migration runner using Supabase REST API
 * Usage: node scripts/run-migration.mjs <migration-file-name>
 * Example: node scripts/run-migration.mjs 20250122000000_add_ai_insights.sql
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Usage: node scripts/run-migration.mjs <migration-file>');
  console.error('Example: node scripts/run-migration.mjs 20250122000000_add_ai_insights.sql');
  process.exit(1);
}

console.log('🚀 Running migration:', migrationFile);

const migrationPath = join(__dirname, '..', 'supabase', 'migrations', migrationFile);
const sql = readFileSync(migrationPath, 'utf-8');

console.log('📡 Executing SQL against:', SUPABASE_URL);

// Use pg_net to execute the SQL via HTTP
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
const apiUrl = `https://${projectRef}.supabase.co/rest/v1/rpc/exec`;

try {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (response.ok) {
    console.log('✅ Migration applied successfully!');
  } else {
    const error = await response.text();
    console.error('❌ Migration failed:', error);
    console.log('\n💡 Try applying manually via SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql`);
  }
} catch (err) {
  console.error('❌ Error:', err.message);
  console.log('\n💡 Apply migration manually via SQL Editor');
}
