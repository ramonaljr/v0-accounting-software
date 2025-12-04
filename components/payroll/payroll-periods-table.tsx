'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar } from 'lucide-react'
import type { PayrollPeriod } from './types'

interface PayrollPeriodsTableProps {
  periods: PayrollPeriod[];
}

export function PayrollPeriodsTable({
  periods,
}: PayrollPeriodsTableProps) {
  if (periods.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Payroll Periods
        </CardTitle>
        <CardDescription>Defined payroll cycles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period Name</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium">{period.period_name}</TableCell>
                  <TableCell>
                    {new Date(period.start_date).toLocaleDateString('en-PH')}
                    {' - '}
                    {new Date(period.end_date).toLocaleDateString('en-PH')}
                  </TableCell>
                  <TableCell>{period.payroll_frequency}</TableCell>
                  <TableCell>
                    <Badge variant={period.status === 'Closed' ? 'secondary' : 'default'}>
                      {period.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
