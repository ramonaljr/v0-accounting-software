'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Building,
  RefreshCw,
  Link2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  CreditCard,
  Wallet,
  Banknote,
} from 'lucide-react';
import { listBankAccounts, createBankAccount } from '@/lib/actions/banking';

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber?: string;
  accountType: 'checking' | 'savings' | 'credit_card' | 'line_of_credit';
  bankName?: string;
  currency: string;
  isActive: boolean;
  currentBalance: number;
  availableBalance?: number;
  balanceDate?: string;
  lastSyncAt?: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  glAccountId?: string;
  glAccountName?: string;
}

export default function BankFeedsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const result = await listBankAccounts();
        if (result.success) {
          setAccounts(result.data as BankAccount[] || []);
        }
      } catch (error) {
        console.error('Failed to load bank accounts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle create account
  async function handleCreateAccount(formData: FormData) {
    startTransition(async () => {
      const data = {
        accountName: formData.get('accountName') as string,
        accountNumber: formData.get('accountNumber') as string || undefined,
        accountType: formData.get('accountType') as 'checking' | 'savings' | 'credit_card' | 'line_of_credit',
        bankName: formData.get('bankName') as string || undefined,
        currency: formData.get('currency') as string || 'PHP',
        currentBalance: parseFloat(formData.get('currentBalance') as string) || 0,
      };

      const result = await createBankAccount(data);

      if (result.success) {
        setIsDialogOpen(false);
        const accountsResult = await listBankAccounts();
        if (accountsResult.success) {
          setAccounts(accountsResult.data as BankAccount[] || []);
        }
      } else {
        alert(result.error || 'Failed to create bank account');
      }
    });
  }

  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getLastSyncText = (lastSyncAt?: string) => {
    if (!lastSyncAt) return 'Never synced';

    const diff = Date.now() - new Date(lastSyncAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
        return <CreditCard className="h-5 w-5 text-gray-500" />;
      case 'savings':
        return <Wallet className="h-5 w-5 text-gray-500" />;
      case 'line_of_credit':
        return <Banknote className="h-5 w-5 text-gray-500" />;
      default:
        return <Building className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAccountTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      checking: 'Checking',
      savings: 'Savings',
      credit_card: 'Credit Card',
      line_of_credit: 'Line of Credit',
    };
    return <Badge variant="outline" className="text-xs">{labels[type] || type}</Badge>;
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'syncing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  // Calculate totals
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const activeAccounts = accounts.filter(acc => acc.isActive).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Feeds</h1>
          <p className="text-gray-600 mt-1">
            Manage your connected bank accounts and credit cards
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Link2 className="h-4 w-4 mr-2" />
              Connect Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Bank Account</DialogTitle>
              <DialogDescription>
                Add a new bank account or credit card to track.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input id="accountName" name="accountName" placeholder="e.g., Business Checking" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type *</Label>
                  <Select name="accountType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking Account</SelectItem>
                      <SelectItem value="savings">Savings Account</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="line_of_credit">Line of Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank / Institution</Label>
                  <Input id="bankName" name="bankName" placeholder="e.g., BDO, BPI, Chase" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number (Last 4)</Label>
                  <Input id="accountNumber" name="accountNumber" maxLength={4} placeholder="1234" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select name="currency" defaultValue="PHP">
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHP">PHP - Philippine Peso</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentBalance">Current Balance</Label>
                  <Input id="currentBalance" name="currentBalance" type="number" step="0.01" placeholder="0.00" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Connect Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Balance</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(totalBalance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Across all accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Connected Accounts</CardDescription>
            <CardTitle className="text-2xl">{accounts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">{activeAccounts} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Integration Status</CardDescription>
            <CardTitle className="text-2xl">
              {accounts.filter(a => a.syncStatus === 'error').length === 0 ? 'Healthy' : 'Needs Attention'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              {accounts.filter(a => a.syncStatus === 'error').length} account{accounts.filter(a => a.syncStatus === 'error').length !== 1 ? 's' : ''} with errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="mb-4">No bank accounts connected yet</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Connect Your First Account
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getAccountIcon(account.accountType)}
                    <div>
                      <span className="font-semibold">{account.accountName}</span>
                      {account.accountNumber && (
                        <span className="text-gray-500 ml-2">****{account.accountNumber}</span>
                      )}
                    </div>
                    {getAccountTypeBadge(account.accountType)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getSyncStatusIcon(account.syncStatus)}
                    <span className={`text-lg font-semibold ${account.currentBalance < 0 ? 'text-red-600' : ''}`}>
                      {formatCurrency(account.currentBalance, account.currency)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {account.bankName && <p className="font-medium">{account.bankName}</p>}
                    <p>Last synced: {getLastSyncText(account.lastSyncAt)}</p>
                    {account.glAccountName && (
                      <p className="text-xs text-gray-500 mt-1">
                        Linked to: {account.glAccountName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Sync
                    </Button>
                    <Button size="sm" variant="outline" disabled>
                      Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Banner */}
      {accounts.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Automatic Bank Feeds</p>
                <p>
                  For automatic transaction syncing, connect your accounts via Plaid (US/EU) or Wise (global).
                  Manual entries can be added in Bank Transactions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
