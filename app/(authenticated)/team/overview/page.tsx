import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, UserCheck } from "lucide-react";

export default function TeamOverviewPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Overview</h1>
          <p className="text-gray-600 mt-1">Manage team members and permissions</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Invite Team Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Team Members</CardDescription>
            <CardTitle className="text-2xl">5</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Active users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Invitations</CardDescription>
            <CardTitle className="text-2xl">2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Not yet accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Last Login</CardDescription>
            <CardTitle className="text-2xl">2h ago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Most recent activity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Activity
          </CardTitle>
          <CardDescription>Recent team member actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">John Smith logged in</p>
                <p className="text-xs text-gray-600">2 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
