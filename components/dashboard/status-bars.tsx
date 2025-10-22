/**
 * Dashboard Status Bars
 * OpportunityOS status bars showing key metrics at a glance
 * Implements Nielsen's Visibility of System Status and Fitts's Law
 */

'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  AlertCircle,
  DollarSign,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatusBarMetric {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'gold' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  badge?: string;
  link?: string;
  ariaLabel?: string;
}

interface StatusBarsProps {
  metrics: StatusBarMetric[];
  className?: string;
}

/**
 * Semantic color system aligned with OpportunityOS brand
 * Gold = primary/neutral, Success = green, Warning = orange, Danger = red, Info = blue
 */
const colorMap = {
  gold: {
    bg: 'bg-[--brand-gold]',
    text: 'text-[--brand-gold]',
    bgLight: 'bg-[--brand-gold]/10 dark:bg-[--brand-gold]/20',
    border: 'border-[--brand-gold]/30',
  },
  success: {
    bg: 'bg-[--success]',
    text: 'text-[--success]',
    bgLight: 'bg-[--success]/10 dark:bg-[--success]/20',
    border: 'border-[--success]/30',
  },
  warning: {
    bg: 'bg-[--warning]',
    text: 'text-[--warning]',
    bgLight: 'bg-[--warning]/10 dark:bg-[--warning]/20',
    border: 'border-[--warning]/30',
  },
  danger: {
    bg: 'bg-[--danger]',
    text: 'text-[--danger]',
    bgLight: 'bg-[--danger]/10 dark:bg-[--danger]/20',
    border: 'border-[--danger]/30',
  },
  info: {
    bg: 'bg-[--info]',
    text: 'text-[--info]',
    bgLight: 'bg-[--info]/10 dark:bg-[--info]/20',
    border: 'border-[--info]/30',
  },
};

export function StatusBars({ metrics, className }: StatusBarsProps) {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4 mb-6', className)} role="list">
      {metrics.map((metric, index) => {
        const colors = colorMap[metric.color || 'gold'];
        const isClickable = Boolean(metric.link);

        const cardContent = (
          <>
            {/* Gold accent bar (or semantic color) */}
            <div className={cn('h-1 w-full', colors.bg)} aria-hidden="true" />

            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {metric.icon && (
                    <div className={cn('p-2 rounded-lg', colors.bgLight)} aria-hidden="true">
                      <div className={colors.text}>
                        {metric.icon}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {metric.label}
                    </p>
                  </div>
                </div>
                {metric.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {metric.badge}
                  </Badge>
                )}
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {metric.value}
                  </p>
                </div>

                {metric.trend && (
                  <div className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    metric.trend.direction === 'up' && 'text-[--success]',
                    metric.trend.direction === 'down' && 'text-[--danger]',
                    metric.trend.direction === 'neutral' && 'text-muted-foreground'
                  )}
                  aria-label={`${metric.trend.direction === 'up' ? 'Increased' : metric.trend.direction === 'down' ? 'Decreased' : 'No change'} by ${metric.trend.value}`}
                  >
                    {metric.trend.direction === 'up' && (
                      <TrendingUp className="w-3 h-3" aria-hidden="true" />
                    )}
                    {metric.trend.direction === 'down' && (
                      <TrendingDown className="w-3 h-3" aria-hidden="true" />
                    )}
                    <span>{metric.trend.value}</span>
                  </div>
                )}
              </div>

              {/* View details affordance for clickable cards */}
              {isClickable && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-[--brand-gold] transition-colors">
                  <span>View details</span>
                  <ChevronRight className="w-3 h-3" aria-hidden="true" />
                </div>
              )}
            </div>
          </>
        );

        return isClickable ? (
          <a
            key={index}
            href={metric.link}
            className={cn(
              'group relative overflow-hidden transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[--brand-gold] focus:ring-offset-2 rounded-lg',
              'block'
            )}
            role="listitem"
            aria-label={metric.ariaLabel || `${metric.label}: ${metric.value}. Click to view details.`}
          >
            <Card className="h-full border-0">
              {cardContent}
            </Card>
          </a>
        ) : (
          <Card
            key={index}
            className="relative overflow-hidden"
            role="listitem"
            aria-label={metric.ariaLabel || `${metric.label}: ${metric.value}`}
          >
            {cardContent}
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Pre-configured status bar metrics for common use cases
 * Updated with semantic colors aligned to OpportunityOS brand
 */
export function getDefaultStatusBarMetrics(data: {
  purchaseOrders?: number;
  overdue?: number;
  openBills?: number;
  paidLast30Days?: number;
}): StatusBarMetric[] {
  return [
    {
      label: 'Purchase Orders',
      value: data.purchaseOrders ?? 0,
      icon: <FileText className="w-4 h-4" />,
      color: 'info',
      link: '/expenses/bills',
      ariaLabel: `${data.purchaseOrders ?? 0} purchase orders. Click to view all bills.`,
    },
    {
      label: 'Overdue',
      value: data.overdue ?? 0,
      icon: <AlertCircle className="w-4 h-4" />,
      color: data.overdue && data.overdue > 0 ? 'danger' : 'warning',
      badge: data.overdue && data.overdue > 0 ? 'Action needed' : undefined,
      link: '/invoices?filter=overdue',
      ariaLabel: `${data.overdue ?? 0} overdue invoices${data.overdue && data.overdue > 0 ? '. Action needed' : ''}. Click to view overdue items.`,
    },
    {
      label: 'Open Bills',
      value: data.openBills ?? 0,
      icon: <DollarSign className="w-4 h-4" />,
      color: 'gold',
      link: '/expenses/bills?status=open',
      ariaLabel: `${data.openBills ?? 0} open bills. Click to view open bills.`,
    },
    {
      label: 'Paid Last 30 Days',
      value: data.paidLast30Days ?? 0,
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'success',
      link: '/expenses/bills?filter=paid',
      ariaLabel: `${data.paidLast30Days ?? 0} bills paid in the last 30 days. Click to view paid bills.`,
    },
  ];
}
