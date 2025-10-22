import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Send, AlertCircle } from "lucide-react";

export default function Form1099sPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">1099 Forms</h1>
          <p className="text-gray-600 mt-1">Generate and file 1099-NEC forms for contractors</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            E-File 1099s
          </Button>
        </div>
      </div>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-700 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">2024 Tax Year Deadline</h3>
              <p className="text-sm text-yellow-800 mt-1">
                1099-NEC forms must be filed by January 31, 2025. You have <strong>3 contractors</strong> who meet the $600 threshold.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Need 1099s</CardDescription>
            <CardTitle className="text-2xl">3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Over $600 threshold</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Amount</CardDescription>
            <CardTitle className="text-2xl">$45,000</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Reportable payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Filing Status</CardDescription>
            <CardTitle className="text-2xl">Not Filed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">2024 tax year</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            1099-NEC Forms
          </CardTitle>
          <CardDescription>Contractors requiring 1099 forms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium">John Smith Design</p>
                <p className="text-sm text-gray-600">Total paid: $18,500</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Preview</Button>
                <Button size="sm">Generate</Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium">ABC Consulting LLC</p>
                <p className="text-sm text-gray-600">Total paid: $15,000</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Preview</Button>
                <Button size="sm">Generate</Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium">Marketing Pro Services</p>
                <p className="text-sm text-gray-600">Total paid: $11,500</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Preview</Button>
                <Button size="sm">Generate</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>E-Filing Information</CardTitle>
          <CardDescription>Electronic filing requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              You can e-file 1099 forms directly to the IRS. E-filing is required if you have 10 or more forms to file.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
