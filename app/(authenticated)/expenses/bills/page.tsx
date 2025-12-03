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
  FileText,
  AlertCircle,
  Loader2,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-react';
import {
  listBills,
  listSuppliers,
  createBill,
  submitBill,
  cancelBill,
  getBillStats,
  createSupplier,
} from '@/lib/actions/payable';

interface Bill {
  id: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNo?: string;
  postingDate: string;
  dueDate: string;
  grandTotal: number;
  outstandingAmount: number;
  paidAmount: number;
  currency: string;
  status: 'Draft' | 'Submitted' | 'Paid' | 'Cancelled' | 'Return';
}

interface Supplier {
  id: string;
  supplierName: string;
  supplierType?: string;
}

interface Stats {
  unpaidTotal: number;
  unpaidCount: number;
  overdueTotal: number;
  overdueCount: number;
  dueSoonTotal: number;
  dueSoonCount: number;
  paidThisMonth: number;
  paidThisMonthCount: number;
}

interface BillItem {
  itemName: string;
  qty: number;
  rate: number;
  description?: string;
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for bill items
  const [billItems, setBillItems] = useState<BillItem[]>([{ itemName: '', qty: 1, rate: 0 }]);

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [billsResult, suppliersResult, statsResult] = await Promise.all([
          listBills({ status: statusFilter || undefined }),
          listSuppliers({ isActive: true }),
          getBillStats(),
        ]);

