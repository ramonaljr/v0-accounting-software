import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Download } from "lucide-react";

export default function SalesTransactionsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Transactions</h1>
          <p className="text-gray-600 mt-1">All sales, invoices, and customer payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Sale
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">$28,450</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Total revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Transactions</CardDescription>
            <CardTitle className="text-2xl">56</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Transaction</CardDescription>
            <CardTitle className="text-2xl">$508</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Average value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Sales history and payment records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No sales transactions yet</p>
            <Button className="mt-4" variant="outline">Record Your First Sale</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
