/**
 * Dashboard Widget Registry
 * Central registry mapping widget types to components and metadata
 */

import type { WidgetType, WidgetConfig } from './types';

export interface WidgetMetadata {
  type: WidgetType;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'financial' | 'operations' | 'ai' | 'actions' | 'banking';
  defaultWidth: number; // Grid columns (1-12)
  defaultHeight: number; // Grid rows
  minWidth?: number;
  minHeight?: number;
  requiredFeatures?: string[]; // Feature flags required
  requiredRoles?: string[]; // Minimum role required
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetMetadata> = {
  bank_accounts: {
    type: 'bank_accounts',
    title: 'Bank Accounts',
    description: 'View balances and transactions across all bank accounts',
    icon: 'Building2',
    category: 'banking',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  ar_summary: {
    type: 'ar_summary',
    title: 'Accounts Receivable',
    description: 'AR aging, DSO, and customer receivables',
    icon: 'Receipt',
    category: 'financial',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  ap_summary: {
    type: 'ap_summary',
    title: 'Accounts Payable',
    description: 'AP aging, DPO, and vendor payables',
    icon: 'FileText',
    category: 'financial',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  profit_loss: {
    type: 'profit_loss',
    title: 'Profit & Loss',
    description: 'Revenue, expenses, and net income trends',
    icon: 'TrendingUp',
    category: 'financial',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  sales_trend: {
    type: 'sales_trend',
    title: 'Sales Trend',
    description: 'Revenue trends over time',
    icon: 'LineChart',
    category: 'financial',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  expenses: {
    type: 'expenses',
    title: 'Expenses',
    description: 'Expense breakdown by category',
    icon: 'Wallet',
    category: 'financial',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  cash_flow: {
    type: 'cash_flow',
    title: 'Cash Flow',
    description: 'Cash inflows, outflows, and net cash position',
    icon: 'Waves',
    category: 'financial',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  taxes: {
    type: 'taxes',
    title: 'Taxes',
    description: 'Tax liabilities and filing deadlines',
    icon: 'FileBarChart',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  balance_sheet: {
    type: 'balance_sheet',
    title: 'Balance Sheet',
    description: 'Assets, liabilities, equity snapshot',
    icon: 'Scale',
    category: 'financial',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  reconciliation: {
    type: 'reconciliation',
    title: 'Reconciliation',
    description: 'Reconciliation progress and exceptions',
    icon: 'CheckCircle',
    category: 'banking',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  kpis: {
    type: 'kpis',
    title: 'Key Performance Indicators',
    description: 'Financial ratios and benchmarks',
    icon: 'BarChart3',
    category: 'financial',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  working_capital: {
    type: 'working_capital',
    title: 'Working Capital',
    description: 'Current assets and liabilities breakdown',
    icon: 'Coins',
    category: 'financial',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  quick_actions: {
    type: 'quick_actions',
    title: 'Quick Actions',
    description: 'Common accounting workflows',
    icon: 'Zap',
    category: 'actions',
    defaultWidth: 12,
    defaultHeight: 1,
  },
  alerts: {
    type: 'alerts',
    title: 'Alerts & Tasks',
    description: 'Important alerts and close checklist',
    icon: 'Bell',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  favorites: {
    type: 'favorites',
    title: 'Favorites & Recent',
    description: 'Quick access to favorite reports',
    icon: 'Star',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  inventory: {
    type: 'inventory',
    title: 'Inventory Health',
    description: 'Stock levels, best sellers, slow movers',
    icon: 'Package',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
    requiredFeatures: ['inventory'],
  },
  to_deposit: {
    type: 'to_deposit',
    title: 'To Deposit',
    description: 'Undeposited funds ready for deposit',
    icon: 'Download',
    category: 'banking',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  unbilled: {
    type: 'unbilled',
    title: 'Unbilled Time & Expenses',
    description: 'Unbilled items ready to invoice',
    icon: 'Clock',
    category: 'operations',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  estimates: {
    type: 'estimates',
    title: 'Estimates Pending',
    description: 'Pending estimates and quotes',
    icon: 'FileEdit',
    category: 'operations',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  collections: {
    type: 'collections',
    title: 'Collections',
    description: 'At-risk customers and collections automation',
    icon: 'UserCheck',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  ai_insights: {
    type: 'ai_insights' as WidgetType,
    title: 'AI Insights',
    description: 'AI-powered insights and recommendations',
    icon: 'Sparkles',
    category: 'ai',
    defaultWidth: 6,
    defaultHeight: 1,
    requiredFeatures: ['aiInsights'],
  },
  // AI & Automation Tiles
  ai_copilot: {
    type: 'ai_copilot',
    title: 'AI Co-Pilot',
    description: 'Natural language accounting assistant',
    icon: 'Bot',
    category: 'ai',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  automation_center: {
    type: 'automation_center',
    title: 'Automation Center',
    description: 'Automation coverage and status',
    icon: 'Settings2',
    category: 'ai',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  agent_performance: {
    type: 'agent_performance',
    title: 'Agent Performance',
    description: 'AI agent metrics and accuracy',
    icon: 'Activity',
    category: 'ai',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  review_queue: {
    type: 'review_queue',
    title: 'Review Queue',
    description: 'Pending AI actions for approval',
    icon: 'ListChecks',
    category: 'ai',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  collections_automation: {
    type: 'collections_automation',
    title: 'Collections Automation',
    description: 'Automated payment reminders and dunning',
    icon: 'UserCheck',
    category: 'ai',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  close_assistant: {
    type: 'close_assistant',
    title: 'Month-End Close Assistant',
    description: 'AI-guided close checklist',
    icon: 'Calendar',
    category: 'ai',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  tax_ai: {
    type: 'tax_ai',
    title: 'Tax AI Forecaster',
    description: 'Tax liability predictions and anomalies',
    icon: 'Calculator',
    category: 'ai',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  // Accounting Module Tiles
  fixed_assets: {
    type: 'fixed_assets',
    title: 'Fixed Assets',
    description: 'Asset register and depreciation',
    icon: 'Building',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  revenue_recognition: {
    type: 'revenue_recognition',
    title: 'Revenue Recognition',
    description: 'Deferred revenue and recognition schedules',
    icon: 'TrendingUp',
    category: 'financial',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  integration_health: {
    type: 'integration_health',
    title: 'Integration Health',
    description: 'Sync status and connector health',
    icon: 'Link',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  receipts_inbox: {
    type: 'receipts_inbox',
    title: 'Receipts Inbox',
    description: 'OCR processing and receipt review',
    icon: 'Camera',
    category: 'operations',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  bank_rules: {
    type: 'bank_rules',
    title: 'Bank Rules Health',
    description: 'Auto-categorization coverage',
    icon: 'Filter',
    category: 'banking',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  recurring_transactions: {
    type: 'recurring_transactions',
    title: 'Recurring Transactions',
    description: 'Scheduled postings and failures',
    icon: 'RefreshCw',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  gl_integrity: {
    type: 'gl_integrity',
    title: 'GL Integrity',
    description: 'General ledger health checks',
    icon: 'ShieldCheck',
    category: 'financial',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  audit_log: {
    type: 'audit_log',
    title: 'Audit & Security',
    description: 'Recent activity and security alerts',
    icon: 'Shield',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  // Expense & Bill Tiles
  bill_payments: {
    type: 'bill_payments',
    title: 'Bill Payments',
    description: 'Scheduled payments this week',
    icon: 'CreditCard',
    category: 'financial',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  compliance_1099: {
    type: 'compliance_1099',
    title: '1099 Compliance',
    description: 'Filing readiness and missing W-9s',
    icon: 'FileBarChart',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  mileage: {
    type: 'mileage',
    title: 'Mileage Tracking',
    description: 'Miles and reimbursements',
    icon: 'Car',
    category: 'operations',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  top_vendors: {
    type: 'top_vendors',
    title: 'Top Vendors',
    description: 'Top vendors by spend',
    icon: 'Users',
    category: 'financial',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  // Sales & Payment Tiles
  payment_links: {
    type: 'payment_links',
    title: 'Payment Links & Recurring',
    description: 'Active links and MRR',
    icon: 'Link2',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  sales_orders: {
    type: 'sales_orders',
    title: 'Sales Orders',
    description: 'Open orders and aging',
    icon: 'ShoppingCart',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  sales_channels: {
    type: 'sales_channels',
    title: 'Sales Channels',
    description: 'Channel health and attribution',
    icon: 'Store',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  payouts: {
    type: 'payouts',
    title: 'Upcoming Payouts',
    description: 'Platform payouts and exceptions',
    icon: 'DollarSign',
    category: 'banking',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  catalog_health: {
    type: 'catalog_health',
    title: 'Product Catalog Health',
    description: 'Inactive items and stock levels',
    icon: 'Package2',
    category: 'operations',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  // Customer Hub Tiles
  contracts: {
    type: 'contracts',
    title: 'Contracts Expiring',
    description: 'Contracts expiring soon',
    icon: 'FileSignature',
    category: 'operations',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  appointments: {
    type: 'appointments',
    title: 'Appointments',
    description: 'Upcoming appointments',
    icon: 'CalendarCheck',
    category: 'operations',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  reviews: {
    type: 'reviews',
    title: 'Customer Reviews',
    description: 'Recent reviews and ratings',
    icon: 'Star',
    category: 'operations',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  // Payroll Tiles
  payroll_tasks: {
    type: 'payroll_tasks',
    title: 'Payroll Tasks',
    description: 'Next pay date and liabilities',
    icon: 'Users2',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
    requiredFeatures: ['payroll'],
  },
  payroll_compliance: {
    type: 'payroll_compliance',
    title: 'Payroll Compliance',
    description: 'Filings due and discrepancies',
    icon: 'AlertTriangle',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
    requiredFeatures: ['payroll'],
  },
  // Time & Projects Tiles
  time_tracking: {
    type: 'time_tracking',
    title: 'Time Tracking',
    description: 'Unapproved time and unbilled hours',
    icon: 'Clock',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  projects: {
    type: 'projects',
    title: 'Projects',
    description: 'Project profitability and budget',
    icon: 'Briefcase',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  // Misc Tiles
  whats_new: {
    type: 'whats_new',
    title: "What's New",
    description: 'Latest features and tips',
    icon: 'Lightbulb',
    category: 'operations',
    defaultWidth: 4,
    defaultHeight: 1,
  },
  scenario_manager: {
    type: 'scenario_manager',
    title: 'Scenario Manager',
    description: 'What-if analysis and planning',
    icon: 'GitBranch',
    category: 'financial',
    defaultWidth: 6,
    defaultHeight: 1,
  },
  my_accountant: {
    type: 'my_accountant',
    title: 'My Accountant',
    description: 'Quick access to expert help',
    icon: 'HeadphonesIcon',
    category: 'operations',
    defaultWidth: 4,
    defaultHeight: 1,
  },
};

/**
 * Get widget metadata by type
 */
export function getWidgetMetadata(type: WidgetType): WidgetMetadata | undefined {
  return WIDGET_REGISTRY[type];
}

/**
 * Get all available widgets filtered by features and role
 */
export function getAvailableWidgets(
  features: Record<string, boolean> = {},
  role: string = 'viewer'
): WidgetMetadata[] {
  const roleHierarchy: Record<string, number> = {
    owner: 5,
    admin: 4,
    accountant: 3,
    staff: 2,
    viewer: 1,
  };

  const userLevel = roleHierarchy[role] || 1;

  return Object.values(WIDGET_REGISTRY).filter((widget) => {
    // Check feature flags
    if (widget.requiredFeatures) {
      const hasAllFeatures = widget.requiredFeatures.every((feature) => features[feature]);
      if (!hasAllFeatures) return false;
    }

    // Check role permissions
    if (widget.requiredRoles) {
      const minLevel = Math.min(
        ...widget.requiredRoles.map((r) => roleHierarchy[r] || 1)
      );
      if (userLevel < minLevel) return false;
    }

    return true;
  });
}

/**
 * Create default widget configuration
 */
export function createDefaultWidget(
  type: WidgetType,
  row: number,
  column: number
): WidgetConfig {
  const metadata = getWidgetMetadata(type);
  if (!metadata) {
    throw new Error(`Unknown widget type: ${type}`);
  }

  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: metadata.title,
    position: {
      row,
      column,
      width: metadata.defaultWidth,
      height: metadata.defaultHeight,
    },
    isVisible: true,
  };
}

/**
 * Get widgets by category
 */
export function getWidgetsByCategory(category: WidgetMetadata['category']): WidgetMetadata[] {
  return Object.values(WIDGET_REGISTRY).filter((widget) => widget.category === category);
}
