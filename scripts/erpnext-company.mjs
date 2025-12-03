#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const envLocal = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal });
else dotenv.config();

const [company] = process.argv.slice(2);
if (!company) {
  console.error('Usage: node scripts/erpnext-company.mjs "<Company Name>"');
  process.exit(1);
}

const headers = { Authorization: `token ${process.env.ERPNEXT_API_KEY}:${process.env.ERPNEXT_API_SECRET}`, Accept: 'application/json' };
const url = new URL(`/api/resource/Company/${encodeURIComponent(company)}?fields=["default_currency","abbr"]`, process.env.ERPNEXT_BASE_URL);
const res = await fetch(url, { headers });
const json = await res.json();
console.log(JSON.stringify(json, null, 2));

