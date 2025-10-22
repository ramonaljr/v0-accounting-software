/**
 * Dashboard Export Utilities
 * Functions to export dashboard data in various formats
 */

import type { DashboardMetrics, DashboardFilters } from './types';

// =====================================================
// CSV EXPORT
// =====================================================

export function exportToCsv(metrics: DashboardMetrics, filters: DashboardFilters): string {
  const rows: string[][] = [];

  // Header
  rows.push(['OpportunityOS Dashboard Export']);
  rows.push(['Generated', new Date().toISOString()]);
  rows.push(['Period', `${filters.startDate} to ${filters.endDate}`]);
  rows.push(['Basis', filters.basis]);
  rows.push([]);

  // Revenue & Expenses
  rows.push(['Income Statement']);
  rows.push(['Metric', 'MTD', 'YTD']);
  rows.push(['Revenue', metrics.revenue.mtd.toString(), metrics.revenue.ytd.toString()]);
  rows.push(['Expenses', metrics.expenses.mtd.toString(), metrics.expenses.ytd.toString()]);
  rows.push(['Net Income', metrics.netIncome.mtd.toString(), metrics.netIncome.ytd.toString()]);
  rows.push([]);

  // AR/AP
  rows.push(['Working Capital']);
  rows.push(['Accounts Receivable', metrics.ar.total.toString()]);
  rows.push(['- Overdue', metrics.ar.overdue.toString()]);
  rows.push(['Accounts Payable', metrics.ap.total.toString()]);
  rows.push(['- Overdue', metrics.ap.overdue.toString()]);
  rows.push([]);

  // Balance Sheet
  if (metrics.balanceSheet) {
    rows.push(['Balance Sheet']);
    rows.push(['Assets', metrics.balanceSheet.assets.toString()]);
    rows.push(['Liabilities', metrics.balanceSheet.liabilities.toString()]);
    rows.push(['Equity', metrics.balanceSheet.equity.toString()]);
    rows.push(['Working Capital', metrics.balanceSheet.workingCapital.toString()]);
    rows.push([]);
  }

  // KPIs
  if (metrics.kpis) {
    rows.push(['Key Performance Indicators']);
    if (metrics.kpis.grossMarginPercent !== undefined) {
      rows.push(['Gross Margin %', metrics.kpis.grossMarginPercent.toFixed(2)]);
    }
    if (metrics.kpis.netMarginPercent !== undefined) {
      rows.push(['Net Margin %', metrics.kpis.netMarginPercent.toFixed(2)]);
    }
    if (metrics.kpis.currentRatio !== undefined) {
      rows.push(['Current Ratio', metrics.kpis.currentRatio.toFixed(2)]);
    }
    if (metrics.kpis.debtToEquity !== undefined) {
      rows.push(['Debt-to-Equity', metrics.kpis.debtToEquity.toFixed(2)]);
    }
    if (metrics.kpis.dso !== undefined) {
      rows.push(['DSO (Days)', metrics.kpis.dso.toString()]);
    }
    if (metrics.kpis.dpo !== undefined) {
      rows.push(['DPO (Days)', metrics.kpis.dpo.toString()]);
    }
  }

  // Convert to CSV string
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// =====================================================
// DOWNLOAD HELPERS
// =====================================================

export function downloadCsv(csv: string, filename: string = 'dashboard-export.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// =====================================================
// EXCEL EXPORT (JSON format for future implementation)
// =====================================================

export function exportToExcel(metrics: DashboardMetrics, filters: DashboardFilters): object {
  return {
    metadata: {
      generated: new Date().toISOString(),
      period: {
        start: filters.startDate,
        end: filters.endDate,
      },
      basis: filters.basis,
    },
    incomeStatement: {
      revenue: {
        mtd: metrics.revenue.mtd,
        ytd: metrics.revenue.ytd,
      },
      expenses: {
        mtd: metrics.expenses.mtd,
        ytd: metrics.expenses.ytd,
      },
      netIncome: {
        mtd: metrics.netIncome.mtd,
        ytd: metrics.netIncome.ytd,
        margin: metrics.netIncome.margin,
      },
    },
    workingCapital: {
      accountsReceivable: metrics.ar.total,
      accountsPayable: metrics.ap.total,
    },
    balanceSheet: metrics.balanceSheet,
    kpis: metrics.kpis,
  };
}

// =====================================================
// PDF EXPORT (Placeholder for future implementation)
// =====================================================

export function exportToPdf(metrics: DashboardMetrics, filters: DashboardFilters): void {
  console.log('PDF export not yet implemented');
  // TODO: Implement PDF generation using a library like jsPDF or puppeteer
}

// =====================================================
// PRINT HELPER
// =====================================================

export function preparePrintView(): void {
  // Add print-specific styles
  const style = document.createElement('style');
  style.innerHTML = `
    @media print {
      .no-print {
        display: none !important;
      }
      .print-only {
        display: block !important;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  `;
  document.head.appendChild(style);
}
