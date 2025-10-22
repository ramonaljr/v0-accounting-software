import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Car, MapPin } from "lucide-react";

export default function MileagePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mileage Tracking</h1>
          <p className="text-gray-600 mt-1">Track business mileage for tax deductions</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Log Trip
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">245 mi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Business miles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tax Deduction</CardDescription>
            <CardTitle className="text-2xl">$160</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">@ $0.655/mile</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Year</CardDescription>
            <CardTitle className="text-2xl">2,850 mi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Total business miles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Trips</CardDescription>
            <CardTitle className="text-2xl">18</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Recent Trips
          </CardTitle>
          <CardDescription>Automatically track business mileage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No trips logged yet</p>
            <p className="text-sm mt-2">Start tracking business mileage for tax deductions</p>
            <Button className="mt-4" variant="outline">Log Your First Trip</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IRS Standard Mileage Rate</CardTitle>
          <CardDescription>2025 tax year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>$0.655 per mile</strong> - Standard mileage rate for business use of your vehicle
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
