'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, CheckCircle } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'

type JournalEntry = Database['public']['Tables']['journal_entries']['Row']

interface JournalEntriesTableProps {
  entries: JournalEntry[]
}

export function JournalEntriesTable({ entries }: JournalEntriesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Entry #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <p className="text-muted-foreground">No journal entries found</p>
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-mono">{entry.entry_number}</TableCell>
                <TableCell>{formatDate(entry.entry_date)}</TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell>{entry.reference || '—'}</TableCell>
                <TableCell>
                  {entry.is_posted ? (
                    <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Posted</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
