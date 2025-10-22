"use client";

/**
 * Global Dashboard Filters
 * Date range, basis, currency, and dimension filters for all dashboard tiles
 */

import React, { useState } from 'react';
import { Calendar, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useDashboard } from '@/features/dashboard/context';
import type { AccountingBasis } from '@/features/dashboard/types';

// =====================================================
// PRESET PERIODS
// =====================================================

interface PeriodPreset {
  label: string;
  startDate: string;
  endDate: string;
}

function getPeriodPresets(): PeriodPreset[] {
  const today = new Date();

  // This Month
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Last Month
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  // This Quarter
  const currentQuarter = Math.floor(today.getMonth() / 3);
  const thisQuarterStart = new Date(today.getFullYear(), currentQuarter * 3, 1);
  const thisQuarterEnd = new Date(today.getFullYear(), currentQuarter * 3 + 3, 0);

  // Last Quarter
  const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
  const lastQuarterYear = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear();
  const lastQuarterStart = new Date(lastQuarterYear, lastQuarter * 3, 1);
  const lastQuarterEnd = new Date(lastQuarterYear, lastQuarter * 3 + 3, 0);

  // This Year
  const thisYearStart = new Date(today.getFullYear(), 0, 1);
  const thisYearEnd = new Date(today.getFullYear(), 11, 31);

  // Last Year
  const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);

  return [
    {
      label: 'This Month',
      startDate: thisMonthStart.toISOString().split('T')[0],
      endDate: thisMonthEnd.toISOString().split('T')[0],
    },
    {
      label: 'Last Month',
      startDate: lastMonthStart.toISOString().split('T')[0],
      endDate: lastMonthEnd.toISOString().split('T')[0],
    },
    {
      label: 'This Quarter',
      startDate: thisQuarterStart.toISOString().split('T')[0],
      endDate: thisQuarterEnd.toISOString().split('T')[0],
    },
    {
      label: 'Last Quarter',
      startDate: lastQuarterStart.toISOString().split('T')[0],
      endDate: lastQuarterEnd.toISOString().split('T')[0],
    },
    {
      label: 'This Year',
      startDate: thisYearStart.toISOString().split('T')[0],
      endDate: thisYearEnd.toISOString().split('T')[0],
    },
    {
      label: 'Last Year',
      startDate: lastYearStart.toISOString().split('T')[0],
      endDate: lastYearEnd.toISOString().split('T')[0],
    },
  ];
}

// =====================================================
// GLOBAL FILTERS COMPONENT
// =====================================================

export function GlobalFilters() {
  const { filters, updateFilters, resetFilters } = useDashboard();
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const presets = getPeriodPresets();

  const handlePeriodChange = (preset: PeriodPreset) => {
    setSelectedPeriod(preset.label);
    updateFilters({
      startDate: preset.startDate,
      endDate: preset.endDate,
    });
  };

  const handleBasisChange = (basis: AccountingBasis) => {
    updateFilters({ basis });
  };

  const formatDateRange = () => {
    if (!filters.startDate || !filters.endDate) return 'Select period';

    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Period Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[280px] justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div className="text-left">
                <div className="text-xs text-gray-500">{selectedPeriod}</div>
                <div className="text-sm font-medium">{formatDateRange()}</div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px]">
          {presets.map((preset) => (
            <DropdownMenuItem
              key={preset.label}
              onClick={() => handlePeriodChange(preset)}
              className="cursor-pointer"
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-gray-500 cursor-not-allowed">
            Custom range (coming soon)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Basis Toggle */}
      <div className="flex items-center border rounded-md overflow-hidden">
        <button
          onClick={() => handleBasisChange('accrual')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filters.basis === 'accrual'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Accrual
        </button>
        <button
          onClick={() => handleBasisChange('cash')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
            filters.basis === 'cash'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Cash
        </button>
      </div>

      {/* Currency Selector (if multi-currency enabled) */}
      {/* TODO: Add currency selector when multi-currency feature is enabled */}

      {/* Reset Filters */}
      <Button
        variant="ghost"
        size="sm"
        onClick={resetFilters}
        className="ml-auto"
        title="Reset to defaults"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}

// =====================================================
// COMPACT VERSION FOR MOBILE
// =====================================================

export function GlobalFiltersCompact() {
  const { filters, updateFilters } = useDashboard();

  return (
    <div className="flex items-center gap-2 mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="text-xs">
              {filters.startDate && filters.endDate
                ? `${new Date(filters.startDate).toLocaleDateString('en-US', { month: 'short' })} - ${new Date(filters.endDate).toLocaleDateString('en-US', { month: 'short' })}`
                : 'Period'}
            </span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          {getPeriodPresets().map((preset) => (
            <DropdownMenuItem
              key={preset.label}
              onClick={() => updateFilters({ startDate: preset.startDate, endDate: preset.endDate })}
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={() => updateFilters({ basis: filters.basis === 'accrual' ? 'cash' : 'accrual' })}
      >
        {filters.basis === 'accrual' ? 'Accrual' : 'Cash'}
      </Button>
    </div>
  );
}
