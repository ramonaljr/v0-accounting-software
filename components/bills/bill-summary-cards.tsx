'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { BillStats } from './types'

interface BillSummaryCardsProps {
  stats: BillStats | null;
  formatCurrency: (amount: number, currency?: string) => string;
}

export function BillSummaryCards({ stats, formatCurrency }: BillSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Unpaid Bills</CardDescription>
          <CardTitle className="text-2xl">{formatCurrency(stats?.unpaidTotal || 0)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">{stats?.unpaidCount || 0} bills outstanding</p>
        </CardContent>
      </Card>
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardDescription>Overdue</CardDescription>
          <CardTitle className="text-2xl text-red-600">{formatCurrency(stats?.overdueTotal || 0)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-red-600">{stats?.overdueCount || 0} bills overdue</p>
        </CardContent>
      </Card>
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <CardDescription>Due Soon</CardDescription>
          <CardTitle className="text-2xl text-yellow-700">{formatCurrency(stats?.dueSoonTotal || 0)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-yellow-700">Due in 7 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>This Month Paid</CardDescription>
          <CardTitle className="text-2xl">{formatCurrency(stats?.paidThisMonth || 0)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">{stats?.paidThisMonthCount || 0} bills paid</p>
        </CardContent>
      </Card>
    </div>
  )
}
