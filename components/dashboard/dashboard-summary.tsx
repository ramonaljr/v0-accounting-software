"use client";

/**
 * Dashboard Summary
 * High-level summary cards showing key business metrics
 */

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { DashboardMetrics } from "@/features/dashboard/types";

interface DashboardSummaryProps {
  metrics: DashboardMetrics;
  formatCurrency: (amount: number) => string;
}

interface SummaryCardProps {
  label: string;
  value: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

function SummaryCard({ label, value, trend, color = "text-gray-900" }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-medium">{Math.abs(trend.value).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSummary({ metrics, formatCurrency }: DashboardSummaryProps) {
  // Calculate trends
  const revenueTrend = metrics.revenue.priorPeriodMtd
    ? ((metrics.revenue.mtd - metrics.revenue.priorPeriodMtd) / metrics.revenue.priorPeriodMtd) * 100
    : 0;

  const expensesTrend = metrics.expenses.priorPeriodMtd
    ? ((metrics.expenses.mtd - metrics.expenses.priorPeriodMtd) / metrics.expenses.priorPeriodMtd) * 100
    : 0;

  const netIncomeTrend = metrics.netIncome.priorPeriodMtd
    ? ((metrics.netIncome.mtd - metrics.netIncome.priorPeriodMtd) / metrics.netIncome.priorPeriodMtd) * 100
    : 0;

  const cashBalance = metrics.cashFlow.endingCash || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Revenue */}
      <SummaryCard
        label="Revenue (MTD)"
        value={formatCurrency(metrics.revenue.mtd)}
        trend={{
          value: revenueTrend,
          isPositive: revenueTrend >= 0,
        }}
        color="text-green-600"
      />

      {/* Expenses */}
      <SummaryCard
        label="Expenses (MTD)"
        value={formatCurrency(metrics.expenses.mtd)}
        trend={{
          value: expensesTrend,
          isPositive: expensesTrend < 0, // Lower expenses are better
        }}
        color="text-red-600"
      />

      {/* Net Income */}
      <SummaryCard
        label="Net Income (MTD)"
        value={formatCurrency(metrics.netIncome.mtd)}
        trend={{
          value: netIncomeTrend,
          isPositive: netIncomeTrend >= 0,
        }}
        color={metrics.netIncome.mtd >= 0 ? "text-green-600" : "text-red-600"}
      />

      {/* Cash Balance */}
      <SummaryCard
        label="Cash Balance"
        value={formatCurrency(cashBalance)}
        color="text-blue-600"
      />
    </div>
  );
}
