#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

// load env
const envLocal = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal })
else dotenv.config()

const baseUrl = process.env.ERPNEXT_BASE_URL
const apiKey = process.env.ERPNEXT_API_KEY
const apiSecret = process.env.ERPNEXT_API_SECRET

function fail(msg) {
  console.error(`✖ ${msg}`)
  process.exit(1)
}
if (!baseUrl) fail('ERPNEXT_BASE_URL is not set')
if (!apiKey) fail('ERPNEXT_API_KEY is not set')
if (!apiSecret) fail('ERPNEXT_API_SECRET is not set')

const args = process.argv.slice(2)
if (args.length === 0) {
  console.log('Usage: pnpm exec node scripts/post-erpnext-je.mjs <json-file>')
  console.log('Example JSON:')
  console.log(
    JSON.stringify(
      {
        company: 'Your Company',
        posting_date: '2025-01-01',
        remark: 'Posted from Accunza',
        accounts: [
          { account: 'Bank - YOUR', debit: 100 },
          { account: 'Sales - YOUR', credit: 100 },
        ],
      },
      null,
      2
    )
  )
  process.exit(0)
}

const jsonPath = path.resolve(process.cwd(), args[0])
if (!fs.existsSync(jsonPath)) fail(`File not found: ${jsonPath}`)
const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

const url = new URL('/api/resource/Journal Entry', baseUrl)
const headers = {
  Authorization: `token ${apiKey}:${apiSecret}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

const transformedAccounts = payload.accounts.map(l => {
  const line = { doctype: 'Journal Entry Account', ...l }
  if (typeof line.debit === 'number' && line.debit > 0) {
    line.debit_in_account_currency = line.debit_in_account_currency ?? line.debit
    line.exchange_rate = line.exchange_rate ?? 1
  }
  if (typeof line.credit === 'number' && line.credit > 0) {
    line.credit_in_account_currency = line.credit_in_account_currency ?? line.credit
    line.exchange_rate = line.exchange_rate ?? 1
  }
  return line
})

const body = JSON.stringify({
  doctype: 'Journal Entry',
  voucher_type: payload.voucher_type || 'Journal Entry',
  posting_date: payload.posting_date,
  company: payload.company,
  user_remark: payload.remark,
  accounts: transformedAccounts,
})

console.log('→ Posting Journal Entry to', String(url))
try {
  const res = await fetch(url, { method: 'POST', headers, body })
  const text = await res.text()
  if (!res.ok) {
    console.error(`✖ HTTP ${res.status} ${res.statusText}\n${text}`)
    process.exit(2)
  }
  console.log('✔ Success:', text)
} catch (err) {
  console.error('✖ Request failed:', err?.message || err)
  process.exit(3)
}
