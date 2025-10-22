"use client";

/**
 * Dashboard Content
 * Main dashboard page using new context and type-safe metrics
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  AlertCircle,
  CheckCircle,
  Link2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getDashboardMetrics } from "@/features/dashboard/actions";
import { useDashboard } from "@/features/dashboard/context";
import { GlobalFilters } from "@/components/dashboard/global-filters";
import { ARTile } from "@/components/dashboard/ar-tile";
import { APTile } from "@/components/dashboard/ap-tile";
import { ReconciliationTile } from "@/components/dashboard/reconciliation-tile";
import { BalanceSheetTile } from "@/components/dashboard/balance-sheet-tile";
import { KPIsTile } from "@/components/dashboard/kpis-tile";
import { QuickActionsTile } from "@/components/dashboard/quick-actions-tile";
import { AIInsightsTile } from "@/components/dashboard/ai-insights-tile";
import { WorkingCapitalTile } from "@/components/dashboard/working-capital-tile";
import { ToDepositTile } from "@/components/dashboard/to-deposit-tile";
import { UnbilledTile } from "@/components/dashboard/unbilled-tile";
import { EstimatesTile } from "@/components/dashboard/estimates-tile";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { StatusBars, getDefaultStatusBarMetrics } from "@/components/dashboard/status-bars";
import { CustomizeDialog } from "@/components/dashboard/customize-dialog";
import { PresetSelector } from "@/components/dashboard/preset-selector";
import { SortableDashboard } from "@/components/dashboard/sortable-dashboard";
import { SortableWidget } from "@/components/dashboard/sortable-widget";
import { WidgetRenderer } from "@/components/dashboard/widget-renderer";
import { exportToCsv, downloadCsv } from "@/features/dashboard/export";
import type { DashboardMetrics, WidgetConfig } from "@/features/dashboard/types";
import { createDefaultWidget } from "@/features/dashboard/widget-registry";
import { saveDashboardLayout } from "@/features/dashboard/layout-actions";
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
} from "recharts";

// =====================================================
// TILE SKELETON
// =====================================================

const TileSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-8" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    </CardContent>
  </Card>
);

// =====================================================
// MAIN DASHBOARD COMPONENT
// =====================================================

// Default widget configuration
const getDefaultWidgets = (): WidgetConfig[] => [
  // Row 1: Bank & AR
  createDefaultWidget('bank_accounts', 1, 0),
  createDefaultWidget('ar_summary', 1, 6),

  // Row 2: P&L and Expenses
  createDefaultWidget('profit_loss', 2, 0),
  createDefaultWidget('expenses', 2, 6),

  // Row 3: Sales and Cash Flow
  createDefaultWidget('sales_trend', 3, 0),
  createDefaultWidget('cash_flow', 3, 6),

  // Row 4: AP and Taxes
  createDefaultWidget('ap_summary', 4, 0),
  createDefaultWidget('taxes', 4, 6),

  // Row 5: Balance Sheet, Reconciliation, KPIs
  createDefaultWidget('balance_sheet', 5, 0),
  createDefaultWidget('reconciliation', 5, 4),
  createDefaultWidget('kpis', 5, 8),

  // Row 6: Working Capital and AI Insights
  createDefaultWidget('working_capital', 6, 0),
  createDefaultWidget('ai_insights', 6, 6),

  // Row 7: AI & Automation Features (NEW)
  createDefaultWidget('ai_copilot', 7, 0),
  createDefaultWidget('automation_center', 7, 4),
  createDefaultWidget('agent_performance', 7, 8),

  // Row 8: Review and Alerts (NEW)
  createDefaultWidget('review_queue', 8, 0),
  createDefaultWidget('alerts', 8, 6),

  // Row 9: Quick Actions
  createDefaultWidget('quick_actions', 9, 0),

  // Row 10: Operations
  createDefaultWidget('to_deposit', 10, 0),
  createDefaultWidget('unbilled', 10, 4),
  createDefaultWidget('estimates', 10, 8),
];

export function DashboardContent() {
  const router = useRouter();
  const { filters, isLoading: filtersLoading } = useDashboard();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(getDefaultWidgets());
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, [filters]);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const result = await getDashboardMetrics(filters);
      if (result.success && result.data) {
        setMetrics(result.data);
      } else {
        toast.error(result.error || "Failed to load dashboard metrics");
      }
    } catch (error) {
      console.error("[Dashboard] Load error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!metrics) return;

    if (format === 'csv') {
      const csv = exportToCsv(metrics, filters);
      const filename = `dashboard-${filters.startDate}-to-${filters.endDate}.csv`;
      downloadCsv(csv, filename);
      toast.success('Dashboard exported as CSV');
    } else if (format === 'excel') {
      toast.info('Excel export coming soon');
    } else if (format === 'pdf') {
      toast.info('PDF export coming soon');
    }
  };

  const handleEditLayout = () => {
    setIsEditMode(true);
    toast.info('Edit mode enabled - drag widgets to reorder');
  };

  const handleSaveLayout = async () => {
    setIsSaving(true);
    try {
      const result = await saveDashboardLayout(widgets);
      if (result.success) {
        toast.success('Layout saved successfully');
        setIsEditMode(false);
      } else {
        toast.error(result.error || 'Failed to save layout');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    toast.info('Edit mode cancelled');
  };

  const handleLoadPreset = (presetWidgets: WidgetConfig[], presetName: string) => {
    setWidgets(presetWidgets);
    toast.success(`${presetName} preset loaded`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Skeleton status bars */}
        <div className="grid grid-cols-4 border-b">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>

          <div className="grid gap-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <TileSkeleton />
              <TileSkeleton />
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TileSkeleton />
              </div>
              <TileSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
          <Button onClick={() => loadMetrics()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Expense data for pie chart
  const expensesByCategory = metrics.expenses.byCategory.map(cat => ({
    name: cat.category,
    value: cat.amount,
    color: getColorForCategory(cat.category),
  }));

  return (
    <>
      {/* Main dashboard content */}
      <div className="p-6">
        {/* Dashboard Header */}
        <DashboardHeader
          onRefresh={() => loadMetrics()}
          onExport={handleExport}
          onCustomize={() => setCustomizeOpen(true)}
          onEditLayout={handleEditLayout}
          onLoadPreset={() => setPresetOpen(true)}
          isEditMode={isEditMode}
          isLoading={isLoading}
        />

        {/* Edit Mode Info Banner */}
        {isEditMode && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Edit Mode Active
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Drag widgets using the grip handle to reorder them. Use "Customize dashboard" to show/hide widgets.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveLayout}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Layout'}
              </Button>
            </div>
          </div>
        )}

        {/* Global Filters */}
        <GlobalFilters />

        {/* Status Bars - QBO-style */}
        {metrics?.statusBars && (
          <StatusBars metrics={getDefaultStatusBarMetrics(metrics.statusBars)} />
        )}

        {/* Dashboard Summary Cards */}
        <DashboardSummary metrics={metrics} formatCurrency={formatCurrency} />

        {/* Dashboard grid - Now with drag-and-drop */}
        <SortableDashboard
          widgets={widgets}
          onLayoutChange={setWidgets}
        >
          {({ widgets: sortedWidgets, isEditMode: sortableEditMode }) => (
            <div className="grid gap-6">
              {sortedWidgets.filter(w => w.isVisible).map((widget) => (
                <SortableWidget
                  key={widget.id}
                  id={widget.id}
                  isEditMode={isEditMode || sortableEditMode}
                >
                  <WidgetRenderer
                    type={widget.type}
                    metrics={metrics}
                    formatCurrency={formatCurrency}
                    basis={filters.basis}
                  />
                </SortableWidget>
              ))}
            </div>
          )}
        </SortableDashboard>
      </div>
      {/* Customize Dialog */}
      <CustomizeDialog
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        currentWidgets={widgets}
        onLayoutChange={setWidgets}
        features={{ aiInsights: true }}
        userRole="owner"
      />

      {/* Preset Selector */}
      <PresetSelector
        open={presetOpen}
        onOpenChange={setPresetOpen}
        currentRole="owner"
        onLoadPreset={handleLoadPreset}
      />
    </>
  );
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getColorForCategory(category: string): string {
  const colors: Record<string, string> = {
    'Office Supplies': '#D4AF37',      // Gold - primary brand
    'Software & Tools': '#B8962E',     // Darker gold variant
    'Marketing': '#E5C158',            // Lighter gold variant
    'Travel': '#A08529',               // Bronze gold variant
    'Other': '#C9A645',                // Medium gold variant
  };
  return colors[category] || '#D4AF37';
}
