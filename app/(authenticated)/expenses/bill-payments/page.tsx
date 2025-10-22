import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, CheckCircle2 } from "lucide-react";

export default function BillPaymentsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bill Payments</h1>
          <p className="text-gray-600 mt-1">Record and track payments to vendors</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">$8,430</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Total payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl">$2,500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">In processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Scheduled</CardDescription>
            <CardTitle className="text-2xl">3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Upcoming payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>Recent payments to vendors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Office Rent Payment</p>
                  <p className="text-xs text-gray-600">Paid on Jan 1, 2025</p>
                </div>
              </div>
              <span className="font-semibold">$2,500.00</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Software Subscription</p>
                  <p className="text-xs text-gray-600">Paid on Dec 28, 2024</p>
                </div>
              </div>
              <span className="font-semibold">$450.00</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
