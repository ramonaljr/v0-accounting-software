'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  BomFilters,
  BomTable,
  CreateBomDialog,
  ViewBomDialog,
} from '@/components/bom';
import type { Bom, Item, BomItem } from '@/components/bom';
import {
  listBoms,
  createBom,
  submitBom,
  setDefaultBom,
  cancelBom,
  getBomById,
} from '@/lib/actions/manufacturing';
import { listItems } from '@/lib/actions/stock';

export default function BomPage() {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedBom, setSelectedBom] = useState<Bom | null>(null);
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [bomItems, setBomItems] = useState<BomItem[]>([{ itemId: '', quantity: 1, rate: 0 }]);

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [bomsResult, itemsResult] = await Promise.all([
          listBoms({ status: statusFilter || undefined }),
          listItems({ isStockItem: true }),
        ]);

        if (bomsResult.success) {
          setBoms(bomsResult.data as Bom[] || []);
        }
        if (itemsResult.success) {
          setItems(itemsResult.data as Item[] || []);
        }
      } catch (error) {
        console.error('Failed to load BOMs:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [statusFilter]);

  // Handle create BOM
  async function handleCreateBom(formData: FormData) {
    startTransition(async () => {
      const data = {
        itemId: formData.get('itemId') as string,
        quantity: parseFloat(formData.get('quantity') as string) || 1,
        description: formData.get('description') as string || undefined,
        items: bomItems.filter(item => item.itemId).map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          rate: item.rate,
        })),
      };

      const result = await createBom(data);

      if (result.success) {
        setIsDialogOpen(false);
        setBomItems([{ itemId: '', quantity: 1, rate: 0 }]);
        const bomsResult = await listBoms({ status: statusFilter || undefined });
        if (bomsResult.success) {
          setBoms(bomsResult.data as Bom[] || []);
        }
      } else {
        alert(result.error || 'Failed to create BOM');
      }
    });
  }

  // Handle submit BOM
  async function handleSubmit(id: string) {
    startTransition(async () => {
      const result = await submitBom(id);
      if (result.success) {
        const bomsResult = await listBoms({ status: statusFilter || undefined });
        if (bomsResult.success) {
          setBoms(bomsResult.data as Bom[] || []);
        }
      } else {
        alert(result.error || 'Failed to submit BOM');
      }
    });
  }

  // Handle set default
  async function handleSetDefault(id: string) {
    startTransition(async () => {
      const result = await setDefaultBom(id);
      if (result.success) {
        const bomsResult = await listBoms({ status: statusFilter || undefined });
        if (bomsResult.success) {
          setBoms(bomsResult.data as Bom[] || []);
        }
      } else {
        alert(result.error || 'Failed to set default BOM');
      }
    });
  }

  // Handle cancel BOM
  async function handleCancel(id: string) {
    if (!confirm('Are you sure you want to cancel this BOM?')) return;

    startTransition(async () => {
      const result = await cancelBom(id);
      if (result.success) {
        const bomsResult = await listBoms({ status: statusFilter || undefined });
        if (bomsResult.success) {
          setBoms(bomsResult.data as Bom[] || []);
        }
      } else {
        alert(result.error || 'Failed to cancel BOM');
      }
    });
  }

  // Handle view BOM details
  async function handleViewBom(id: string) {
    startTransition(async () => {
      const result = await getBomById(id);
      if (result.success) {
        setSelectedBom(result.data as Bom);
        setIsViewDialogOpen(true);
      } else {
        alert(result.error || 'Failed to load BOM details');
      }
    });
  }

  // BOM item management
  function addBomItem() {
    setBomItems([...bomItems, { itemId: '', quantity: 1, rate: 0 }]);
  }

  function removeBomItem(index: number) {
    setBomItems(bomItems.filter((_, i) => i !== index));
  }

  function updateBomItem(index: number, field: keyof BomItem, value: string | number) {
    const updated = [...bomItems];
    if (field === 'itemId') {
      updated[index].itemId = value as string;
      const item = items.find(i => i.id === value);
      if (item) {
        updated[index].rate = item.standardRate;
      }
    } else {
      updated[index][field] = value as number;
    }
    setBomItems(updated);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  // Filter BOMs by search
  const filteredBoms = boms.filter(bom => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bom.bomNo?.toLowerCase().includes(query) ||
      bom.itemName?.toLowerCase().includes(query) ||
      bom.itemCode?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bill of Materials</h1>
          <p className="text-gray-600 mt-1">Define product recipes and raw materials</p>
        </div>
        <CreateBomDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          items={items}
          bomItems={bomItems}
          isPending={isPending}
          onSubmit={handleCreateBom}
          onAddItem={addBomItem}
          onRemoveItem={removeBomItem}
          onUpdateItem={updateBomItem}
          formatCurrency={formatCurrency}
        />
      </div>

      <BomFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <BomTable
        boms={filteredBoms}
        loading={loading}
        isPending={isPending}
        onView={handleViewBom}
        onSubmit={handleSubmit}
        onSetDefault={handleSetDefault}
        onCancel={handleCancel}
        onCreateFirst={() => setIsDialogOpen(true)}
        formatCurrency={formatCurrency}
      />

      <ViewBomDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        bom={selectedBom}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
