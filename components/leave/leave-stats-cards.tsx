'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LeaveStatsCardsProps {
  loading: boolean;
  pendingCount: number;
  approvedCount: number;
  onLeaveToday: number;
  leaveTypesCount: number;
}

export function LeaveStatsCards({
  loading,
  pendingCount,
  approvedCount,
  onLeaveToday,
  leaveTypesCount,
}: LeaveStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Pending Requests</CardDescription>
          <CardTitle className="text-2xl text-yellow-600">{loading ? '...' : pendingCount}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">Awaiting approval</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Approved This Month</CardDescription>
          <CardTitle className="text-2xl text-green-600">{loading ? '...' : approvedCount}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">Leave requests</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>On Leave Today</CardDescription>
          <CardTitle className="text-2xl">{loading ? '...' : onLeaveToday}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">Employees</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Leave Types</CardDescription>
          <CardTitle className="text-2xl">{loading ? '...' : leaveTypesCount}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">Configured</p>
        </CardContent>
      </Card>
    </div>
  )
}
