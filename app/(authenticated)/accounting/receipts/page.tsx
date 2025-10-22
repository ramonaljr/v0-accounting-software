import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Scan } from "lucide-react";

export default function ReceiptsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600 mt-1">Capture and manage expense receipts with OCR</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          <Button size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload Receipt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl">12</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Receipts to process</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">48</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Receipts uploaded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>OCR Processed</CardDescription>
            <CardTitle className="text-2xl">98%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">Auto-extraction rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Recent Receipts
          </CardTitle>
          <CardDescription>Upload receipts and let AI extract the data automatically</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No receipts uploaded yet</p>
            <p className="text-sm mt-2">Upload a receipt to get started with automatic data extraction</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
