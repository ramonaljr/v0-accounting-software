/**
 * Fiscal Year Model
 * Based on ERPNext's Fiscal Year DocType
 */

import { z } from 'zod';

// Fiscal Year schema
export const FiscalYearSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  yearName: z.string().min(1).max(20),      // e.g., "2024", "2024-25"
  yearStartDate: z.date(),
  yearEndDate: z.date(),

  isClosed: z.boolean().default(false),
  autoCreated: z.boolean().default(false),

  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid().optional(),
}).refine(
  (data) => data.yearEndDate > data.yearStartDate,
  { message: 'End date must be after start date' }
);

export type FiscalYear = z.infer<typeof FiscalYearSchema>;

// Create schema
export const CreateFiscalYearSchema = FiscalYearSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateFiscalYear = z.infer<typeof CreateFiscalYearSchema>;

// Accounting Period status
export const AccountingPeriodStatus = z.enum(['open', 'closed', 'locked']);
export type AccountingPeriodStatus = z.infer<typeof AccountingPeriodStatus>;

// Accounting Period schema (monthly/quarterly)
export const AccountingPeriodSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  fiscalYearId: z.string().uuid(),

  periodName: z.string().min(1).max(50),    // e.g., "January 2024", "Q1 2024"
  startDate: z.date(),
  endDate: z.date(),

  status: AccountingPeriodStatus.default('open'),
  closedAt: z.date().optional(),
  closedBy: z.string().uuid().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: 'End date must be on or after start date' }
);

export type AccountingPeriod = z.infer<typeof AccountingPeriodSchema>;

// Helper to generate fiscal year name
export function generateFiscalYearName(startDate: Date, endDate: Date): string {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    return startYear.toString();
  }

  return `${startYear}-${endYear.toString().slice(-2)}`;
}

// Helper to generate monthly periods for a fiscal year
export function generateMonthlyPeriods(
  fiscalYear: FiscalYear
): Omit<AccountingPeriod, 'id' | 'createdAt' | 'updatedAt'>[] {
  const periods: Omit<AccountingPeriod, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const current = new Date(fiscalYear.yearStartDate);

  while (current < fiscalYear.yearEndDate) {
    const monthStart = new Date(current);
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

    // Don't exceed fiscal year end
    const periodEnd = monthEnd > fiscalYear.yearEndDate
      ? new Date(fiscalYear.yearEndDate)
      : monthEnd;

    const monthName = monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    periods.push({
      orgId: fiscalYear.orgId,
      fiscalYearId: fiscalYear.id,
      periodName: monthName,
      startDate: monthStart,
      endDate: periodEnd,
      status: 'open',
    });

    // Move to next month
    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
  }

  return periods;
}

// Helper to check if a date falls within a fiscal year
export function isDateInFiscalYear(date: Date, fiscalYear: FiscalYear): boolean {
  return date >= fiscalYear.yearStartDate && date <= fiscalYear.yearEndDate;
}
