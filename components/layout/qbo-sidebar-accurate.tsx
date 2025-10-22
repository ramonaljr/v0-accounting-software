"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Grid3x3,
  LayoutDashboard,
  Receipt,
  DollarSign,
  Users,
  Clock,
  Briefcase,
  BarChart3,
  Calculator,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  isExpanded?: boolean;
  children?: Array<{
    label: string;
    href: string;
  }>;
}

export function QBOSidebarAccurate() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Accounting", "Expenses & Bills"]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleExpanded = (label: string) => {
    if (!isCollapsed) {
      setExpandedItems((prev) =>
        prev.includes(label)
          ? prev.filter((item) => item !== label)
          : [...prev, label]
      );
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // MY APPS section items (always visible)
  const myAppsItems: NavItem[] = [
    {
      label: "Accounting",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">A</span>,
      children: [
        { label: "Overview", href: "/accounting/overview" },
        { label: "Expense transactions", href: "/accounting/expenses" },
        { label: "Vendors", href: "/vendors" },
        { label: "Bills", href: "/bills" },
        { label: "Bill payments", href: "/bill-payments" },
        { label: "Mileage", href: "/mileage" },
        { label: "Contractors", href: "/contractors" },
        { label: "1099s", href: "/1099s" },
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
        { label: "Bill payments", href: "/expenses/payments" },
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
        { label: "All sales", href: "/sales/all" },
        { label: "Invoices", href: "/invoices" },
        { label: "Payment links", href: "/sales/payment-links" },
        { label: "Customers", href: "/sales/customers" },
        { label: "Products and services", href: "/products" },
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
        { label: "Run payroll", href: "/payroll/run" },
        { label: "Pay schedules", href: "/payroll/schedules" },
        { label: "Tax forms", href: "/payroll/tax-forms" },
      ],
    },
    {
      label: "Team",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">T</span>,
      children: [
        { label: "Overview", href: "/team/overview" },
        { label: "Team members", href: "/team/members" },
        { label: "Roles", href: "/team/roles" },
        { label: "Activity", href: "/team/activity" },
      ],
    },
    {
      label: "Time",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">T</span>,
      children: [
        { label: "Overview", href: "/time/overview" },
        { label: "Time entries", href: "/time/entries" },
        { label: "Projects", href: "/time/projects" },
        { label: "Reports", href: "/time/reports" },
      ],
    },
    {
      label: "Projects",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">P</span>,
      children: [
        { label: "Overview", href: "/projects/overview" },
        { label: "Projects", href: "/projects" },
        { label: "Tasks", href: "/projects/tasks" },
        { label: "Time tracking", href: "/projects/time" },
      ],
    },
    {
      label: "Sales Tax",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">S</span>,
      children: [
        { label: "Overview", href: "/sales-tax/overview" },
        { label: "Sales tax settings", href: "/sales-tax/settings" },
        { label: "Reports", href: "/sales-tax/reports" },
        { label: "File sales tax", href: "/sales-tax/file" },
      ],
    },
    {
      label: "Business Tax",
      icon: <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] text-white font-bold">B</span>,
      children: [
        { label: "Overview", href: "/business-tax/overview" },
        { label: "Tax profile", href: "/business-tax/profile" },
        { label: "Deductions", href: "/business-tax/deductions" },
        { label: "Quarterly taxes", href: "/business-tax/quarterly" },
      ],
    },
  ];

  // PINNED section items
  const pinnedItems = [
    { label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, href: "/dashboard" },
    { label: "Reports", icon: <BarChart3 className="h-4 w-4" />, href: "/reports" },
    { label: "My apps", icon: <Grid3x3 className="h-4 w-4" />, href: "/apps" },
  ];

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-[60px]" : "w-[200px]"
    )}>
      {/* Top section with logo placeholder */}
      <div className="h-12 border-b border-gray-200 flex items-center px-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#D4AF37] rounded-sm flex items-center justify-center">
            <span className="text-[#0D0D0D] text-xs font-bold">OS</span>
          </div>
          {!isCollapsed && (
            <span className="text-sm font-medium text-gray-700">OpportunityOS</span>
          )}
        </div>
      </div>

      {/* MY APPS Section */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn("px-3 py-2", isCollapsed && "px-2")}>
          {!isCollapsed && (
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              MY APPS
            </div>
          )}

          {/* Create button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full h-8 mb-2 text-gray-700 hover:bg-gray-100",
              isCollapsed ? "justify-center px-0" : "justify-start px-2"
            )}
          >
            <Plus className="h-3 w-3" />
            {!isCollapsed && <span className="text-xs ml-2">Create</span>}
          </Button>

          {/* MY APPS items */}
          <div className="space-y-0">
            {myAppsItems.map((item) => {
              const isExpanded = expandedItems.includes(item.label);

              return (
                <div key={item.label}>
                  {item.href ? (
                    <Link href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-2 py-1 rounded text-[11px] cursor-pointer transition-colors",
                          isCollapsed ? "justify-center px-0" : "px-2",
                          isActive(item.href)
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        {item.icon}
                        {!isCollapsed && <span>{item.label}</span>}
                      </div>
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.label)}
                        className={cn(
                          "w-full flex items-center gap-2 py-1 rounded text-[11px] transition-colors",
                          isCollapsed ? "justify-center px-0" : "px-2",
                          "text-gray-700 hover:bg-gray-50"
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        {!isCollapsed && (
                          <ChevronRight
                            className={cn(
                              "h-3 w-3 transition-transform flex-shrink-0",
                              isExpanded && "rotate-90"
                            )}
                          />
                        )}
                        {item.icon}
                        {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                      </button>
                      {!isCollapsed && isExpanded && item.children && (
                        <div className="ml-8 space-y-0">
                          {item.children.map((child) => (
                            <Link key={child.href} href={child.href}>
                              <div
                                className={cn(
                                  "px-2 py-0.5 rounded text-[11px] transition-colors",
                                  isActive(child.href)
                                    ? "bg-gray-100 text-gray-900"
                                    : "text-gray-600 hover:bg-gray-50"
                                )}
                              >
                                {child.label}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* PINNED Section */}
        {!isCollapsed && (
          <div className="px-3 py-2 border-t border-gray-200 mt-2">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              PINNED
            </div>
            <div className="space-y-0.5">
              {pinnedItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors",
                      isActive(item.href)
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="border-t border-gray-200 p-2">
        {!isCollapsed && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 px-2 text-gray-600 hover:bg-gray-100 text-xs"
            >
              <MoreHorizontal className="h-3 w-3 mr-2" />
              More
            </Button>
            <Link href="/customize">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 px-2 text-gray-600 hover:bg-gray-100 text-xs mt-1"
              >
                Customize
              </Button>
            </Link>
          </>
        )}

        {/* Collapse/Expand toggle button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            "h-8 text-gray-600 hover:bg-gray-100",
            isCollapsed ? "w-full justify-center px-0 mt-0" : "w-full justify-start px-2 mt-1"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform",
              !isCollapsed && "rotate-180"
            )}
          />
          {!isCollapsed && <span className="text-xs ml-2">Collapse</span>}
        </Button>
      </div>
    </div>
  );
}