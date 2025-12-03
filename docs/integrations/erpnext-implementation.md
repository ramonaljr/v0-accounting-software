# ERPNext Integration Implementation

## Overview

This document outlines the ERPNext integration implementation for Accunza, following the roadmap defined in [roadmap.md](../roadmap.md). The implementation provides full ERP parity with ERPNext while maintaining Accunza's superior UX and AI-powered automation.

**Status:** Phase 0 and Phase 1 Core implemented and verified ✅

**Build Status:** All TypeScript checks passing, no errors ✅

---

## Architecture

### System of Record

- **ERPNext** = System of record for financial postings
- **Accunza** = UX layer, workflows, automation, and AI features
- **Sync Model** = Write-through to ERPNext on authoritative events; read-replicate for analytics

### Key Principles

1. **Double-entry correctness first** - Never post unbalanced journal entries
2. **Write-through on authoritative events** - All financial transactions sync to ERPNext
3. **Clear ID mappings** - Every synced entity has deterministic mapping
4. **Observable sync** - Full observability via sync events and health dashboard
5. **Tamper-evident audit** - Immutable audit log with cryptographic hash chain

---

## Phase 0: Foundation & Sync Infrastructure ✅

### Database Schema

#### ERP Mapping Table (`erp_map`)
Maps internal entities to ERPNext doctypes for bidirectional sync.

**Columns:**
- `org_id`, `entity_type`, `entity_id` - Our internal entity reference
- `erp_doctype`, `erp_name` - ERPNext document reference
- `content_hash` - Change detection via SHA-256
- `sync_status` - `pending`, `synced`, `error`, `conflict`
- `retry_count`, `error_message` - Error handling

**Indexes:**
- Composite unique index on `(org_id, entity_type, entity_id)`
- Composite unique index on `(org_id, erp_doctype, erp_name)`
- Status index for filtering pending/error states

#### Sync Events Table (`sync_events`)
Tracks all sync operations for observability and debugging.

**Columns:**
- `event_type` - `push`, `pull`, `retry`, `error`
- `direction` - `push` or `pull`
- `status` - `started`, `success`, `error`, `skipped`
- `duration_ms` - Performance tracking
- `request_payload`, `response_payload` - Full audit trail

#### Audit Log Table (`audit_log`)
Immutable tamper-evident audit log with cryptographic signatures.

**Features:**
- Append-only (enforced via RLS policies)
- Hash chain linking (`prev_hash` references previous entry)
- Actor tracking (user, AI agent, or system)
- Minimal diffs for change tracking
- IP address and session tracking

**Security:**
- RLS prevents updates and deletes
- Only service role can insert
- `compute_audit_hash()` function for SHA-256 hashing
- `insert_audit_log()` function maintains hash chain

### Sync Infrastructure

#### Core Functions (`lib/erpnext/sync.ts`)

**`pushToERPNext()`**
- Retry logic with exponential backoff (3 retries default)
- Content hash comparison to avoid noisy syncs
- Automatic create vs update detection
- Full error logging to `sync_events`

**`pullFromERPNext()`**
- Fetches entity from ERPNext by mapped name
- Validates mapping exists
- Logs all operations

**`batchSync()`**
- Batch multiple entities in sequence
- Returns array of results

**Helper Functions:**
- `computeContentHash()` - SHA-256 of normalized JSON
- `upsertERPMapping()` - Create or update mapping
- `getERPMapping()` - Retrieve mapping by entity
- `logSyncEvent()` - Record sync operation

### API Endpoints

#### `/api/integrations/erpnext/sync`
- `POST` - Push or pull single entity; batch sync multiple entities
- `GET` - Get sync status and recent events for entity
- **Auth:** Requires admin/owner role
- **Validation:** Zod schemas for type safety

#### `/api/integrations/erpnext/health`
- `GET` - Health dashboard with connectivity, stats, errors
- Returns:
  - Connectivity status and logged-in user
  - Sync stats (total, synced, pending, error, conflict)
  - Entity breakdown by type
  - Recent errors (last 10)
  - Performance metrics (avg sync duration)

#### `/api/integrations/erpnext/whoami`
- `GET` - Test ERPNext connectivity
- Returns logged-in ERPNext user

### UI Components

#### Integration Settings Page
**Path:** `/settings/integrations`

**Features:**
- ERPNext configuration status badge
- Health dashboard (if configured)
- Available integrations list (Plaid, Wise, Stripe, PayPal, etc.)
- Admin-only controls

#### ERPNext Health Dashboard Component
**File:** `components/integrations/erpnext-health.tsx`

