import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, DollarSign, PieChart } from "lucide-react";
import Link from "next/link";

export default function StandardReportsPage() {
  const reportCategories = [
    {
      title: "Financial Statements",
      icon: FileText,
      color: "bg-[#D4AF37]/10 text-[#D4AF37]",
      reports: [
        { name: "Profit & Loss", href: "/reports/profit-loss" },
        { name: "Balance Sheet", href: "/reports/balance-sheet" },
        { name: "Cash Flow Statement", href: "/reports/cash-flow" },
        { name: "Trial Balance", href: "/reports/trial-balance" },
      ],
    },
    {
      title: "Sales Reports",
      icon: TrendingUp,
      color: "bg-[#E5C158]/10 text-[#B8962E]",
      reports: [
        { name: "Sales by Customer", href: "/reports/sales-by-customer" },
        { name: "Sales by Product", href: "/reports/sales-by-product" },
        { name: "AR Aging", href: "/reports/ar-aging" },
        { name: "Invoice List", href: "/reports/invoice-list" },
      ],
    },
    {
      title: "Expense Reports",
      icon: DollarSign,
      color: "bg-[#A08529]/10 text-[#A08529]",
      reports: [
        { name: "Expenses by Vendor", href: "/reports/expenses-by-vendor" },
        { name: "Expenses by Category", href: "/reports/expenses-by-category" },
        { name: "AP Aging", href: "/reports/ap-aging" },
        { name: "Bill List", href: "/reports/bill-list" },
      ],
    },
    {
      title: "Tax Reports",
      icon: PieChart,
      color: "bg-[#C9A645]/10 text-[#9D8030]",
      reports: [
        { name: "Sales Tax Summary", href: "/reports/sales-tax-summary" },
        { name: "1099 Summary", href: "/reports/1099-summary" },
        { name: "Tax Detail Report", href: "/reports/tax-detail" },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Standard Reports</h1>
          <p className="text-gray-600 mt-1">Pre-built financial and operational reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.reports.length} reports</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.reports.map((report) => (
                    <Link key={report.name} href={report.href}>
                      <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors flex items-center justify-between group">
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{report.name}</span>
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          View
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
