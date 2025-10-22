import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Filter, Download } from "lucide-react";

export default function TimeEntriesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Entries</h1>
          <p className="text-gray-600 mt-1">View and manage all time entries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Log Time
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">586 hrs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Total hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Billable Hours</CardDescription>
            <CardTitle className="text-2xl">412 hrs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">70% billable</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Unbilled</CardDescription>
            <CardTitle className="text-2xl">$8,450</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Ready to invoice</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Log
          </CardTitle>
          <CardDescription>All tracked time entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No time entries logged</p>
            <Button className="mt-4" variant="outline">Log Your First Entry</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