**Displays:**
- Real-time connectivity status
- Sync statistics with color-coded badges
- Entity-type breakdown with progress bars
- Performance metrics
- Recent errors with drill-down
- Manual refresh button

**Metrics Tracked:**
- Total entities
- Synced, pending, error, conflict counts
- Average sync duration
- Success rate

---

## Phase 1: Core Double-Entry ✅

### Chart of Accounts Sync

#### Account Mapping (`lib/erpnext/accounts.ts`)

**Type Mapping:**
```typescript
Accunza         ERPNext
-------         -------
asset       ->  Asset
liability   ->  Liability
equity      ->  Equity
revenue     ->  Income
expense     ->  Expense
```

**Key Functions:**

**`pushAccountToERPNext()`**
- Converts Accunza account to ERPNext format
- Resolves parent account mapping
- Handles account hierarchy
- Sets `is_group` for parent accounts

**`importCOAFromERPNext()`**
- Fetches all accounts for a company
- Sorts by `is_group` (parents first)
- Creates missing accounts
- Establishes parent-child relationships
- Creates ERP mappings

**`getERPNextCompanies()`**
- Lists available ERPNext companies
- Used for company selection in UI

#### API Endpoint

**`/api/integrations/erpnext/accounts`**
- `POST` with `action: "push"` - Push single account
- `POST` with `action: "import"` - Import full COA from ERPNext
- `GET /companies` - List ERPNext companies
- **Auth:** Requires admin/accountant role

### Journal Entry Sync

**Existing:** `lib/erpnext/journal-entry.ts`

**Enhanced with:**
- Balance validation before API call (fail fast)
- Cost center support
- Multi-currency support
- Party (customer/supplier) linking
- Reference document linking

**Mapping:**
```typescript
Accunza JE Line          ERPNext JE Account
---------------          ------------------
account_id           ->  account (by mapping)
debit/credit         ->  debit/credit + debit_in_account_currency
cost_center_id       ->  cost_center (by mapping)
description          ->  user_remark
```

### Period Management & Locking

#### Fiscal Periods Table (`fiscal_periods`)

**Columns:**
- `name`, `start_date`, `end_date`, `fiscal_year`
- `period_type` - `month`, `quarter`, `year`
- `status` - `open`, `closed`, `locked`
- Closing metadata: `closed_by`, `closed_at`, `closing_entry_id`
- Lock metadata: `locked_by`, `locked_at`, `lock_reason`

**Constraints:**
- No overlapping periods per org
- `end_date > start_date` validation

#### Cost Centers Table (`cost_centers`)

**Purpose:** Dimensional reporting (departments, projects, locations)

**Columns:**
- `code`, `name`, `parent_id`
- `is_active`, `is_group`
- Hierarchical structure support

**Integration:**
- Added `cost_center_id` to `journal_entry_lines`
- Syncs to ERPNext `Cost Center` doctype

#### Period Locking Functions

**`get_period_for_date(org_id, date)`**
- Returns period ID for a given date
- Used for auto-assignment

**`is_period_locked(org_id, date)`**
- Checks if date falls in locked period
- Returns boolean

**`check_period_lock_on_je()` Trigger**
- Prevents posting JE to locked periods
- Auto-assigns period if not set
- Raises exception on violation

**`close_fiscal_period(period_id, user_id)`**
- Changes status from `open` to `closed`
- Records who closed and when
- Prevents further changes

**`lock_fiscal_period(period_id, user_id, reason)`**
- Changes status from `closed` to `locked`
- Absolute lock (requires unlock to modify)
- Records lock reason

**`unlock_fiscal_period(period_id, user_id)`**
- Admin-only function
- Returns status to `closed`

**`reopen_fiscal_period(period_id, user_id)`**
- Admin-only function
- Returns status to `open`
- Clears all closing/lock metadata

### Audit Logging

#### Audit Actions Enum

**File:** `lib/audit/logger.ts`

**Predefined Actions:**
- Journal Entry: `create`, `post`, `reverse`, `delete`, `update`
- Bank: `connect`, `disconnect`, `sync`
- Reconciliation: `approve`, `reject`, `auto`
- Invoice: `create`, `send`, `void`, `payment`
- Period: `open`, `close`, `lock`, `unlock`
- Permissions: `grant`, `revoke`, `role.change`
- Data: `export`, `report.generate`
- Settings: `update`, `integration.enable`, `integration.disable`

#### Core Functions

**`auditLog(params)`**
- Calls RPC function `insert_audit_log()`
- Automatically computes hash chain
- Returns audit log entry ID

**`computeDiff(oldValues, newValues)`**
- Minimal diff computation
- Returns only changed fields with old/new values

