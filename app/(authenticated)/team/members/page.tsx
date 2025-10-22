import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Search, Shield } from "lucide-react";

export default function TeamMembersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">Manage users and permissions</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Members</CardDescription>
            <CardTitle className="text-2xl">5</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">With access</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-2xl">2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Full access</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Invites</CardDescription>
            <CardTitle className="text-2xl">2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Not accepted</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Directory
          </CardTitle>
          <CardDescription>Manage user access and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="text-center py-12 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No team members yet</p>
            <Button className="mt-4" variant="outline">Invite Your First Team Member</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
