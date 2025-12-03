'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
  Umbrella,
  Briefcase,
  Heart,
  Users,
} from 'lucide-react';
import {
  listEmployees,
  listLeaveTypes,
  listLeaveApplications,
  createLeaveApplication,
  approveLeaveApplication,
  rejectLeaveApplication,
} from '@/lib/actions/hr';
import type { Employee } from '@/lib/models/hr';

interface LeaveType {
  id: string;
  leave_type_name: string;
  max_leaves_allowed: number;
  is_paid: boolean;
  is_carry_forward: boolean;
}

interface LeaveApplication {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_no?: string;
  leave_type_id: string;
  leave_type_name?: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  status: 'Open' | 'Approved' | 'Rejected' | 'Cancelled';
  reason?: string;
  created_at: string;
}

interface LeaveBalance {
  leave_type_id: string;
  leave_type_name: string;
  total_allocated: number;
  total_used: number;
  available: number;
}

export default function LeavePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Stats
  const pendingCount = applications.filter(a => a.status === 'Open').length;
  const approvedCount = applications.filter(a => a.status === 'Approved').length;
  const onLeaveToday = applications.filter(a => {
    const today = new Date();
    const from = new Date(a.from_date);
    const to = new Date(a.to_date);
    return a.status === 'Approved' && today >= from && today <= to;
  }).length;

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [empResult, typesResult, appsResult] = await Promise.all([
          listEmployees({ status: 'Active' }),
          listLeaveTypes(),
          listLeaveApplications({ status: statusFilter as any || undefined }),
        ]);

        if (empResult.success && empResult.data) {
          setEmployees(empResult.data.employees || []);
        }
        if (typesResult.success && typesResult.data) {
          setLeaveTypes(typesResult.data || []);
        }
        if (appsResult.success && appsResult.data) {
          setApplications(appsResult.data.applications || []);
        }
        // Leave balances would be loaded per employee when selected
      } catch (error) {
        console.error('Failed to load leave data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [statusFilter]);

  // Handle create leave application
  async function handleCreateLeave(formData: FormData) {
    startTransition(async () => {
      const employeeId = formData.get('employeeId') as string;
      const leaveTypeId = formData.get('leaveTypeId') as string;
      const fromDate = formData.get('fromDate') as string;
      const toDate = formData.get('toDate') as string;
      const reason = formData.get('reason') as string;

      const result = await createLeaveApplication({
        orgId: '00000000-0000-0000-0000-000000000000', // Default org ID
        employeeId,
        leaveTypeId,
        fromDate,
        toDate,
        reason,
      });

      if (result.success) {
        setIsDialogOpen(false);
        // Reload applications
        const appsResult = await listLeaveApplications();
        if (appsResult.success && appsResult.data) {
          setApplications(appsResult.data.applications || []);
        }
      } else {
        alert(result.error || 'Failed to create leave application');
      }
    });
  }

  // Handle approve
  async function handleApprove(id: string) {
    startTransition(async () => {
      const result = await approveLeaveApplication(id);
      if (result.success) {
        const appsResult = await listLeaveApplications();
        if (appsResult.success && appsResult.data) {
          setApplications(appsResult.data.applications || []);
        }
      } else {
        alert(result.error || 'Failed to approve leave');
      }
    });
  }

  // Handle reject
  async function handleReject(id: string) {
    startTransition(async () => {
      const reason = prompt('Rejection reason (optional):');
      const result = await rejectLeaveApplication(id, reason || undefined);
      if (result.success) {
        const appsResult = await listLeaveApplications();
        if (appsResult.success && appsResult.data) {
          setApplications(appsResult.data.applications || []);
        }
      } else {
        alert(result.error || 'Failed to reject leave');
      }
    });
  }

  // Get leave icon based on type
  const getLeaveIcon = (typeName: string) => {
    const name = typeName.toLowerCase();
    if (name.includes('sick') || name.includes('medical')) return <Heart className="h-4 w-4" />;
    if (name.includes('vacation') || name.includes('annual')) return <Umbrella className="h-4 w-4" />;
    if (name.includes('maternity') || name.includes('paternity')) return <Users className="h-4 w-4" />;
    return <Briefcase className="h-4 w-4" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">Manage employee leave applications and balances</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Leave Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Leave Application</DialogTitle>
              <DialogDescription>
                Submit a leave request for an employee.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateLeave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee *</Label>
                <Select name="employeeId" value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeNo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveTypeId">Leave Type *</Label>
                <Select name="leaveTypeId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.leave_type_name} {type.is_paid ? '(Paid)' : '(Unpaid)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromDate">From Date *</Label>
                  <Input id="fromDate" name="fromDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toDate">To Date *</Label>
                  <Input id="toDate" name="toDate" type="date" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" name="reason" placeholder="Reason for leave..." />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
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
            <CardTitle className="text-2xl">{loading ? '...' : leaveTypes.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Configured</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">Leave Applications</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="types">Leave Types</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-4">
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  <Button className="mt-4" variant="outline" onClick={() => setIsDialogOpen(true)}>
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
                                  onClick={() => handleApprove(app.id)}
                                  disabled={isPending}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600"
                                  onClick={() => handleReject(app.id)}
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
        </TabsContent>

        <TabsContent value="balances" className="mt-4">
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
        </TabsContent>

        <TabsContent value="types" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Types</CardTitle>
              <CardDescription>Configured leave categories</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : leaveTypes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No leave types configured. Contact administrator to set up leave types.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leaveTypes.map((type) => (
                    <Card key={type.id} className="bg-gray-50">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-full">
                            {getLeaveIcon(type.leave_type_name)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{type.leave_type_name}</h4>
                            <p className="text-sm text-gray-600">
                              {type.max_leaves_allowed} days/year
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge variant={type.is_paid ? 'default' : 'outline'} className="text-xs">
                              {type.is_paid ? 'Paid' : 'Unpaid'}
                            </Badge>
                            {type.is_carry_forward && (
                              <Badge variant="secondary" className="text-xs">
                                Carry Forward
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
