"use client";

/**
 * Working Capital Tile
 * Shows working capital breakdown and trend
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WorkingCapitalMetrics {
  cash: number;
  ar: number;
  inventory?: number;
  ap: number;
  total: number;
  priorPeriod?: {
    total: number;
  };
}

interface WorkingCapitalTileProps {
  metrics: WorkingCapitalMetrics;
  formatCurrency: (amount: number) => string;
}

export function WorkingCapitalTile({ metrics, formatCurrency }: WorkingCapitalTileProps) {
  // Calculate change from prior period
  const priorPeriodChange = metrics.priorPeriod
    ? ((metrics.total - metrics.priorPeriod.total) / metrics.priorPeriod.total) * 100
    : 0;

  const hasPositiveTrend = priorPeriodChange > 0;
  const TrendIcon = priorPeriodChange > 2 ? TrendingUp : priorPeriodChange < -2 ? TrendingDown : Minus;

  // Calculate percentages
  const totalCurrent = metrics.cash + metrics.ar + (metrics.inventory || 0);
  const cashPercent = totalCurrent > 0 ? (metrics.cash / totalCurrent) * 100 : 0;
  const arPercent = totalCurrent > 0 ? (metrics.ar / totalCurrent) * 100 : 0;
  const inventoryPercent = metrics.inventory && totalCurrent > 0 ? (metrics.inventory / totalCurrent) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Working Capital</CardTitle>
        {metrics.priorPeriod && (
          <div className="flex items-center gap-1 text-xs">
            <TrendIcon className={`h-4 w-4 ${hasPositiveTrend ? 'text-green-600' : priorPeriodChange < -2 ? 'text-red-600' : 'text-gray-500'}`} />
            <span className={hasPositiveTrend ? 'text-green-600' : priorPeriodChange < -2 ? 'text-red-600' : 'text-gray-500'}>
              {Math.abs(priorPeriodChange).toFixed(1)}%
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Working Capital */}
        <div className="pb-3 border-b">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className={`text-2xl font-bold ${metrics.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.total)}
            </span>
          </div>
          {metrics.priorPeriod && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">Prior period</span>
              <span className="text-xs text-gray-600">
                {formatCurrency(metrics.priorPeriod.total)}
              </span>
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          {/* Cash */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Cash</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(metrics.cash)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-green-600 h-1.5 rounded-full transition-all"
                style={{ width: `${cashPercent}%` }}
              />
            </div>
          </div>

          {/* Accounts Receivable */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Accounts Receivable</span>
              <span className="font-semibold text-blue-600">
                {formatCurrency(metrics.ar)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${arPercent}%` }}
              />
            </div>
          </div>

          {/* Inventory (if applicable) */}
          {metrics.inventory !== undefined && metrics.inventory > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Inventory</span>
                <span className="font-semibold text-purple-600">
                  {formatCurrency(metrics.inventory)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-purple-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${inventoryPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Accounts Payable */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Accounts Payable</span>
              <span className="font-semibold text-red-600">
                ({formatCurrency(metrics.ap)})
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-red-600 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min((metrics.ap / totalCurrent) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Formula explanation */}
        <div className="pt-3 border-t text-xs text-gray-500">
          <p>Working Capital = Current Assets - Current Liabilities</p>
          {metrics.inventory !== undefined ? (
            <p className="mt-1">Cash + AR + Inventory - AP = {formatCurrency(metrics.total)}</p>
          ) : (
            <p className="mt-1">Cash + AR - AP = {formatCurrency(metrics.total)}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
