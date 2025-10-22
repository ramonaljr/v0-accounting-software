import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";

export default function IntegrationTransactionsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integration Transactions</h1>
          <p className="text-gray-600 mt-1">Transactions synced from connected apps</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Manage Integrations
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Integrations</CardTitle>
          <CardDescription>Transactions from Shopify, PayPal, Stripe and other apps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No integrations connected yet</p>
            <Button className="mt-4" variant="outline">Browse Integrations</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
