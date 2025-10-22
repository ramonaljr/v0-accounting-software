import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, TrendingUp } from "lucide-react";

export default function TimeOverviewPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking Overview</h1>
          <p className="text-gray-600 mt-1">Track billable hours and productivity</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Log Time
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Week</CardDescription>
            <CardTitle className="text-2xl">142 hrs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Total hours logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Billable</CardDescription>
            <CardTitle className="text-2xl">98 hrs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>69% billable</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Timers</CardDescription>
            <CardTitle className="text-2xl">3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Running now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Revenue</CardDescription>
            <CardTitle className="text-2xl">$14,700</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">From billable hours</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Summary
          </CardTitle>
          <CardDescription>Hours by project and team member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No time entries yet</p>
            <Button className="mt-4" variant="outline">Start Tracking Time</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
