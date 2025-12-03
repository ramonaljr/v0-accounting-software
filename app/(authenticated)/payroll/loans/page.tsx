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
import { Textarea } from '@/components/ui/textarea';
import {
  Wallet,
  Plus,
  Loader2,
  Banknote,
  TrendingDown,
  Clock,
  CheckCircle,
  Building,
  CreditCard,
} from 'lucide-react';
import { listEmployees } from '@/lib/actions/hr';
import type { Employee } from '@/lib/models/hr';

interface Loan {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_no?: string;
  loan_type: 'SSS Loan' | 'Pag-IBIG Loan' | 'Company Loan' | 'Cash Advance' | 'Other';
  description?: string;
  loan_amount: number;
  total_amount_paid: number;
  balance_amount: number;
  monthly_repayment: number;
  interest_rate: number;
  repayment_start_date: string;
  repayment_period_months: number;
  status: 'Draft' | 'Approved' | 'Disbursed' | 'Repaying' | 'Closed' | 'Cancelled';
  application_date: string;
  created_at: string;
}

export default function LoansPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Stats
  const activeLoans = loans.filter(l => l.status === 'Repaying' || l.status === 'Disbursed').length;
  const totalOutstanding = loans
    .filter(l => l.status === 'Repaying' || l.status === 'Disbursed')
    .reduce((sum, l) => sum + (l.balance_amount || 0), 0);
  const monthlyDeductions = loans
    .filter(l => l.status === 'Repaying')
    .reduce((sum, l) => sum + (l.monthly_repayment || 0), 0);
  const pendingApproval = loans.filter(l => l.status === 'Draft').length;

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [empResult, loansResult] = await Promise.all([
          listEmployees({ status: 'Active' }),
          fetchLoans(),
        ]);

        if (empResult.success && empResult.data) {
          const data = empResult.data as { employees?: Employee[] };
          setEmployees(data.employees || []);
        }
        if (loansResult) {
          setLoans(loansResult);
        }
      } catch (error) {
        console.error('Failed to load loan data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [statusFilter, typeFilter]);

  // Fetch loans from API
  async function fetchLoans(): Promise<Loan[]> {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('loanType', typeFilter);

      const response = await fetch(`/api/hr/loans?${params.toString()}`);
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Failed to fetch loans:', error);
      return [];
    }
  }

  // Handle create loan
  async function handleCreateLoan(formData: FormData) {
    startTransition(async () => {
      const data = {
        employeeId: formData.get('employeeId') as string,
        loanType: formData.get('loanType') as string,
        description: formData.get('description') as string,
        loanAmount: parseFloat(formData.get('loanAmount') as string),
        interestRate: parseFloat(formData.get('interestRate') as string) || 0,
        repaymentStartDate: formData.get('repaymentStartDate') as string,
        repaymentPeriodMonths: parseInt(formData.get('repaymentPeriodMonths') as string),
        applicationDate: formData.get('applicationDate') as string,
      };

      try {
        const response = await fetch('/api/hr/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          setIsDialogOpen(false);
          const loansResult = await fetchLoans();
          setLoans(loansResult);
        } else {
          alert(result.error || 'Failed to create loan');
        }
      } catch (error) {
        alert('Failed to create loan');
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

  // Get loan icon based on type
  const getLoanIcon = (type: string) => {
    switch (type) {
      case 'SSS Loan':
        return <Building className="h-4 w-4 text-blue-600" />;
      case 'Pag-IBIG Loan':
        return <Building className="h-4 w-4 text-green-600" />;
      case 'Company Loan':
        return <Banknote className="h-4 w-4 text-purple-600" />;
      case 'Cash Advance':
        return <CreditCard className="h-4 w-4 text-orange-600" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Repaying':
        return 'default';
      case 'Disbursed':
        return 'secondary';
      case 'Approved':
        return 'outline';
      case 'Closed':
        return 'default';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Loans</h1>
          <p className="text-gray-600 mt-1">Manage employee loans and repayments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Loan</DialogTitle>
              <DialogDescription>
                Record a new employee loan for payroll deductions.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateLoan} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee *</Label>
                <Select name="employeeId" required>
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
                <Label htmlFor="loanType">Loan Type *</Label>
                <Select name="loanType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SSS Loan">SSS Loan</SelectItem>
                    <SelectItem value="Pag-IBIG Loan">Pag-IBIG Loan</SelectItem>
                    <SelectItem value="Company Loan">Company Loan</SelectItem>
                    <SelectItem value="Cash Advance">Cash Advance</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loanAmount">Loan Amount (PHP) *</Label>
                  <Input
                    id="loanAmount"
                    name="loanAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    name="interestRate"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repaymentPeriodMonths">Repayment Period (months) *</Label>
                  <Input
                    id="repaymentPeriodMonths"
                    name="repaymentPeriodMonths"
                    type="number"
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repaymentStartDate">Repayment Start Date *</Label>
                  <Input
                    id="repaymentStartDate"
                    name="repaymentStartDate"
                    type="date"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicationDate">Application Date</Label>
                <Input
                  id="applicationDate"
                  name="applicationDate"
                  type="date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Additional details about the loan..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Loan
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
            <CardDescription>Active Loans</CardDescription>
            <CardTitle className="text-2xl">{loading ? '...' : activeLoans}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Currently in repayment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Outstanding</CardDescription>
            <CardTitle className="text-2xl">{loading ? '...' : formatCurrency(totalOutstanding)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Remaining balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Monthly Deductions</CardDescription>
            <CardTitle className="text-2xl">{loading ? '...' : formatCurrency(monthlyDeductions)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-gray-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              <span>From payroll</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Approval</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{loading ? '...' : pendingApproval}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Loan Records
              </CardTitle>
              <CardDescription>Employee loans and repayment status</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="SSS Loan">SSS Loan</SelectItem>
                  <SelectItem value="Pag-IBIG Loan">Pag-IBIG Loan</SelectItem>
                  <SelectItem value="Company Loan">Company Loan</SelectItem>
                  <SelectItem value="Cash Advance">Cash Advance</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Disbursed">Disbursed</SelectItem>
                  <SelectItem value="Repaying">Repaying</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : loans.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Banknote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No loans recorded yet</p>
              <Button className="mt-4" variant="outline" onClick={() => setIsDialogOpen(true)}>
                Record First Loan
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Loan Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Monthly</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{loan.employee_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{loan.employee_no}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLoanIcon(loan.loan_type)}
                          {loan.loan_type}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(loan.loan_amount)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(loan.balance_amount)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(loan.monthly_repayment)}
                      </TableCell>
                      <TableCell>
                        {new Date(loan.repayment_start_date).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(loan.status)}>
                          {loan.status}
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
    </div>
  );
}
