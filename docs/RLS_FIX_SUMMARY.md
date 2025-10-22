# RLS Infinite Recursion Fix

## Problem

The error `"infinite recursion detected in policy for relation \"org_members\""` was occurring because the RLS policies on the `org_members` table were querying `org_members` within their policy definitions, creating infinite recursion.

### Root Cause

In [supabase/migrations/20250101000000_init_core_schema.sql](../supabase/migrations/20250101000000_init_core_schema.sql), the policies were structured like this:

```sql
CREATE POLICY "Users can view members of their organizations"
  ON org_members FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members  -- ❌ Recursion!
      WHERE user_id = auth.uid()
    )
  );
```

When Postgres tries to evaluate the policy for a query on `org_members`, it needs to query `org_members` to check the policy, which triggers the policy evaluation again, and so on.

## Solutions Implemented

### 1. Development Fix (✅ Already Applied)

Modified [features/dashboard/ai-insights-actions.ts](../features/dashboard/ai-insights-actions.ts) to use the admin client (which bypasses RLS) when `BYPASS_AUTH=true`:

```typescript
const { createAdminClient } = await import("@/lib/supabase/server");
const supabase = process.env.BYPASS_AUTH === 'true'
  ? createAdminClient()  // Bypasses RLS entirely
  : await createClient();
```

This allows development to continue without being blocked by RLS issues.

### 2. Production Fix (❗ Requires Manual Application)

Created a migration file [supabase/migrations/20250122000003_fix_org_members_rls_recursion.sql](../supabase/migrations/20250122000003_fix_org_members_rls_recursion.sql) that:

1. **Drops the problematic policies** on `org_members`
2. **Creates simplified policies** that don't cause recursion:
   ```sql
   -- Users can only see their own membership
   CREATE POLICY "Users can view org members"
     ON org_members FOR SELECT
     USING (user_id = auth.uid());
   ```
3. **Updates other table policies** to use the SECURITY DEFINER helper functions (`is_org_member`, `has_org_role`) which safely query `org_members` without triggering policy recursion

## How to Apply the Production Fix

### Option 1: Supabase SQL Editor (Recommended)

1. Go to https://supabase.com/dashboard/project/jcozquxglutlyfzujswy/sql/new
2. Copy the contents of [scripts/fix-rls-now.sql](../scripts/fix-rls-now.sql)
3. Click "Run"

### Option 2: Via Supabase CLI

If you have Docker running locally:

```bash
supabase db push
```

Or reset and reapply all migrations:

```bash
supabase db reset
```

### Option 3: Manual Connection

If you have `psql` installed:

```bash
psql "postgresql://postgres:ramon123ramon@db.jcozquxglutlyfzujswy.supabase.co:5432/postgres" \
  -f supabase/migrations/20250122000003_fix_org_members_rls_recursion.sql
```

## Verification

After applying the fix, verify it works by:

1. Setting `BYPASS_AUTH=false` in `.env.local`
2. Restarting your dev server (`pnpm dev`)
3. Navigating to the dashboard
4. Checking that AI Insights load without errors

## Long-term Considerations

### Current Policy Limitations

The simplified `org_members` SELECT policy only allows users to see their own membership:

```sql
USING (user_id = auth.uid())
```

This means:
- ✅ No more infinite recursion
- ⚠️ Users can't query other team members via the anon key
- ✅ Application uses service role for team member queries

### Recommended Approach

For multi-user features (team management, etc.), use **Server Actions with the service role key** rather than relying on client-side RLS:

```typescript
// Good: Server Action with service role
export async function getOrgMembers(orgId: string) {
  const context = await requireOrg();
  if (context.orgId !== orgId) throw new Error("Unauthorized");

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('org_members')
    .select('*')
    .eq('org_id', orgId);

  return data;
}
```

```typescript
// Avoid: Client-side query with anon key
const { data } = await supabase
  .from('org_members')
  .select('*')  // ❌ RLS blocks this
```

## Files Modified

- ✅ [features/dashboard/ai-insights-actions.ts](../features/dashboard/ai-insights-actions.ts) - Use admin client in development
- 📝 [supabase/migrations/20250122000003_fix_org_members_rls_recursion.sql](../supabase/migrations/20250122000003_fix_org_members_rls_recursion.sql) - Production RLS fix
- 📝 [scripts/fix-rls-now.sql](../scripts/fix-rls-now.sql) - Standalone SQL for manual application

## References

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Avoiding RLS Recursion](https://github.com/orgs/supabase/discussions/6642)
- [SECURITY DEFINER Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
