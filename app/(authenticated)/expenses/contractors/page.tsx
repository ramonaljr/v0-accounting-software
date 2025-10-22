import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, FileText } from "lucide-react";

export default function ContractorsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contractors</h1>
          <p className="text-gray-600 mt-1">Manage independent contractors and 1099 workers</p>
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
            <CardDescription>This Year Paid</CardDescription>
            <CardTitle className="text-2xl">$45,000</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Total contractor payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Need 1099s</CardDescription>
            <CardTitle className="text-2xl">3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Over $600 threshold</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contractor Directory
          </CardTitle>
          <CardDescription>Independent contractors and freelancers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No contractors added yet</p>
            <p className="text-sm mt-2">Add contractors to track payments and generate 1099 forms</p>
            <Button className="mt-4" variant="outline">Add Your First Contractor</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            1099 Filing
          </CardTitle>
          <CardDescription>Tax form generation and e-filing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>Reminder:</strong> 1099-NEC forms must be filed by January 31st for contractors paid $600 or more during the tax year.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
