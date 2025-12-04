'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

interface PayrollStatsCardsProps {
  loading: boolean;
  activeEmployees: number;
  pendingPayroll: number;
  ytdPayroll: number;
  totalDeductions: number;
  formatCurrency: (amount: number) => string;
}

export function PayrollStatsCards({
  loading,
  activeEmployees,
  pendingPayroll,
  ytdPayroll,
  totalDeductions,
  formatCurrency,
}: PayrollStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Active Employees</CardDescription>
          <CardTitle className="text-2xl">{loading ? '...' : activeEmployees}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">Eligible for payroll</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Pending Payroll</CardDescription>
          <CardTitle className="text-2xl">{loading ? '...' : formatCurrency(pendingPayroll)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">Draft & submitted</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>YTD Payroll</CardDescription>
          <CardTitle className="text-2xl">{loading ? '...' : formatCurrency(ytdPayroll)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-xs text-gray-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>Total paid this year</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>YTD Deductions</CardDescription>
          <CardTitle className="text-2xl">{loading ? '...' : formatCurrency(totalDeductions)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">SSS, PhilHealth, Pag-IBIG, Tax</p>
        </CardContent>
      </Card>
    </div>
  )
}
