import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Link2, Copy } from "lucide-react";

export default function PaymentLinksPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Links</h1>
          <p className="text-gray-600 mt-1">Create shareable payment links for quick checkout</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Payment Link
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Links</CardDescription>
            <CardTitle className="text-2xl">5</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Payment links created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Collected</CardDescription>
            <CardTitle className="text-2xl">$12,450</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Via payment links</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Conversion Rate</CardDescription>
            <CardTitle className="text-2xl">68%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Visitors who paid</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Your Payment Links
          </CardTitle>
          <CardDescription>Share links via email, text, or social media</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Link2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No payment links created yet</p>
            <p className="text-sm mt-2">Create payment links to accept payments without invoices</p>
            <Button className="mt-4" variant="outline">Create Your First Link</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Payment Links Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 font-semibold">1</div>
              <div>
                <p className="font-medium">Create a payment link</p>
                <p className="text-gray-600">Set amount, description, and payment options</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 font-semibold">2</div>
              <div>
                <p className="font-medium">Share the link</p>
                <p className="text-gray-600">Send via email, text, or social media</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 font-semibold">3</div>
              <div>
                <p className="font-medium">Get paid instantly</p>
                <p className="text-gray-600">Customers pay securely, funds deposited to your account</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
