# Applying Database Migrations to Supabase

## Quick Start (Recommended Method)

The easiest way to apply all pending migrations is through the **Supabase SQL Editor**:

### Step 1: Access the SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/jcozquxglutlyfzujswy
2. Navigate to **SQL Editor** in the left sidebar
3. Click **+ New query**

### Step 2: Copy and Run Migration Files

You need to run each migration file in order. Here are the critical migrations to get started:

#### Required Core Migrations (in order):

1. **Core Schema** - `supabase/migrations/20250101000000_init_core_schema.sql`
2. **Storage Buckets** - `supabase/migrations/20250101000001_init_storage_buckets.sql`
3. **Chart of Accounts** - `supabase/migrations/20250102000000_init_chart_of_accounts.sql`
4. **General Ledger** - `supabase/migrations/20250102000001_init_general_ledger.sql`
5. **AI Insights** - `supabase/migrations/20250122000000_add_ai_insights.sql` ⭐ **Fix for current error**

#### How to apply each migration:

1. Open the migration file in your code editor
2. Copy the entire SQL content
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl/Cmd + Enter)
5. Verify "Success. No rows returned" or similar success message
6. Move to the next migration file

### Step 3: Verify Tables Exist

After running migrations, verify in the **Table Editor**:

1. Go to **Table Editor** in the left sidebar
2. You should see tables like:
   - `organizations`
   - `org_members`
   - `accounts`
   - `transactions`
   - `ai_insights` ⭐ **Required for dashboard**

---

## Alternative Method: Using Supabase CLI

If you prefer using the CLI, you'll need your database password.

### Prerequisites

```bash
# Ensure Supabase CLI is installed
supabase --version
```

### Link to Project

```bash
# Link CLI to your remote project
supabase link --project-ref jcozquxglutlyfzujswy
```

You'll be prompted for your database password. You can find or reset it at:
https://supabase.com/dashboard/project/jcozquxglutlyfzujswy/settings/database

### Apply Migrations

```bash
# Push all pending migrations to remote database
supabase db push
```

This will automatically detect and apply all migrations in `supabase/migrations/` that haven't been applied yet.

---

## Verification

### Check Applied Migrations

Run this query in the SQL Editor to see which migrations have been applied:

```sql
SELECT * FROM _migrations ORDER BY applied_at DESC;
```

### Test the Dashboard

1. Restart your Next.js dev server:
   ```bash
   pnpm dev
   ```

2. Navigate to: http://localhost:3000/dashboard

3. The AI Insights tile should now show "No insights at this time" instead of an error

4. Click "Generate AI Insights" to create sample data

---

## Migration Files Overview

| Migration File | Purpose | Required For |
|---------------|---------|--------------|
| `20250101000000_init_core_schema.sql` | Organizations, members, roles | All features |
| `20250101000001_init_storage_buckets.sql` | File storage (receipts, invoices) | OCR, Documents |
| `20250102000000_init_chart_of_accounts.sql` | Accounting structure | Ledger, Reports |
| `20250102000001_init_general_ledger.sql` | Transactions, journal entries | Core accounting |
| `20250102000002_init_bank_feeds.sql` | Bank connections | Bank sync |
| `20250102000003_init_multi_currency.sql` | FX rates | Multi-currency |
| `20250103000000_init_ai_agents.sql` | AI categorization rules | Auto-categorization |
| `20250103000002_init_reconciliation.sql` | Reconciliation engine | Bank reconciliation |
| `20250104000000_init_phase4_ocr_expenses.sql` | OCR expenses | Receipt scanning |
| `20250105000000_init_phase5_invoicing.sql` | Invoicing, AR | Invoicing |
| `20250105000001_init_phase5_reporting.sql` | Saved reports | Financial reports |
| `20250122000000_add_ai_insights.sql` | ⭐ AI dashboard insights | Dashboard AI Insights |
| `20250122000001_add_agent_feedback.sql` | Agent feedback tracking | AI learning |
| `20250122000002_configure_pg_cron.sql` | Scheduled jobs | Automation |

---

## Troubleshooting

### Error: "relation does not exist"

This means the migration for that table hasn't been applied yet. Check which table is missing and apply the corresponding migration.

### Error: "permission denied"

Make sure you're using the SQL Editor as an authenticated user, not trying to run DDL with the anon key.

### Error: "already exists"

This means the migration was already applied. You can safely skip it or check `_migrations` table to see what's been applied.

### Migrations out of order

Migrations have dependencies. If you get foreign key errors, make sure you're applying migrations in filename order (timestamp order).

---

## Need Help?

- **Supabase Docs**: https://supabase.com/docs/guides/database/migrations
- **Project Dashboard**: https://supabase.com/dashboard/project/jcozquxglutlyfzujswy
- **SQL Editor**: https://supabase.com/dashboard/project/jcozquxglutlyfzujswy/sql

---

## Next Steps After Migrations

1. ✅ **Verify tables exist** in Table Editor
2. ✅ **Test dashboard** loads without errors
3. ✅ **Create test organization** data
4. ✅ **Generate AI insights** from dashboard
5. ✅ **Explore features** in the UI

The dashboard should now load correctly with all tiles displaying data or empty states!
