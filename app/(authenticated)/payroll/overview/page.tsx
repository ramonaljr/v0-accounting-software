import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, TrendingUp } from "lucide-react";

export default function PayrollOverviewPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Overview</h1>
          <p className="text-gray-600 mt-1">Manage employee compensation and payroll</p>
        </div>
        <Button size="sm">Run Payroll</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Employees</CardDescription>
            <CardTitle className="text-2xl">24</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Active employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Next Payroll</CardDescription>
            <CardTitle className="text-2xl">$42,500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Due Jan 15</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>YTD Payroll</CardDescription>
            <CardTitle className="text-2xl">$520,000</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-gray-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>On track</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tax Liability</CardDescription>
            <CardTitle className="text-2xl">$8,450</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Pending payment</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Recent Payroll Runs
          </CardTitle>
          <CardDescription>Historical payroll processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No payroll runs yet</p>
            <Button className="mt-4" variant="outline">Run Your First Payroll</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
