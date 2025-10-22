import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";

export default function RecurringTransactionsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recurring Transactions</h1>
          <p className="text-gray-600 mt-1">Automate regular income and expenses</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Recurring Transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl">5</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Recurring templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Next Due</CardDescription>
            <CardTitle className="text-2xl">Jan 1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Office rent - $2,500</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">$8,450</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Auto-posted total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Recurring Templates
          </CardTitle>
          <CardDescription>Set up recurring invoices, bills, and journal entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No recurring transactions set up</p>
            <p className="text-sm mt-2">Automate regular transactions to save time</p>
            <Button className="mt-4" variant="outline">Create Template</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
