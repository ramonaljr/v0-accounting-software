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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Loader2, CheckCircle, XCircle, CalendarDays, Heart, Umbrella, Briefcase, Users } from 'lucide-react'
import type { LeaveApplication } from './types'

interface LeaveApplicationsTableProps {
  applications: LeaveApplication[];
  loading: boolean;
  isPending: boolean;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCreateFirst: () => void;
}

function getLeaveIcon(typeName: string) {
  const name = typeName.toLowerCase();
  if (name.includes('sick') || name.includes('medical')) return <Heart className="h-4 w-4" />;
  if (name.includes('vacation') || name.includes('annual')) return <Umbrella className="h-4 w-4" />;
  if (name.includes('maternity') || name.includes('paternity')) return <Users className="h-4 w-4" />;
  return <Briefcase className="h-4 w-4" />;
}

export function LeaveApplicationsTable({
  applications,
  loading,
  isPending,
  statusFilter,
  onStatusFilterChange,
  onApprove,
  onReject,
  onCreateFirst,
}: LeaveApplicationsTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Applications
            </CardTitle>
            <CardDescription>Employee leave requests and status</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="Open">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No leave applications found</p>
            <Button className="mt-4" variant="outline" onClick={onCreateFirst}>
              Create First Leave Request
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{app.employee_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{app.employee_no}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getLeaveIcon(app.leave_type_name || '')}
                        {app.leave_type_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(app.from_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      {' - '}
                      {new Date(app.to_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell>{app.total_leave_days}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          app.status === 'Approved'
                            ? 'default'
                            : app.status === 'Open'
                            ? 'secondary'
                            : app.status === 'Rejected'
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {app.status === 'Open' ? 'Pending' : app.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {app.status === 'Open' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-600"
                            onClick={() => onApprove(app.id)}
                            disabled={isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => onReject(app.id)}
                            disabled={isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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
