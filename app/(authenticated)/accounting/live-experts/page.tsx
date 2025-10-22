import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Video, MessageCircle, Calendar } from "lucide-react";

export default function LiveExpertsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Experts</h1>
          <p className="text-gray-600 mt-1">Get help from QuickBooks-certified experts</p>
        </div>
        <Button size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Call
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-teal-200 bg-teal-50">
          <CardHeader>
            <Phone className="h-8 w-8 text-teal-600 mb-2" />
            <CardTitle className="text-lg">Phone Support</CardTitle>
            <CardDescription>Speak with an expert now</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Call Now</Button>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <Video className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle className="text-lg">Video Call</CardTitle>
            <CardDescription>Screen share with an expert</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Start Video Call</Button>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <MessageCircle className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle className="text-lg">Live Chat</CardTitle>
            <CardDescription>Chat with an expert</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Start Chat</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expert Services</CardTitle>
          <CardDescription>Professional help for your accounting needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-teal-600 pl-4 py-2">
              <h3 className="font-semibold text-sm">Bookkeeping Services</h3>
              <p className="text-sm text-gray-600 mt-1">Let our experts manage your books monthly</p>
            </div>
            <div className="border-l-4 border-blue-600 pl-4 py-2">
              <h3 className="font-semibold text-sm">Tax Preparation</h3>
              <p className="text-sm text-gray-600 mt-1">Get your taxes done by certified professionals</p>
            </div>
            <div className="border-l-4 border-purple-600 pl-4 py-2">
              <h3 className="font-semibold text-sm">Setup & Training</h3>
              <p className="text-sm text-gray-600 mt-1">Get help setting up your accounting system</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
