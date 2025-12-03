/**
 * HR Services Index
 * Re-exports all HR/Payroll-related services
 */

// Employee Management Service
export { EmployeeService, employeeService } from './employee.service';

// Payroll Processing Service
export { PayrollService } from './payroll.service';

// Leave and Attendance Service
export { LeaveService } from './leave.service';

// Philippines Statutory Deductions Service
export { PhStatutoryService } from './statutory-ph.service';

// Salary Structure Service
export { SalaryStructureService } from './salary-structure.service';

// 13th Month Pay Service
export { ThirteenthMonthService } from './thirteenth-month.service';

// Loan Service
export { LoanService } from './loan.service';

// Re-export types
export type {
  SalaryComponent,
  SalaryStructure,
  SalaryStructureEarning,
  SalaryStructureDeduction,
  SalaryStructureAssignment,
  CreateSalaryComponent,
  CreateSalaryStructure,
  CreateSalaryStructureAssignment,
} from './salary-structure.service';

export type {
  ThirteenthMonthComputation,
  ThirteenthMonthBatch,
  ComputationOptions,
} from './thirteenth-month.service';

export type {
  EmployeeLoan,
  LoanRepayment,
  LoanDeductionSchedule,
  CreateLoan,
  LoanType,
  LoanStatus,
} from './loan.service';
