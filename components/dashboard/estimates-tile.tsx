/**
 * Estimates Pending Tile
 * Shows pending estimates and quotes awaiting customer response
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileEdit, ArrowRight, TrendingUp, Calendar } from 'lucide-react';
import Link from 'next/link';

interface EstimatesMetrics {
  totalValue: number;
  count: number;
  acceptedCount: number;
  acceptedValue: number;
  conversionRate: number;
  expiringCount?: number;
  byStatus?: Array<{
    status: string;
    count: number;
    value: number;
  }>;
}

interface EstimatesTileProps {
  metrics?: EstimatesMetrics;
  formatCurrency: (amount: number) => string;
}

export function EstimatesTile({ metrics, formatCurrency }: EstimatesTileProps) {
  if (!metrics) {
    return null;
  }

  const hasPending = metrics.count > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-50">
            <FileEdit className="w-5 h-5 text-orange-600" />
          </div>
          <CardTitle className="text-base font-medium">Estimates</CardTitle>
        </div>
        {hasPending && metrics.expiringCount && metrics.expiringCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {metrics.expiringCount} expiring soon
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        {hasPending ? (
          <div className="space-y-4">
            {/* Total Pending */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending Estimates</p>
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(metrics.totalValue)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.count} {metrics.count === 1 ? 'estimate' : 'estimates'}
              </p>
            </div>

            {/* Conversion Stats */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  <span>Conversion Rate</span>
                </div>
                <p className="text-xl font-semibold text-green-600">
                  {metrics.conversionRate.toFixed(0)}%
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileEdit className="w-3 h-3" />
                  <span>Accepted</span>
                </div>
                <p className="text-xl font-semibold">
                  {metrics.acceptedCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(metrics.acceptedValue)}
                </p>
              </div>
            </div>

            {/* Status Breakdown */}
            {metrics.byStatus && metrics.byStatus.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  By Status
                </p>
                {metrics.byStatus.map((status, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        status.status === 'Sent' ? 'bg-blue-500' :
                        status.status === 'Viewed' ? 'bg-purple-500' :
                        status.status === 'Expired' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-muted-foreground">{status.status}</span>
                      <Badge variant="outline" className="text-xs">
                        {status.count}
                      </Badge>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(status.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button asChild size="sm" className="flex-1">
                <Link href="/customers/estimates/new">
                  <FileEdit className="w-4 h-4 mr-2" />
                  New Estimate
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/customers/estimates">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-gray-100 mb-3">
              <FileEdit className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No pending estimates
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Create estimates to send to customers
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/customers/estimates/new">
                <FileEdit className="w-4 h-4 mr-2" />
                Create Estimate
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
