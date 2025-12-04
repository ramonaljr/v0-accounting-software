/**
 * Dashboard Components - Barrel Export
 *
 * All dashboard widget and layout components.
 */

// Main dashboard components
export { DashboardContent } from './dashboard-content';
export { DashboardHeader } from './dashboard-header';
export { DashboardSummary } from './dashboard-summary';

// Dashboard header components
export { GlobalFilters, GlobalFiltersCompact } from './global-filters';
export { PresetSelector } from './preset-selector';
export { CustomizeDialog } from './customize-dialog';
export { LastRefreshed } from './last-refreshed';

// Sortable/Draggable components
export { SortableDashboard } from './sortable-dashboard';
export { SortableWidget } from './sortable-widget';
export { DraggableWidget } from './draggable-widget';

// Widget utilities
export { WidgetRenderer } from './widget-renderer';
export { WidgetInfoTooltip } from './widget-info-tooltip';
export { WidgetLoading, WidgetEmpty, WidgetError, WidgetContainer } from './widget-states';

// KPI and summary tiles
export { KPIsTile } from './kpis-tile';
export { WorkingCapitalTile } from './working-capital-tile';

// Financial tiles
export { BalanceSheetTile } from './balance-sheet-tile';
export { ARTile } from './ar-tile';
export { APTile } from './ap-tile';
export { ReconciliationTile } from './reconciliation-tile';

// Action tiles
export { QuickActionsTile } from './quick-actions-tile';
export { AlertsTile } from './alerts-tile';
export { ReviewQueueTile } from './review-queue-tile';

// Transaction tiles
export { UnbilledTile } from './unbilled-tile';
export { EstimatesTile } from './estimates-tile';
export { ToDepositTile } from './to-deposit-tile';

// AI tiles
export { AIInsightsTile } from './ai-insights-tile';
export { AICopilotTile } from './ai-copilot-tile';
export { AgentPerformanceTile } from './agent-performance-tile';
export { AutomationCenterTile } from './automation-center-tile';

// Status components
export { StatusBars, getDefaultStatusBarMetrics } from './status-bars';
