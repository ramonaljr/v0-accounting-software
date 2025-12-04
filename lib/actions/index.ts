/**
 * Server Actions - Barrel Export
 *
 * Central export point for all server actions.
 * Import from '@/lib/actions' to access any action.
 *
 * NOTE: ActionResult types are defined in each module. For the canonical
 * type, import from '@/lib/actions/types' or '@/hooks'.
 *
 * @example
 * import { createEmployee, listBills, createWorkOrder } from '@/lib/actions';
 * import type { ActionResult } from '@/lib/actions/types';
 */

// Common types (canonical definitions)
export type {
  ActionResult,
  PaginatedResult,
  PaginatedActionResult,
  ValidationError,
  ValidatedActionResult,
  BulkOperationResult,
} from './types';

// Banking actions
export {
  listBankAccounts,
  getBankAccount,
  createBankAccount,
  listBankTransactions,
  getBankTransaction,
  createBankTransaction,
  categorizeBankTransaction,
  reconcileBankTransaction,
  ignoreBankTransaction,
  getBankTransactionStats,
} from './banking';

// Human Resources actions - Employee
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
} from './hr/employee.actions';

// Human Resources actions - Leave
export {
  createLeaveType,
  listLeaveTypes,
  getLeaveType,
  createLeaveApplication,
  approveLeaveApplication,
  rejectLeaveApplication,
  cancelLeaveApplication,
  getLeaveApplication,
  listLeaveApplications,
  getLeaveSummary,
} from './hr/leave.actions';

// Human Resources actions - Payroll
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
} from './hr/payroll.actions';

// Manufacturing actions
export {
  listBoms,
  getBom,
  createBom,
  calculateBomCost,
  getBomById,
  submitBom,
  setDefaultBom,
  cancelBom,
  listWorkOrders,
  getWorkOrder,
  createWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  cancelWorkOrder,
  listJobCards,
  startJobCard,
  completeJobCard,
  listProductionPlans,
  createProductionPlan,
  generateWorkOrdersFromPlan,
} from './manufacturing';

// Accounts Payable actions
export {
  listSuppliers,
  getSupplier,
  createSupplier,
  listBills,
  getBill,
  createBill,
  submitBill,
  cancelBill,
  getBillStats,
} from './payable';

// Stock/Inventory actions
export {
  listItems,
  getItem,
  createItem,
  updateItem,
  getLowStockItems,
  listItemGroups,
  listUoms,
  listWarehouses,
  createWarehouse,
  getWarehouseStock,
  createStockEntry,
  listStockEntries,
  submitStockEntry,
  cancelStockEntry,
  getStockBalance,
  getStockLedger,
  getInventoryValuation,
} from './stock';
