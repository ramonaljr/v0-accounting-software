'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrg, requireRole } from '@/lib/auth/org'
import { Database } from '@/lib/supabase/database.types'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit/logger'

type JournalEntry = Database['public']['Tables']['journal_entries']['Row']
type JournalEntryLine = Database['public']['Tables']['journal_entry_lines']['Row']

export interface JournalEntryWithLines extends JournalEntry {
  lines: JournalEntryLine[]
}

export interface CreateJournalEntryInput {
  entry_date: string
  description: string
  reference?: string
  lines: Array<{
    account_id: string
    description?: string
    debit: number
    credit: number
  }>
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const context = await requireOrg()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('org_id', context.orgId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch journal entries: ${error.message}`)
  return data || []
}

export async function getJournalEntry(id: string): Promise<JournalEntryWithLines | null> {
  const context = await requireOrg()
  const supabase = await createClient()

  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .eq('org_id', context.orgId)
    .single()

  if (entryError || !entry) return null

  const { data: lines, error: linesError } = await supabase
    .from('journal_entry_lines')
    .select('*')
    .eq('journal_entry_id', id)
    .eq('org_id', context.orgId)

  if (linesError) return null

  return { ...entry, lines: lines || [] }
}

export async function createJournalEntry(input: CreateJournalEntryInput): Promise<{ success: boolean; data?: JournalEntry; error?: string }> {
  try {
    const context = await requireRole('staff')
    const supabase = await createClient()

    // Validate balanced entry
    const totalDebits = input.lines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = input.lines.reduce((sum, line) => sum + line.credit, 0)

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return { success: false, error: `Entry not balanced: debits=${totalDebits}, credits=${totalCredits}` }
    }

    // Create journal entry
    const { data: entry, error: entryError } = await supabase
      .from('journal_entries')
      .insert({
        org_id: context.orgId,
        entry_date: input.entry_date,
        description: input.description,
        reference: input.reference,
        source: 'manual',
        created_by: context.userId,
      })
      .select()
      .single()

    if (entryError) return { success: false, error: entryError.message }

    // Create lines
    const linesData = input.lines.map((line) => ({
      journal_entry_id: entry.id,
      org_id: context.orgId,
      account_id: line.account_id,
      description: line.description,
      debit: line.debit,
      credit: line.credit,
      currency: 'USD',
      base_debit: line.debit,
      base_credit: line.credit,
    }))

    const { error: linesError } = await supabase
      .from('journal_entry_lines')
      .insert(linesData)

    if (linesError) return { success: false, error: linesError.message }

    await logAudit({
      action: 'journal_entry.created',
      entity_type: 'journal_entry',
      entity_id: entry.id,
      changes: { created: { entry, lines: linesData } },
    })

    revalidatePath('/journal-entries')
    return { success: true, data: entry }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function postJournalEntry(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requireRole('accountant')
    const supabase = await createClient()

    const { error } = await supabase
      .from('journal_entries')
      .update({ is_posted: true, posted_by: context.userId, posted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', context.orgId)

    if (error) return { success: false, error: error.message }

    await logAudit({
      action: 'journal_entry.posted',
      entity_type: 'journal_entry',
      entity_id: id,
    })

    revalidatePath('/journal-entries')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
