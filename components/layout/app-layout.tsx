"use client";

import { useState } from "react";
import { QBOPrimarySidebar } from "./qbo-primary-sidebar";
import { QBOSecondarySidebar } from "./qbo-secondary-sidebar";
import { QBOTopBarAccurate } from "./qbo-topbar-accurate";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const [isSecondarySidebarOpen, setIsSecondarySidebarOpen] = useState(false);

  const handleMyAppsClick = () => {
    setIsSecondarySidebarOpen((prev) => !prev);
  };

  const handleSecondarySidebarClose = () => {
    setIsSecondarySidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar - Above everything */}
      <QBOTopBarAccurate />

      {/* Sidebars and content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Primary Sidebar - Always visible */}
        <QBOPrimarySidebar
          onMyAppsClick={handleMyAppsClick}
          isMyAppsActive={isSecondarySidebarOpen}
        />

        {/* Secondary Sidebar - Collapsible */}
        <QBOSecondarySidebar
          isOpen={isSecondarySidebarOpen}
          onClose={handleSecondarySidebarClose}
        />

        {/* Main content area */}
        <main className={cn("flex-1 overflow-y-auto bg-white", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}