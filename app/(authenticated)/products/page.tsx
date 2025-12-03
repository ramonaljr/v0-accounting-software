'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Package, Search, AlertTriangle, DollarSign, Boxes, Eye, Pencil } from "lucide-react";
import { listItems, createItem, updateItem, getLowStockItems, listItemGroups, listUoms } from '@/lib/actions/stock';

interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  description?: string;
  itemGroupId?: string;
  stockUomId?: string;
  standardRate: number;
  isStockItem: boolean;
  isSalesItem: boolean;
  isPurchaseItem: boolean;
  isActive: boolean;
  reorderLevel?: number;
  reorderQty?: number;
  currentStock?: number;
  stockValue?: number;
  item_groups?: { groupName: string };
  uoms?: { uomName: string };
}

interface ItemGroup {
  id: string;
  groupName: string;
}

interface Uom {
  id: string;
  uomName: string;
}

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
  const [stats, setStats] = useState({
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
          lowStock: 0, // Will be set from lowStockResult
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Product/Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product/Service</DialogTitle>
              <DialogDescription>Create a new item in your catalog</DialogDescription>
            </DialogHeader>
            <form action={handleCreateItem}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="itemName">Item Name *</Label>
                    <Input id="itemName" name="itemName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemCode">Item Code</Label>
                    <Input id="itemCode" name="itemCode" placeholder="Auto-generated if empty" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="itemGroupId">Item Group</Label>
                    <Select name="itemGroupId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {itemGroups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.groupName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stockUomId">Unit of Measure</Label>
                    <Select name="stockUomId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select UOM" />
                      </SelectTrigger>
                      <SelectContent>
                        {uoms.map(uom => (
                          <SelectItem key={uom.id} value={uom.id}>
                            {uom.uomName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="standardRate">Standard Rate</Label>
                    <Input id="standardRate" name="standardRate" type="number" step="0.01" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input id="reorderLevel" name="reorderLevel" type="number" step="1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorderQty">Reorder Qty</Label>
                    <Input id="reorderQty" name="reorderQty" type="number" step="1" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="isStockItem" name="isStockItem" defaultChecked />
                    <input type="hidden" name="isStockItem" value="false" />
                    <Label htmlFor="isStockItem" className="text-sm">Stock Item</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="isSalesItem" name="isSalesItem" defaultChecked />
                    <input type="hidden" name="isSalesItem" value="false" />
                    <Label htmlFor="isSalesItem" className="text-sm">Sales Item</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="isPurchaseItem" name="isPurchaseItem" defaultChecked />
                    <input type="hidden" name="isPurchaseItem" value="false" />
                    <Label htmlFor="isPurchaseItem" className="text-sm">Purchase Item</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="text-2xl">{stats.totalItems}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Products & services</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Products</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Boxes className="h-5 w-5 text-blue-600" />
              {stats.products}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Physical items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Services</CardDescription>
            <CardTitle className="text-2xl">{stats.services}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Service offerings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Low Stock</CardDescription>
            <CardTitle className={`text-2xl ${stats.lowStock > 0 ? 'text-yellow-600' : ''}`}>
              {stats.lowStock}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xs ${stats.lowStock > 0 ? 'text-yellow-600' : 'text-gray-600'}`}>
              {stats.lowStock > 0 ? 'Need reorder' : 'All stocked'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Inventory Value</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              {formatCurrency(stats.totalValue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Total stock value</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Catalog
          </CardTitle>
          <CardDescription>Items you sell to customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products and services..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={(v: 'all' | 'product' | 'service') => setFilterType(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="product">Products Only</SelectItem>
                <SelectItem value="service">Services Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>{items.length === 0 ? 'No products or services added yet' : 'No items match your search'}</p>
              <p className="text-sm mt-2">
                {items.length === 0
                  ? 'Add items to quickly populate invoices and track sales'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {items.length === 0 && (
                <Button className="mt-4" variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                  Add Your First Item
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.itemCode}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isStockItem ? "default" : "secondary"}>
                        {item.isStockItem ? 'Product' : 'Service'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.item_groups?.groupName || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.standardRate)}</TableCell>
                    <TableCell className="text-right">
                      {item.isStockItem ? (
                        <span className={item.currentStock && item.reorderLevel && item.currentStock <= item.reorderLevel ? 'text-yellow-600 font-medium' : ''}>
                          {item.currentStock ?? 0}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "default" : "secondary"}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bottom Section - Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Inventory Alerts
            </CardTitle>
            <CardDescription>Items needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">All items in stock</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item.itemName}</p>
                      <p className="text-xs text-gray-500">{item.itemCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-yellow-700">
                        {item.currentStock ?? 0} in stock
                      </p>
                      <p className="text-xs text-gray-500">
                        Reorder at {item.reorderLevel}
                      </p>
                    </div>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <p className="text-xs text-center text-gray-500">
                    +{lowStockItems.length - 5} more items need attention
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Item breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sales Items</span>
                <span className="font-medium">{items.filter(i => i.isSalesItem).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Purchase Items</span>
                <span className="font-medium">{items.filter(i => i.isPurchaseItem).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Items</span>
                <span className="font-medium">{items.filter(i => i.isActive).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Inactive Items</span>
                <span className="font-medium">{items.filter(i => !i.isActive).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Item Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Item Code</p>
                  <p className="font-medium">{selectedItem.itemCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Item Name</p>
                  <p className="font-medium">{selectedItem.itemName}</p>
                </div>
              </div>
              {selectedItem.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p>{selectedItem.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <Badge variant={selectedItem.isStockItem ? "default" : "secondary"}>
                    {selectedItem.isStockItem ? 'Product' : 'Service'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={selectedItem.isActive ? "default" : "secondary"}>
                    {selectedItem.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Standard Rate</p>
                  <p className="font-medium">{formatCurrency(selectedItem.standardRate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Group</p>
                  <p className="font-medium">{selectedItem.item_groups?.groupName || '-'}</p>
                </div>
              </div>
              {selectedItem.isStockItem && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Stock</p>
                    <p className="font-medium">{selectedItem.currentStock ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reorder Level</p>
                    <p className="font-medium">{selectedItem.reorderLevel ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reorder Qty</p>
                    <p className="font-medium">{selectedItem.reorderQty ?? '-'}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Badge variant={selectedItem.isSalesItem ? "default" : "outline"}>
                  {selectedItem.isSalesItem ? 'Sales Item' : 'Not for Sale'}
                </Badge>
                <Badge variant={selectedItem.isPurchaseItem ? "default" : "outline"}>
                  {selectedItem.isPurchaseItem ? 'Purchase Item' : 'Not for Purchase'}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              setIsEditDialogOpen(true);
            }}>
              Edit Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update item details</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <form action={handleUpdateItem}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-itemName">Item Name *</Label>
                  <Input
                    id="edit-itemName"
                    name="itemName"
                    defaultValue={selectedItem.itemName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    rows={2}
                    defaultValue={selectedItem.description || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-itemGroupId">Item Group</Label>
                  <Select name="itemGroupId" defaultValue={selectedItem.itemGroupId || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemGroups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.groupName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-standardRate">Standard Rate</Label>
                    <Input
                      id="edit-standardRate"
                      name="standardRate"
                      type="number"
                      step="0.01"
                      defaultValue={selectedItem.standardRate}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-reorderLevel">Reorder Level</Label>
                    <Input
                      id="edit-reorderLevel"
                      name="reorderLevel"
                      type="number"
                      step="1"
                      defaultValue={selectedItem.reorderLevel || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-reorderQty">Reorder Qty</Label>
                    <Input
                      id="edit-reorderQty"
                      name="reorderQty"
                      type="number"
                      step="1"
                      defaultValue={selectedItem.reorderQty || ''}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="edit-isActive"
                    name="isActive"
                    defaultChecked={selectedItem.isActive}
                  />
                  <input type="hidden" name="isActive" value="false" />
                  <Label htmlFor="edit-isActive">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedItem(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
