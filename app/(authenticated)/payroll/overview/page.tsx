'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  PayrollStatsCards,
  SalarySlipsTable,
  PayrollPeriodsTable,
  CreatePeriodDialog,
  RunPayrollDialog,
} from '@/components/payroll';
import type { SalarySlip, PayrollPeriod } from '@/components/payroll';
import { listEmployees } from '@/lib/actions/hr';
import { listSalarySlips, createBulkPayrollEntries, listPayrollPeriods, createPayrollPeriod } from '@/lib/actions/hr';
import type { Employee } from '@/lib/models/hr';

export default function PayrollOverviewPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRunPayrollOpen, setIsRunPayrollOpen] = useState(false);
  const [isCreatePeriodOpen, setIsCreatePeriodOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Calculate stats
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const ytdPayroll = salarySlips
    .filter(s => s.status === 'Paid' && new Date(s.posting_date).getFullYear() === new Date().getFullYear())
    .reduce((sum, s) => sum + (s.net_pay || 0), 0);
  const pendingPayroll = salarySlips
    .filter(s => s.status === 'Draft' || s.status === 'Submitted')
    .reduce((sum, s) => sum + (s.net_pay || 0), 0);
  const totalDeductions = salarySlips
    .filter(s => s.status === 'Paid' && new Date(s.posting_date).getFullYear() === new Date().getFullYear())
    .reduce((sum, s) => sum + (s.total_deductions || 0), 0);

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [empResult, slipsResult, periodsResult] = await Promise.all([
          listEmployees({ status: 'Active' }),
          listSalarySlips({ limit: 50 }),
          listPayrollPeriods(),
        ]);

        if (empResult.success && empResult.data) {
          const empData = empResult.data as { employees?: Employee[] };
          setEmployees(empData.employees || []);
          setSelectedEmployees(empData.employees?.map((e: Employee) => e.id) || []);
        }
        if (slipsResult.success && slipsResult.data) {
          const slipsData = slipsResult.data as { salarySlips?: SalarySlip[] };
          setSalarySlips(slipsData.salarySlips || []);
        }
        if (periodsResult.success && periodsResult.data) {
          setPayrollPeriods(periodsResult.data as PayrollPeriod[]);
        }
      } catch (error) {
        console.error('Failed to load payroll data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle run payroll
  async function handleRunPayroll(formData: FormData) {
    startTransition(async () => {
      const startDate = formData.get('startDate') as string;
      const endDate = formData.get('endDate') as string;
      const postingDate = formData.get('postingDate') as string;

      if (!startDate || !endDate || !postingDate) {
        alert('Please fill in all required fields');
        return;
      }

      if (selectedEmployees.length === 0) {
        alert('Please select at least one employee');
        return;
      }

      const createResult = await createBulkPayrollEntries(
        '00000000-0000-0000-0000-000000000000',
        selectedEmployees,
        startDate,
        endDate,
        postingDate
      );

      if (!createResult.success) {
        alert(createResult.error || 'Failed to create payroll entries');
        return;
      }

      const entries = (createResult.data as { success: string[] })?.success || [];
      if (entries.length > 0) {
        alert(`Created ${entries.length} payroll entries successfully`);
        setIsRunPayrollOpen(false);

        const slipsResult = await listSalarySlips({ limit: 50 });
        if (slipsResult.success && slipsResult.data) {
          const slipsData = slipsResult.data as { salarySlips?: SalarySlip[] };
          setSalarySlips(slipsData.salarySlips || []);
        }
      }
    });
  }

  // Handle create period
  async function handleCreatePeriod(formData: FormData) {
    startTransition(async () => {
      const periodName = formData.get('periodName') as string;
      const startDate = formData.get('startDate') as string;
      const endDate = formData.get('endDate') as string;
      const payrollFrequency = formData.get('payrollFrequency') as 'Monthly' | 'Semi-Monthly' | 'Weekly' | 'Bi-Weekly';

      const result = await createPayrollPeriod({
        orgId: '00000000-0000-0000-0000-000000000000',
        periodName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        payrollFrequency,
      });

      if (result.success) {
        setIsCreatePeriodOpen(false);
        const periodsResult = await listPayrollPeriods();
        if (periodsResult.success && periodsResult.data) {
          setPayrollPeriods(periodsResult.data as PayrollPeriod[]);
        }
      } else {
        alert(result.error || 'Failed to create payroll period');
      }
    });
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  // Get recent payroll runs (last 10)
  const recentRuns = [...salarySlips]
    .sort((a, b) => new Date(b.posting_date).getTime() - new Date(a.posting_date).getTime())
    .slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Overview</h1>
          <p className="text-gray-600 mt-1">Manage employee compensation and payroll processing</p>
        </div>
        <div className="flex gap-2">
          <CreatePeriodDialog
            open={isCreatePeriodOpen}
            onOpenChange={setIsCreatePeriodOpen}
            isPending={isPending}
            onSubmit={handleCreatePeriod}
          />
          <RunPayrollDialog
            open={isRunPayrollOpen}
            onOpenChange={setIsRunPayrollOpen}
            employees={employees}
            selectedEmployees={selectedEmployees}
            onSelectedEmployeesChange={setSelectedEmployees}
            isPending={isPending}
            onSubmit={handleRunPayroll}
          />
        </div>
      </div>

      <PayrollStatsCards
        loading={loading}
        activeEmployees={activeEmployees}
        pendingPayroll={pendingPayroll}
        ytdPayroll={ytdPayroll}
        totalDeductions={totalDeductions}
        formatCurrency={formatCurrency}
      />

      <SalarySlipsTable
        salarySlips={recentRuns}
        loading={loading}
        onRunPayroll={() => setIsRunPayrollOpen(true)}
        formatCurrency={formatCurrency}
      />

      <PayrollPeriodsTable periods={payrollPeriods} />
    </div>
  );
}
