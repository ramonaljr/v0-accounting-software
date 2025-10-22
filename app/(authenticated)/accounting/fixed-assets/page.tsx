import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingDown } from "lucide-react";

export default function FixedAssetsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fixed Assets</h1>
          <p className="text-gray-600 mt-1">Track and depreciate your company assets</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Assets</CardDescription>
            <CardTitle className="text-2xl">$125,000</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Book value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>YTD Depreciation</CardDescription>
            <CardTitle className="text-2xl">$18,500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Accumulated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Asset Count</CardDescription>
            <CardTitle className="text-2xl">12</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Active assets</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Asset Register
          </CardTitle>
          <CardDescription>Manage equipment, vehicles, property and other fixed assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No fixed assets recorded</p>
            <p className="text-sm mt-2">Add assets to track depreciation and book value</p>
            <Button className="mt-4" variant="outline">Add Your First Asset</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