        if (billsResult.success) {
          setBills(billsResult.data as Bill[] || []);
        }
        if (suppliersResult.success) {
          setSuppliers(suppliersResult.data as Supplier[] || []);
        }
        if (statsResult.success) {
          setStats(statsResult.data as Stats);
        }
      } catch (error) {
        console.error('Failed to load bills:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [statusFilter]);

  // Handle create bill
  async function handleCreateBill(formData: FormData) {
    startTransition(async () => {
      const data = {
        supplierId: formData.get('supplierId') as string,
        supplierInvoiceNo: formData.get('supplierInvoiceNo') as string || undefined,
        postingDate: formData.get('postingDate') as string,
        dueDate: formData.get('dueDate') as string || undefined,
        items: billItems.filter(item => item.itemName).map(item => ({
          itemName: item.itemName,
          qty: item.qty,
          rate: item.rate,
          description: item.description,
        })),
        remarks: formData.get('remarks') as string || undefined,
      };

      const result = await createBill(data);

      if (result.success) {
        setIsDialogOpen(false);
        setBillItems([{ itemName: '', qty: 1, rate: 0 }]);
        // Reload bills
        const billsResult = await listBills({ status: statusFilter || undefined });
        if (billsResult.success) {
          setBills(billsResult.data as Bill[] || []);
        }
        const statsResult = await getBillStats();
        if (statsResult.success) {
          setStats(statsResult.data as Stats);
        }
      } else {
        alert(result.error || 'Failed to create bill');
      }
    });
  }

  // Handle create supplier
  async function handleCreateSupplier(formData: FormData) {
    startTransition(async () => {
      const data = {
        supplierName: formData.get('supplierName') as string,
        supplierType: formData.get('supplierType') as string || undefined,
        email: formData.get('email') as string || undefined,
        phone: formData.get('phone') as string || undefined,
      };

      const result = await createSupplier(data);

      if (result.success) {
        setIsSupplierDialogOpen(false);
        const suppliersResult = await listSuppliers({ isActive: true });
        if (suppliersResult.success) {
          setSuppliers(suppliersResult.data as Supplier[] || []);
        }
      } else {
        alert(result.error || 'Failed to create supplier');
      }
    });
  }

  // Handle submit bill
  async function handleSubmit(id: string) {
    startTransition(async () => {
      const result = await submitBill(id);
      if (result.success) {
        const billsResult = await listBills({ status: statusFilter || undefined });
        if (billsResult.success) {
          setBills(billsResult.data as Bill[] || []);
        }
      } else {
        alert(result.error || 'Failed to submit bill');
      }
    });
  }

  // Handle cancel bill
  async function handleCancel(id: string) {
    if (!confirm('Are you sure you want to cancel this bill?')) return;

    startTransition(async () => {
      const result = await cancelBill(id);
      if (result.success) {
        const billsResult = await listBills({ status: statusFilter || undefined });
        if (billsResult.success) {
          setBills(billsResult.data as Bill[] || []);
        }
      } else {
        alert(result.error || 'Failed to cancel bill');
      }
    });
  }

  // Add bill item row
  function addBillItem() {
    setBillItems([...billItems, { itemName: '', qty: 1, rate: 0 }]);
  }

  // Remove bill item row
  function removeBillItem(index: number) {
    setBillItems(billItems.filter((_, i) => i !== index));
  }

  // Update bill item
  function updateBillItem(index: number, field: keyof BillItem, value: string | number) {
    const updated = [...billItems];
    if (field === 'itemName' || field === 'description') {
      updated[index][field] = value as string;
    } else {
      updated[index][field] = value as number;
    }
    setBillItems(updated);
  }

  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge variant="default">Paid</Badge>;
      case 'Submitted':
        return <Badge className="bg-blue-500">Submitted</Badge>;
      case 'Cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'Paid' || status === 'Cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  const isDueSoon = (dueDate: string, status: string) => {
    if (status === 'Paid' || status === 'Cancelled') return false;
    const due = new Date(dueDate);
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return due >= now && due <= sevenDays;
  };

  // Filter bills by search
  const filteredBills = bills.filter(bill => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bill.invoiceNo?.toLowerCase().includes(query) ||
      bill.supplierName?.toLowerCase().includes(query) ||
      bill.supplierInvoiceNo?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-600 mt-1">Track and pay vendor bills</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Vendor</DialogTitle>
                <DialogDescription>
                  Create a new supplier/vendor.
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateSupplier} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierName">Vendor Name *</Label>
                  <Input id="supplierName" name="supplierName" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplierType">Type</Label>
                    <Select name="supplierType">
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Company">Company</SelectItem>
                        <SelectItem value="Individual">Individual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsSupplierDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Vendor
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Bill</DialogTitle>
                <DialogDescription>
                  Record a new vendor bill or purchase invoice.
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateBill} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplierId">Vendor *</Label>
                    <Select name="supplierId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.supplierName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplierInvoiceNo">Vendor Invoice #</Label>
                    <Input id="supplierInvoiceNo" name="supplierInvoiceNo" placeholder="Vendor's ref #" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postingDate">Bill Date *</Label>
                    <Input id="postingDate" name="postingDate" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" name="dueDate" type="date" />
                  </div>
                </div>

                {/* Bill Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Line Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addBillItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-20">Qty</TableHead>
                          <TableHead className="w-28">Rate</TableHead>
                          <TableHead className="w-28">Amount</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                placeholder="Item description"
                                value={item.itemName}
                                onChange={(e) => updateBillItem(index, 'itemName', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) => updateBillItem(index, 'qty', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.rate}
                                onChange={(e) => updateBillItem(index, 'rate', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.qty * item.rate)}
                            </TableCell>
                            <TableCell>
                              {billItems.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600"
                                  onClick={() => removeBillItem(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="text-right font-medium">
                    Total: {formatCurrency(billItems.reduce((sum, item) => sum + (item.qty * item.rate), 0))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Notes</Label>
                  <Input id="remarks" name="remarks" placeholder="Optional notes" />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Bill
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
            <CardDescription>Unpaid Bills</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(stats?.unpaidTotal || 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">{stats?.unpaidCount || 0} bills outstanding</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-2xl text-red-600">{formatCurrency(stats?.overdueTotal || 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-red-600">{stats?.overdueCount || 0} bills overdue</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardDescription>Due Soon</CardDescription>
            <CardTitle className="text-2xl text-yellow-700">{formatCurrency(stats?.dueSoonTotal || 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-yellow-700">Due in 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month Paid</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(stats?.paidThisMonth || 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">{stats?.paidThisMonthCount || 0} bills paid</p>
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
                placeholder="Search bills..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
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
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bills ({filteredBills.length})
          </CardTitle>
          <CardDescription>Vendor bills and purchase invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Add vendors to start creating bills</p>
              <Button className="mt-4" variant="outline" onClick={() => setIsSupplierDialogOpen(true)}>
                Add Your First Vendor
              </Button>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No bills found</p>
              <Button className="mt-4" variant="outline" onClick={() => setIsDialogOpen(true)}>
                Create Your First Bill
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => (
                    <TableRow key={bill.id} className={isOverdue(bill.dueDate, bill.status) ? 'bg-red-50' : isDueSoon(bill.dueDate, bill.status) ? 'bg-yellow-50' : ''}>
                      <TableCell className="font-mono text-sm">{bill.invoiceNo}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{bill.supplierName}</div>
                          {bill.supplierInvoiceNo && (
                            <div className="text-sm text-gray-500">Ref: {bill.supplierInvoiceNo}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(bill.postingDate).toLocaleDateString('en-PH')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isOverdue(bill.dueDate, bill.status) && <AlertCircle className="h-4 w-4 text-red-600" />}
                          {isDueSoon(bill.dueDate, bill.status) && <Clock className="h-4 w-4 text-yellow-600" />}
                          <span className={isOverdue(bill.dueDate, bill.status) ? 'text-red-600' : isDueSoon(bill.dueDate, bill.status) ? 'text-yellow-700' : ''}>
                            {new Date(bill.dueDate).toLocaleDateString('en-PH')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(bill.grandTotal, bill.currency)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(bill.outstandingAmount, bill.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {bill.status === 'Draft' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-600"
                                onClick={() => handleSubmit(bill.id)}
                                disabled={isPending}
                                title="Submit Bill"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => handleCancel(bill.id)}
                                disabled={isPending}
                                title="Cancel Bill"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {bill.status === 'Submitted' && bill.outstandingAmount > 0 && (
                            <Button size="sm" variant="outline" disabled>
                              Pay
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
    </div>
  );
}
