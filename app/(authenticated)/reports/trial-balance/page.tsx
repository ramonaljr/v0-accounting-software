"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { generateTrialBalanceReport } from "@/features/reports/actions";

interface TrialBalanceData {
  accounts: Array<{
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
  }>;
  totalDebits: number;
  totalCredits: number;
}

export default function TrialBalancePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<TrialBalanceData | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (asOfDate) {
      loadReport();
    }
  }, [asOfDate]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const result = await generateTrialBalanceReport({ asOfDate });
      if (result.success && result.data) {
        setReportData(result.data as unknown as TrialBalanceData);
      } else {
        toast.error(result.error || "Failed to load report");
      }
    } catch (error) {
      console.error("[Trial Balance] Load error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const isBalanced = reportData && Math.abs(reportData.totalDebits - reportData.totalCredits) < 0.01;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/reports")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Trial Balance</h1>
            <p className="text-muted-foreground mt-1">All account balances as of {new Date(asOfDate).toLocaleDateString()}</p>
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
          ) : !reportData || reportData.accounts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">No accounts found</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.accounts.map((account, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{account.account_code}</TableCell>
                      <TableCell>{account.account_name}</TableCell>
                      <TableCell className="text-right">{account.debit > 0 ? formatCurrency(account.debit) : "—"}</TableCell>
                      <TableCell className="text-right">{account.credit > 0 ? formatCurrency(account.credit) : "—"}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(reportData.totalDebits)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(reportData.totalCredits)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className={`mt-4 p-4 rounded-lg ${isBalanced ? "bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20" : "bg-[#A08529]/10 dark:bg-[#A08529]/20"}`}>
                <p className={`font-semibold ${isBalanced ? "text-[#D4AF37] dark:text-[#E5C158]" : "text-[#A08529] dark:text-[#C9A645]"}`}>
                  {isBalanced ? "✓ Trial Balance is balanced" : "⚠ Trial Balance is not balanced"}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
