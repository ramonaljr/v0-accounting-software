"use client";

/**
 * Reconciliation Progress Tile
 * Shows reconciliation status, exceptions, and progress
 */

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReconciliationProgress } from "@/features/dashboard/types";

interface ReconciliationTileProps {
  metrics: ReconciliationProgress;
}

export function ReconciliationTile({ metrics }: ReconciliationTileProps) {
  const router = useRouter();

  const getStatusColor = () => {
    if (metrics.percentReconciled >= 90) return "text-green-600";
    if (metrics.percentReconciled >= 70) return "text-yellow-600";
    return "text-orange-600";
  };

  const getProgressColor = () => {
    if (metrics.percentReconciled >= 90) return "bg-green-600";
    if (metrics.percentReconciled >= 70) return "bg-yellow-600";
    return "bg-orange-600";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Reconciliation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Progress</span>
            <span className={`text-2xl font-bold ${getStatusColor()}`}>
              {metrics.percentReconciled}%
            </span>
          </div>
          <Progress
            value={metrics.percentReconciled}
            className={`h-2 ${getProgressColor()}`}
          />
        </div>

        {/* Account Status */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">Reconciled</span>
            </div>
            <span className="font-medium">
              {metrics.reconciledAccounts} / {metrics.totalAccounts} accounts
            </span>
          </div>

          {metrics.unreconciledCount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-gray-600">Need review</span>
              </div>
              <span className="font-medium text-orange-600">
                {metrics.unreconciledCount} {metrics.unreconciledCount === 1 ? 'account' : 'accounts'}
              </span>
            </div>
          )}

          {metrics.exceptions > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-gray-600">Exceptions</span>
              </div>
              <span className="font-medium text-red-600">
                {metrics.exceptions}
              </span>
            </div>
          )}

          {metrics.lastReconcileDate && (
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <span>Last reconciled</span>
              <span>{new Date(metrics.lastReconcileDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-3 border-t">
          {metrics.unreconciledCount > 0 || metrics.exceptions > 0 ? (
            <Button
              variant="default"
              className="w-full"
              onClick={() => router.push("/accounting/reconcile")}
            >
              Reconcile now
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/accounting/reconcile")}
            >
              View reconciliation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
