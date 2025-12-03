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
const headers = { Authorization: `token ${apiKey}:${apiSecret}`, Accept: 'application/json' };

const url = new URL('/api/resource/Account?fields=["name","root_type","account_type"]&limit_page_length=1000', baseUrl);
const res = await fetch(url, { headers });
const json = await res.json();
const names = json.data.filter(x => x.root_type === 'Income' || String(x.name).includes('Sales')).map(x => x.name);
console.log(names.join('\n'));

