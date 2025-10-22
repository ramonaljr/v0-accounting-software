"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  HelpCircle,
  Settings,
  User,
  LogOut,
  CreditCard,
  Package,
  Users,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function QBOTopBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left section - Global search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search for transactions, customers, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 w-full"
            />
          </div>
        </form>

        {/* Right section - Actions and user menu */}
        <div className="flex items-center gap-2 ml-4">
          {/* AI Co-pilot button */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-2"
            onClick={() => router.push("/copilot")}
          >
            <MessageSquare className="h-4 w-4" />
            AI Co-pilot
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start py-3">
                <div className="font-medium">Bank sync completed</div>
                <div className="text-sm text-gray-500">
                  45 new transactions imported from Business Checking
                </div>
                <div className="text-xs text-gray-400 mt-1">2 minutes ago</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-3">
                <div className="font-medium">Invoice overdue</div>
                <div className="text-sm text-gray-500">
                  Invoice #1023 to Acme Corp is 5 days overdue
                </div>
                <div className="text-xs text-gray-400 mt-1">1 hour ago</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start py-3">
                <div className="font-medium">Tax filing reminder</div>
                <div className="text-sm text-gray-500">
                  Q4 sales tax return due in 7 days
                </div>
                <div className="text-xs text-gray-400 mt-1">This morning</div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/help")}>
                Help center
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/help/tutorials")}>
                Video tutorials
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/help/contact")}>
                Contact support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/feedback")}>
                Send feedback
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  JD
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>John Doe</span>
                  <span className="text-sm font-normal text-gray-500">
                    john@company.com
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
                <User className="h-4 w-4 mr-2" />
                Profile settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings/billing")}>
                <CreditCard className="h-4 w-4 mr-2" />
                Billing & subscription
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings/team")}>
                <Users className="h-4 w-4 mr-2" />
                Team members
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings/integrations")}>
                <Package className="h-4 w-4 mr-2" />
                Integrations
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}