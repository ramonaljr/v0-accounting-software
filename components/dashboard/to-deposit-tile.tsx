/**
 * To Deposit Tile
 * Shows undeposited funds ready to deposit to bank accounts
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ArrowRight, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface ToDepositMetrics {
  totalAmount: number;
  itemCount: number;
  oldestDate?: string;
  byPaymentMethod?: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
}

interface ToDepositTileProps {
  metrics?: ToDepositMetrics;
  formatCurrency: (amount: number) => string;
}

export function ToDepositTile({ metrics, formatCurrency }: ToDepositTileProps) {
  if (!metrics) {
    return null;
  }

  const hasUndeposited = metrics.totalAmount > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <CardTitle className="text-base font-medium">To Deposit</CardTitle>
        </div>
        {hasUndeposited && (
          <Badge variant="secondary">
            {metrics.itemCount} {metrics.itemCount === 1 ? 'item' : 'items'}
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        {hasUndeposited ? (
          <div className="space-y-4">
            {/* Total Amount */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Undeposited Funds</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(metrics.totalAmount)}
              </p>
              {metrics.oldestDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Oldest: {new Date(metrics.oldestDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Breakdown by Payment Method */}
            {metrics.byPaymentMethod && metrics.byPaymentMethod.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  By Payment Method
                </p>
                {metrics.byPaymentMethod.map((method, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{method.method}</span>
                      <Badge variant="outline" className="text-xs">
                        {method.count}
                      </Badge>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(method.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button asChild size="sm" className="flex-1">
                <Link href="/banking/deposits">
                  <Download className="w-4 h-4 mr-2" />
                  Record Deposit
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/banking/deposits">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-gray-100 mb-3">
              <Download className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No undeposited funds
            </p>
            <p className="text-xs text-muted-foreground">
              All payments have been deposited
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
