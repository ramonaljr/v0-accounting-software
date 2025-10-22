"use client";

/**
 * AP Tile - Accounts Payable with Aging Buckets
 * Displays open bills, aging breakdown, DPO, and vendor count
 */

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { APMetrics } from "@/features/dashboard/types";

interface APTileProps {
  metrics: APMetrics;
  formatCurrency: (amount: number) => string;
}

export function APTile({ metrics, formatCurrency }: APTileProps) {
  const router = useRouter();

  // Calculate percentages for aging buckets
  const total = metrics.total || 0;
  const agingPercentages = {
    current: total > 0 ? (metrics.aging.current / total) * 100 : 0,
    days_1_30: total > 0 ? (metrics.aging.days_1_30 / total) * 100 : 0,
    days_31_60: total > 0 ? (metrics.aging.days_31_60 / total) * 100 : 0,
    days_61_90: total > 0 ? (metrics.aging.days_61_90 / total) * 100 : 0,
    days_90_plus: total > 0 ? (metrics.aging.days_90_plus / total) * 100 : 0,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Bills to pay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Open</span>
            <span className="font-semibold text-lg">
              {formatCurrency(metrics.total)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-orange-600">Overdue</span>
            <span className="font-semibold text-lg text-orange-600">
              {formatCurrency(metrics.overdue)}
            </span>
          </div>
          {metrics.dpo && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">DPO (Days)</span>
              <span className="font-medium">{metrics.dpo}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Vendors</span>
            <span className="font-medium">{metrics.vendorsCount}</span>
          </div>
        </div>

        {/* Aging Breakdown */}
        <div className="pt-3 border-t">
          <div className="text-xs font-medium text-gray-700 mb-2">Payment Schedule</div>

          {/* Current */}
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Not yet due</span>
              <span className="font-medium text-green-600">
                {formatCurrency(metrics.aging.current)}
              </span>
            </div>
            <Progress value={agingPercentages.current} className="h-1.5 bg-gray-100" />
          </div>

          {/* 1-30 days */}
          {metrics.aging.days_1_30 > 0 && (
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">1-30 days past</span>
                <span className="font-medium text-yellow-600">
                  {formatCurrency(metrics.aging.days_1_30)}
                </span>
              </div>
              <Progress value={agingPercentages.days_1_30} className="h-1.5 bg-gray-100" />
            </div>
          )}

          {/* 31-60 days */}
          {metrics.aging.days_31_60 > 0 && (
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">31-60 days past</span>
                <span className="font-medium text-orange-600">
                  {formatCurrency(metrics.aging.days_31_60)}
                </span>
              </div>
              <Progress value={agingPercentages.days_31_60} className="h-1.5 bg-gray-100" />
            </div>
          )}

          {/* 61-90 days */}
          {metrics.aging.days_61_90 > 0 && (
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">61-90 days past</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(metrics.aging.days_61_90)}
                </span>
              </div>
              <Progress value={agingPercentages.days_61_90} className="h-1.5 bg-gray-100" />
            </div>
          )}

          {/* 90+ days */}
          {metrics.aging.days_90_plus > 0 && (
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">90+ days past</span>
                <span className="font-medium text-red-700">
                  {formatCurrency(metrics.aging.days_90_plus)}
                </span>
              </div>
              <Progress value={agingPercentages.days_90_plus} className="h-1.5 bg-gray-100" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/expenses/bills")}
          >
            View bills
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push("/bills/pay")}
          >
            Pay bills
          </Button>
        </div>

        {/* Scheduling link */}
        {metrics.total > 0 && (
          <Button
            variant="link"
            className="w-full text-blue-600 hover:text-blue-700 text-xs"
            onClick={() => router.push("/bills/schedule-payments")}
          >
            Schedule payments →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
