/**
 * Widget Renderer
 * Maps widget types to actual tile components
 */

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Link2, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { ARTile } from '@/components/dashboard/ar-tile';
import { APTile } from '@/components/dashboard/ap-tile';
import { ReconciliationTile } from '@/components/dashboard/reconciliation-tile';
import { BalanceSheetTile } from '@/components/dashboard/balance-sheet-tile';
import { KPIsTile } from '@/components/dashboard/kpis-tile';
import { QuickActionsTile } from '@/components/dashboard/quick-actions-tile';
import { AIInsightsTile } from '@/components/dashboard/ai-insights-tile';
import { WorkingCapitalTile } from '@/components/dashboard/working-capital-tile';
import { ToDepositTile } from '@/components/dashboard/to-deposit-tile';
import { UnbilledTile } from '@/components/dashboard/unbilled-tile';
import { EstimatesTile } from '@/components/dashboard/estimates-tile';
import { AICopilotTile } from '@/components/dashboard/ai-copilot-tile';
import { AutomationCenterTile } from '@/components/dashboard/automation-center-tile';
import { AgentPerformanceTile } from '@/components/dashboard/agent-performance-tile';
import { ReviewQueueTile } from '@/components/dashboard/review-queue-tile';
import { AlertsTile } from '@/components/dashboard/alerts-tile';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WidgetType, DashboardMetrics, AccountingBasis } from '@/features/dashboard/types';

interface WidgetRendererProps {
  type: WidgetType;
  metrics: DashboardMetrics;
  formatCurrency: (amount: number) => string;
  basis: AccountingBasis;
}

function getColorForCategory(category: string): string {
  const colors: Record<string, string> = {
    'Office Supplies': '#D4AF37',           // Gold - primary brand
    'Software & Technology': '#B8962E',     // Darker gold variant
    'Marketing & Advertising': '#E5C158',   // Lighter gold variant
    'Rent & Utilities': '#A08529',          // Bronze gold variant
    'Professional Services': '#C9A645',     // Medium gold variant
    'Travel & Entertainment': '#E0BE50',    // Bright gold variant
    'Insurance': '#9D8030',                 // Deep gold variant
    'Other': '#D4AF37',                     // Gold - primary brand
  };
  return colors[category] || '#D4AF37';
}

