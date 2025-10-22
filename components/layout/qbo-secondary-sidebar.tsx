"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SecondarySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QBOSecondarySidebar({ isOpen, onClose }: SecondarySidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(["AI & Automation", "Accounting", "Customer Hub"]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const myAppsItems = [
    {
      label: "AI & Automation",
      icon: <span className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] text-white font-bold">AI</span>,
      children: [
        { label: "AI Co-Pilot", href: "/copilot" },
        { label: "Automation Center", href: "/automation" },
        { label: "Agent Performance", href: "/ai/agents" },
        { label: "Review Queue", href: "/review" },
        { label: "AI Explainability", href: "/ai/explain" },
        { label: "Insights & Anomalies", href: "/ai/insights" },
      ],
    },
    {
      label: "Accounting",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">A</span>,
      children: [
        { label: "Bank transactions", href: "/accounting/bank-transactions" },
        { label: "Integration transactions", href: "/accounting/integration-transactions" },
        { label: "Receipts", href: "/accounting/receipts" },
        { label: "Reconcile", href: "/accounting/reconcile" },
        { label: "Rules", href: "/accounting/rules" },
        { label: "Chart of accounts", href: "/accounts" },
        { label: "Recurring transactions", href: "/accounting/recurring-transactions" },
        { label: "Fixed Assets", href: "/accounting/fixed-assets" },
        { label: "My accountant", href: "/accounting/my-accountant" },
        { label: "Live Experts", href: "/accounting/live-experts" },
        { label: "Revenue recognition", href: "/accounting/revenue-recognition" },
      ],
    },
    {
      label: "Expenses & Bills",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">E</span>,
      children: [
        { label: "Overview", href: "/expenses/overview" },
        { label: "Expense transactions", href: "/expenses/transactions" },
        { label: "Vendors", href: "/expenses/vendors" },
        { label: "Bills", href: "/expenses/bills" },
        { label: "Bill payments", href: "/expenses/bill-payments" },
        { label: "Mileage", href: "/expenses/mileage" },
        { label: "Contractors", href: "/expenses/contractors" },
        { label: "1099s", href: "/expenses/1099s" },
      ],
    },
    {
      label: "Sales & Get Paid",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">S</span>,
      children: [
        { label: "Overview", href: "/sales/overview" },
        { label: "Sales transactions", href: "/sales/transactions" },
        { label: "Invoices", href: "/invoices" },
        { label: "Payment links", href: "/sales/payment-links" },
        { label: "Recurring payments", href: "/sales/recurring-payments" },
        { label: "Sales orders", href: "/sales/orders" },
        { label: "Sales channels", href: "/sales/channels" },
        { label: "Payment payouts", href: "/sales/payment-payouts" },
        { label: "Channel payouts", href: "/sales/channel-payouts" },
        { label: "Products & services", href: "/products" },
      ],
    },
    {
      label: "Customer Hub",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">C</span>,
      children: [
        { label: "Overview", href: "/customers/overview" },
        { label: "Leads", href: "/customers/leads" },
        { label: "Customers", href: "/customers" },
        { label: "Estimates", href: "/customers/estimates" },
        { label: "Contracts", href: "/customers/contracts" },
        { label: "Appointments", href: "/customers/appointments" },
        { label: "Reviews", href: "/customers/reviews" },
      ],
    },
    {
      label: "Payroll",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">P</span>,
      children: [
        { label: "Overview", href: "/payroll/overview" },
        { label: "Employees", href: "/payroll/employees" },
        { label: "Contractors", href: "/payroll/contractors" },
        { label: "Payroll taxes", href: "/payroll/taxes" },
        { label: "Benefits", href: "/payroll/benefits" },
        { label: "HR advisor", href: "/payroll/hr-advisor" },
        { label: "Compliance", href: "/payroll/compliance" },
      ],
    },
    {
      label: "Team",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">T</span>,
      children: [
        { label: "Overview", href: "/team/overview" },
        { label: "Team members", href: "/team/members" },
      ],
    },
    {
      label: "Time",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">T</span>,
      children: [
        { label: "Overview", href: "/time/overview" },
        { label: "Time entries", href: "/time/entries" },
      ],
    },
    {
      label: "Projects",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">P</span>,
      children: [
        { label: "Overview", href: "/projects/overview" },
        { label: "Projects", href: "/projects" },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-[200px] animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-3">
        <div className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
          MY APPS
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 hover:bg-gray-100"
        >
          <Menu className="h-4 w-4 text-gray-600" />
        </Button>
      </div>

      {/* Apps list */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-0">
          {myAppsItems.map((item) => {
            const isExpanded = expandedItems.includes(item.label);

            return (
              <div key={item.label} className="border-b border-gray-100">
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-gray-900 hover:bg-gray-50"
                >
                  {item.icon}
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {isExpanded && item.children && (
                  <div className="bg-white">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href}>
                        <div
                          className={cn(
                            "px-3 py-1.5 pl-9 text-sm transition-colors",
                            isActive(child.href)
                              ? "bg-gray-100 text-gray-900 font-medium"
                              : "text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          {child.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}