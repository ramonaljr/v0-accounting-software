/**
 * Payroll Service
 * Re-exports from payroll subdirectory for backwards compatibility
 *
 * @deprecated Import from '@/lib/services/hr/payroll' instead
 * This file is maintained for backwards compatibility only.
 * New code should import directly from the payroll subdirectory.
 */

export {
  PayrollService,
  PayrollEntryService,
  SalarySlipService,
  PayrollCalculationService,
  HolidayPayService,
  mapDbToPayrollEntry,
  mapDbToSalarySlip,
  mapDbToSalarySlipEarning,
  mapDbToSalarySlipDeduction,
  mapDbToSalaryStructure,
} from './payroll';

export type {
  AttendanceSummary,
  PayrollEmployee,
  HolidayPayResult,
  HolidayData,
  PeriodHolidayPayResult,
  YtdEarningsResult,
  PayrollEntryRow,
  SalarySlipRow,
} from './payroll';
