import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, Search } from "lucide-react";

export default function ProductsServicesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products & Services</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog and service offerings</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Product/Service
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="text-2xl">24</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Products & services</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Products</CardDescription>
            <CardTitle className="text-2xl">18</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Physical items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Services</CardDescription>
            <CardTitle className="text-2xl">6</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Service offerings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Low Stock</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-yellow-600">Need reorder</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Catalog
          </CardTitle>
          <CardDescription>Items you sell to customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products and services..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="text-center py-12 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No products or services added yet</p>
            <p className="text-sm mt-2">Add items to quickly populate invoices and track sales</p>
            <Button className="mt-4" variant="outline">Add Your First Item</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performers this month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 text-center py-4">No sales data yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>Items needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 text-center py-4">All items in stock</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
