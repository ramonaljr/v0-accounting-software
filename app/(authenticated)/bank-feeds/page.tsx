"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, RefreshCw, Link2, CheckCircle, AlertCircle } from "lucide-react";

export default function BankFeedsPage() {
  const accounts = [
    {
      id: "1",
      name: "Business Checking",
      bank: "Chase",
      balance: "$45,230.50",
      lastSync: "2 minutes ago",
      status: "connected"
    },
    {
      id: "2",
      name: "Business Savings",
      bank: "Chase",
      balance: "$125,000.00",
      lastSync: "2 minutes ago",
      status: "connected"
    },
    {
      id: "3",
      name: "Credit Card",
      bank: "American Express",
      balance: "-$3,250.00",
      lastSync: "1 hour ago",
      status: "error"
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Bank Feeds</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your connected bank accounts and credit cards
          </p>
        </div>
        <Button>
          <Link2 className="h-4 w-4 mr-2" />
          Connect Account
        </Button>
      </div>

      <div className="grid gap-4">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="h-5 w-5 text-gray-500" />
                  {account.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {account.status === "connected" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                  <span className="text-lg font-semibold">{account.balance}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p>{account.bank}</p>
                  <p>Last updated: {account.lastSync}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Sync
                  </Button>
                  <Button size="sm" variant="outline">
                    Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}