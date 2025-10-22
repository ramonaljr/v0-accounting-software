"use client";

/**
 * Quick Actions Tile
 * Common accounting workflows and shortcuts
 */

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  DollarSign,
  Receipt,
  CreditCard,
  RefreshCw,
  FileBarChart,
  Users,
  Link2,
  Calculator,
  Upload,
  Download,
  Search,
} from "lucide-react";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  route: string;
  color: string;
  hoverColor: string;
}

const quickActions: QuickAction[] = [
  {
    icon: FileText,
    label: "Create invoice",
    route: "/invoices/new",
    color: "text-blue-600",
    hoverColor: "hover:bg-blue-50 hover:border-blue-300",
  },
  {
    icon: DollarSign,
    label: "Receive payment",
    route: "/invoices/receive-payment",
    color: "text-green-600",
    hoverColor: "hover:bg-green-50 hover:border-green-300",
  },
  {
    icon: Receipt,
    label: "Record expense",
    route: "/expenses/new",
    color: "text-orange-600",
    hoverColor: "hover:bg-orange-50 hover:border-orange-300",
  },
  {
    icon: CreditCard,
    label: "Enter bill",
    route: "/expenses/bills",
    color: "text-purple-600",
    hoverColor: "hover:bg-purple-50 hover:border-purple-300",
  },
  {
    icon: RefreshCw,
    label: "Reconcile",
    route: "/accounting/reconcile",
    color: "text-indigo-600",
    hoverColor: "hover:bg-indigo-50 hover:border-indigo-300",
  },
  {
    icon: FileBarChart,
    label: "Run reports",
    route: "/reports",
    color: "text-teal-600",
    hoverColor: "hover:bg-teal-50 hover:border-teal-300",
  },
  {
    icon: Users,
    label: "Add customer",
    route: "/customers/new",
    color: "text-blue-600",
    hoverColor: "hover:bg-blue-50 hover:border-blue-300",
  },
  {
    icon: Link2,
    label: "Connect bank",
    route: "/bank-feeds",
    color: "text-cyan-600",
    hoverColor: "hover:bg-cyan-50 hover:border-cyan-300",
  },
  {
    icon: FileText,
    label: "Journal entry",
    route: "/journal-entries",
    color: "text-gray-600",
    hoverColor: "hover:bg-gray-50 hover:border-gray-400",
  },
  {
    icon: Calculator,
    label: "Tax center",
    route: "/taxes",
    color: "text-red-600",
    hoverColor: "hover:bg-red-50 hover:border-red-300",
  },
  {
    icon: Upload,
    label: "Upload receipt",
    route: "/accounting/receipts",
    color: "text-orange-600",
    hoverColor: "hover:bg-orange-50 hover:border-orange-300",
  },
  {
    icon: Search,
    label: "Search transactions",
    route: "/transactions",
    color: "text-gray-600",
    hoverColor: "hover:bg-gray-50 hover:border-gray-400",
  },
];

export function QuickActionsTile() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Get things done</CardTitle>
        <span className="text-xs text-gray-500">Quick actions</span>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className={`h-auto py-4 px-3 flex flex-col items-center justify-center space-y-2 transition-colors ${action.hoverColor}`}
                onClick={() => router.push(action.route)}
              >
                <Icon className={`h-5 w-5 ${action.color}`} />
                <span className="text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
