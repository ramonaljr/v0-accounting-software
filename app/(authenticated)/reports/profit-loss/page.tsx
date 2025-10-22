"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { generateProfitLossReport } from "@/features/reports/actions";

interface PLData {
  revenue: Array<{ account_code: string; account_name: string; amount: number }>;
  expenses: Array<{ account_code: string; account_name: string; amount: number }>;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export default function ProfitLossReportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<PLData | null>(null);
  const [period, setPeriod] = useState("this-month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    calculateDateRange();
  }, [period]);

  useEffect(() => {
    if (startDate && endDate) {
      loadReport();
    }
  }, [startDate, endDate]);

  const calculateDateRange = () => {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (period) {
      case "this-month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "last-month":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "this-quarter":
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case "this-year":
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case "last-year":
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const result = await generateProfitLossReport({ startDate, endDate });

      if (result.success && result.data) {
        setReportData(result.data as unknown as PLData);
      } else {
        toast.error(result.error || "Failed to load report");
      }
    } catch (error) {
      console.error("[P&L Report] Load error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/reports")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Profit & Loss</h1>
            <p className="text-muted-foreground mt-1">
              {startDate && endDate &&
                `${formatDate(startDate)} - ${formatDate(endDate)}`}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Period Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Period</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === "custom" && (
              <>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      {!isLoading && reportData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#D4AF37]">
                {formatCurrency(reportData.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-[#A08529]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#A08529]">
                {formatCurrency(reportData.totalExpenses)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
              {reportData.netIncome >= 0 ? (
                <TrendingUp className="h-4 w-4 text-[#D4AF37]" />
              ) : (
                <TrendingDown className="h-4 w-4 text-[#A08529]" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  reportData.netIncome >= 0 ? "text-[#D4AF37]" : "text-[#A08529]"
                }`}
              >
                {formatCurrency(reportData.netIncome)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Detail */}
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
              {/* Revenue Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Revenue</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.revenue.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-muted-foreground"
                        >
                          No revenue accounts
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData.revenue.map((account, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {account.account_code}
                          </TableCell>
                          <TableCell>{account.account_name}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(account.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={2}>Total Revenue</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reportData.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* Expenses Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Expenses</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.expenses.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-muted-foreground"
                        >
                          No expense accounts
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData.expenses.map((account, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {account.account_code}
                          </TableCell>
                          <TableCell>{account.account_name}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(account.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={2}>Total Expenses</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reportData.totalExpenses)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-6" />

              {/* Net Income */}
              <div className="flex justify-between items-center bg-primary/10 p-4 rounded-lg">
                <h3 className="text-xl font-bold">Net Income</h3>
                <p
                  className={`text-2xl font-bold ${
                    reportData.netIncome >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(reportData.netIncome)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
