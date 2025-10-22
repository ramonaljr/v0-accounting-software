import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, AlertCircle, Download } from "lucide-react";

export default function PayrollTaxesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Taxes</h1>
          <p className="text-gray-600 mt-1">Manage payroll tax obligations and filings</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download Forms
        </Button>
      </div>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">Tax Payment Due</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Quarterly payroll tax payment of <strong>$8,450</strong> is due on <strong>January 31, 2025</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Current Liability</CardDescription>
            <CardTitle className="text-2xl">$8,450</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Taxes owed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>YTD Tax Paid</CardDescription>
            <CardTitle className="text-2xl">$78,500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Total payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Next Filing</CardDescription>
            <CardTitle className="text-2xl">Jan 31</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Quarterly filing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Compliance</CardDescription>
            <CardTitle className="text-2xl text-green-600">✓</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600">Up to date</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Tax Payment History
          </CardTitle>
          <CardDescription>Payroll tax deposits and filings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No tax payments recorded</p>
            <p className="text-sm mt-2">Payroll tax payments will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
