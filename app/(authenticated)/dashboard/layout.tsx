/**
 * Dashboard Layout
 * Wraps dashboard pages with DashboardProvider for global filter context
 */

import { DashboardProvider } from '@/features/dashboard/context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      {children}
    </DashboardProvider>
  );
}
