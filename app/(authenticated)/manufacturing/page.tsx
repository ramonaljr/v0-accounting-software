'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Factory,
  FileText,
  ClipboardList,
  Cog,
  ArrowRight,
  Loader2,
  Plus,
  PlayCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  listBoms,
  listWorkOrders,
  listJobCards,
} from '@/lib/actions/manufacturing';

interface ManufacturingStats {
  totalBoms: number;
  activeWorkOrders: number;
  pendingJobCards: number;
  completedToday: number;
}

interface WorkOrder {
  id: string;
  workOrderNo: string;
  itemName: string;
  qty: number;
  producedQty: number;
  status: string;
  plannedStartDate: string;
}

export default function ManufacturingPage() {
  const [stats, setStats] = useState<ManufacturingStats>({
    totalBoms: 0,
    activeWorkOrders: 0,
    pendingJobCards: 0,
    completedToday: 0,
  });
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [bomsResult, workOrdersResult, jobCardsResult] = await Promise.all([
          listBoms({ isActive: true }),
          listWorkOrders({ limit: 10 }),
          listJobCards({ status: 'Open' }),
        ]);

        interface WorkOrderData {
          id: string;
          workOrderNo: string;
          itemName?: string;
          qty: number;
          producedQty: number;
          status: string;
          plannedStartDate: string;
          updatedAt?: string;
        }
        const workOrders = workOrdersResult.success ? (workOrdersResult.data as WorkOrderData[]) || [] : [];
        const activeWOs = workOrders.filter((wo) =>
          wo.status === 'In Progress' || wo.status === 'Not Started'
        );
        const completedToday = workOrders.filter((wo) => {
          const today = new Date().toDateString();
          return wo.status === 'Completed' &&
                 wo.updatedAt && new Date(wo.updatedAt).toDateString() === today;
        });

        setStats({
          totalBoms: bomsResult.success ? (bomsResult.data as unknown[])?.length || 0 : 0,
          activeWorkOrders: activeWOs.length,
          pendingJobCards: jobCardsResult.success ? (jobCardsResult.data as unknown[])?.length || 0 : 0,
          completedToday: completedToday.length,
        });

        setRecentWorkOrders(workOrders.slice(0, 5).map((wo) => ({
          id: wo.id,
          workOrderNo: wo.workOrderNo,
          itemName: wo.itemName || 'Unknown Item',
          qty: wo.qty,
          producedQty: wo.producedQty || 0,
          status: wo.status,
          plannedStartDate: wo.plannedStartDate,
        })));
      } catch (error) {
        console.error('Failed to load manufacturing data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const quickLinks = [
    { label: 'Bill of Materials', href: '/manufacturing/bom', icon: FileText, description: 'Product recipes' },
    { label: 'Work Orders', href: '/manufacturing/work-orders', icon: ClipboardList, description: 'Production orders' },
    { label: 'Job Cards', href: '/manufacturing/job-cards', icon: Cog, description: 'Operation tracking' },
    { label: 'Production Plans', href: '/manufacturing/production-plans', icon: Factory, description: 'Planning & scheduling' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'In Progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="default">Completed</Badge>;
      case 'In Progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'Not Started':
        return <Badge variant="outline">Not Started</Badge>;
      case 'Stopped':
        return <Badge variant="destructive">Stopped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manufacturing</h1>
          <p className="text-gray-600 mt-1">Production planning, BOMs, and work orders</p>
        </div>
        <div className="flex gap-2">
          <Link href="/manufacturing/bom/new">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New BOM
            </Button>
          </Link>
          <Link href="/manufacturing/work-orders/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Work Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Bill of Materials</CardDescription>
            <CardTitle className="text-2xl">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalBoms}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Active product recipes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Work Orders</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeWorkOrders}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Job Cards</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.pendingJobCards}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Awaiting start</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed Today</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.completedToday}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Work orders finished</p>
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

      {/* Recent Work Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Recent Work Orders
          </CardTitle>
          <CardDescription>Latest production orders</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : recentWorkOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Factory className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No work orders yet</p>
              <Link href="/manufacturing/work-orders/new">
                <Button className="mt-4" variant="outline">
                  Create First Work Order
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkOrders.map((wo) => (
                <div
                  key={wo.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(wo.status)}
                    <div>
                      <p className="font-medium">{wo.workOrderNo}</p>
                      <p className="text-sm text-gray-600">{wo.itemName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {wo.producedQty} / {wo.qty}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(wo.plannedStartDate).toLocaleDateString('en-PH')}
                      </p>
                    </div>
                    {getStatusBadge(wo.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {recentWorkOrders.length > 0 && (
            <Link href="/manufacturing/work-orders">
              <Button variant="outline" className="w-full mt-4">
                View All Work Orders
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
