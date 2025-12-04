'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Heart, Umbrella, Briefcase, Users } from 'lucide-react'
import type { LeaveBalance } from './types'

interface LeaveBalancesTableProps {
  balances: LeaveBalance[];
  loading: boolean;
}

function getLeaveIcon(typeName: string) {
  const name = typeName.toLowerCase();
  if (name.includes('sick') || name.includes('medical')) return <Heart className="h-4 w-4" />;
  if (name.includes('vacation') || name.includes('annual')) return <Umbrella className="h-4 w-4" />;
  if (name.includes('maternity') || name.includes('paternity')) return <Users className="h-4 w-4" />;
  return <Briefcase className="h-4 w-4" />;
}

export function LeaveBalancesTable({
  balances,
  loading,
}: LeaveBalancesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Balances</CardTitle>
        <CardDescription>Employee leave allocations and usage</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : balances.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No leave balances found. Allocate leaves to employees first.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead className="text-right">Total Allocated</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((balance, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getLeaveIcon(balance.leave_type_name)}
                        {balance.leave_type_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{balance.total_allocated}</TableCell>
                    <TableCell className="text-right">{balance.total_used}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {balance.available}
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
