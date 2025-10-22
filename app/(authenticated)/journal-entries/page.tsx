import { getJournalEntries } from '@/features/journal-entries/actions'
import { getAccounts } from '@/features/accounts/actions'
import { JournalEntriesTable } from '@/features/journal-entries/components/journal-entries-table'
import { NewJournalEntryDialog } from '@/features/journal-entries/components/new-journal-entry-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function JournalEntriesPage() {
  const [entries, accounts] = await Promise.all([getJournalEntries(), getAccounts()])

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1>
          <p className="text-muted-foreground">Manage journal entries and general ledger transactions</p>
        </div>
        <NewJournalEntryDialog accounts={accounts} trigger={<Button><Plus className="mr-2 h-4 w-4" />New Entry</Button>} />
      </div>
      <JournalEntriesTable entries={entries} />
    </div>
  )
}
