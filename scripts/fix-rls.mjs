/**
 * Apply RLS recursion fix directly to Supabase
 * Run with: node scripts/fix-rls.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://jcozquxglutlyfzujswy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjb3pxdXhnbHV0bHlmenVqc3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTAxMTgwMywiZXhwIjoyMDc2NTg3ODAzfQ.30PIYiGbddVzAACdLZKvTwSv8fO7-8R-tqUBTfNV4TA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(sql) {
  const { data, error } = await supabase.rpc('execute_sql', { query: sql }).catch(() => ({ data: null, error: null }));

  if (error) {
    // Try alternative approach - execute statements one by one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 80)}...`);
      const { error: stmtError } = await supabase.rpc('exec', { sql: statement + ';' });
      if (stmtError) {
        console.error(`Error: ${stmtError.message}`);
      }
    }
  }

  return { data, error };
}

async function applyFix() {
  console.log('🔧 Applying RLS recursion fix...\n');

  const sqlPath = join(__dirname, '..', 'scripts', 'fix-rls-now.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  console.log('SQL to execute:');
  console.log('='.repeat(60));
  console.log(sql);
  console.log('='.repeat(60));
  console.log();

  // Since Supabase doesn't have a direct SQL execution RPC by default,
  // we'll execute each statement individually via the REST API
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`[${i + 1}/${statements.length}] ${statement.substring(0, 60)}...`);

    try {
      // Use the Supabase admin API to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: statement + ';' })
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`   ⚠️  ${error}`);
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log('\n✨ Done! Please test your application now.');
}

applyFix();
