'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DollarSign, Loader2, FileText } from 'lucide-react'
import type { SalarySlip } from './types'

interface SalarySlipsTableProps {
  salarySlips: SalarySlip[];
  loading: boolean;
  onRunPayroll: () => void;
  formatCurrency: (amount: number) => string;
}

export function SalarySlipsTable({
  salarySlips,
  loading,
  onRunPayroll,
  formatCurrency,
}: SalarySlipsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Recent Salary Slips
        </CardTitle>
        <CardDescription>Latest payroll processing records</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : salarySlips.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No payroll runs yet</p>
            <Button className="mt-4" variant="outline" onClick={onRunPayroll}>
              Run Your First Payroll
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salarySlips.map((slip) => (
                  <TableRow key={slip.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{slip.employee_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{slip.employee_no}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(slip.start_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      {' - '}
                      {new Date(slip.end_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(slip.gross_pay || 0)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(slip.total_deductions || 0)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(slip.net_pay || 0)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          slip.status === 'Paid'
                            ? 'default'
                            : slip.status === 'Submitted'
                            ? 'secondary'
                            : slip.status === 'Cancelled'
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {slip.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
