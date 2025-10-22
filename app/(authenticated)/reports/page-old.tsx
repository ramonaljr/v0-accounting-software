"use client";

import { useRouter } from "next/navigation";
import {
  FileText,
  TrendingUp,
  Scale,
  DollarSign,
  Clock,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const reports = [
  {
    id: "profit-loss",
    title: "Profit & Loss",
    description: "Income statement showing revenue, expenses, and net income",
    icon: TrendingUp,
    path: "/reports/profit-loss",
    color: "text-green-600",
  },
  {
    id: "balance-sheet",
    title: "Balance Sheet",
    description: "Financial position with assets, liabilities, and equity",
    icon: Scale,
    path: "/reports/balance-sheet",
    color: "text-blue-600",
  },
  {
    id: "trial-balance",
    title: "Trial Balance",
    description: "All account balances with debits and credits",
    icon: BarChart3,
    path: "/reports/trial-balance",
    color: "text-purple-600",
  },
  {
    id: "ar-aging",
    title: "Accounts Receivable Aging",
    description: "Outstanding customer invoices by age bracket",
    icon: Clock,
    path: "/reports/ar-aging",
    color: "text-orange-600",
  },
  {
    id: "cash-flow",
    title: "Cash Flow Statement",
    description: "Cash inflows and outflows by activity",
    icon: DollarSign,
    path: "/reports/cash-flow",
    color: "text-cyan-600",
    comingSoon: true,
  },
];

export default function ReportsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground mt-1">
          View and analyze your financial performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                report.comingSoon ? "opacity-60" : ""
              }`}
              onClick={() =>
                !report.comingSoon && router.push(report.path)
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-muted ${report.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {report.comingSoon ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="text-sm text-muted-foreground">
                      Coming Soon
                    </span>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(report.path);
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Report
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
