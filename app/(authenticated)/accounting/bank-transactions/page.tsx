'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Plus,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  RefreshCw,
} from 'lucide-react';
import {
  listBankTransactions,
  listBankAccounts,
  createBankTransaction,
  reconcileBankTransaction,
  ignoreBankTransaction,
  getBankTransactionStats,
  createBankAccount,
} from '@/lib/actions/banking';

interface BankTransaction {
  id: string;
  bankAccountId: string;
  bankAccountName?: string;
  transactionDate: string;
  description: string;
  merchantName?: string;
  amount: number;
  currency: string;
  transactionType: 'debit' | 'credit' | 'fee' | 'interest' | 'transfer';
  assignedAccountId?: string;
  assignedAccountName?: string;
  isReconciled: boolean;
  status: 'pending' | 'categorized' | 'reconciled' | 'ignored';
}

interface BankAccount {
  id: string;
  accountName: string;
  bankName?: string;
  accountType: string;
  currentBalance: number;
  currency: string;
}

interface Stats {
  total: number;
  uncategorized: number;
  categorized: number;
  reconciled: number;
  totalCredits: number;
  totalDebits: number;
}

export default function BankTransactionsPage() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [txResult, accountsResult, statsResult] = await Promise.all([
          listBankTransactions({
            status: statusFilter || undefined,
            bankAccountId: accountFilter || undefined,
            search: searchQuery || undefined,
          }),
          listBankAccounts({ isActive: true }),
          getBankTransactionStats(accountFilter || undefined),
        ]);

        if (txResult.success) {
          setTransactions(txResult.data as BankTransaction[] || []);
        }
        if (accountsResult.success) {
          setBankAccounts(accountsResult.data as BankAccount[] || []);
        }
        if (statsResult.success) {
          setStats(statsResult.data as Stats);
        }
      } catch (error) {
        console.error('Failed to load bank transactions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [statusFilter, accountFilter, searchQuery]);

  // Handle create transaction
  async function handleCreateTransaction(formData: FormData) {
    startTransition(async () => {
      const amount = parseFloat(formData.get('amount') as string);
      const transactionType = formData.get('transactionType') as string;

      const data = {
        bankAccountId: formData.get('bankAccountId') as string,
        transactionDate: formData.get('transactionDate') as string,
        description: formData.get('description') as string,
        merchantName: formData.get('merchantName') as string || undefined,
        amount: transactionType === 'debit' ? -Math.abs(amount) : Math.abs(amount),
        transactionType: transactionType as 'debit' | 'credit',
        notes: formData.get('notes') as string || undefined,
      };

      const result = await createBankTransaction(data);

      if (result.success) {
        setIsDialogOpen(false);
        // Reload transactions
        const txResult = await listBankTransactions({
          status: statusFilter || undefined,
          bankAccountId: accountFilter || undefined,
        });
        if (txResult.success) {
          setTransactions(txResult.data as BankTransaction[] || []);
        }
        // Reload stats
        const statsResult = await getBankTransactionStats(accountFilter || undefined);
        if (statsResult.success) {
          setStats(statsResult.data as Stats);
        }
      } else {
        alert(result.error || 'Failed to create transaction');
      }
    });
  }

  // Handle create bank account
  async function handleCreateAccount(formData: FormData) {
    startTransition(async () => {
      const data = {
        accountName: formData.get('accountName') as string,
        accountNumber: formData.get('accountNumber') as string || undefined,
        accountType: formData.get('accountType') as 'checking' | 'savings' | 'credit_card' | 'line_of_credit',
        bankName: formData.get('bankName') as string || undefined,
        currentBalance: parseFloat(formData.get('currentBalance') as string) || 0,
      };

      const result = await createBankAccount(data);

      if (result.success) {
        setIsAccountDialogOpen(false);
        const accountsResult = await listBankAccounts({ isActive: true });
        if (accountsResult.success) {
          setBankAccounts(accountsResult.data as BankAccount[] || []);
        }
      } else {
        alert(result.error || 'Failed to create bank account');
      }
    });
  }

  // Handle reconcile
  async function handleReconcile(id: string) {
    startTransition(async () => {
      const result = await reconcileBankTransaction(id);
      if (result.success) {
        const txResult = await listBankTransactions({
          status: statusFilter || undefined,
          bankAccountId: accountFilter || undefined,
        });
        if (txResult.success) {
          setTransactions(txResult.data as BankTransaction[] || []);
        }
        const statsResult = await getBankTransactionStats(accountFilter || undefined);
        if (statsResult.success) {
          setStats(statsResult.data as Stats);
        }
      } else {
        alert(result.error || 'Failed to reconcile transaction');
      }
    });
  }

  // Handle ignore
  async function handleIgnore(id: string) {
    if (!confirm('Are you sure you want to ignore this transaction?')) return;

    startTransition(async () => {
      const result = await ignoreBankTransaction(id);
      if (result.success) {
        const txResult = await listBankTransactions({
          status: statusFilter || undefined,
          bankAccountId: accountFilter || undefined,
        });
        if (txResult.success) {
          setTransactions(txResult.data as BankTransaction[] || []);
        }
      } else {
        alert(result.error || 'Failed to ignore transaction');
      }
    });
  }

  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reconciled':
        return <Badge variant="default">Reconciled</Badge>;
      case 'categorized':
        return <Badge className="bg-blue-500">Categorized</Badge>;
      case 'ignored':
        return <Badge variant="secondary">Ignored</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Transactions</h1>
          <p className="text-gray-600 mt-1">Review and categorize your bank transactions</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Banknote className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Bank Account</DialogTitle>
                <DialogDescription>
                  Connect a new bank account to track transactions.
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateAccount} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name *</Label>
                    <Input id="accountName" name="accountName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type *</Label>
                    <Select name="accountType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="line_of_credit">Line of Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input id="bankName" name="bankName" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number (Last 4)</Label>
                    <Input id="accountNumber" name="accountNumber" maxLength={4} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentBalance">Current Balance</Label>
                  <Input id="currentBalance" name="currentBalance" type="number" step="0.01" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Account
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Bank Transaction</DialogTitle>
                <DialogDescription>
                  Manually record a bank transaction.
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateTransaction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bankAccountId">Bank Account *</Label>
                  <Select name="bankAccountId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountName} {account.bankName && `(${account.bankName})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transactionDate">Date *</Label>
                    <Input id="transactionDate" name="transactionDate" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transactionType">Type *</Label>
                    <Select name="transactionType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit">Deposit / Credit</SelectItem>
                        <SelectItem value="debit">Withdrawal / Debit</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="fee">Fee</SelectItem>
                        <SelectItem value="interest">Interest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="merchantName">Merchant/Payee</Label>
                    <Input id="merchantName" name="merchantName" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input id="description" name="description" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Transaction
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Uncategorized</CardDescription>
            <CardTitle className="text-2xl">{stats?.uncategorized || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Transactions need review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Credits</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {formatCurrency(stats?.totalCredits || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Money in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Debits</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {formatCurrency(stats?.totalDebits || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Money out</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Reconciled</CardDescription>
            <CardTitle className="text-2xl">{stats?.reconciled || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">of {stats?.total || 0} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search transactions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Accounts</SelectItem>
                {bankAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.accountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="categorized">Categorized</SelectItem>
                <SelectItem value="reconciled">Reconciled</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Recent Transactions ({transactions.length})
          </CardTitle>
          <CardDescription>Bank transactions from all connected accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Banknote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No bank accounts connected</p>
              <Button className="mt-4" variant="outline" onClick={() => setIsAccountDialogOpen(true)}>
                Add Bank Account
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No transactions found</p>
              <Button className="mt-4" variant="outline" onClick={() => setIsDialogOpen(true)}>
                Add Your First Transaction
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(tx.transactionDate).toLocaleDateString('en-PH')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tx.description}</div>
                          {tx.merchantName && (
                            <div className="text-sm text-gray-500">{tx.merchantName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {tx.bankAccountName}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {tx.transactionType === 'credit' ? (
                            <ArrowDownRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                          <span className={tx.transactionType === 'credit' ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(Math.abs(tx.amount), tx.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tx.assignedAccountName ? (
                          <span className="text-sm">{tx.assignedAccountName}</span>
                        ) : (
                          <span className="text-sm text-gray-400">Uncategorized</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {tx.status !== 'reconciled' && tx.status !== 'ignored' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-600"
                                onClick={() => handleReconcile(tx.id)}
                                disabled={isPending}
                                title="Mark as Reconciled"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-400"
                                onClick={() => handleIgnore(tx.id)}
                                disabled={isPending}
                                title="Ignore"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
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
    </div>
  );
}
