/**
 * HR Module Actions - Index
 * Export all HR-related server actions
 */

// Employee Actions
export {
  createEmployee,
  updateEmployee,
  getEmployee,
  listEmployees,
  updateEmployeeStatus,
  createDepartment,
  listDepartments,
  createDesignation,
  listDesignations,
  createBranch,
  listBranches,
  createEmployeeGrade,
  listEmployeeGrades,
  createEmploymentType,
  listEmploymentTypes,
  addEmployeeEducation,
  addEmployeeWorkExperience,
  addEmployeeDependent,
} from './employee.actions';

// Payroll Actions
export {
  createPayrollEntry,
  getPayrollEntry,
  createSalarySlips,
  submitPayrollEntry,
  getSalarySlip,
  generatePayslip,
  listSalarySlips,
  listPayrollEntries,
  createPayrollPeriod,
  listPayrollPeriods,
  listSalaryComponents,
  getEmployeesForPayroll,
  getYTDEarnings,
  getWorkingDays,
  calculatePeriodHolidayPay,
  getHolidaysInRange,
  createBulkPayrollEntries,
  processBulkPayroll,
  cancelPayrollEntry,
} from './payroll.actions';

// Leave Actions
export {
  createLeaveType,
  listLeaveTypes,
  getLeaveType,
  createLeaveApplication,
  approveLeaveApplication,
  rejectLeaveApplication,
  cancelLeaveApplication,
  listLeaveApplications,
  getLeaveApplication,
  createLeaveAllocation,
  listLeaveAllocations,
  getLeaveBalance,
  getAllLeaveBalances,
  bulkAllocateLeaves,
  getLeaveSummary,
} from './leave.actions';

// Re-export types
export type { ActionResult } from './employee.actions';
