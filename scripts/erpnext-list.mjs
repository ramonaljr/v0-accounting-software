#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else dotenv.config();

const baseUrl = process.env.ERPNEXT_BASE_URL;
const apiKey = process.env.ERPNEXT_API_KEY;
const apiSecret = process.env.ERPNEXT_API_SECRET;
if (!baseUrl || !apiKey || !apiSecret) {
  console.error('Missing ERPNext env.');
  process.exit(1);
}

const [cmd, ...rest] = process.argv.slice(2);
const headers = {
  Authorization: `token ${apiKey}:${apiSecret}`,
  Accept: 'application/json'
};

async function main() {
  if (!cmd || cmd === 'help') {
    console.log('Usage: node scripts/erpnext-list.mjs <companies|accounts> [company]');
    process.exit(0);
  }

  if (cmd === 'companies') {
    const url = new URL('/api/resource/Company?fields=["name"]&limit_page_length=100', baseUrl);
    const res = await fetch(url, { headers });
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
    return;
  }

  if (cmd === 'accounts') {
    const url = new URL('/api/resource/Account?fields=["name","company","root_type","account_type","is_group"]&limit_page_length=1000', baseUrl);
    const res = await fetch(url, { headers });
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
    return;
  }

  console.log('Unknown command');
}

main().catch((e) => { console.error(e); process.exit(2); });

