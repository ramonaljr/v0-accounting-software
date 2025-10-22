import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, MessageSquare } from "lucide-react";

export default function ReviewsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="text-gray-600 mt-1">Monitor and respond to customer feedback</p>
        </div>
        <Button size="sm">Request Review</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Rating</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-1">
              4.8 <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">From 24 reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>5-Star Reviews</CardDescription>
            <CardTitle className="text-2xl">18</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">75% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Response Rate</CardDescription>
            <CardTitle className="text-2xl">100%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">All reviews responded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">6</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">New reviews</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Reviews
          </CardTitle>
          <CardDescription>Customer feedback and testimonials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <ThumbsUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No reviews yet</p>
            <p className="text-sm mt-2">Request reviews from satisfied customers</p>
            <Button className="mt-4" variant="outline">Send Review Request</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
