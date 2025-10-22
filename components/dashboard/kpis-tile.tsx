"use client";

/**
 * KPIs & Ratios Tile
 * Displays key financial ratios: margins, liquidity, efficiency, profitability
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KPIMetrics } from "@/features/dashboard/types";

interface KPIsTileProps {
  metrics: KPIMetrics;
}

interface KPIItemProps {
  label: string;
  value: number | undefined;
  suffix?: string;
  format?: 'percentage' | 'ratio' | 'days';
  benchmark?: { good: number; warning: number };
  higherIsBetter?: boolean;
}

function KPIItem({ label, value, suffix = '', format = 'ratio', benchmark, higherIsBetter = true }: KPIItemProps) {
  if (value === undefined) return null;

  const formattedValue = format === 'percentage'
    ? `${value.toFixed(1)}%`
    : format === 'days'
    ? Math.round(value).toString()
    : value.toFixed(2);

  // Determine status color based on benchmark
  let statusColor = 'text-gray-700';
  let Icon = Minus;

  if (benchmark) {
    if (higherIsBetter) {
      if (value >= benchmark.good) {
        statusColor = 'text-green-600';
        Icon = TrendingUp;
      } else if (value >= benchmark.warning) {
        statusColor = 'text-yellow-600';
        Icon = Minus;
      } else {
        statusColor = 'text-red-600';
        Icon = TrendingDown;
      }
    } else {
      if (value <= benchmark.good) {
        statusColor = 'text-green-600';
        Icon = TrendingUp;
      } else if (value <= benchmark.warning) {
        statusColor = 'text-yellow-600';
        Icon = Minus;
      } else {
        statusColor = 'text-red-600';
        Icon = TrendingDown;
      }
    }
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${statusColor}`}>
          {formattedValue}{suffix}
        </span>
        {benchmark && <Icon className={`h-3 w-3 ${statusColor}`} />}
      </div>
    </div>
  );
}

export function KPIsTile({ metrics }: KPIsTileProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Key Performance Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Profitability */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Profitability
          </div>
          <div className="space-y-1">
            <KPIItem
              label="Gross Margin"
              value={metrics.grossMarginPercent}
              format="percentage"
              benchmark={{ good: 40, warning: 25 }}
            />
            <KPIItem
              label="Net Margin"
              value={metrics.netMarginPercent}
              format="percentage"
              benchmark={{ good: 15, warning: 5 }}
            />
            <KPIItem
              label="Return on Assets (ROA)"
              value={metrics.roa}
              format="percentage"
              benchmark={{ good: 10, warning: 5 }}
            />
            <KPIItem
              label="Return on Equity (ROE)"
              value={metrics.roe}
              format="percentage"
              benchmark={{ good: 15, warning: 8 }}
            />
          </div>
        </div>

        {/* Liquidity */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Liquidity
          </div>
          <div className="space-y-1">
            <KPIItem
              label="Current Ratio"
              value={metrics.currentRatio}
              format="ratio"
              benchmark={{ good: 1.5, warning: 1.0 }}
            />
            <KPIItem
              label="Quick Ratio"
              value={metrics.quickRatio}
              format="ratio"
              benchmark={{ good: 1.0, warning: 0.7 }}
            />
          </div>
        </div>

        {/* Leverage */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Leverage
          </div>
          <div className="space-y-1">
            <KPIItem
              label="Debt-to-Equity"
              value={metrics.debtToEquity}
              format="ratio"
              benchmark={{ good: 0.5, warning: 1.0 }}
              higherIsBetter={false}
            />
          </div>
        </div>

        {/* Efficiency */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Efficiency
          </div>
          <div className="space-y-1">
            <KPIItem
              label="Days Sales Outstanding"
              value={metrics.dso}
              format="days"
              suffix=" days"
              benchmark={{ good: 30, warning: 45 }}
              higherIsBetter={false}
            />
            <KPIItem
              label="Days Payable Outstanding"
              value={metrics.dpo}
              format="days"
              suffix=" days"
              benchmark={{ good: 30, warning: 60 }}
            />
            <KPIItem
              label="Inventory Turnover"
              value={metrics.inventoryTurnover}
              format="ratio"
              suffix="x"
              benchmark={{ good: 6, warning: 3 }}
            />
            <KPIItem
              label="Days on Hand"
              value={metrics.daysOnHand}
              format="days"
              suffix=" days"
              benchmark={{ good: 60, warning: 120 }}
              higherIsBetter={false}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
