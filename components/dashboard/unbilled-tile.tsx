/**
 * Unbilled Time & Expenses Tile
 * Shows unbilled time and expenses ready to invoice
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Receipt, ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';

interface UnbilledMetrics {
  totalAmount: number;
  timeAmount: number;
  timeHours: number;
  expenseAmount: number;
  expenseCount: number;
  byClient?: Array<{
    clientName: string;
    amount: number;
  }>;
}

interface UnbilledTileProps {
  metrics?: UnbilledMetrics;
  formatCurrency: (amount: number) => string;
}

export function UnbilledTile({ metrics, formatCurrency }: UnbilledTileProps) {
  if (!metrics) {
    return null;
  }

  const hasUnbilled = metrics.totalAmount > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-50">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <CardTitle className="text-base font-medium">Unbilled</CardTitle>
        </div>
        {hasUnbilled && (
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Ready to invoice
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        {hasUnbilled ? (
          <div className="space-y-4">
            {/* Total Unbilled */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Unbilled</p>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(metrics.totalAmount)}
              </p>
            </div>

            {/* Time vs Expenses Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Time</span>
                </div>
                <p className="text-lg font-semibold">
                  {formatCurrency(metrics.timeAmount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metrics.timeHours.toFixed(1)} hours
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Receipt className="w-3 h-3" />
                  <span>Expenses</span>
                </div>
                <p className="text-lg font-semibold">
                  {formatCurrency(metrics.expenseAmount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metrics.expenseCount} {metrics.expenseCount === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>

            {/* Top Clients */}
            {metrics.byClient && metrics.byClient.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Top Clients
                </p>
                {metrics.byClient.slice(0, 3).map((client, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate flex-1">
                      {client.clientName}
                    </span>
                    <span className="font-medium ml-2">
                      {formatCurrency(client.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button asChild size="sm" className="flex-1">
                <Link href="/invoices/new?from=unbilled">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Invoice
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/time/entries?status=unbilled">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-gray-100 mb-3">
              <Clock className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No unbilled items
            </p>
            <p className="text-xs text-muted-foreground">
              All time and expenses have been invoiced
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
