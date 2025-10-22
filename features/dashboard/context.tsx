"use client";

/**
 * Dashboard Context
 * Provides global date, basis, and filter state across all dashboard tiles
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { DashboardFilters, AccountingBasis, DashboardPeriod } from './types';

// =====================================================
// CONTEXT TYPES
// =====================================================

interface DashboardContextValue {
  filters: DashboardFilters;
  updateFilters: (updates: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  isLoading: boolean;
}

// =====================================================
// CONTEXT CREATION
// =====================================================

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getDefaultPeriod(): DashboardPeriod {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    label: 'This Month',
    startDate: firstOfMonth.toISOString().split('T')[0],
    endDate: lastOfMonth.toISOString().split('T')[0],
  };
}

function getDefaultFilters(): DashboardFilters {
  const period = getDefaultPeriod();
  return {
    startDate: period.startDate,
    endDate: period.endDate,
    basis: 'accrual',
    currency: 'USD',
  };
}

// Parse filters from URL search params
function parseFiltersFromURL(searchParams: URLSearchParams): Partial<DashboardFilters> {
  const filters: Partial<DashboardFilters> = {};

  if (searchParams.get('startDate')) {
    filters.startDate = searchParams.get('startDate')!;
  }
  if (searchParams.get('endDate')) {
    filters.endDate = searchParams.get('endDate')!;
  }
  if (searchParams.get('basis')) {
    filters.basis = searchParams.get('basis') as AccountingBasis;
  }
  if (searchParams.get('currency')) {
    filters.currency = searchParams.get('currency')!;
  }
  if (searchParams.get('classId')) {
    filters.classId = searchParams.get('classId')!;
  }
  if (searchParams.get('locationId')) {
    filters.locationId = searchParams.get('locationId')!;
  }
  if (searchParams.get('departmentId')) {
    filters.departmentId = searchParams.get('departmentId')!;
  }

  return filters;
}

// =====================================================
// PROVIDER COMPONENT
// =====================================================

function DashboardProviderInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>(() => {
    const urlFilters = parseFiltersFromURL(searchParams);
    return { ...getDefaultFilters(), ...urlFilters };
  });

  // Track if we should sync to URL (to avoid syncing when URL changes trigger filter updates)
  const shouldSyncToURL = useRef(false);
  const isInitialMount = useRef(true);

  // Sync URL with filters in an effect (not during render)
  useEffect(() => {
    // Skip sync on initial mount and when URL changes trigger filter updates
    if (isInitialMount.current || !shouldSyncToURL.current) {
      isInitialMount.current = false;
      shouldSyncToURL.current = false;
      return;
    }

    const params = new URLSearchParams();

    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.basis) params.set('basis', filters.basis);
    if (filters.currency) params.set('currency', filters.currency);
    if (filters.classId) params.set('classId', filters.classId);
    if (filters.locationId) params.set('locationId', filters.locationId);
    if (filters.departmentId) params.set('departmentId', filters.departmentId);

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    router.replace(newUrl, { scroll: false });
    shouldSyncToURL.current = false;
  }, [filters, pathname, router]);

  // Update filters and mark for URL sync
  const updateFilters = useCallback((updates: Partial<DashboardFilters>) => {
    setIsLoading(true);
    shouldSyncToURL.current = true;
    setFilters((prev) => ({ ...prev, ...updates }));

    // Simulate async update (tiles will re-fetch)
    setTimeout(() => setIsLoading(false), 100);
  }, []);

  // Reset to defaults
  const resetFilters = useCallback(() => {
    const defaults = getDefaultFilters();
    shouldSyncToURL.current = true;
    setFilters(defaults);
  }, []);

  // Sync from URL changes (browser back/forward)
  useEffect(() => {
    const urlFilters = parseFiltersFromURL(searchParams);
    if (Object.keys(urlFilters).length > 0) {
      shouldSyncToURL.current = false; // Don't sync back to URL when URL is the source
      setFilters((prev) => ({ ...prev, ...urlFilters }));
    }
  }, [searchParams]);

  const value: DashboardContextValue = {
    filters,
    updateFilters,
    resetFilters,
    isLoading,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// Wrapper with Suspense boundary for useSearchParams
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<DashboardProviderFallback />}>
      <DashboardProviderInner>{children}</DashboardProviderInner>
    </Suspense>
  );
}

// Fallback component while Suspense boundary loads
function DashboardProviderFallback() {
  const defaultFilters = getDefaultFilters();
  const value: DashboardContextValue = {
    filters: defaultFilters,
    updateFilters: () => {},
    resetFilters: () => {},
    isLoading: true,
  };

  return (
    <DashboardContext.Provider value={value}>
      <div className="min-h-screen bg-gray-50" />
    </DashboardContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}

// =====================================================
// UTILITY HOOKS
// =====================================================

export function useDashboardPeriod() {
  const { filters } = useDashboard();
  return {
    startDate: filters.startDate,
    endDate: filters.endDate,
  };
}

export function useDashboardBasis() {
  const { filters } = useDashboard();
  return filters.basis;
}
