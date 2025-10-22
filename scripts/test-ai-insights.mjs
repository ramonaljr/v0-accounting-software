#!/usr/bin/env node

/**
 * Test AI Insights
 * Verify that AI insights can be fetched from the database
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

async function testAIInsights() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('🧪 Testing AI Insights functionality...\n');

    // Check if table exists and count records
    const { rows } = await client.query(`
      SELECT COUNT(*) as count FROM ai_insights
    `);

    console.log(`✅ ai_insights table accessible`);
    console.log(`📊 Current records: ${rows[0].count}\n`);

    if (rows[0].count === '0') {
      console.log('💡 No insights yet. You can:');
      console.log('   1. Visit http://localhost:3002/dashboard');
      console.log('   2. Click "Generate AI Insights" button');
      console.log('   3. Sample insights will be created\n');
    } else {
      console.log('🎉 AI Insights data exists!\n');

      // Fetch sample insights
      const { rows: insights } = await client.query(`
        SELECT id, agent_type, severity, title, confidence
        FROM ai_insights
        ORDER BY created_at DESC
        LIMIT 5
      `);

      console.log('📋 Recent insights:');
      insights.forEach(insight => {
        console.log(`   ${insight.severity.toUpperCase()} | ${insight.agent_type} | ${insight.title} (${Math.round(insight.confidence * 100)}% confidence)`);
      });
      console.log();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testAIInsights();
