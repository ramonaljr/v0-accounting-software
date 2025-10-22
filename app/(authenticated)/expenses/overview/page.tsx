import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";

export default function ExpensesOverviewPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses & Bills Overview</h1>
          <p className="text-gray-600 mt-1">Track and manage business expenses</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">$8,430</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-red-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>12% vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Unpaid Bills</CardDescription>
            <CardTitle className="text-2xl">$12,500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">5 bills due soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Receipts</CardDescription>
            <CardTitle className="text-2xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Need categorization</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Vendors</CardDescription>
            <CardTitle className="text-2xl">24</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Total vendors</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
            <CardDescription>This month breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Rent</span>
                <span className="font-semibold">$2,500</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Software & Subscriptions</span>
                <span className="font-semibold">$1,845</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Office Supplies</span>
                <span className="font-semibold">$680</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Utilities</span>
                <span className="font-semibold">$450</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bills</CardTitle>
            <CardDescription>Due in next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                <div>
                  <p className="text-sm font-medium">Office Rent</p>
                  <p className="text-xs text-gray-600">Due in 2 days</p>
                </div>
                <span className="font-semibold text-red-600">$2,500</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                <div>
                  <p className="text-sm font-medium">Internet Service</p>
                  <p className="text-xs text-gray-600">Due in 7 days</p>
                </div>
                <span className="font-semibold text-yellow-700">$120</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
