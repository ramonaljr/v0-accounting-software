'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  ProductStatsCards,
  ProductCatalogTable,
  LowStockAlerts,
  QuickStatsCard,
  ItemViewDialog,
  ItemEditDialog,
  AddProductDialog,
} from '@/components/products';
import type { Item, ItemGroup, Uom, ProductStats } from '@/components/products';
import { listItems, createItem, updateItem, getLowStockItems, listItemGroups, listUoms } from '@/lib/actions/stock';

export default function ProductsServicesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Item[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'product' | 'service'>('all');

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Stats
  const [stats, setStats] = useState<ProductStats>({
    totalItems: 0,
    products: 0,
    services: 0,
    lowStock: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [itemsResult, lowStockResult, groupsResult, uomsResult] = await Promise.all([
        listItems(),
        getLowStockItems(),
        listItemGroups(),
        listUoms(),
      ]);

      if (itemsResult.success && itemsResult.data) {
        const allItems = itemsResult.data as Item[];
        setItems(allItems);

        // Calculate stats
        const products = allItems.filter(i => i.isStockItem).length;
        const services = allItems.filter(i => !i.isStockItem).length;
        const totalValue = allItems.reduce((sum, i) => sum + (i.stockValue || 0), 0);

        setStats({
          totalItems: allItems.length,
          products,
          services,
          lowStock: 0,
          totalValue,
        });
      }

      if (lowStockResult.success && lowStockResult.data) {
        const lowStock = lowStockResult.data as Item[];
        setLowStockItems(lowStock);
        setStats(prev => ({ ...prev, lowStock: lowStock.length }));
      }

      if (groupsResult.success && groupsResult.data) {
        setItemGroups(groupsResult.data as ItemGroup[]);
      }

      if (uomsResult.success && uomsResult.data) {
        setUoms(uomsResult.data as Uom[]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter items based on search and type
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery ||
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' ||
      (filterType === 'product' && item.isStockItem) ||
      (filterType === 'service' && !item.isStockItem);

    return matchesSearch && matchesType;
  });

  async function handleCreateItem(formData: FormData) {
    const data = {
      itemName: formData.get('itemName') as string,
      itemCode: formData.get('itemCode') as string || undefined,
      description: formData.get('description') as string || undefined,
      itemGroupId: formData.get('itemGroupId') as string || undefined,
      stockUomId: formData.get('stockUomId') as string || undefined,
      isStockItem: formData.get('isStockItem') === 'true',
      isSalesItem: formData.get('isSalesItem') === 'true',
      isPurchaseItem: formData.get('isPurchaseItem') === 'true',
      standardRate: parseFloat(formData.get('standardRate') as string) || 0,
      reorderLevel: parseFloat(formData.get('reorderLevel') as string) || undefined,
      reorderQty: parseFloat(formData.get('reorderQty') as string) || undefined,
    };

    startTransition(async () => {
      const result = await createItem(data);
      if (result.success) {
        setIsAddDialogOpen(false);
        loadData();
      } else {
        console.error('Failed to create item:', result.error);
      }
    });
  }

  async function handleUpdateItem(formData: FormData) {
    if (!selectedItem) return;

    const data = {
      itemName: formData.get('itemName') as string,
      description: formData.get('description') as string || undefined,
      itemGroupId: formData.get('itemGroupId') as string || undefined,
      standardRate: parseFloat(formData.get('standardRate') as string) || 0,
      reorderLevel: parseFloat(formData.get('reorderLevel') as string) || undefined,
      reorderQty: parseFloat(formData.get('reorderQty') as string) || undefined,
      isActive: formData.get('isActive') === 'true',
    };

    startTransition(async () => {
      const result = await updateItem(selectedItem.id, data);
      if (result.success) {
        setIsEditDialogOpen(false);
        setSelectedItem(null);
        loadData();
      } else {
        console.error('Failed to update item:', result.error);
      }
    });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products & Services</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog and service offerings</p>
        </div>
        <AddProductDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          itemGroups={itemGroups}
          uoms={uoms}
          isPending={isPending}
          onSubmit={handleCreateItem}
        />
      </div>

      {/* Stats Cards */}
      <ProductStatsCards stats={stats} formatCurrency={formatCurrency} />

      {/* Product Catalog */}
      <ProductCatalogTable
        items={items}
        filteredItems={filteredItems}
        searchQuery={searchQuery}
        filterType={filterType}
        onSearchChange={setSearchQuery}
        onFilterChange={setFilterType}
        onViewItem={(item) => {
          setSelectedItem(item);
          setIsViewDialogOpen(true);
        }}
        onEditItem={(item) => {
          setSelectedItem(item);
          setIsEditDialogOpen(true);
        }}
        onAddItem={() => setIsAddDialogOpen(true)}
        formatCurrency={formatCurrency}
      />

      {/* Bottom Section - Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LowStockAlerts lowStockItems={lowStockItems} />
        <QuickStatsCard items={items} />
      </div>

      {/* View Item Dialog */}
      <ItemViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        item={selectedItem}
        onEdit={() => {
          setIsViewDialogOpen(false);
          setIsEditDialogOpen(true);
        }}
        formatCurrency={formatCurrency}
      />

      {/* Edit Item Dialog */}
      <ItemEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        item={selectedItem}
        itemGroups={itemGroups}
        isPending={isPending}
        onSubmit={handleUpdateItem}
        onCancel={() => {
          setIsEditDialogOpen(false);
          setSelectedItem(null);
        }}
      />
    </div>
  );
}
