import { describe, it, expect } from 'vitest'
import {
  validateBalancedEntry,
  validateLineItems,
  validateJournalEntry,
  calculateAccountBalance,
  validateAccountingEquation,
  type JournalEntry,
  type JournalEntryLine,
} from '../validation'

describe('validateBalancedEntry', () => {
  it('should validate a balanced entry', () => {
    const entry: JournalEntry = {
      entry_date: new Date('2025-01-01'),
      description: 'Test entry',
      lines: [
        { account_id: 'acc1', debit: 100, credit: 0 },
        { account_id: 'acc2', debit: 0, credit: 100 },
      ],
    }

    const result = validateBalancedEntry(entry)
    expect(result.isValid).toBe(true)
    expect(result.debitTotal).toBe(100)
    expect(result.creditTotal).toBe(100)
    expect(result.difference).toBe(0)
  })

  it('should reject an unbalanced entry', () => {
    const entry: JournalEntry = {
      entry_date: new Date('2025-01-01'),
      description: 'Unbalanced entry',
      lines: [
        { account_id: 'acc1', debit: 100, credit: 0 },
        { account_id: 'acc2', debit: 0, credit: 50 },
      ],
    }

    const result = validateBalancedEntry(entry)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('out of balance')
    expect(result.debitTotal).toBe(100)
    expect(result.creditTotal).toBe(50)
    expect(result.difference).toBe(50)
  })

  it('should handle multiple debits and credits', () => {
    const entry: JournalEntry = {
      entry_date: new Date('2025-01-01'),
      description: 'Multiple lines',
      lines: [
        { account_id: 'acc1', debit: 100, credit: 0 },
        { account_id: 'acc2', debit: 50, credit: 0 },
        { account_id: 'acc3', debit: 0, credit: 75 },
        { account_id: 'acc4', debit: 0, credit: 75 },
      ],
    }

    const result = validateBalancedEntry(entry)
    expect(result.isValid).toBe(true)
    expect(result.debitTotal).toBe(150)
    expect(result.creditTotal).toBe(150)
  })

  it('should allow for floating point precision errors', () => {
    const entry: JournalEntry = {
      entry_date: new Date('2025-01-01'),
      description: 'Floating point test',
      lines: [
        { account_id: 'acc1', debit: 0.1 + 0.2, credit: 0 }, // 0.30000000000000004
        { account_id: 'acc2', debit: 0, credit: 0.3 },
      ],
    }

    const result = validateBalancedEntry(entry)
    expect(result.isValid).toBe(true)
  })
})

describe('validateLineItems', () => {
  it('should validate correct line items', () => {
    const lines: JournalEntryLine[] = [
      { account_id: 'acc1', debit: 100, credit: 0 },
      { account_id: 'acc2', debit: 0, credit: 100 },
    ]

    const result = validateLineItems(lines)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject empty lines', () => {
    const lines: JournalEntryLine[] = []

    const result = validateLineItems(lines)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Journal entry must have at least one line')
  })

  it('should reject single line entry', () => {
    const lines: JournalEntryLine[] = [
      { account_id: 'acc1', debit: 100, credit: 0 },
    ]

    const result = validateLineItems(lines)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Journal entry must have at least two lines for double-entry')
  })

  it('should reject line with both debit and credit', () => {
    const lines: JournalEntryLine[] = [
      { account_id: 'acc1', debit: 100, credit: 50 },
      { account_id: 'acc2', debit: 0, credit: 100 },
    ]

    const result = validateLineItems(lines)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('Cannot have both debit and credit'))).toBe(true)
  })

  it('should reject line with neither debit nor credit', () => {
    const lines: JournalEntryLine[] = [
      { account_id: 'acc1', debit: 0, credit: 0 },
      { account_id: 'acc2', debit: 0, credit: 100 },
    ]

    const result = validateLineItems(lines)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('Must have either a debit or credit'))).toBe(true)
  })

  it('should reject negative amounts', () => {
    const lines: JournalEntryLine[] = [
      { account_id: 'acc1', debit: -100, credit: 0 },
      { account_id: 'acc2', debit: 0, credit: 100 },
    ]

    const result = validateLineItems(lines)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('must be non-negative'))).toBe(true)
  })

  it('should reject missing account ID', () => {
    const lines: JournalEntryLine[] = [
      { account_id: '', debit: 100, credit: 0 },
      { account_id: 'acc2', debit: 0, credit: 100 },
    ]

    const result = validateLineItems(lines)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('Account ID is required'))).toBe(true)
  })
})

