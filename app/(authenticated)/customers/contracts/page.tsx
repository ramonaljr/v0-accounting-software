import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileSignature } from "lucide-react";

export default function ContractsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
          <p className="text-gray-600 mt-1">Manage customer agreements and contracts</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Contract
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Contracts</CardDescription>
            <CardTitle className="text-2xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">In effect</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardDescription>Expiring Soon</CardDescription>
            <CardTitle className="text-2xl text-yellow-700">2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-yellow-700">Within 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Contract Value</CardDescription>
            <CardTitle className="text-2xl">$145,000</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Annual value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Contract Management
          </CardTitle>
          <CardDescription>Service agreements and long-term contracts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No contracts created yet</p>
            <Button className="mt-4" variant="outline">Create Your First Contract</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
