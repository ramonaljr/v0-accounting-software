'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { createJournalEntry } from '../actions'
import { AccountPicker } from '@/features/accounts/components/account-picker'
import type { Database } from '@/lib/supabase/database.types'

type Account = Database['public']['Tables']['accounts']['Row']

interface Line {
  id: string
  account_id: string
  description: string
  debit: number
  credit: number
}

export function NewJournalEntryDialog({ accounts, trigger }: { accounts: Account[]; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [lines, setLines] = useState<Line[]>([
    { id: '1', account_id: '', description: '', debit: 0, credit: 0 },
    { id: '2', account_id: '', description: '', debit: 0, credit: 0 },
  ])
  const router = useRouter()
  const { toast } = useToast()

  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0)
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

  const addLine = () => {
    setLines([...lines, { id: Date.now().toString(), account_id: '', description: '', debit: 0, credit: 0 }])
  }

  const removeLine = (id: string) => {
    setLines(lines.filter((l) => l.id !== id))
  }

  const updateLine = (id: string, field: keyof Line, value: string | number) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isBalanced) {
      toast({ title: 'Entry not balanced', description: 'Debits must equal credits', variant: 'destructive' })
      return
    }

    setLoading(true)
    const result = await createJournalEntry({
      entry_date: entryDate,
      description,
      reference: reference || undefined,
      lines: lines.filter((l) => l.account_id && (l.debit > 0 || l.credit > 0)),
    })

    if (result.success) {
      toast({ title: 'Journal entry created', description: `Entry ${result.data?.entry_number} created successfully` })
      setOpen(false)
      setDescription('')
      setReference('')
      setLines([
        { id: '1', account_id: '', description: '', debit: 0, credit: 0 },
        { id: '2', account_id: '', description: '', debit: 0, credit: 0 },
      ])
      router.refresh()
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger || <Button>New Entry</Button>}</SheetTrigger>
      <SheetContent className="sm:max-w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Journal Entry</SheetTitle>
          <SheetDescription>Create a manual journal entry</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div>
              <Label>Reference</Label>
              <Input placeholder="Optional" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Lines</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="h-4 w-4 mr-2" />Add Line</Button>
            </div>

            {lines.map((line, idx) => (
              <div key={line.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Line {idx + 1}</span>
                  {lines.length > 2 && <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(line.id)}><Trash2 className="h-4 w-4" /></Button>}
                </div>
                <div>
                  <Label>Account</Label>
                  <AccountPicker accounts={accounts} value={line.account_id} onValueChange={(val) => updateLine(line.id, 'account_id', val)} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input placeholder="Line description" value={line.description} onChange={(e) => updateLine(line.id, 'description', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Debit</Label>
                    <Input type="number" step="0.01" min="0" value={line.debit || ''} onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <Label>Credit</Label>
                    <Input type="number" step="0.01" min="0" value={line.credit || ''} onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>Total Debits:</span>
              <span className="font-mono">${totalDebits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Total Credits:</span>
              <span className="font-mono">${totalCredits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-2 pt-2 border-t font-semibold">
              <span>Difference:</span>
              <span className={`font-mono ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>${Math.abs(totalDebits - totalCredits).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !isBalanced}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Entry</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
