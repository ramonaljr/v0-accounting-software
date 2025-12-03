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
import {
  FileText,
  Search,
  Loader2,
  Eye,
  Send,
  XCircle,
  DollarSign,
  Download,
  Calendar,
} from 'lucide-react';
import {
  listSalarySlips,
  getSalarySlip,
  submitPayrollEntry,
  cancelPayrollEntry,
  listEmployees,
} from '@/lib/actions/hr';
import type { Employee } from '@/lib/models/hr';

interface SalarySlipDetail {
  id: string;
  employee_id: string;
  employee_no?: string;
  employee_name?: string;
  department_name?: string;
  designation_name?: string;
  start_date: string;
  end_date: string;
  posting_date: string;
  payroll_frequency: string;
  payment_days: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  status: 'Draft' | 'Submitted' | 'Paid' | 'Cancelled';
  earnings: Array<{
    component_name: string;
    amount: number;
    is_taxable: boolean;
  }>;
  deductions: Array<{
    component_name: string;
    amount: number;
  }>;
  created_at: string;
}

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

export default function SalarySlipsPage() {
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlipDetail | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [slipsResult, empResult] = await Promise.all([
          listSalarySlips({
            status: statusFilter || undefined,
            employeeId: employeeFilter || undefined,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
            limit: 100,
          }),
          listEmployees(),
        ]);

        if (slipsResult.success && slipsResult.data) {
          setSalarySlips(slipsResult.data.salarySlips || []);
          setTotal(slipsResult.data.total || 0);
        }
        if (empResult.success && empResult.data) {
          setEmployees(empResult.data.employees || []);
        }
      } catch (error) {
        console.error('Failed to load salary slips:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [statusFilter, employeeFilter, fromDate, toDate]);

  // View salary slip details
  async function handleView(id: string) {
    startTransition(async () => {
      const result = await getSalarySlip(id);
      if (result.success && result.data) {
        setSelectedSlip(result.data as SalarySlipDetail);
        setIsViewDialogOpen(true);
      } else {
        alert(result.error || 'Failed to load salary slip');
      }
    });
  }

  // Submit salary slip
  async function handleSubmit(id: string) {
    startTransition(async () => {
      const result = await submitPayrollEntry(id);
      if (result.success) {
        // Reload list
        const slipsResult = await listSalarySlips({ limit: 100 });
        if (slipsResult.success && slipsResult.data) {
          setSalarySlips(slipsResult.data.salarySlips || []);
        }
      } else {
        alert(result.error || 'Failed to submit salary slip');
      }
    });
  }

  // Cancel salary slip
  async function handleCancel(id: string) {
    if (!confirm('Are you sure you want to cancel this salary slip?')) return;

    startTransition(async () => {
      const result = await cancelPayrollEntry(id);
      if (result.success) {
        const slipsResult = await listSalarySlips({ limit: 100 });
        if (slipsResult.success && slipsResult.data) {
          setSalarySlips(slipsResult.data.salarySlips || []);
        }
        setIsViewDialogOpen(false);
      } else {
        alert(result.error || 'Failed to cancel salary slip');
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

  // Filter by search query
  const filteredSlips = salarySlips.filter(slip => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      slip.employee_name?.toLowerCase().includes(query) ||
      slip.employee_no?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Slips</h1>
          <p className="text-gray-600 mt-1">View and manage employee salary slips</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search employee..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Employees</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <Input
                type="date"
                placeholder="From date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="To date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Slips Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Salary Slips ({total})
          </CardTitle>
          <CardDescription>Employee payroll records</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredSlips.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No salary slips found</p>
              <p className="text-sm mt-2">Run payroll to generate salary slips</p>
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSlips.map((slip) => (
                    <TableRow key={slip.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{slip.employee_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{slip.employee_no}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(slip.start_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                          {' - '}
                          {new Date(slip.end_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
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
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleView(slip.id)}
                            disabled={isPending}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {slip.status === 'Draft' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600"
                              onClick={() => handleSubmit(slip.id)}
                              disabled={isPending}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {(slip.status === 'Draft' || slip.status === 'Submitted') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => handleCancel(slip.id)}
                              disabled={isPending}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Salary Slip Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Salary Slip Details</DialogTitle>
            <DialogDescription>
              Pay period: {selectedSlip && new Date(selectedSlip.start_date).toLocaleDateString('en-PH')} -{' '}
              {selectedSlip && new Date(selectedSlip.end_date).toLocaleDateString('en-PH')}
            </DialogDescription>
          </DialogHeader>

          {selectedSlip && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-xs">Employee</Label>
                    <p className="font-medium">{selectedSlip.employee_name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Employee ID</Label>
                    <p className="font-mono">{selectedSlip.employee_no}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Department</Label>
                    <p>{selectedSlip.department_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Designation</Label>
                    <p>{selectedSlip.designation_name || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Earnings */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-green-700">Earnings</h4>
                <div className="space-y-2">
                  {selectedSlip.earnings?.length > 0 ? (
                    selectedSlip.earnings.map((earning, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">
                          {earning.component_name}
                          {earning.is_taxable && <span className="text-xs text-gray-400 ml-1">(Taxable)</span>}
                        </span>
                        <span className="font-medium">{formatCurrency(earning.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No earnings recorded</p>
                  )}
                  <div className="flex justify-between items-center py-2 bg-green-50 px-2 rounded font-semibold">
                    <span>Gross Pay</span>
                    <span>{formatCurrency(selectedSlip.gross_pay)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-red-700">Deductions</h4>
                <div className="space-y-2">
                  {selectedSlip.deductions?.length > 0 ? (
                    selectedSlip.deductions.map((deduction, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">{deduction.component_name}</span>
                        <span className="font-medium text-red-600">({formatCurrency(deduction.amount)})</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No deductions recorded</p>
                  )}
                  <div className="flex justify-between items-center py-2 bg-red-50 px-2 rounded font-semibold">
                    <span>Total Deductions</span>
                    <span className="text-red-600">({formatCurrency(selectedSlip.total_deductions)})</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Net Pay</span>
                  <span className="text-2xl font-bold text-blue-700">{formatCurrency(selectedSlip.net_pay)}</span>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Badge
                  variant={
                    selectedSlip.status === 'Paid'
                      ? 'default'
                      : selectedSlip.status === 'Submitted'
                      ? 'secondary'
                      : selectedSlip.status === 'Cancelled'
                      ? 'destructive'
                      : 'outline'
                  }
                >
                  {selectedSlip.status}
                </Badge>
                <div className="flex gap-2">
                  {selectedSlip.status === 'Draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleSubmit(selectedSlip.id)}
                      disabled={isPending}
                    >
                      {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Send className="h-4 w-4 mr-2" />
                      Submit
                    </Button>
                  )}
                  {(selectedSlip.status === 'Draft' || selectedSlip.status === 'Submitted') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancel(selectedSlip.id)}
                      disabled={isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