**`getAuditTrail(params)`**
- Retrieve audit history for entity
- Ordered by timestamp (newest first)

**`verifyAuditChain(params)`**
- Verify hash chain integrity
- Detects tampering
- Returns validation result with broken point if invalid

---

## Migration Files

### Created Migrations

1. **`20250131000000_init_erp_sync_infrastructure.sql`**
   - `erp_map`, `sync_events`, `audit_log` tables
   - Helper functions for sync and audit
   - RLS policies
   - Triggers for `updated_at`

2. **`20250131000001_init_period_locking.sql`**
   - `fiscal_periods`, `cost_centers` tables
   - Period locking functions
   - Period assignment triggers
   - Lock enforcement on JE posting

### Existing Migrations Used

- `20250102000000_init_chart_of_accounts.sql` - Accounts table
- `20250102000001_init_general_ledger.sql` - Journal entries and lines

---

## Configuration

### Environment Variables

```env
# ERPNext Integration (Optional)
ERPNEXT_BASE_URL=https://your-erpnext-instance.com
ERPNEXT_API_KEY=your_api_key
ERPNEXT_API_SECRET=your_api_secret
```

**Feature Flag:** `features.hasERPNext` in `lib/env.ts`

### ERPNext Setup Requirements

1. **API Credentials**
   - Generate API key and secret in ERPNext user settings
   - User must have permissions for doctypes: Company, Account, Journal Entry, Cost Center

2. **Company Setup**
   - At least one Company must exist in ERPNext
   - Chart of Accounts should be set up
   - Fiscal Year defined

3. **Permissions**
   - API user needs read/write access to:
     - Account
     - Journal Entry
     - Cost Center
     - Company (read-only)

---

## Testing

### Manual Testing Steps

1. **Connectivity Test**
   - Visit `/settings/integrations`
   - Verify ERPNext shows "Configured" badge
   - Check connectivity status (green = connected)

2. **COA Import**
   - Use `/api/integrations/erpnext/accounts` with `action: "import"`
   - Verify accounts created in Accunza
   - Check `erp_map` table for mappings

3. **Account Push**
   - Create new account in Accunza
   - Push to ERPNext via API
   - Verify account exists in ERPNext with correct properties

4. **Journal Entry**
   - Use `/api/integrations/erpnext/journal-entry` route
   - Post balanced JE
   - Verify JE created in ERPNext
   - Check mapping in `erp_map`

5. **Period Locking**
   - Create fiscal period
   - Close period via SQL: `SELECT close_fiscal_period(period_id, user_id);`
   - Lock period: `SELECT lock_fiscal_period(period_id, user_id, 'Month-end close');`
   - Attempt to post JE in locked period → should fail

6. **Audit Log**
   - Perform auditable action (JE post, period close, etc.)
   - Query `audit_log` table
   - Verify hash chain: `SELECT verifyAuditChain(org_id);`

### Automated Tests

**Test File:** `lib/erpnext/__tests__/client.test.ts` (existing)

**Coverage Needed (TODO):**
- Sync retry logic
- Hash chain verification
- Period lock enforcement
- Account hierarchy resolution

---

## Performance Considerations

### Optimizations Implemented

1. **Indexes**
   - Composite indexes on frequently queried columns
   - Status indexes for filtering pending/error syncs

2. **Content Hashing**
   - Avoids unnecessary syncs when content unchanged
   - SHA-256 of normalized JSON

3. **Batch Operations**
   - `batchSync()` for multiple entities
   - Sequential processing with error isolation

4. **Query Optimization**
   - Select only required fields from ERPNext API
   - Limit results with pagination

### Performance Targets

- **Sync Duration:** < 2s per entity (P95)
- **Health Dashboard:** < 1s load time
- **Batch Sync:** < 30s for 100 entities
- **Audit Chain Verification:** < 5s for 1000 entries

---

## Security

### Row-Level Security (RLS)

**All tables enforce RLS:**
- Users can only access data for their org
- Role-based permissions (owner, admin, accountant, staff, viewer)
- `audit_log` is read-only; only service role can insert

### Tamper-Evident Audit

**Hash Chain:**
- Each entry contains SHA-256 hash of content
- `prev_hash` links to previous entry
- Tampering detection via `verifyAuditChain()`

**Immutability:**
- RLS policies prevent UPDATE and DELETE
- Append-only via service role INSERT policy

### Sensitive Data

**Encrypted Fields (TODO):**
- ERPNext API credentials (stored in env)
- Future: Bank access tokens, tax IDs

**Audit Scope:**
- All financial postings
- Permission changes
- Period close/lock operations
- Data exports

---

