/**
 * Payroll Services
 * Re-exports all payroll-related services for backwards compatibility
 */

import { PayrollEntryService } from './payroll-entry.service';
import { SalarySlipService } from './salary-slip.service';
import { PayrollCalculationService } from './payroll-calculation.service';
import { HolidayPayService } from './holiday-pay.service';

// Export individual services
export { PayrollEntryService } from './payroll-entry.service';
export { SalarySlipService } from './salary-slip.service';
export { PayrollCalculationService } from './payroll-calculation.service';
export { HolidayPayService } from './holiday-pay.service';

// Export types
export * from './types';

// Export mappers for use in other services
export {
  mapDbToPayrollEntry,
  mapDbToSalarySlip,
  mapDbToSalarySlipEarning,
  mapDbToSalarySlipDeduction,
  mapDbToSalaryStructure,
} from './mappers';

// Re-export HrError from statutory service for convenience
export { HrError } from '../statutory-ph.service';

/**
 * PayrollService - Facade for backwards compatibility
 * Delegates to specialized sub-services
 */
export class PayrollService {
  // Payroll Entry methods
  static createPayrollEntry = PayrollEntryService.createPayrollEntry;
  static getPayrollEntryById = PayrollEntryService.getPayrollEntryById;
  static getEmployeesForPayroll = PayrollEntryService.getEmployeesForPayroll;
  static submitPayrollEntry = PayrollEntryService.submitPayrollEntry;

  // Salary Slip methods
  static createSalarySlips = SalarySlipService.createSalarySlips;
  static createSalarySlip = SalarySlipService.createSalarySlip;
  static getSalarySlipById = SalarySlipService.getSalarySlipById;
  static generatePayslip = SalarySlipService.generatePayslip;

  // Calculation methods
  static calculateSalary = PayrollCalculationService.calculateSalary;
  static getYTDEarnings = PayrollCalculationService.getYTDEarnings;
  static getWorkingDays = PayrollCalculationService.getWorkingDays;

  // Holiday Pay methods
  static computeHolidayPay = HolidayPayService.computeHolidayPay;
  static getHolidaysInRange = HolidayPayService.getHolidaysInRange;
  static calculatePeriodHolidayPay = HolidayPayService.calculatePeriodHolidayPay;
}
