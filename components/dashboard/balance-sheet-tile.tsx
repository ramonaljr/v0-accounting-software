"use client";

/**
 * Balance Sheet Snapshot Tile
 * Shows key balance sheet metrics: Assets, Liabilities, Equity, Working Capital
 */

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { BalanceSheetSnapshot } from "@/features/dashboard/types";

interface BalanceSheetTileProps {
  metrics: BalanceSheetSnapshot;
  formatCurrency: (amount: number) => string;
}

export function BalanceSheetTile({ metrics, formatCurrency }: BalanceSheetTileProps) {
  const router = useRouter();

  // Check if balance sheet balances (Assets = Liabilities + Equity)
  const isBalanced = Math.abs(metrics.assets - (metrics.liabilities + metrics.equity)) < 0.01;

  // Calculate debt-to-equity ratio
  const debtToEquity = metrics.equity > 0 ? metrics.liabilities / metrics.equity : 0;

  // Calculate current ratio estimate (using working capital)
  const currentRatio = metrics.liabilities > 0 ? (metrics.workingCapital + metrics.liabilities * 0.5) / (metrics.liabilities * 0.5) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Balance Sheet</CardTitle>
        <span className="text-xs text-gray-500">As of {new Date(metrics.asOfDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Metrics */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Assets</span>
            <span className="font-semibold text-lg text-green-600">
              {formatCurrency(metrics.assets)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Liabilities</span>
            <span className="font-semibold text-lg text-red-600">
              {formatCurrency(metrics.liabilities)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Equity</span>
            <span className="font-semibold text-lg text-blue-600">
              {formatCurrency(metrics.equity)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm font-medium text-gray-700">Working Capital</span>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${metrics.workingCapital >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.workingCapital)}
              </span>
              {metrics.workingCapital >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Ratios */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Debt-to-Equity</span>
            <span className="font-medium">{debtToEquity.toFixed(2)}</span>
          </div>

          {currentRatio > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Current Ratio</span>
              <span className={`font-medium ${currentRatio >= 1.5 ? 'text-green-600' : currentRatio >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                {currentRatio.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Balance Status */}
        {!isBalanced && (
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded text-xs text-orange-700">
            <TrendingDown className="h-3 w-3" />
            <span>Balance sheet out of balance by {formatCurrency(Math.abs(metrics.assets - (metrics.liabilities + metrics.equity)))}</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/reports/balance-sheet")}
          >
            View full report →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
