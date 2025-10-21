# Supabase Integration Guide

This directory contains the Supabase client utilities for OpportunityOS. Follow the security and architectural patterns defined in [CLAUDE.md](../../CLAUDE.md).

## Quick Start

### 1. Environment Setup

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Get your credentials from the Supabase dashboard:
https://supabase.com/dashboard/project/jcozquxglutlyfzujswy/settings/api

### 2. Client Usage Patterns

#### Server Components & Server Actions (Preferred)

```tsx
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Always scope by org_id for multi-tenant security
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(10)

  return <div>{/* render transactions */}</div>
}
```

#### Server Actions for Mutations

```tsx
// app/actions/transactions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTransaction(formData: FormData) {
  const supabase = await createClient()

  // Validate user has access to org
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const newTransaction = {
    org_id: formData.get('org_id'),
    amount: formData.get('amount'),
    description: formData.get('description'),
    // ... other fields
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(newTransaction)
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard')
  return data
}
```

#### Client Components (Use Sparingly)

```tsx
// components/AccountsRealtime.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function AccountsRealtime({ orgId }: { orgId: string }) {
  const [accounts, setAccounts] = useState([])
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    async function fetchAccounts() {
      const { data } = await supabase
        .from('accounts')
        .select('*')
        .eq('org_id', orgId)

      setAccounts(data || [])
    }

    fetchAccounts()

    // Real-time subscription
    const channel = supabase
      .channel('accounts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts',
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          // Handle real-time updates
          fetchAccounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId])

  return <div>{/* render accounts */}</div>
}
```

#### Admin Operations (Use with Caution)

```tsx
// lib/audit/system-logger.ts
import { createAdminClient } from '@/lib/supabase/server'

export async function logSystemEvent(event: {
  action: string
  entity_type: string
  entity_id: string
  actor_id?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = createAdminClient()

  // Service role bypasses RLS - ensure proper validation
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      ...event,
      timestamp: new Date().toISOString(),
      source: 'system',
    })

  if (error) throw error
}
```

## Security Best Practices

### 1. Always Scope by org_id

```tsx
// ✅ Good - Scoped by org_id
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('org_id', userOrgId)

// ❌ Bad - No org_id scope (security vulnerability!)
const { data } = await supabase
  .from('transactions')
  .select('*')
```

### 2. Enable Row Level Security (RLS)

Every table MUST have RLS enabled with policies that validate:
- User authentication (`auth.uid()`)
- Organization membership (`org_id`)

Example RLS policy:
```sql
-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see transactions from their org
CREATE POLICY "Users can view org transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );
```

### 3. Never Expose Service Role Key

```tsx
// ✅ Good - Service role on server only
// lib/admin/operations.ts (server-side only)
import { createAdminClient } from '@/lib/supabase/server'

// ❌ Bad - NEVER use service role on client
// 'use client'
// import { createAdminClient } from '@/lib/supabase/server' // Don't do this!
```

### 4. Validate User Permissions

```tsx
async function updateTransaction(transactionId: string, updates: object) {
  const supabase = await createClient()

  // 1. Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 2. Verify user has permission (check role)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!['owner', 'admin', 'accountant'].includes(membership?.role)) {
    throw new Error('Insufficient permissions')
  }

  // 3. Perform the operation
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .select()

  if (error) throw error
  return data
}
```

## Multi-Tenant Patterns

### User-Org Relationship

```typescript
// Types for multi-tenant access
interface OrgMember {
  id: string
  org_id: string
  user_id: string
  role: 'owner' | 'admin' | 'accountant' | 'staff' | 'viewer'
  created_at: string
}

// Helper to get user's orgs
async function getUserOrganizations(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(*)')
    .eq('user_id', userId)

  return data
}

// Helper to check if user can access org
async function canAccessOrg(userId: string, orgId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single()

  return !!data
}
```

## Storage Patterns

### Per-Org File Storage

```tsx
import { createClient } from '@/lib/supabase/server'

export async function uploadReceipt(
  orgId: string,
  file: File
) {
  const supabase = await createClient()

  // Use org-scoped path
  const filePath = `${orgId}/receipts/${Date.now()}-${file.name}`

  const { data, error } = await supabase
    .storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  // Get public URL (or signed URL for private files)
  const { data: { publicUrl } } = supabase
    .storage
    .from('documents')
    .getPublicUrl(filePath)

  return { path: filePath, url: publicUrl }
}

// Generate short-lived signed URL for sensitive exports
export async function getExportUrl(orgId: string, exportPath: string) {
  const supabase = await createClient()

  // 15-minute expiry for sensitive documents
  const { data, error } = await supabase
    .storage
    .from('documents')
    .createSignedUrl(`${orgId}/exports/${exportPath}`, 900) // 900s = 15min

  if (error) throw error
  return data.signedUrl
}
```

## Error Handling

```tsx
import { createClient } from '@/lib/supabase/server'

async function safeQuery() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('org_id', orgId)

  if (error) {
    // Log error for monitoring
    console.error('Supabase query error:', error)

    // Return user-friendly error
    throw new Error('Failed to fetch transactions. Please try again.')
  }

  return data
}
```

## Performance Tips

1. **Select only needed fields**
   ```tsx
   // ✅ Good
   .select('id, amount, date, description')

   // ❌ Bad (fetches all columns)
   .select('*')
   ```

2. **Use pagination**
   ```tsx
   .range(0, 49) // First 50 rows
   .limit(50)
   ```

3. **Index frequently queried columns**
   ```sql
   CREATE INDEX idx_transactions_org_date
   ON transactions(org_id, created_at DESC);
   ```

4. **Use real-time subscriptions sparingly**
   - Only subscribe to critical data that needs instant updates
   - Unsubscribe when component unmounts
   - Consider polling for less critical data

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Project Dashboard](https://supabase.com/dashboard/project/jcozquxglutlyfzujswy)
