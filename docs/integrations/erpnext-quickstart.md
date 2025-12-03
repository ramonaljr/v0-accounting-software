# ERPNext Integration - Quick Start Guide

## 5-Minute Setup

### 1. Configure Environment Variables

Add to `.env.local`:

```env
ERPNEXT_BASE_URL=https://your-erpnext.com
ERPNEXT_API_KEY=your_api_key_here
ERPNEXT_API_SECRET=your_api_secret_here
```

### 2. Test Connectivity

```bash
curl http://localhost:3000/api/integrations/erpnext/whoami
```

Expected response:
```json
{
  "message": "user@example.com"
}
```

### 3. View Health Dashboard

Visit: [http://localhost:3000/settings/integrations](http://localhost:3000/settings/integrations)

You should see:
- ✅ ERPNext configured badge
- 🟢 Connected status
- Sync statistics dashboard

---

## Common Operations

### Import Chart of Accounts from ERPNext

```typescript
// API call
const response = await fetch('/api/integrations/erpnext/accounts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'import',
    orgId: 'your-org-id',
    companyName: 'Your Company Name', // Must match ERPNext company
  }),
})

const result = await response.json()
console.log(`Imported ${result.imported} accounts`)
```

### Push Single Account to ERPNext

```typescript
const response = await fetch('/api/integrations/erpnext/accounts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'push',
    orgId: 'your-org-id',
    accountId: 'account-uuid',
    companyName: 'Your Company Name',
  }),
})

const result = await response.json()
console.log(`ERP Name: ${result.erpName}`)
```

### Post Journal Entry to ERPNext

```typescript
import { postJournalEntry } from '@/lib/erpnext/journal-entry'

const result = await postJournalEntry({
  company: 'Your Company Name',
  posting_date: '2025-01-31',
  remark: 'Test journal entry',
  accounts: [
    {
      account: 'Cash - YC', // ERPNext account name
      debit: 1000,
      credit: 0,
    },
    {
      account: 'Sales - YC',
      debit: 0,
      credit: 1000,
    },
  ],
})

console.log('JE posted:', result.data.name)
```

### Create Fiscal Period

```sql
INSERT INTO fiscal_periods (
  org_id,
  name,
  start_date,
  end_date,
  fiscal_year,
  period_type,
  status
) VALUES (
  'your-org-id',
  'January 2025',
  '2025-01-01',
  '2025-01-31',
  2025,
  'month',
  'open'
);
```

### Close Period

```sql
SELECT close_fiscal_period(
  'period-uuid',
  'user-uuid'
);
```

### Lock Period

```sql
SELECT lock_fiscal_period(
  'period-uuid',
  'user-uuid',
  'Month-end close completed'
);
```

### Log Audit Event

```typescript
import { auditLog, AuditActions } from '@/lib/audit/logger'

await auditLog({
  orgId: 'your-org-id',
  actorType: 'user',
  actorId: 'user-uuid',
  actorEmail: 'user@example.com',
  action: AuditActions.JOURNAL_ENTRY_POST,
  entityType: 'journal_entry',
  entityId: 'je-uuid',
  newValues: { is_posted: true },
  metadata: { amount: 1000, account_count: 2 },
})
```

---

## Troubleshooting

### Check Sync Status

```sql
SELECT * FROM erp_map
WHERE org_id = 'your-org-id'
ORDER BY updated_at DESC;
```

### View Recent Sync Errors

```sql
SELECT * FROM sync_events
WHERE org_id = 'your-org-id'
  AND status = 'error'
ORDER BY created_at DESC
LIMIT 10;
```

### Verify Audit Chain

```sql
SELECT * FROM verify_audit_chain('your-org-id');
-- Returns: { valid: true } or { valid: false, brokenAt: 'timestamp' }
```

### Retry Failed Sync

```typescript
const response = await fetch('/api/integrations/erpnext/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orgId: 'your-org-id',
    entityType: 'account',
    entityId: 'account-uuid',
    erpDoctype: 'Account',
    direction: 'push',
    payload: { /* account data */ },
  }),
})
```

---

## Key Files Reference

### Core Libraries
- `lib/erpnext/client.ts` - ERPNext API client
- `lib/erpnext/sync.ts` - Sync infrastructure
- `lib/erpnext/accounts.ts` - COA sync
- `lib/erpnext/journal-entry.ts` - JE posting
- `lib/audit/logger.ts` - Audit logging

### API Routes
- `/api/integrations/erpnext/whoami` - Connectivity test
- `/api/integrations/erpnext/health` - Health dashboard
- `/api/integrations/erpnext/sync` - Generic sync endpoint
- `/api/integrations/erpnext/accounts` - COA operations
- `/api/integrations/erpnext/journal-entry` - JE posting

### UI Components
- `app/(authenticated)/settings/integrations/page.tsx` - Settings page
- `components/integrations/erpnext-health.tsx` - Health dashboard
- `components/integrations/integrations-list.tsx` - Integrations list

### Migrations
- `20250131000000_init_erp_sync_infrastructure.sql` - Sync tables
- `20250131000001_init_period_locking.sql` - Periods and cost centers

---

## Testing Checklist

- [ ] ERPNext credentials configured
- [ ] Connectivity test passes (`/whoami`)
- [ ] Health dashboard loads without errors
- [ ] Can import COA from ERPNext
- [ ] Can push new account to ERPNext
- [ ] Can post journal entry to ERPNext
- [ ] Fiscal period prevents posting when locked
- [ ] Audit log records all actions
- [ ] Hash chain verification passes
- [ ] Build completes without TypeScript errors

---

## Next Steps

1. **Import your ERPNext COA** to establish account mappings
2. **Create fiscal periods** for your accounting calendar
3. **Test journal entry posting** end-to-end
4. **Set up period locking** workflow
5. **Review audit logs** for compliance

For detailed documentation, see [erpnext-implementation.md](./erpnext-implementation.md)
