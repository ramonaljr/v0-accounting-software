import { Suspense } from 'react'
import { AccountsTable } from '@/features/accounts/components/accounts-table'
import { NewAccountDialog } from '@/features/accounts/components/new-account-dialog'
import { getAccounts } from '@/features/accounts/actions'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function AccountsPage() {
  const accounts = await getAccounts()

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Chart of Accounts
          </h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s accounts
          </p>
        </div>
        <NewAccountDialog
          accounts={accounts}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Account
            </Button>
          }
        />
      </div>

      {/* Accounts Table */}
      <Suspense fallback={<div>Loading accounts...</div>}>
        <AccountsTable accounts={accounts} />
      </Suspense>
    </div>
  )
}
