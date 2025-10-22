import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";

export default function EstimatesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estimates</h1>
          <p className="text-gray-600 mt-1">Create and send project estimates</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Estimate
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl">$18,500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">5 estimates</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardDescription>Accepted</CardDescription>
            <CardTitle className="text-2xl text-green-600">$24,000</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600">8 estimates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Conversion Rate</CardDescription>
            <CardTitle className="text-2xl">62%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Estimate to invoice</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">13</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Estimates sent</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Estimates
          </CardTitle>
          <CardDescription>Quotes and proposals for customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No estimates created yet</p>
            <Button className="mt-4" variant="outline">Create Your First Estimate</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
