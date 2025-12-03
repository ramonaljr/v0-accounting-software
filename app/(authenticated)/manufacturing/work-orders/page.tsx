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
  ClipboardList,
  Plus,
  Loader2,
  Play,
  CheckCircle,
  XCircle,
  Search,
} from 'lucide-react';
import {
  listWorkOrders,
  createWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  cancelWorkOrder,
  listBoms,
} from '@/lib/actions/manufacturing';
import { listWarehouses } from '@/lib/actions/stock';

interface WorkOrder {
  id: string;
  workOrderNo: string;
  itemId: string;
  itemName: string;
  bomId: string;
  qty: number;
  producedQty: number;
  status: 'Draft' | 'Not Started' | 'In Progress' | 'Stopped' | 'Completed' | 'Cancelled';
  plannedStartDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  targetWarehouseId: string;
  createdAt: string;
}

interface Bom {
  id: string;
  bomName: string;
  itemId: string;
  itemName: string;
  quantity: number;
}

interface Warehouse {
  id: string;
  warehouseName: string;
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [woResult, bomsResult, whResult] = await Promise.all([
          listWorkOrders({ status: statusFilter || undefined }),
          listBoms({ isActive: true }),
          listWarehouses(),
        ]);

        if (woResult.success) {
          setWorkOrders(woResult.data as WorkOrder[] || []);
        }
        if (bomsResult.success) {
          setBoms(bomsResult.data as Bom[] || []);
        }
        if (whResult.success) {
          setWarehouses(whResult.data as Warehouse[] || []);
        }
      } catch (error) {
        console.error('Failed to load work orders:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [statusFilter]);

  // Handle create work order
  async function handleCreateWorkOrder(formData: FormData) {
    startTransition(async () => {
      const data = {
        bomId: formData.get('bomId') as string,
        qty: parseFloat(formData.get('qty') as string),
        plannedStartDate: formData.get('plannedStartDate') as string,
        targetWarehouseId: formData.get('targetWarehouseId') as string,
        sourceWarehouseId: formData.get('sourceWarehouseId') as string || undefined,
      };

      const result = await createWorkOrder(data);

      if (result.success) {
        setIsDialogOpen(false);
        const woResult = await listWorkOrders();
        if (woResult.success) {
          setWorkOrders(woResult.data as WorkOrder[] || []);
        }
      } else {
        alert(result.error || 'Failed to create work order');
      }
    });
  }

  // Handle start work order
  async function handleStart(id: string) {
    startTransition(async () => {
      const result = await startWorkOrder(id);
      if (result.success) {
        const woResult = await listWorkOrders({ status: statusFilter || undefined });
        if (woResult.success) {
          setWorkOrders(woResult.data as WorkOrder[] || []);
        }
      } else {
        alert(result.error || 'Failed to start work order');
      }
    });
  }

  // Handle complete work order
  async function handleComplete(id: string) {
    startTransition(async () => {
      const result = await completeWorkOrder(id);
      if (result.success) {
        const woResult = await listWorkOrders({ status: statusFilter || undefined });
        if (woResult.success) {
          setWorkOrders(woResult.data as WorkOrder[] || []);
        }
      } else {
        alert(result.error || 'Failed to complete work order');
      }
    });
  }

  // Handle cancel work order
  async function handleCancel(id: string) {
    if (!confirm('Are you sure you want to cancel this work order?')) return;

    startTransition(async () => {
      const result = await cancelWorkOrder(id);
      if (result.success) {
        const woResult = await listWorkOrders({ status: statusFilter || undefined });
        if (woResult.success) {
          setWorkOrders(woResult.data as WorkOrder[] || []);
        }
      } else {
        alert(result.error || 'Failed to cancel work order');
      }
    });
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="default">Completed</Badge>;
      case 'In Progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'Not Started':
        return <Badge variant="outline">Not Started</Badge>;
      case 'Stopped':
        return <Badge variant="destructive">Stopped</Badge>;
      case 'Cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter work orders by search
  const filteredOrders = workOrders.filter(wo => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      wo.workOrderNo?.toLowerCase().includes(query) ||
      wo.itemName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-gray-600 mt-1">Manage production orders and track progress</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Work Order
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Work Order</DialogTitle>
              <DialogDescription>
                Start a new production order from a Bill of Materials.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateWorkOrder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bomId">Bill of Materials *</Label>
                <Select name="bomId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select BOM" />
                  </SelectTrigger>
                  <SelectContent>
                    {boms.map(bom => (
                      <SelectItem key={bom.id} value={bom.id}>
                        {bom.bomName} ({bom.itemName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity *</Label>
                  <Input id="qty" name="qty" type="number" min="1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plannedStartDate">Planned Start Date *</Label>
                  <Input id="plannedStartDate" name="plannedStartDate" type="date" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetWarehouseId">Target Warehouse *</Label>
                  <Select name="targetWarehouseId" required>
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
                <div className="space-y-2">
                  <Label htmlFor="sourceWarehouseId">Source Warehouse</Label>
                  <Select name="sourceWarehouseId">
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

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Work Order
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
                placeholder="Search work orders..."
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
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Stopped">Stopped</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Work Orders ({filteredOrders.length})
          </CardTitle>
          <CardDescription>Production orders and their progress</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No work orders found</p>
              <Button className="mt-4" variant="outline" onClick={() => setIsDialogOpen(true)}>
                Create Your First Work Order
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Produced</TableHead>
                    <TableHead>Planned Start</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell className="font-mono text-sm">{wo.workOrderNo}</TableCell>
                      <TableCell className="font-medium">{wo.itemName}</TableCell>
                      <TableCell className="text-right">{wo.qty}</TableCell>
                      <TableCell className="text-right">
                        <span className={wo.producedQty >= wo.qty ? 'text-green-600' : ''}>
                          {wo.producedQty || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(wo.plannedStartDate).toLocaleDateString('en-PH')}
                      </TableCell>
                      <TableCell>{getStatusBadge(wo.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {wo.status === 'Not Started' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-blue-600"
                              onClick={() => handleStart(wo.id)}
                              disabled={isPending}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {wo.status === 'In Progress' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600"
                              onClick={() => handleComplete(wo.id)}
                              disabled={isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {(wo.status === 'Not Started' || wo.status === 'In Progress') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => handleCancel(wo.id)}
                              disabled={isPending}
                            >
                              <XCircle className="h-4 w-4" />
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
