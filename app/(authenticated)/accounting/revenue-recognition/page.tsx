import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";

export default function RevenueRecognitionPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Recognition</h1>
          <p className="text-gray-600 mt-1">Manage deferred revenue and subscription accounting</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Deferred Revenue</CardDescription>
            <CardTitle className="text-2xl">$45,000</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Unearned balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">$12,500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Revenue recognized</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Schedules</CardDescription>
            <CardTitle className="text-2xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Recognition schedules</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recognition Schedules
          </CardTitle>
          <CardDescription>Automate revenue recognition for subscriptions and contracts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No revenue recognition schedules</p>
            <p className="text-sm mt-2">Create schedules to properly recognize subscription revenue over time</p>
            <Button className="mt-4" variant="outline">Create Schedule</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance</CardTitle>
          <CardDescription>ASC 606 / IFRS 15 revenue recognition standards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Revenue recognition helps you comply with accounting standards by properly timing when revenue is recognized in your financial statements.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
