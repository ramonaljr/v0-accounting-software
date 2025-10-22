"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Users,
  FileText,
  CreditCard,
  Receipt,
  Building,
  RefreshCw,
  FileBarChart,
  Settings,
  HelpCircle,
  Plus,
  Search,
  Bell,
  User,
  Package,
  TrendingUp,
  Calculator,
  Briefcase,
  Clock,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: Array<{
    label: string;
    href: string;
  }>;
}

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <Home className="h-4 w-4" />,
    href: "/dashboard",
  },
  {
    label: "Banking",
    icon: <Building className="h-4 w-4" />,
    children: [
      { label: "Bank feeds", href: "/bank-feeds" },
      { label: "Reconcile", href: "/reconciliation" },
      { label: "Bank rules", href: "/bank-rules" },
      { label: "Receipts", href: "/receipts" },
    ],
  },
  {
    label: "Sales",
    icon: <TrendingUp className="h-4 w-4" />,
    children: [
      { label: "All sales", href: "/sales" },
      { label: "Invoices", href: "/invoices" },
      { label: "Customers", href: "/customers" },
      { label: "Products & services", href: "/products" },
    ],
  },
  {
    label: "Expenses",
    icon: <Receipt className="h-4 w-4" />,
    children: [
      { label: "Expenses", href: "/expenses" },
      { label: "Vendors", href: "/vendors" },
      { label: "Bills", href: "/bills" },
    ],
  },
  {
    label: "Projects",
    icon: <Briefcase className="h-4 w-4" />,
    href: "/projects",
  },
  {
    label: "Payroll",
    icon: <Users className="h-4 w-4" />,
    href: "/payroll",
  },
  {
    label: "Time",
    icon: <Clock className="h-4 w-4" />,
    href: "/time-tracking",
  },
  {
    label: "Reports",
    icon: <FileBarChart className="h-4 w-4" />,
    href: "/reports",
  },
  {
    label: "Taxes",
    icon: <Calculator className="h-4 w-4" />,
    href: "/taxes",
  },
  {
    label: "Accounting",
    icon: <FileText className="h-4 w-4" />,
    children: [
      { label: "Chart of accounts", href: "/accounts" },
      { label: "Journal entries", href: "/journal-entries" },
    ],
  },
  {
    label: "My accountant",
    icon: <User className="h-4 w-4" />,
    href: "/accountant",
  },
];

export function QBOSidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Sales", "Banking"]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: NavItem) => {
    if (item.href) return isActive(item.href);
    return item.children?.some((child) => isActive(child.href)) || false;
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-gray-900 text-white transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Company selector */}
      <div className="p-4 border-b border-gray-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between text-white hover:bg-gray-800"
            >
              {!isCollapsed && (
                <>
                  <span className="font-semibold truncate">Your Company</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </>
              )}
              {isCollapsed && <Building className="h-5 w-5" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>Switch company</DropdownMenuItem>
            <DropdownMenuItem>Company settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search bar */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search"
              className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
            />
          </div>
        </div>
      )}

      {/* Create new button */}
      <div className="px-4 mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className={cn(
                "w-full bg-green-600 hover:bg-green-700 text-white",
                isCollapsed && "px-2"
              )}
            >
              <Plus className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">New</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem onClick={() => window.location.href = "/invoices/new"}>
              <FileText className="h-4 w-4 mr-2" />
              Invoice
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = "/expenses/new"}>
              <Receipt className="h-4 w-4 mr-2" />
              Expense
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = "/bills/new"}>
              <CreditCard className="h-4 w-4 mr-2" />
              Bill
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = "/customers/new"}>
              <Users className="h-4 w-4 mr-2" />
              Customer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = "/vendors/new"}>
              <Building className="h-4 w-4 mr-2" />
              Vendor
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2">
        {navigationItems.map((item) => {
          const isExpanded = expandedItems.includes(item.label);
          const isItemActive = isParentActive(item);

          return (
            <div key={item.label} className="mb-1">
              {item.href ? (
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isItemActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    {item.icon}
                    {!isCollapsed && <span className="ml-3">{item.label}</span>}
                  </div>
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => !isCollapsed && toggleExpanded(item.label)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isItemActive
                        ? "bg-gray-800 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    {item.icon}
                    {!isCollapsed && (
                      <>
                        <span className="ml-3 flex-1 text-left">{item.label}</span>
                        {item.children && (
                          isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )
                        )}
                      </>
                    )}
                  </button>
                  {!isCollapsed && isExpanded && item.children && (
                    <div className="mt-1 ml-6 space-y-1">
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href}>
                          <div
                            className={cn(
                              "px-3 py-2 rounded-md text-sm transition-colors",
                              isActive(child.href)
                                ? "bg-blue-600 text-white"
                                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
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
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {!isCollapsed && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}