describe('validateJournalEntry', () => {
  it('should validate a complete valid entry', () => {
    const entry: JournalEntry = {
      entry_date: new Date('2025-01-01'),
      description: 'Cash sale',
      lines: [
        { account_id: 'cash', debit: 100, credit: 0, description: 'Cash received' },
        { account_id: 'revenue', debit: 0, credit: 100, description: 'Sales revenue' },
      ],
    }

    const result = validateJournalEntry(entry)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject entry without description', () => {
    const entry: JournalEntry = {
      entry_date: new Date('2025-01-01'),
      description: '',
      lines: [
        { account_id: 'cash', debit: 100, credit: 0 },
        { account_id: 'revenue', debit: 0, credit: 100 },
      ],
    }

    const result = validateJournalEntry(entry)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Description is required')
  })

  it('should accumulate multiple validation errors', () => {
    const entry: JournalEntry = {
      entry_date: new Date('2025-01-01'),
      description: '',
      lines: [
        { account_id: 'cash', debit: 100, credit: 0 },
        { account_id: 'revenue', debit: 0, credit: 50 }, // Unbalanced
      ],
    }

    const result = validateJournalEntry(entry)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(1)
  })
})

describe('calculateAccountBalance', () => {
  it('should calculate asset account balance correctly', () => {
    const balance = calculateAccountBalance('asset', 1000, 300)
    expect(balance).toBe(700)
  })

  it('should calculate expense account balance correctly', () => {
    const balance = calculateAccountBalance('expense', 500, 100)
    expect(balance).toBe(400)
  })

  it('should calculate liability account balance correctly', () => {
    const balance = calculateAccountBalance('liability', 200, 1000)
    expect(balance).toBe(800)
  })

  it('should calculate equity account balance correctly', () => {
    const balance = calculateAccountBalance('equity', 100, 5000)
    expect(balance).toBe(4900)
  })

  it('should calculate revenue account balance correctly', () => {
    const balance = calculateAccountBalance('revenue', 50, 10000)
    expect(balance).toBe(9950)
  })

  it('should handle zero balances', () => {
    const balance = calculateAccountBalance('asset', 0, 0)
    expect(balance).toBe(0)
  })
})

describe('validateAccountingEquation', () => {
  it('should validate balanced equation', () => {
    const balances = {
      assets: 10000,
      liabilities: 4000,
      equity: 6000,
    }

    const result = validateAccountingEquation(balances)
    expect(result.isValid).toBe(true)
    expect(result.leftSide).toBe(10000)
    expect(result.rightSide).toBe(10000)
    expect(result.difference).toBe(0)
  })

  it('should reject unbalanced equation', () => {
    const balances = {
      assets: 10000,
      liabilities: 4000,
      equity: 5000, // Should be 6000
    }

    const result = validateAccountingEquation(balances)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('does not balance')
    expect(result.leftSide).toBe(10000)
    expect(result.rightSide).toBe(9000)
    expect(result.difference).toBe(1000)
  })

  it('should handle floating point precision', () => {
    const balances = {
      assets: 0.1 + 0.2, // 0.30000000000000004
      liabilities: 0.2,
      equity: 0.1,
    }

    const result = validateAccountingEquation(balances)
    expect(result.isValid).toBe(true)
  })

  it('should handle negative equity (deficit)', () => {
    const balances = {
      assets: 1000,
      liabilities: 2000,
      equity: -1000, // Deficit
    }

    const result = validateAccountingEquation(balances)
    expect(result.isValid).toBe(true)
    expect(result.leftSide).toBe(1000)
    expect(result.rightSide).toBe(1000)
  })
})
