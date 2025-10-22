import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, MessageSquare } from "lucide-react";

export default function MyAccountantPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Accountant</h1>
          <p className="text-gray-600 mt-1">Collaborate with your accountant or bookkeeper</p>
        </div>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Accountant
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Team Members</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Accountants invited</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Shared Files</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Documents shared</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Messages</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Unread messages</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Accountant Access
          </CardTitle>
          <CardDescription>Give your accountant secure access to your books</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="font-medium">No accountant invited yet</p>
            <p className="text-sm mt-2">Invite your accountant to collaborate on your books</p>
            <Button className="mt-4">Invite Accountant</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </CardTitle>
          <CardDescription>Communicate with your accounting team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No messages yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
