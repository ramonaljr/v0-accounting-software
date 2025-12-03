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
  Layers,
  Plus,
  Loader2,
  Search,
  CheckCircle,
  Star,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  listBoms,
  createBom,
  submitBom,
  setDefaultBom,
  cancelBom,
  getBomById,
} from '@/lib/actions/manufacturing';
import { listItems } from '@/lib/actions/stock';

interface BomItemDetail {
  itemName: string;
  itemCode: string;
  stockQty?: number;
  quantity: number;
  rate: number;
  amount: number;
}

interface Bom {
  id: string;
  bomNo: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  quantity: number;
  status: 'Draft' | 'Submitted' | 'Cancelled';
  isActive: boolean;
  isDefault: boolean;
  rawMaterialCost: number;
  operatingCost: number;
  totalCost: number;
  createdAt: string;
  items?: BomItemDetail[];
}

interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  standardRate: number;
}

interface BomItem {
  itemId: string;
  quantity: number;
  rate: number;
}

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

  // Form state for BOM items
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

  // Add BOM item row
  function addBomItem() {
    setBomItems([...bomItems, { itemId: '', quantity: 1, rate: 0 }]);
  }

  // Remove BOM item row
  function removeBomItem(index: number) {
    setBomItems(bomItems.filter((_, i) => i !== index));
  }

  // Update BOM item
  function updateBomItem(index: number, field: keyof BomItem, value: string | number) {
    const updated = [...bomItems];
    if (field === 'itemId') {
      updated[index].itemId = value as string;
      // Auto-fill rate from item
      const item = items.find(i => i.id === value);
      if (item) {
        updated[index].rate = item.standardRate;
      }
    } else {
      updated[index][field] = value as number;
    }
    setBomItems(updated);
  }

  const getStatusBadge = (status: string, isActive: boolean, isDefault: boolean) => {
    return (
      <div className="flex gap-1">
        {status === 'Submitted' && isActive ? (
          <Badge variant="default">Active</Badge>
        ) : status === 'Draft' ? (
          <Badge variant="outline">Draft</Badge>
        ) : status === 'Cancelled' ? (
          <Badge variant="destructive">Cancelled</Badge>
        ) : (
          <Badge variant="secondary">{status}</Badge>
        )}
        {isDefault && <Badge className="bg-yellow-500">Default</Badge>}
      </div>
    );
  };

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New BOM
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Bill of Materials</DialogTitle>
              <DialogDescription>
                Define the raw materials and components needed to manufacture a product.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateBom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemId">Finished Product *</Label>
                  <Select name="itemId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.itemCode} - {item.itemName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input id="quantity" name="quantity" type="number" min="1" step="0.01" defaultValue="1" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Optional description" />
              </div>

              {/* BOM Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Raw Materials / Components</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBomItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="w-24">Qty</TableHead>
                        <TableHead className="w-32">Rate</TableHead>
                        <TableHead className="w-32">Amount</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bomItems.map((bomItem, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={bomItem.itemId}
                              onValueChange={(value) => updateBomItem(index, 'itemId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                              <SelectContent>
                                {items.map(item => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.itemCode} - {item.itemName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={bomItem.quantity}
                              onChange={(e) => updateBomItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={bomItem.rate}
                              onChange={(e) => updateBomItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(bomItem.quantity * bomItem.rate)}
                          </TableCell>
                          <TableCell>
                            {bomItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => removeBomItem(index)}
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
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create BOM
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search BOMs..."
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
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* BOMs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Bills of Materials ({filteredBoms.length})
          </CardTitle>
          <CardDescription>Product recipes and material requirements</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredBoms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No BOMs found</p>
              <Button className="mt-4" variant="outline" onClick={() => setIsDialogOpen(true)}>
                Create Your First BOM
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>BOM No</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Raw Material Cost</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBoms.map((bom) => (
                    <TableRow key={bom.id}>
                      <TableCell className="font-mono text-sm">{bom.bomNo}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{bom.itemName}</div>
                          <div className="text-sm text-gray-500">{bom.itemCode}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{bom.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(bom.rawMaterialCost)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(bom.totalCost)}</TableCell>
                      <TableCell>{getStatusBadge(bom.status, bom.isActive, bom.isDefault)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewBom(bom.id)}
                            disabled={isPending}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {bom.status === 'Draft' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600"
                              onClick={() => handleSubmit(bom.id)}
                              disabled={isPending}
                              title="Submit BOM"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {bom.status === 'Submitted' && !bom.isDefault && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-yellow-600"
                              onClick={() => handleSetDefault(bom.id)}
                              disabled={isPending}
                              title="Set as Default"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          {(bom.status === 'Draft' || bom.status === 'Submitted') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => handleCancel(bom.id)}
                              disabled={isPending}
                              title="Cancel BOM"
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* View BOM Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>BOM Details - {selectedBom?.bomNo}</DialogTitle>
            <DialogDescription>
              {selectedBom?.itemName} ({selectedBom?.itemCode})
            </DialogDescription>
          </DialogHeader>
          {selectedBom && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-500">Quantity</Label>
                  <p className="font-medium">{selectedBom.quantity}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <p>{getStatusBadge(selectedBom.status, selectedBom.isActive, selectedBom.isDefault)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Total Cost</Label>
                  <p className="font-medium">{formatCurrency(selectedBom.totalCost)}</p>
                </div>
              </div>

              {selectedBom.items && selectedBom.items.length > 0 && (
                <div className="space-y-2">
                  <Label>Raw Materials</Label>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBom.items?.map((item: BomItemDetail, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.itemName}</div>
                                <div className="text-sm text-gray-500">{item.itemCode}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item.stockQty || item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-gray-500">Raw Material Cost</Label>
                  <p className="font-medium">{formatCurrency(selectedBom.rawMaterialCost)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Operating Cost</Label>
                  <p className="font-medium">{formatCurrency(selectedBom.operatingCost)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Cost Per Unit</Label>
                  <p className="font-medium">{formatCurrency(selectedBom.totalCost / selectedBom.quantity)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
