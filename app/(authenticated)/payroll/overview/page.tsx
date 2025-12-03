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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Users, TrendingUp, Play, Loader2, Calendar, FileText, AlertCircle } from 'lucide-react';
import { listEmployees } from '@/lib/actions/hr';
import { listSalarySlips, createBulkPayrollEntries, processBulkPayroll, listPayrollPeriods, createPayrollPeriod } from '@/lib/actions/hr';
import type { Employee } from '@/lib/models/hr';

interface SalarySlip {
  id: string;
  employee_id: string;
  employee_no?: string;
  employee_name?: string;
  start_date: string;
  end_date: string;
  posting_date: string;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  status: 'Draft' | 'Submitted' | 'Paid' | 'Cancelled';
  created_at: string;
}

interface PayrollPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  payroll_frequency: string;
  status: string;
}

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
          // Pre-select all active employees
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

      // Create payroll entries
      const createResult = await createBulkPayrollEntries(
        '00000000-0000-0000-0000-000000000000', // Default org ID
        selectedEmployees,
        startDate,
        endDate,
        postingDate
      );

      if (!createResult.success) {
        alert(createResult.error || 'Failed to create payroll entries');
        return;
      }

      // Process the payroll
      const entries = (createResult.data as { success: string[] })?.success || [];
      if (entries.length > 0) {
        // For now, we'll just show success - processing would need the entry IDs
        alert(`Created ${entries.length} payroll entries successfully`);
        setIsRunPayrollOpen(false);

        // Reload salary slips
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
        startDate,
        endDate,
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

  // Format currency
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
          <Dialog open={isCreatePeriodOpen} onOpenChange={setIsCreatePeriodOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                New Period
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payroll Period</DialogTitle>
                <DialogDescription>
                  Define a new payroll period for your organization.
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreatePeriod} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="periodName">Period Name *</Label>
                  <Input id="periodName" name="periodName" placeholder="e.g., January 2025" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input id="startDate" name="startDate" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input id="endDate" name="endDate" type="date" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payrollFrequency">Frequency *</Label>
                  <Select name="payrollFrequency" defaultValue="Semi-Monthly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Semi-Monthly">Semi-Monthly</SelectItem>
                      <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreatePeriodOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Period
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isRunPayrollOpen} onOpenChange={setIsRunPayrollOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Play className="h-4 w-4 mr-2" />
                Run Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Run Payroll</DialogTitle>
                <DialogDescription>
                  Process payroll for selected employees. This will calculate earnings, deductions, and taxes.
                </DialogDescription>
              </DialogHeader>
              <form action={handleRunPayroll} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Period Start *</Label>
                    <Input id="startDate" name="startDate" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Period End *</Label>
                    <Input id="endDate" name="endDate" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postingDate">Posting Date *</Label>
                    <Input id="postingDate" name="postingDate" type="date" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Employees</Label>
                  <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.length === employees.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmployees(employees.map(emp => emp.id));
                          } else {
                            setSelectedEmployees([]);
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Select All ({employees.length} employees)</span>
                    </div>
                    {employees.map((emp) => (
                      <div key={emp.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees([...selectedEmployees, emp.id]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{emp.fullName}</span>
                        <span className="text-xs text-gray-500">({emp.employeeNo})</span>
                      </div>
                    ))}
                    {employees.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No active employees found</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{selectedEmployees.length} employees selected</p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsRunPayrollOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending || selectedEmployees.length === 0}>
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Run Payroll
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Recent Payroll Runs */}
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
          ) : recentRuns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No payroll runs yet</p>
              <Button className="mt-4" variant="outline" onClick={() => setIsRunPayrollOpen(true)}>
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
                  {recentRuns.map((slip) => (
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

      {/* Payroll Periods */}
      {payrollPeriods.length > 0 && (
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
                  {payrollPeriods.map((period) => (
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
      )}
    </div>
  );
}
