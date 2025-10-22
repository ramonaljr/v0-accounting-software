"use client";

/**
 * Dashboard Header
 * Header with refresh, export, print, and customize actions
 */

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RefreshCw,
  Download,
  Printer,
  Settings,
  MoreVertical,
  FileText,
  Mail,
  Calendar,
  Edit3,
  Save,
  X,
} from "lucide-react";

interface DashboardHeaderProps {
  onRefresh: () => void;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  onPrint?: () => void;
  onCustomize?: () => void;
  onEditLayout?: () => void;
  onLoadPreset?: () => void;
  isEditMode?: boolean;
  isLoading?: boolean;
}

export function DashboardHeader({
  onRefresh,
  onExport,
  onPrint,
  onCustomize,
  onEditLayout,
  onLoadPreset,
  isEditMode = false,
  isLoading = false,
}: DashboardHeaderProps) {
  const router = useRouter();

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export behavior
      console.log(`Exporting dashboard as ${format}`);
      // TODO: Implement actual export logic
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleCustomize = () => {
    if (onCustomize) {
      onCustomize();
    } else {
      router.push('/dashboard/customize');
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold">Business overview</h1>
        <p className="text-sm text-gray-600 mt-1">
          Here's what's happening with your business right now
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Edit Layout Button - shown when NOT in edit mode */}
        {!isEditMode && onEditLayout && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEditLayout}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Layout
          </Button>
        )}

        {/* Refresh Button - hidden in edit mode */}
        {!isEditMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}

        {/* Export Dropdown - hidden in edit mode */}
        {!isEditMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileText className="w-4 h-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/email')}>
                <Mail className="w-4 h-4 mr-2" />
                Email dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/schedule')}>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Print Button - hidden in edit mode */}
        {!isEditMode && (
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
          </Button>
        )}

        {/* More Actions - hidden in edit mode */}
        {!isEditMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCustomize}>
                <Settings className="w-4 h-4 mr-2" />
                Customize dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onLoadPreset && (
                <DropdownMenuItem onClick={onLoadPreset}>
                  <Settings className="w-4 h-4 mr-2" />
                  Load preset
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/help')}>
                Help & tutorials
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
