"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { generateBalanceSheetReport } from "@/features/reports/actions";

interface BalanceSheetData {
  assets: Array<{ account_code: string; account_name: string; amount: number }>;
  liabilities: Array<{ account_code: string; account_name: string; amount: number }>;
  equity: Array<{ account_code: string; account_name: string; amount: number }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export default function BalanceSheetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<BalanceSheetData | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (asOfDate) {
      loadReport();
    }
  }, [asOfDate]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const result = await generateBalanceSheetReport({ asOfDate });

      if (result.success && result.data) {
        setReportData(result.data as unknown as BalanceSheetData);
      } else {
        toast.error(result.error || "Failed to load report");
      }
    } catch (error) {
      console.error("[Balance Sheet] Load error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/reports")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Balance Sheet</h1>
            <p className="text-muted-foreground mt-1">
              As of {new Date(asOfDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end max-w-md">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">As Of Date</label>
              <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
            </div>
            <Button onClick={loadReport}>Refresh</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading report...</div>
            </div>
          ) : !reportData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">No data available</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Assets */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Assets</h3>
                <Table>
                  <TableBody>
                    {reportData.assets.map((account, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{account.account_code}</TableCell>
                        <TableCell>{account.account_name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(account.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={2}>Total Assets</TableCell>
                      <TableCell className="text-right">{formatCurrency(reportData.totalAssets)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* Liabilities */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Liabilities</h3>
                <Table>
                  <TableBody>
                    {reportData.liabilities.map((account, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{account.account_code}</TableCell>
                        <TableCell>{account.account_name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(account.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={2}>Total Liabilities</TableCell>
                      <TableCell className="text-right">{formatCurrency(reportData.totalLiabilities)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* Equity */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Equity</h3>
                <Table>
                  <TableBody>
                    {reportData.equity.map((account, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{account.account_code}</TableCell>
                        <TableCell>{account.account_name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(account.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={2}>Total Equity</TableCell>
                      <TableCell className="text-right">{formatCurrency(reportData.totalEquity)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between items-center bg-primary/10 p-4 rounded-lg">
                <h3 className="text-xl font-bold">Total Liabilities + Equity</h3>
                <p className="text-2xl font-bold">{formatCurrency(reportData.totalLiabilities + reportData.totalEquity)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
