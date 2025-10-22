import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Folder, Search } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage client projects and track profitability</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Projects</CardDescription>
            <CardTitle className="text-2xl">12</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Billable Amount</CardDescription>
            <CardTitle className="text-2xl">$45,200</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Ready to invoice</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Hours Tracked</CardDescription>
            <CardTitle className="text-2xl">586 hrs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Project List
          </CardTitle>
          <CardDescription>Track time, expenses, and profitability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="text-center py-12 text-gray-500">
            <Folder className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No projects yet</p>
            <p className="text-sm mt-2">Create projects to track time and expenses</p>
            <Button className="mt-4" variant="outline">Create Your First Project</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
