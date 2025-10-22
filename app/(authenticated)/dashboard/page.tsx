/**
 * Dashboard Page
 * Main business overview dashboard with global filters and metrics
 * Wrapped with DashboardProvider via layout.tsx for global filter context
 */

import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default function DashboardPage() {
  return <DashboardContent />;
}
