'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Warehouse,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Loader2,
  Plus,
  FileText,
  BarChart3,
} from 'lucide-react';
import {
  listItems,
  listWarehouses,
  getLowStockItems,
  getInventoryValuation,
} from '@/lib/actions/stock';

interface InventoryStats {
  totalItems: number;
  totalWarehouses: number;
  lowStockCount: number;
  totalValue: number;
}

interface LowStockItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  actualQty: number;
  reorderLevel: number;
  shortfall: number;
}

export default function InventoryPage() {
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    totalWarehouses: 0,
    lowStockCount: 0,
    totalValue: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [itemsResult, warehousesResult, lowStockResult, valuationResult] = await Promise.all([
          listItems({ isActive: true }),
          listWarehouses(),
          getLowStockItems(),
          getInventoryValuation(),
        ]);

        setStats({
          totalItems: itemsResult.success ? (itemsResult.data as unknown[])?.length || 0 : 0,
          totalWarehouses: warehousesResult.success ? (warehousesResult.data as unknown[])?.length || 0 : 0,
          lowStockCount: lowStockResult.success ? (lowStockResult.data as unknown[])?.length || 0 : 0,
          totalValue: valuationResult.success ? (valuationResult.data as { totalValue?: number })?.totalValue || 0 : 0,
        });

        if (lowStockResult.success) {
          setLowStockItems((lowStockResult.data as LowStockItem[])?.slice(0, 5) || []);
        }
      } catch (error) {
        console.error('Failed to load inventory data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const quickLinks = [
    { label: 'Items', href: '/inventory/items', icon: Package, description: 'Manage product catalog' },
    { label: 'Warehouses', href: '/inventory/warehouses', icon: Warehouse, description: 'Storage locations' },
    { label: 'Stock Entry', href: '/inventory/stock-entries', icon: FileText, description: 'Receipts & issues' },
    { label: 'Stock Ledger', href: '/inventory/ledger', icon: BarChart3, description: 'Transaction history' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">Manage stock, warehouses, and inventory movements</p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory/items/new">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Item
            </Button>
          </Link>
          <Link href="/inventory/stock-entries/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Stock Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="text-2xl">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalItems}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Active products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Warehouses</CardDescription>
            <CardTitle className="text-2xl">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalWarehouses}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Storage locations</p>
          </CardContent>
        </Card>
        <Card className={stats.lowStockCount > 0 ? 'border-yellow-300 bg-yellow-50' : ''}>
          <CardHeader className="pb-3">
            <CardDescription>Low Stock Alerts</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.lowStockCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-yellow-700">Items below reorder level</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Inventory Value</CardDescription>
            <CardTitle className="text-2xl">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(stats.totalValue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-gray-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Total stock value</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:border-gray-400 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <link.icon className="h-5 w-5 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{link.label}</h3>
                    <p className="text-sm text-gray-500">{link.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Low Stock Items */}
      {lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Items that need to be reordered</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-sm text-gray-600">{item.itemCode}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {item.actualQty} / {item.reorderLevel}
                    </Badge>
                    <p className="text-xs text-red-600 mt-1">
                      Need {item.shortfall} more
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/inventory/items?filter=low-stock">
              <Button variant="outline" className="w-full mt-4">
                View All Low Stock Items
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
