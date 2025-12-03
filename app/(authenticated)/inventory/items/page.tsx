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
import { Textarea } from '@/components/ui/textarea';
import {
  Package,
  Plus,
  Search,
  Loader2,
} from 'lucide-react';
import {
  listItems,
  createItem,
  listItemGroups,
  listWarehouses,
} from '@/lib/actions/stock';

interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  description?: string;
  itemGroupId?: string;
  isStockItem: boolean;
  isSalesItem: boolean;
  isPurchaseItem: boolean;
  standardRate: number;
  valuationRate: number;
  reorderLevel: number;
  isActive: boolean;
}

interface ItemGroup {
  id: string;
  groupName: string;
}

interface Warehouse {
  id: string;
  warehouseName: string;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [itemsResult, groupsResult, warehousesResult] = await Promise.all([
          listItems({ search: searchQuery || undefined }),
          listItemGroups(),
          listWarehouses(),
        ]);

        if (itemsResult.success) {
          setItems(itemsResult.data as Item[] || []);
        }
        if (groupsResult.success) {
          setItemGroups(groupsResult.data as ItemGroup[] || []);
        }
        if (warehousesResult.success) {
          setWarehouses(warehousesResult.data as Warehouse[] || []);
        }
      } catch (error) {
        console.error('Failed to load items:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [searchQuery]);

  // Handle create item
  async function handleCreateItem(formData: FormData) {
    startTransition(async () => {
      const data = {
        itemName: formData.get('itemName') as string,
        itemCode: formData.get('itemCode') as string || undefined,
        description: formData.get('description') as string || undefined,
        itemGroupId: formData.get('itemGroupId') as string || undefined,
        standardRate: parseFloat(formData.get('standardRate') as string) || 0,
        reorderLevel: parseFloat(formData.get('reorderLevel') as string) || 0,
        reorderQty: parseFloat(formData.get('reorderQty') as string) || 0,
        defaultWarehouseId: formData.get('defaultWarehouseId') as string || undefined,
        isStockItem: formData.get('isStockItem') === 'true',
        isSalesItem: formData.get('isSalesItem') === 'true',
        isPurchaseItem: formData.get('isPurchaseItem') === 'true',
      };

      const result = await createItem(data);

      if (result.success) {
        setIsDialogOpen(false);
        // Reload items
        const itemsResult = await listItems();
        if (itemsResult.success) {
          setItems(itemsResult.data as Item[] || []);
        }
      } else {
        alert(result.error || 'Failed to create item');
      }
    });
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Items</h1>
          <p className="text-gray-600 mt-1">Manage your product and service catalog</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Item</DialogTitle>
              <DialogDescription>
                Add a new product or service to your inventory.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateItem} className="space-y-4">
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
                <Textarea id="description" name="description" />
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
                  <Label htmlFor="defaultWarehouseId">Default Warehouse</Label>
                  <Select name="defaultWarehouseId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(wh => (
                        <SelectItem key={wh.id} value={wh.id}>
                          {wh.warehouseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="standardRate">Standard Rate (PHP)</Label>
                  <Input id="standardRate" name="standardRate" type="number" min="0" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderLevel">Reorder Level</Label>
                  <Input id="reorderLevel" name="reorderLevel" type="number" min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderQty">Reorder Qty</Label>
                  <Input id="reorderQty" name="reorderQty" type="number" min="0" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isStockItem" name="isStockItem" value="true" defaultChecked />
                  <Label htmlFor="isStockItem">Stock Item</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isSalesItem" name="isSalesItem" value="true" defaultChecked />
                  <Label htmlFor="isSalesItem">Sales Item</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isPurchaseItem" name="isPurchaseItem" value="true" defaultChecked />
                  <Label htmlFor="isPurchaseItem">Purchase Item</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search items..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Items ({items.length})
          </CardTitle>
          <CardDescription>All products and services in your catalog</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No items found</p>
              <Button className="mt-4" variant="outline" onClick={() => setIsDialogOpen(true)}>
                Create Your First Item
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right">Standard Rate</TableHead>
                    <TableHead className="text-right">Valuation Rate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.itemCode}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.itemName}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.standardRate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.valuationRate)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {item.isStockItem && <Badge variant="outline" className="text-xs">Stock</Badge>}
                          {item.isSalesItem && <Badge variant="outline" className="text-xs">Sales</Badge>}
                          {item.isPurchaseItem && <Badge variant="outline" className="text-xs">Purchase</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                          {item.isActive ? 'Active' : 'Inactive'}
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
