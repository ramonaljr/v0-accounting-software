'use client';

import { useEffect, useState, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LeaveStatsCards,
  LeaveApplicationsTable,
  LeaveBalancesTable,
  LeaveTypesGrid,
  CreateLeaveDialog,
} from '@/components/leave';
import type { LeaveType, LeaveApplication, LeaveBalance } from '@/components/leave';
import {
  listEmployees,
  listLeaveTypes,
  listLeaveApplications,
  createLeaveApplication,
  approveLeaveApplication,
  rejectLeaveApplication,
} from '@/lib/actions/hr';
import type { Employee } from '@/lib/models/hr';

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
          listLeaveApplications({ status: statusFilter as LeaveApplication['status'] || undefined }),
        ]);

        if (empResult.success && empResult.data) {
          const data = empResult.data as { employees?: Employee[] };
          setEmployees(data.employees || []);
        }
        if (typesResult.success && typesResult.data) {
          setLeaveTypes(typesResult.data as LeaveType[]);
        }
        if (appsResult.success && appsResult.data) {
          const data = appsResult.data as { applications?: LeaveApplication[] };
          setApplications(data.applications || []);
        }
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
        orgId: '00000000-0000-0000-0000-000000000000',
        employeeId,
        leaveTypeId,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        halfDay: false,
        reason,
      });

      if (result.success) {
        setIsDialogOpen(false);
        const appsResult = await listLeaveApplications();
        if (appsResult.success && appsResult.data) {
          const data = appsResult.data as { applications?: LeaveApplication[] };
          setApplications(data.applications || []);
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
          const data = appsResult.data as { applications?: LeaveApplication[] };
          setApplications(data.applications || []);
        }
      } else {
        alert(result.error || 'Failed to approve leave');
      }
    });
  }

  // Handle reject
  async function handleReject(id: string) {
    startTransition(async () => {
      const reason = prompt('Rejection reason (optional):') || '';
      const result = await rejectLeaveApplication(id, reason);
      if (result.success) {
        const appsResult = await listLeaveApplications();
        if (appsResult.success && appsResult.data) {
          const data = appsResult.data as { applications?: LeaveApplication[] };
          setApplications(data.applications || []);
        }
      } else {
        alert(result.error || 'Failed to reject leave');
      }
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">Manage employee leave applications and balances</p>
        </div>
        <CreateLeaveDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          employees={employees}
          leaveTypes={leaveTypes}
          selectedEmployee={selectedEmployee}
          onSelectedEmployeeChange={setSelectedEmployee}
          isPending={isPending}
          onSubmit={handleCreateLeave}
        />
      </div>

      <LeaveStatsCards
        loading={loading}
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        onLeaveToday={onLeaveToday}
        leaveTypesCount={leaveTypes.length}
      />

      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">Leave Applications</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="types">Leave Types</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-4">
          <LeaveApplicationsTable
            applications={applications}
            loading={loading}
            isPending={isPending}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onApprove={handleApprove}
            onReject={handleReject}
            onCreateFirst={() => setIsDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="balances" className="mt-4">
          <LeaveBalancesTable
            balances={balances}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="types" className="mt-4">
          <LeaveTypesGrid
            leaveTypes={leaveTypes}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
