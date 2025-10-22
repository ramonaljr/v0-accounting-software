import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Store, ShoppingCart } from "lucide-react";

export default function SalesChannelsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Channels</h1>
          <p className="text-gray-600 mt-1">Connect e-commerce platforms and marketplaces</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Channel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Connected Channels</CardDescription>
            <CardTitle className="text-2xl">2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Active integrations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Channel Revenue</CardDescription>
            <CardTitle className="text-2xl">$24,500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Synced Orders</CardDescription>
            <CardTitle className="text-2xl">156</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">Shopify</CardTitle>
            <CardDescription>Connect your Shopify store</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Connect</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <Store className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">WooCommerce</CardTitle>
            <CardDescription>Sync WooCommerce orders</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Connect</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Amazon</CardTitle>
            <CardDescription>Import Amazon sales</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Connect</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
