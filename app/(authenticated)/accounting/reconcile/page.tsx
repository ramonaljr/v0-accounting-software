import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

export default function ReconcilePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reconcile</h1>
          <p className="text-gray-600 mt-1">Match bank transactions with your books</p>
        </div>
        <Button size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Auto Reconcile with AI
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Unreconciled</CardDescription>
            <CardTitle className="text-2xl">18</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Transactions to match</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>AI Suggested</CardDescription>
            <CardTitle className="text-2xl">12</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">High confidence matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Last Reconciled</CardDescription>
            <CardTitle className="text-2xl">Dec 31</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">2024</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Status</CardTitle>
          <CardDescription>Review and approve AI-suggested matches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">Main Operating Account</p>
                  <p className="text-xs text-gray-600">Reconciled through Dec 31, 2024</p>
                </div>
              </div>
              <Button variant="outline" size="sm">View</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Circle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-sm">Savings Account</p>
                  <p className="text-xs text-gray-600">18 unreconciled transactions</p>
                </div>
              </div>
              <Button size="sm">Reconcile</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
