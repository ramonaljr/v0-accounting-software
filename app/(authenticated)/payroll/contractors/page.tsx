import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, FileText } from "lucide-react";

export default function PayrollContractorsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contractors</h1>
          <p className="text-gray-600 mt-1">Manage independent contractors on payroll</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Contractor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Contractors</CardDescription>
            <CardTitle className="text-2xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">1099 workers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>YTD Payments</CardDescription>
            <CardTitle className="text-2xl">$95,000</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Total paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Upcoming Payments</CardDescription>
            <CardTitle className="text-2xl">$8,500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">This period</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Contractor List
          </CardTitle>
          <CardDescription>1099 contractors and freelancers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No contractors in payroll yet</p>
            <Button className="mt-4" variant="outline">Add Contractor</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
