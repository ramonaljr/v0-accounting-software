ERPNext Integration
===================

Overview
--------
- Supports token-based auth to ERPNext/Frappe.
- Adds a minimal client and a test API route to verify credentials.

Environment Variables
---------------------
Add these to `.env.local` (or your deployment env):

```
ERPNEXT_BASE_URL=https://your-erpnext-domain
ERPNEXT_API_KEY=your_api_key
ERPNEXT_API_SECRET=your_api_secret
```

Where to find in ERPNext
------------------------
- User menu → Settings → API Access → Generate Key & Secret (or via User document → API Access).
- Copy `api_key` and `api_secret` values. Keep them secret.

Verify Setup
------------
- Start the app and call the test endpoint:
  - GET `/api/integrations/erpnext/whoami`
- Expected: `{ ok: true, data: { message: "<your-user>" } }`

Using the Client
----------------
- Import and call `erpnextFetch` for any REST/METHOD endpoint:

```ts
import { erpnextFetch } from "@/lib/erpnext/client";

// Example: list 20 customers
const res = await erpnextFetch("/api/resource/Customer?limit_page_length=20");
```

Notes
-----
- Auth header used: `Authorization: token <api_key>:<api_secret>`.
- The integration is optional; app runs without it.


Journal Entry
-------------
- API route: `POST /api/integrations/erpnext/journal-entry`
- Body shape:
```
{
  "company": "Your Company",
  "posting_date": "YYYY-MM-DD",
  "remark": "optional text",
  "accounts": [
    { "account": "Bank - YOUR", "debit": 100 },
    { "account": "Sales - YOUR", "credit": 100 }
  ]
}
```
- CLI: `pnpm erpnext:post-je ./sample-je.json`

