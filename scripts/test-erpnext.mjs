#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Load env from .env.local if present, else .env
const envLocal = path.resolve(process.cwd(), '.env.local');
const envDefault = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envLocal)) {
  dotenv.config({ path: envLocal });
} else if (fs.existsSync(envDefault)) {
  dotenv.config({ path: envDefault });
} else {
  // Fallback to default dotenv behavior (none found)
  dotenv.config();
}

const baseUrl = process.env.ERPNEXT_BASE_URL;
const apiKey = process.env.ERPNEXT_API_KEY;
const apiSecret = process.env.ERPNEXT_API_SECRET;

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

if (!baseUrl) fail("ERPNEXT_BASE_URL is not set");
if (!apiKey) fail("ERPNEXT_API_KEY is not set");
if (!apiSecret) fail("ERPNEXT_API_SECRET is not set");

const url = new URL("/api/method/frappe.auth.get_logged_user", baseUrl);
const headers = {
  Authorization: `token ${apiKey}:${apiSecret}`,
  Accept: "application/json",
};

console.log(`→ Testing ERPNext at ${url}`);

try {
  const res = await fetch(url, { headers });
  const text = await res.text();
  if (!res.ok) {
    console.error(`✖ HTTP ${res.status} ${res.statusText}\n${text}`);
    process.exit(2);
  }
  try {
    const json = JSON.parse(text);
    console.log("✔ Success:", JSON.stringify(json, null, 2));
  } catch {
    console.log("✔ Success (non-JSON):", text);
  }
} catch (err) {
  console.error("✖ Request failed:", err?.message || err);
  process.exit(3);
}
