/**
 * Ledger Validation Functions
 * Core accounting validation logic for double-entry bookkeeping
 */

export interface JournalEntryLine {
  account_id: string
  debit: number
  credit: number
  description?: string
}

export interface JournalEntry {
  id?: string
  entry_date: Date
  description: string
  lines: JournalEntryLine[]
}

/**
 * Validates that debits equal credits in a journal entry
 * Core accounting principle: sum(debits) must equal sum(credits)
 */
export function validateBalancedEntry(entry: JournalEntry): {
  isValid: boolean
  error?: string
  debitTotal: number
  creditTotal: number
  difference: number
} {
  const debitTotal = entry.lines.reduce((sum, line) => sum + line.debit, 0)
  const creditTotal = entry.lines.reduce((sum, line) => sum + line.credit, 0)
  const difference = Math.abs(debitTotal - creditTotal)

  // Allow for floating point precision errors (0.01 cents tolerance)
  const tolerance = 0.01
  const isValid = difference < tolerance

  return {
    isValid,
    error: isValid ? undefined : `Entry is out of balance: debits=${debitTotal}, credits=${creditTotal}, difference=${difference}`,
    debitTotal,
    creditTotal,
    difference,
  }
}

/**
 * Validates that each line has either a debit OR a credit (not both, not neither)
 */
export function validateLineItems(lines: JournalEntryLine[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (lines.length === 0) {
    errors.push('Journal entry must have at least one line')
  }

  if (lines.length === 1) {
    errors.push('Journal entry must have at least two lines for double-entry')
  }

  lines.forEach((line, index) => {
    const hasDebit = line.debit > 0
    const hasCredit = line.credit > 0

    if (hasDebit && hasCredit) {
      errors.push(`Line ${index + 1}: Cannot have both debit and credit`)
    }

    if (!hasDebit && !hasCredit) {
      errors.push(`Line ${index + 1}: Must have either a debit or credit`)
    }

    if (line.debit < 0 || line.credit < 0) {
      errors.push(`Line ${index + 1}: Debit and credit amounts must be non-negative`)
    }

    if (!line.account_id) {
      errors.push(`Line ${index + 1}: Account ID is required`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validates a complete journal entry
 */
export function validateJournalEntry(entry: JournalEntry): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate description
  if (!entry.description || entry.description.trim() === '') {
    errors.push('Description is required')
  }

  // Validate date
  if (!entry.entry_date || !(entry.entry_date instanceof Date)) {
    errors.push('Valid entry date is required')
  }

  // Validate lines
  const lineValidation = validateLineItems(entry.lines)
  if (!lineValidation.isValid) {
    errors.push(...lineValidation.errors)
  }

  // Validate balance
  const balanceValidation = validateBalancedEntry(entry)
  if (!balanceValidation.isValid && balanceValidation.error) {
    errors.push(balanceValidation.error)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Calculates account balance based on account type
 * Assets and Expenses: Debit increases, Credit decreases
 * Liabilities, Equity, Revenue: Credit increases, Debit decreases
 */
export function calculateAccountBalance(
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
  debits: number,
  credits: number
): number {
  switch (accountType) {
    case 'asset':
    case 'expense':
      return debits - credits
    case 'liability':
    case 'equity':
    case 'revenue':
      return credits - debits
    default:
      throw new Error(`Unknown account type: ${accountType}`)
  }
}

/**
 * Validates that the accounting equation holds:
 * Assets = Liabilities + Equity
 */
export function validateAccountingEquation(balances: {
  assets: number
  liabilities: number
  equity: number
}): {
  isValid: boolean
  error?: string
  leftSide: number
  rightSide: number
  difference: number
} {
  const leftSide = balances.assets
  const rightSide = balances.liabilities + balances.equity
  const difference = Math.abs(leftSide - rightSide)

  // Allow for floating point precision errors
  const tolerance = 0.01
  const isValid = difference < tolerance

  return {
    isValid,
    error: isValid ? undefined : `Accounting equation does not balance: Assets=${leftSide}, Liabilities+Equity=${rightSide}`,
    leftSide,
    rightSide,
    difference,
  }
}
