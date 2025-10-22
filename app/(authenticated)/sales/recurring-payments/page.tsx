import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, CreditCard } from "lucide-react";

export default function RecurringPaymentsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recurring Payments</h1>
          <p className="text-gray-600 mt-1">Set up automatic subscription billing</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Subscription
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Subscriptions</CardDescription>
            <CardTitle className="text-2xl">12</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Recurring customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Monthly Recurring</CardDescription>
            <CardTitle className="text-2xl">$8,450</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">MRR</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Next Billing</CardDescription>
            <CardTitle className="text-2xl">Jan 15</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">5 customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Churn Rate</CardDescription>
            <CardTitle className="text-2xl">2.5%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Subscription Plans
          </CardTitle>
          <CardDescription>Manage recurring billing and subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No recurring payments set up</p>
            <p className="text-sm mt-2">Create subscription plans for predictable revenue</p>
            <Button className="mt-4" variant="outline">Create Subscription Plan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
