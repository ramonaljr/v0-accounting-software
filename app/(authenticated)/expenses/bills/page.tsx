import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, AlertCircle } from "lucide-react";

export default function BillsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-600 mt-1">Track and pay vendor bills</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Bill
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Unpaid Bills</CardDescription>
            <CardTitle className="text-2xl">$12,500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">5 bills outstanding</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-2xl text-red-600">$2,350</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-red-600">2 bills overdue</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardDescription>Due Soon</CardDescription>
            <CardTitle className="text-2xl text-yellow-700">$3,500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-yellow-700">Due in 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month Paid</CardDescription>
            <CardTitle className="text-2xl">$8,430</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">12 bills paid</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Bills
          </CardTitle>
          <CardDescription>Upcoming and unpaid bills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Office Supplies Inc</p>
                  <p className="text-xs text-gray-600">Due: 3 days overdue</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">$850.00</p>
                <Button size="sm" className="mt-1">Pay Now</Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Acme Services</p>
                  <p className="text-xs text-gray-600">Due: in 2 days</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-yellow-700">$1,500.00</p>
                <Button size="sm" variant="outline" className="mt-1">Pay Now</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