export function WidgetRenderer({ type, metrics, formatCurrency, basis }: WidgetRendererProps) {
  const router = useRouter();

  switch (type) {
    case 'bank_accounts':
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Bank accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.bankAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => router.push(`/accounts/${account.id}`)}
              >
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">{account.name}</p>
                    <p className="text-xs text-gray-500">Updated {account.lastSync}</p>
                    {account.forReviewCount && account.forReviewCount > 0 && (
                      <p className="text-xs text-orange-600">
                        {account.forReviewCount} for review
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${account.balance < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(Math.abs(account.balance))}
                  </span>
                  {account.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  {account.status === 'connected' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
            <Button
              variant="link"
              className="w-full text-blue-600 hover:text-blue-700"
              onClick={() => router.push('/bank-feeds')}
            >
              <Link2 className="w-4 h-4 mr-2" />
              Connect accounts
            </Button>
          </CardContent>
        </Card>
      );

    case 'ar_summary':
      return <ARTile metrics={metrics.ar} formatCurrency={formatCurrency} />;

    case 'ap_summary':
      return <APTile metrics={metrics.ap} formatCurrency={formatCurrency} />;

    case 'profit_loss':
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Profit and loss</CardTitle>
            <span className="text-sm text-gray-500">{basis === 'accrual' ? 'Accrual' : 'Cash'} basis</span>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={metrics.revenue.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--brand-gold, #D4AF37)"
                  fill="var(--brand-gold, #D4AF37)"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-between mt-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-500">Net Income</p>
                <p className={`text-lg font-semibold ${metrics.netIncome.mtd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.netIncome.mtd)}
                </p>
                {metrics.netIncome.margin !== undefined && (
                  <p className="text-xs text-gray-500">
                    {metrics.netIncome.margin.toFixed(1)}% margin
                  </p>
                )}
              </div>
              <Button variant="link" onClick={() => router.push('/reports/profit-loss')}>
                View report <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      );

    case 'expenses':
      // Sort expenses by amount descending and show top categories + "Other"
      const sortedExpenses = [...metrics.expenses.byCategory].sort((a, b) => b.amount - a.amount);
      const topExpenses = sortedExpenses.slice(0, 5);
      const otherExpenses = sortedExpenses.slice(5);
      const otherTotal = otherExpenses.reduce((sum, cat) => sum + cat.amount, 0);

      const expensesData = [...topExpenses];
      if (otherTotal > 0) {
        // Calculate percentage for "Other" category
        const otherPercentage = (otherTotal / metrics.expenses.mtd) * 100;
        expensesData.push({ category: 'Other', amount: otherTotal, percentage: otherPercentage });
      }

      const maxExpense = Math.max(...expensesData.map(e => e.amount));

      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Expenses</CardTitle>
            <span className="text-sm text-gray-500">This period • {basis === 'accrual' ? 'Accrual' : 'Cash'}</span>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-xs text-muted-foreground">Total expenses</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.expenses.mtd)}</p>
            </div>

            <div className="space-y-3">
              {expensesData.map((cat, idx) => {
                const percentage = (cat.amount / maxExpense) * 100;
                const color = cat.category === 'Other' ? '#6B7280' : getColorForCategory(cat.category);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground truncate flex-1">{cat.category}</span>
                      <span className="font-semibold ml-2">{formatCurrency(cat.amount)}</span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color,
                        }}
                        role="progressbar"
                        aria-valuenow={cat.amount}
                        aria-valuemin={0}
                        aria-valuemax={maxExpense}
                        aria-label={`${cat.category}: ${formatCurrency(cat.amount)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              variant="link"
              className="w-full mt-4 text-[--brand-gold] hover:text-[--brand-gold]/80"
              onClick={() => router.push('/reports/expenses')}
            >
              View expense report <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      );

    case 'sales_trend':
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Sales</CardTitle>
            <span className="text-sm text-gray-500">Last 30 days</span>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics.revenue.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--brand-gold, #D4AF37)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--brand-gold, #D4AF37)', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-500">Revenue MTD</p>
                <p className="text-lg font-semibold">{formatCurrency(metrics.revenue.mtd)}</p>
              </div>
              {metrics.revenue.growth !== undefined && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Growth</p>
                  <p className={`text-sm font-semibold ${metrics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.revenue.growth >= 0 ? '+' : ''}{metrics.revenue.growth.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );

    case 'cash_flow':
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Cash flow</CardTitle>
            <span className="text-sm text-gray-500">This period</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Net cash flow</p>
                <p className={`text-2xl font-bold ${metrics.cashFlow.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.cashFlow.netCashFlow)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div>
                  <p className="text-xs text-gray-500">Money in</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(metrics.cashFlow.moneyIn)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Money out</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(metrics.cashFlow.moneyOut)}
                  </p>
                </div>
              </div>
              <Button variant="link" className="w-full" onClick={() => router.push('/reports/cash-flow')}>
                View cash flow statement <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      );

    case 'taxes':
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Taxes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Sales tax</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatCurrency(metrics.taxes.salesTax.collected)}
                </p>
              </div>
              <div className="text-xs text-gray-500">
                <p>Due: {formatCurrency(metrics.taxes.salesTax.due)}</p>
                <p>Next filing: {new Date(metrics.taxes.salesTax.nextFilingDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Payroll tax</p>
                <p className="text-lg font-semibold text-purple-600">
                  {formatCurrency(metrics.taxes.payrollTax.due)}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Next filing: {new Date(metrics.taxes.payrollTax.nextFilingDate).toLocaleDateString()}
              </p>
            </div>
            <Button variant="link" className="w-full" onClick={() => router.push('/taxes')}>
              Manage taxes <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      );

    case 'balance_sheet':
      if (!metrics.balanceSheet) return null;
      return <BalanceSheetTile metrics={metrics.balanceSheet} formatCurrency={formatCurrency} />;

    case 'reconciliation':
      if (!metrics.reconciliation) return null;
      return <ReconciliationTile metrics={metrics.reconciliation} />;

    case 'kpis':
      if (!metrics.kpis) return null;
      return <KPIsTile metrics={metrics.kpis} />;

    case 'working_capital':
      if (!metrics.balanceSheet) return null;
      // Construct working capital metrics from available data
      const workingCapitalMetrics = {
        cash: metrics.cashFlow?.endingCash || 0,
        ar: metrics.ar?.total || 0,
        inventory: 0, // TODO: Add when inventory module is enabled
        ap: metrics.ap?.total || 0,
        total: metrics.balanceSheet.workingCapital,
        priorPeriod: {
          total: metrics.balanceSheet.workingCapital, // TODO: Add historical data
        },
      };
      return <WorkingCapitalTile metrics={workingCapitalMetrics} formatCurrency={formatCurrency} />;

    case 'ai_insights':
      return <AIInsightsTile />;

    case 'quick_actions':
      return <QuickActionsTile />;

    case 'to_deposit':
      return <ToDepositTile metrics={metrics.toDeposit} formatCurrency={formatCurrency} />;

    case 'unbilled':
      return <UnbilledTile metrics={metrics.unbilled} formatCurrency={formatCurrency} />;

    case 'estimates':
      return <EstimatesTile metrics={metrics.estimates} formatCurrency={formatCurrency} />;

    // AI & Automation Tiles
    case 'ai_copilot':
      return <AICopilotTile />;

    case 'automation_center':
      return <AutomationCenterTile />;

    case 'agent_performance':
      return <AgentPerformanceTile />;

    case 'review_queue':
      return <ReviewQueueTile />;

    case 'alerts':
      return <AlertsTile />;

    // Additional tiles with placeholder implementation
    case 'favorites':
    case 'inventory':
    case 'collections':
    case 'collections_automation':
    case 'close_assistant':
    case 'tax_ai':
    case 'fixed_assets':
    case 'revenue_recognition':
    case 'integration_health':
    case 'receipts_inbox':
    case 'bank_rules':
    case 'recurring_transactions':
    case 'gl_integrity':
    case 'audit_log':
    case 'bill_payments':
    case 'compliance_1099':
    case 'mileage':
    case 'top_vendors':
    case 'payment_links':
    case 'sales_orders':
    case 'sales_channels':
    case 'payouts':
    case 'catalog_health':
    case 'contracts':
    case 'appointments':
    case 'reviews':
    case 'payroll_tasks':
    case 'payroll_compliance':
    case 'time_tracking':
    case 'projects':
    case 'whats_new':
    case 'scenario_manager':
    case 'my_accountant':
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {type.split('_').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500 mb-2">Coming soon</p>
              <p className="text-xs text-gray-400">This feature is in development</p>
            </div>
          </CardContent>
        </Card>
      );

    default:
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Widget: {type}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Widget renderer not implemented yet</p>
          </CardContent>
        </Card>
      );
  }
}
