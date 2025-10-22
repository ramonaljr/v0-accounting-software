import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Download } from "lucide-react";

export default function ChannelPayoutsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Channel Payouts</h1>
          <p className="text-gray-600 mt-1">Track payouts from connected sales channels</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl">$4,500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Awaiting payout</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">$22,300</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Channel payouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Connected Channels</CardDescription>
            <CardTitle className="text-2xl">2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Active platforms</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Payout Breakdown by Channel
          </CardTitle>
          <CardDescription>Deposits from Shopify, Amazon, and other platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No channel payouts yet</p>
            <p className="text-sm mt-2">Connect sales channels to track platform payouts</p>
            <Button className="mt-4" variant="outline">Connect Sales Channel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
