import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, AlertCircle, FileText } from "lucide-react";

export default function CompliancePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance</h1>
          <p className="text-gray-600 mt-1">Stay compliant with labor laws and regulations</p>
        </div>
        <Button size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Compliance Report
        </Button>
      </div>

      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Compliance Status: Good Standing</h3>
              <p className="text-sm text-green-800 mt-1">
                Your payroll is compliant with federal and state regulations. Next review due: <strong>February 1, 2025</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Compliance Score</CardDescription>
            <CardTitle className="text-2xl text-green-600">98%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600">Excellent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Required Filings</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Past due</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Next Audit</CardDescription>
            <CardTitle className="text-2xl">Feb 1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Quarterly review</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance Checklist
          </CardTitle>
          <CardDescription>Required actions and filings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">W-2 Forms Filed</p>
                <p className="text-xs text-gray-600">Completed on time</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Tax Deposits Current</p>
                <p className="text-xs text-gray-600">All payments up to date</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">I-9 Verification</p>
                <p className="text-xs text-gray-600">All employees verified</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