## Next Steps: Phase 2+ Roadmap

### Phase 2: Banking & Reconciliation

**Tables:**
- `bank_accounts`, `bank_transactions`
- `categorization_rules`, `reconciliation_matches`

**ERPNext Sync:**
- `Bank Account` doctype
- `Bank Transaction` doctype
- `Payment Entry` for reconciliation

**Features:**
- Plaid/Wise integration
- Auto-categorization rules
- One-click reconciliation
- Bank clearance date tracking

### Phase 2.5: Auto-Reconciliation Engine

**ML-Powered Matching:**
- Deterministic rules (exact amount, date tolerance)
- ML scoring with explainability
- Active learning from user feedback
- Threshold tuning per org

**Metrics:**
- Precision@auto > 99.9%
- Recall@top3 > 98%
- False auto-post < 0.1%

### Phase 3: Accounts Receivable

**ERPNext Sync:**
- `Customer`, `Item`, `Sales Invoice`
- `Payment Entry` (Receive)
- `Credit Note`

**Features:**
- Customer management
- Invoicing with payment links
- Aging reports
- Dunning automation

### Phase 4: Accounts Payable

**ERPNext Sync:**
- `Supplier`, `Purchase Invoice`
- `Payment Entry` (Pay)
- Debit notes

**Features:**
- Vendor management
- Bill payments
- 1099 support (US)
- AP aging

### Phase 5: Taxes & Compliance

**ERPNext Sync:**
- `Tax Category`, `Tax Rule`
- `Sales/Purchase Taxes and Charges Template`

**Features:**
- Sales tax/VAT/GST templates
- Withholding tax (TDS/TCS)
- Tax returns and filings
- Regional presets (US, EU, PH, JP)

### Phase 6+: Inventory, Assets, FX, Reporting

See [roadmap.md](../roadmap.md) for full Phase 6-13 details.

---

## Troubleshooting

### Common Issues

**"ERPNext is not configured"**
- Verify env vars are set: `ERPNEXT_BASE_URL`, `ERPNEXT_API_KEY`, `ERPNEXT_API_SECRET`
- Check `.env.local` file
- Restart dev server

**"Unauthorized" on API calls**
- Check ERPNext API credentials
- Verify user has required permissions
- Test with `/api/integrations/erpnext/whoami`

**Sync fails with "Account not found"**
- Ensure parent accounts exist first
- Import COA from ERPNext to establish mappings
- Check `erp_map` table for missing entries

**Period lock not enforcing**
- Verify trigger is installed: `trigger_check_period_lock_on_je`
- Check period status: `SELECT * FROM fiscal_periods;`
- Ensure `entry_date` falls within period range

**Hash chain broken**
- Run verification: `SELECT * FROM verify_audit_chain(org_id);`
- Investigate `brokenAt` timestamp
- Check for manual database modifications

### Debug Commands

```sql
-- Check sync status
SELECT entity_type, sync_status, COUNT(*)
FROM erp_map
WHERE org_id = 'your-org-id'
GROUP BY entity_type, sync_status;

-- Recent sync errors
SELECT *
FROM sync_events
WHERE org_id = 'your-org-id'
  AND status = 'error'
ORDER BY created_at DESC
LIMIT 10;

-- Audit trail for entity
SELECT *
FROM audit_log
WHERE org_id = 'your-org-id'
  AND entity_type = 'journal_entry'
  AND entity_id = 'your-je-id'
ORDER BY created_at DESC;

-- Verify hash chain
SELECT * FROM verify_audit_chain('your-org-id');
```

---

## Contributing

### Code Style

- Follow existing patterns in `lib/erpnext/`
- Use TypeScript strict mode
- Add JSDoc comments for public functions
- Run `pnpm build` before committing

### Adding New ERPNext Doctypes

1. Create new file in `lib/erpnext/` (e.g., `customers.ts`)
2. Define TypeScript interfaces for ERPNext doctype
3. Implement `push` and `pull` functions
4. Add API route in `app/api/integrations/erpnext/`
5. Update `erp_map` entity_type enum if needed
6. Add tests

### Database Changes

1. Create migration file with timestamp prefix
2. Add RLS policies
3. Add indexes for performance
4. Document in comments
5. Test with sample data
6. Update this document

---

## Resources

- [ERPNext API Documentation](https://frappeframework.com/docs/user/en/api)
- [Roadmap](../roadmap.md)
- [PRD](../prd.md)
- [CLAUDE.md](../../CLAUDE.md)

---

**Last Updated:** 2025-01-31
**Implemented By:** Claude Code (Anthropic)
**Status:** Phase 0 & Phase 1 Complete ✅
