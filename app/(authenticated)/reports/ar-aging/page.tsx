"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { generateARAgingReport } from "@/features/reports/actions";

interface ARAgingData {
  aging: Array<{
    customer_name: string;
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    days_over_90: number;
    total: number;
  }>;
  totals: {
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    days_over_90: number;
    total: number;
  };
}

export default function ARAgingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ARAgingData | null>(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const result = await generateARAgingReport();
      if (result.success && result.data) {
        setReportData(result.data as unknown as ARAgingData);
      } else {
        toast.error(result.error || "Failed to load report");
      }
    } catch (error) {
      console.error("[AR Aging] Load error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/reports")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Accounts Receivable Aging</h1>
            <p className="text-muted-foreground mt-1">Outstanding customer invoices by age</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading report...</div>
            </div>
          ) : !reportData || reportData.aging.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">No outstanding invoices</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">1-30 Days</TableHead>
                    <TableHead className="text-right">31-60 Days</TableHead>
                    <TableHead className="text-right">61-90 Days</TableHead>
                    <TableHead className="text-right">Over 90 Days</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.aging.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.customer_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.current)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.days_1_30)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.days_31_60)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.days_61_90)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatCurrency(row.days_over_90)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(row.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(reportData.totals.current)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(reportData.totals.days_1_30)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(reportData.totals.days_31_60)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(reportData.totals.days_61_90)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatCurrency(reportData.totals.days_over_90)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(reportData.totals.total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
