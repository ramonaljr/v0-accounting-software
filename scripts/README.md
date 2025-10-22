# Database Migration Scripts

## Quick Start

### Apply All Pending Migrations

```bash
node scripts/migrate.mjs
```

This script will:
1. Connect to your Supabase database
2. Create a `_migrations` tracking table (if it doesn't exist)
3. Check which migrations have already been applied
4. Apply all pending migrations in order
5. Track each successful migration

## Prerequisites

### 1. Set Database Password

Add your Supabase database password to `.env.local`:

```bash
SUPABASE_DB_PASSWORD=your_actual_password_here
```

**Get your password:**
- Go to: https://supabase.com/dashboard/project/jcozquxglutlyfzujswy/settings/database
- Scroll to "Database Password"
- If you don't have it, click "Reset Database Password"
- Copy and paste into `.env.local`

### 2. Install Dependencies

```bash
pnpm install
```

## Usage

### Apply All Migrations

```bash
node scripts/migrate.mjs
```

**Output:**
```
🚀 Supabase Migration Tool

📡 Project: jcozquxglutlyfzujswy
🌍 Region: ap-southeast-1

🔌 Connecting to database...
✅ Connected!

📋 Creating migrations tracking table...
✅ Tracking table ready

📁 Total migrations: 18
✅ Already applied: 0
⏳ Pending: 18

🔄 Applying pending migrations:

   📄 20250101000000_init_core_schema.sql... ✅
   📄 20250101000001_init_storage_buckets.sql... ✅
   📄 20250122000000_add_ai_insights.sql... ✅
   ...

🎉 Successfully applied 18 migrations!
```

## Features

✅ **Transaction Safety** - Each migration runs in a transaction and rolls back on error
✅ **Idempotent** - Safe to run multiple times (skips already-applied migrations)
✅ **Ordered Execution** - Migrations apply in timestamp order
✅ **Progress Tracking** - Visual feedback for each migration
✅ **Error Handling** - Clear error messages with position info

## Troubleshooting

### Error: Database password not set

Add `SUPABASE_DB_PASSWORD` to your `.env.local` file.

### Error: Authentication failed (28P01)

Your database password is incorrect. Reset it at:
https://supabase.com/dashboard/project/jcozquxglutlyfzujswy/settings/database

### Error: Could not connect to database

Check:
1. Your internet connection
2. Supabase project status
3. The connection string format in the script

### Migration Failed Mid-Way

The failed migration is rolled back automatically. Fix the SQL error in the migration file and run again. Already-applied migrations will be skipped.

## Migration Files

All migration files are in `supabase/migrations/` and follow this naming convention:

```
YYYYMMDDHHMMSS_description.sql
```

For example:
- `20250101000000_init_core_schema.sql`
- `20250122000000_add_ai_insights.sql`

## Verifying Migrations

### Check Applied Migrations

After running migrations, you can verify in the Supabase Dashboard:

**SQL Editor:**
```sql
SELECT * FROM _migrations ORDER BY applied_at DESC;
```

**Table Editor:**
Go to: https://supabase.com/dashboard/project/jcozquxglutlyfzujswy/editor

You should see tables like:
- `organizations`
- `org_members`
- `accounts`
- `transactions`
- `ai_insights` ⭐

## Alternative: Manual Application

If the script doesn't work, you can apply migrations manually via SQL Editor:

1. Go to: https://supabase.com/dashboard/project/jcozquxglutlyfzujswy/sql
2. Open migration file in your editor
3. Copy entire SQL content
4. Paste in SQL Editor
5. Click "Run" (or Ctrl/Cmd + Enter)
6. Repeat for each migration file in order

## Security Notes

- `SUPABASE_DB_PASSWORD` should **never** be committed to git
- `.env.local` is already in `.gitignore`
- The password is only used for server-side migrations
- Client-side code uses the `anon` key with RLS protection

---

**Need help?** See full documentation: [docs/runbooks/apply-database-migrations.md](../docs/runbooks/apply-database-migrations.md)
