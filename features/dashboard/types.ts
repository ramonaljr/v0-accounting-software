/**
 * Dashboard Types
 * Centralized TypeScript interfaces for dashboard tiles, metrics, and configuration
 */

// =====================================================
// CORE METRIC TYPES
// =====================================================

export interface MoneyAmount {
  amount: number;
  currency?: string;
}

export interface TrendData {
  period: string;
  amount: number;
  label?: string;
}

export interface AgingBucket {
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
}

// =====================================================
// DASHBOARD FILTER & CONTEXT TYPES
// =====================================================

export type AccountingBasis = 'accrual' | 'cash';

export interface DashboardFilters {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  basis: AccountingBasis;
  currency?: string;
  classId?: string; // Dimension filter
  locationId?: string; // Dimension filter
  departmentId?: string; // Dimension filter
}

export interface DashboardPeriod {
  label: string;
  startDate: string;
  endDate: string;
}

// =====================================================
// TILE METRIC INTERFACES
// =====================================================

export interface RevenueMetrics {
  mtd: number;
  ytd: number;
  trend: TrendData[];
  priorPeriodMtd?: number;
  growth?: number; // Percentage
}

export interface ExpenseMetrics {
  mtd: number;
  ytd: number;
  trend: TrendData[];
  byCategory: Array<{
    category: string;
    categoryId?: string;
    amount: number;
    percentage: number;
  }>;
  priorPeriodMtd?: number;
}

export interface NetIncomeMetrics {
  mtd: number;
  ytd: number;
  margin?: number; // Percentage
  priorPeriodMtd?: number;
}

export interface ARMetrics {
  total: number;
  overdue: number;
  aging: AgingBucket;
  customersCount: number;
  dso?: number; // Days Sales Outstanding
}

export interface APMetrics {
  total: number;
  overdue: number;
  aging: AgingBucket;
  vendorsCount: number;
  dpo?: number; // Days Payable Outstanding
}

export interface InvoiceMetrics {
  draft: number;
  sent: number;
  overdue: number;
  paid: number;
  totalDraft: number;
  totalSent: number;
  totalOverdue: number;
}

export interface BillMetrics {
  open: number;
  overdue: number;
  paid30Days: number;
  total: number;
  nextDueDate?: string;
  nextDueAmount?: number;
}

export interface BankAccountSummary {
  id: string;
  name: string;
  balance: number;
  currency: string;
  lastSync: string;
  status: 'connected' | 'error' | 'syncing' | 'disconnected';
  forReviewCount?: number;
  varianceToBank?: number;
}

export interface TaxMetrics {
  salesTax: {
    collected: number;
    due: number;
    nextFilingDate: string;
    jurisdiction?: string;
  };
  payrollTax: {
    due: number;
    nextFilingDate: string;
  };
  incomeTax: {
    estimated: number;
    paid: number;
    nextQuarterDate?: string;
  };
}

export interface CashFlowMetrics {
  moneyIn: number;
  moneyOut: number;
  netCashFlow: number;
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  endingCash?: number;
}

export interface BalanceSheetSnapshot {
  assets: number;
  liabilities: number;
  equity: number;
  workingCapital: number;
  asOfDate: string;
}

export interface KPIMetrics {
  grossMarginPercent?: number;
  netMarginPercent?: number;
  currentRatio?: number;
  quickRatio?: number;
  debtToEquity?: number;
  dso?: number;
  dpo?: number;
  inventoryTurnover?: number;
  daysOnHand?: number;
  roa?: number; // Return on Assets
  roe?: number; // Return on Equity
}

export interface ReconciliationProgress {
  percentReconciled: number;
  totalAccounts: number;
  reconciledAccounts: number;
  unreconciledCount: number;
  exceptions: number;
  lastReconcileDate?: string;
}

// =====================================================
// FULL DASHBOARD METRICS INTERFACE
// =====================================================

export interface StatusBarMetrics {
  purchaseOrders: number;
  overdue: number;
  openBills: number;
  paidLast30Days: number;
}

export interface ToDepositMetrics {
  totalAmount: number;
  itemCount: number;
  oldestDate?: string;
  byPaymentMethod?: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
}

export interface UnbilledMetrics {
  totalAmount: number;
  timeAmount: number;
  timeHours: number;
  expenseAmount: number;
  expenseCount: number;
  byClient?: Array<{
    clientName: string;
    amount: number;
  }>;
}

export interface EstimatesMetrics {
  totalValue: number;
  count: number;
  acceptedCount: number;
  acceptedValue: number;
  conversionRate: number;
  expiringCount?: number;
  byStatus?: Array<{
    status: string;
    count: number;
    value: number;
  }>;
}

