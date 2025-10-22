"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Plus,
  Bookmark,
  LayoutDashboard,
  Zap,
  BarChart3,
  Grid3x3,
  MoreHorizontal,
  Settings2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrimarySidebarProps {
  onMyAppsClick: () => void;
  isMyAppsActive: boolean;
}

export function QBOPrimarySidebar({ onMyAppsClick, isMyAppsActive }: PrimarySidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const mainNavItems = [
    { id: "bookmarks", label: "Bookmarks", icon: Bookmark, href: "/bookmarks", hasSubmenu: false },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", hasSubmenu: false },
    { id: "feed", label: "Feed", icon: Zap, href: "/feed", hasSubmenu: false },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      href: "/reports",
      hasSubmenu: true,
      submenuItems: [
        { label: "Standard reports", href: "/reports/standard" },
        { label: "Custom reports", href: "/reports/custom" },
        { label: "Management reports", href: "/reports/management" },
        { label: "KPIs", href: "/reports/kpis" },
        { label: "Spreadsheet sync", href: "/reports/spreadsheet-sync" },
        { label: "Performance center", href: "/reports/performance-center" },
        { label: "Financial planning", href: "/reports/financial-planning", hasArrow: true },
      ]
    },
  ];

  const pinnedItems = [
    { label: "Accounting", icon: "A", color: "bg-teal-600", href: "/accounting" },
    { label: "Expenses", icon: "E", color: "bg-teal-600", href: "/expenses" },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-[70px]">

      {/* Create button */}
      <div className="p-2 pt-3">
        <Button
          variant="ghost"
          className="w-full h-14 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 rounded-lg"
        >
          <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
            <Plus className="h-4 w-4 text-gray-600" />
          </div>
          <span className="text-[10px] text-gray-600">Create</span>
        </Button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-2 pt-2 space-y-1 relative">
        {mainNavItems.map((item) => (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Link href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-lg cursor-pointer transition-colors",
                  pathname === item.href
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-[10px] text-center">{item.label}</span>
              </div>
            </Link>

            {/* Hover menu */}
            {item.hasSubmenu && hoveredItem === item.id && (
              <div className="absolute left-full top-0 ml-1 w-[240px] bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    {item.label}
                  </h3>
                </div>
                <div className="py-1">
                  {item.submenuItems?.map((subItem) => (
                    <Link key={subItem.href} href={subItem.href}>
                      <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center justify-between">
                        <span>{subItem.label}</span>
                        {subItem.hasArrow && <ChevronRight className="h-4 w-4 text-gray-400" />}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* My apps button */}
        <button
          onClick={onMyAppsClick}
          className={cn(
            "w-full flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors",
            isMyAppsActive
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <Grid3x3 className="h-5 w-5 mb-1" />
          <span className="text-[10px] text-center">My apps</span>
        </button>
      </nav>

      {/* PINNED section */}
      <div className="px-2 py-3 border-t border-gray-200">
        <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider text-center mb-2">
          PINNED
        </div>
        <div className="space-y-2">
          {pinnedItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <div className="flex flex-col items-center justify-center cursor-pointer group">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                  item.color,
                  "group-hover:ring-2 group-hover:ring-offset-1 group-hover:ring-teal-400"
                )}>
                  {item.icon}
                </div>
                <span className="text-[9px] text-gray-600 mt-1 text-center">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="px-2 pb-3 border-t border-gray-200 space-y-1">
        <button className="w-full flex flex-col items-center justify-center py-2 px-1 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
          <MoreHorizontal className="h-5 w-5 mb-1" />
          <span className="text-[10px] text-center">More</span>
        </button>
        <Link href="/customize">
          <div className="w-full flex flex-col items-center justify-center py-2 px-1 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
            <Settings2 className="h-5 w-5 mb-1" />
            <span className="text-[10px] text-center">Customize</span>
          </div>
        </Link>
      </div>
    </div>
  );
}