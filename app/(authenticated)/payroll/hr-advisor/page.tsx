import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, Video, FileText } from "lucide-react";

export default function HRAdvisorPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Advisor</h1>
          <p className="text-gray-600 mt-1">Expert guidance on HR policies and compliance</p>
        </div>
        <Button size="sm">Contact HR Expert</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-teal-200 bg-teal-50">
          <CardHeader>
            <Phone className="h-8 w-8 text-teal-600 mb-2" />
            <CardTitle className="text-lg">Phone Support</CardTitle>
            <CardDescription>Speak with an HR expert</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Call Now</Button>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <Video className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle className="text-lg">Video Consultation</CardTitle>
            <CardDescription>Schedule a video call</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Schedule Call</Button>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <MessageSquare className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle className="text-lg">Live Chat</CardTitle>
            <CardDescription>Chat with HR advisor</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Start Chat</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            HR Resources
          </CardTitle>
          <CardDescription>Policies, templates, and compliance guides</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-teal-600 pl-4 py-2">
              <h3 className="font-semibold text-sm">Employee Handbook Templates</h3>
              <p className="text-sm text-gray-600 mt-1">Customizable templates for your business</p>
            </div>
            <div className="border-l-4 border-blue-600 pl-4 py-2">
              <h3 className="font-semibold text-sm">Compliance Guides</h3>
              <p className="text-sm text-gray-600 mt-1">Stay compliant with labor laws</p>
            </div>
            <div className="border-l-4 border-purple-600 pl-4 py-2">
              <h3 className="font-semibold text-sm">HR Best Practices</h3>
              <p className="text-sm text-gray-600 mt-1">Expert advice on HR management</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