export interface DashboardMetrics {
  statusBars?: StatusBarMetrics;
  revenue: RevenueMetrics;
  expenses: ExpenseMetrics;
  netIncome: NetIncomeMetrics;
  ar: ARMetrics;
  ap: APMetrics;
  invoices: InvoiceMetrics;
  bills: BillMetrics;
  bankAccounts: BankAccountSummary[];
  taxes: TaxMetrics;
  cashFlow: CashFlowMetrics;
  balanceSheet?: BalanceSheetSnapshot;
  kpis?: KPIMetrics;
  reconciliation?: ReconciliationProgress;
  toDeposit?: ToDepositMetrics;
  unbilled?: UnbilledMetrics;
  estimates?: EstimatesMetrics;
}

// =====================================================
// WIDGET CONFIGURATION TYPES
// =====================================================

export type WidgetType =
  // Core Financial Tiles
  | 'bank_accounts'
  | 'ar_summary'
  | 'ap_summary'
  | 'profit_loss'
  | 'sales_trend'
  | 'expenses'
  | 'cash_flow'
  | 'taxes'
  | 'balance_sheet'
  | 'reconciliation'
  | 'kpis'
  | 'working_capital'
  // Operations Tiles
  | 'quick_actions'
  | 'alerts'
  | 'favorites'
  | 'inventory'
  | 'to_deposit'
  | 'unbilled'
  | 'estimates'
  | 'collections'
  // AI & Automation Tiles
  | 'ai_insights'
  | 'ai_copilot'
  | 'automation_center'
  | 'agent_performance'
  | 'review_queue'
  | 'collections_automation'
  | 'close_assistant'
  | 'tax_ai'
  // Accounting Module Tiles
  | 'fixed_assets'
  | 'revenue_recognition'
  | 'integration_health'
  | 'receipts_inbox'
  | 'bank_rules'
  | 'recurring_transactions'
  | 'gl_integrity'
  | 'audit_log'
  // Expense & Bill Tiles
  | 'bill_payments'
  | 'compliance_1099'
  | 'mileage'
  | 'top_vendors'
  // Sales & Payment Tiles
  | 'payment_links'
  | 'sales_orders'
  | 'sales_channels'
  | 'payouts'
  | 'catalog_health'
  // Customer Hub Tiles
  | 'contracts'
  | 'appointments'
  | 'reviews'
  // Payroll Tiles
  | 'payroll_tasks'
  | 'payroll_compliance'
  // Time & Projects Tiles
  | 'time_tracking'
  | 'projects'
  // Misc Tiles
  | 'whats_new'
  | 'scenario_manager'
  | 'my_accountant';

export interface WidgetPosition {
  row: number;
  column: number;
  width: number; // Grid columns (1-12)
  height: number; // Grid rows
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  isVisible: boolean;
  config?: Record<string, any>; // Widget-specific configuration
  refreshInterval?: number; // Seconds
}

export interface DashboardLayout {
  userId?: string; // null for org-wide preset
  orgId: string;
  widgets: WidgetConfig[];
  updatedAt: string;
}

export interface WidgetDragItem {
  id: string;
  type: WidgetType;
  currentRow: number;
  currentColumn: number;
}

export interface LayoutRow {
  row: number;
  widgets: WidgetConfig[];
}

// =====================================================
// FEATURE GATING TYPES
// =====================================================

export interface FeatureFlags {
  inventory: boolean;
  payroll: boolean;
  projects: boolean;
  multiCurrency: boolean;
  advancedReporting: boolean;
  aiInsights: boolean;
  [key: string]: boolean;
}

export interface UserRole {
  role: 'owner' | 'admin' | 'accountant' | 'staff' | 'viewer';
  permissions: string[];
}

// =====================================================
// PRESET TYPES
// =====================================================

export type PresetRole = 'owner' | 'admin' | 'accountant' | 'staff' | 'viewer';
export type IndustryType = 'general' | 'retail' | 'service' | 'manufacturing' | 'ecommerce' | 'nonprofit';

export interface DashboardPreset {
  id: string;
  name: string;
  role?: PresetRole;
  industry?: IndustryType;
  widgets: Omit<WidgetConfig, 'id'>[];
}

// =====================================================
// TILE RESPONSE WRAPPER
// =====================================================

export interface TileData<T = any> {
  data: T;
  isLoading: boolean;
  error?: string;
  lastRefreshed?: string;
  tieOutUrl?: string; // URL to detailed report with same filters
}

// =====================================================
// AI AGENT TYPES
// =====================================================

export interface AIInsight {
  id: string;
  agentType: 'variance' | 'anomaly' | 'forecast' | 'suggestion';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  confidence: number; // 0-1
  actionUrl?: string;
  whyLink?: string; // Link to explanation
  createdAt: string;
}

export interface AgentAction {
  id: string;
  agentName: string;
  action: string;
  status: 'pending' | 'approved' | 'rejected';
  confidence: number;
  reasoning: string;
  createdAt: string;
}
