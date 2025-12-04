'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  BillSummaryCards,
  BillFilters,
  BillsTable,
  CreateBillDialog,
  AddVendorDialog,
} from '@/components/bills';
import type { Bill, Supplier, BillStats, BillItem, BillStatus } from '@/components/bills';
import {
  listBills,
  listSuppliers,
  createBill,
  submitBill,
  cancelBill,
  getBillStats,
  createSupplier,
} from '@/lib/actions/payable';

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<BillStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<BillStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([{ itemName: '', qty: 1, rate: 0 }]);

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [billsResult, suppliersResult, statsResult] = await Promise.all([
          listBills({ status: statusFilter === '' ? undefined : statusFilter }),
          listSuppliers(),
          getBillStats(),
        ]);

        if (billsResult.success) {
          setBills(billsResult.data as Bill[] || []);
        }
        if (suppliersResult.success) {
          setSuppliers(suppliersResult.data as Supplier[] || []);
        }
        if (statsResult.success) {
          setStats(statsResult.data as BillStats);
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
        const billsResult = await listBills({ status: statusFilter || undefined });
        if (billsResult.success) {
          setBills(billsResult.data as Bill[] || []);
        }
        const statsResult = await getBillStats();
        if (statsResult.success) {
          setStats(statsResult.data as BillStats);
        }
      } else {
        alert(result.error || 'Failed to create bill');
      }
    });
  }

  // Handle create supplier
  async function handleCreateSupplier(formData: FormData) {
    startTransition(async () => {
      const supplierTypeValue = formData.get('supplierType') as string;
      const supplierType = supplierTypeValue && ['Company', 'Individual', 'Government', 'Partnership'].includes(supplierTypeValue)
        ? supplierTypeValue as 'Company' | 'Individual' | 'Government' | 'Partnership'
        : undefined;

      const data = {
        supplierName: formData.get('supplierName') as string,
        supplierType,
        email: formData.get('email') as string || undefined,
        phone: formData.get('phone') as string || undefined,
      };

      const result = await createSupplier(data);

      if (result.success) {
        setIsSupplierDialogOpen(false);
        const suppliersResult = await listSuppliers();
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

  // Bill item management
  function addBillItem() {
    setBillItems([...billItems, { itemName: '', qty: 1, rate: 0 }]);
  }

  function removeBillItem(index: number) {
    setBillItems(billItems.filter((_, i) => i !== index));
  }

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
          <AddVendorDialog
            open={isSupplierDialogOpen}
            onOpenChange={setIsSupplierDialogOpen}
            isPending={isPending}
            onSubmit={handleCreateSupplier}
          />
          <CreateBillDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            suppliers={suppliers}
            billItems={billItems}
            isPending={isPending}
            onSubmit={handleCreateBill}
            onAddItem={addBillItem}
            onRemoveItem={removeBillItem}
            onUpdateItem={updateBillItem}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>

      <BillSummaryCards stats={stats} formatCurrency={formatCurrency} />

      <BillFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <BillsTable
        bills={filteredBills}
        suppliers={suppliers}
        loading={loading}
        isPending={isPending}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onAddVendor={() => setIsSupplierDialogOpen(true)}
        onAddBill={() => setIsDialogOpen(true)}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
