import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, DollarSign } from "lucide-react";

export default function SalesOverviewPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales & Get Paid Overview</h1>
          <p className="text-gray-600 mt-1">Track revenue and customer payments</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Revenue (MTD)</CardDescription>
            <CardTitle className="text-2xl">$28,450</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>18% vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Outstanding</CardDescription>
            <CardTitle className="text-2xl">$12,300</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">8 unpaid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-2xl text-red-600">$3,200</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-red-600">2 invoices overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Customers</CardDescription>
            <CardTitle className="text-2xl">42</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Total customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">INV-1024</p>
                  <p className="text-xs text-gray-600">Acme Corp - Paid</p>
                </div>
                <span className="text-sm font-semibold text-green-600">$5,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">INV-1023</p>
                  <p className="text-xs text-gray-600">Tech Solutions - Pending</p>
                </div>
                <span className="text-sm font-semibold text-yellow-600">$3,500</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>How customers pay you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Credit Card</span>
                <span className="font-semibold">65%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Bank Transfer</span>
                <span className="font-semibold">25%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Check</span>
                <span className="font-semibold">10%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
