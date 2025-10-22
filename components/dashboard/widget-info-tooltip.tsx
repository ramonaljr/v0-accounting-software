/**
 * Widget Info Tooltip Component
 * Provides contextual "Why this matters" tooltips for dashboard widgets
 * Implements Progressive Disclosure and supports novice-to-expert pathway
 */

'use client'

import { HelpCircle, ExternalLink } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WidgetInfoTooltipProps {
  title: string
  description: string
  learnMoreLink?: string
  className?: string
}

/**
 * Info tooltip for dashboard widgets
 * Shows "Why this matters" explanation with optional learn more link
 */
export function WidgetInfoTooltip({
  title,
  description,
  learnMoreLink,
  className,
}: WidgetInfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-5 w-5 rounded-full text-muted-foreground hover:text-[--brand-gold] focus:ring-[--brand-gold]',
              className
            )}
            aria-label={`Learn more about ${title}`}
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-4" side="top" align="start">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
            {learnMoreLink && (
              <a
                href={learnMoreLink}
                className="inline-flex items-center gap-1 text-xs text-[--brand-gold] hover:underline focus:outline-none focus:ring-2 focus:ring-[--brand-gold] rounded"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Pre-configured tooltips for common dashboard widgets
 */
export const widgetInfoConfig = {
  revenue: {
    title: 'Why revenue tracking matters',
    description:
      'Monitoring revenue trends helps you identify growth patterns, seasonal variations, and potential issues early. This metric shows your total income before expenses.',
    learnMoreLink: '/help/reports/revenue',
  },
  expenses: {
    title: 'Why expense tracking matters',
    description:
      'Understanding your expense breakdown helps identify cost-saving opportunities and ensures spending aligns with your budget. Track trends to spot unusual patterns.',
    learnMoreLink: '/help/reports/expenses',
  },
  cashFlow: {
    title: 'Why cash flow matters',
    description:
      'Cash flow shows the actual money moving in and out of your business. Positive cash flow means you have funds available to pay bills and invest in growth.',
    learnMoreLink: '/help/reports/cash-flow',
  },
  profitLoss: {
    title: 'Why P&L matters',
    description:
      'The Profit & Loss statement shows whether your business is profitable by comparing total revenue to total expenses over a specific period.',
    learnMoreLink: '/help/reports/profit-and-loss',
  },
  accountsReceivable: {
    title: 'Why A/R matters',
    description:
      'Accounts Receivable tracks money owed to you by customers. Monitoring overdue invoices helps maintain healthy cash flow and identifies collection issues.',
    learnMoreLink: '/help/reports/accounts-receivable',
  },
  accountsPayable: {
    title: 'Why A/P matters',
    description:
      'Accounts Payable tracks money you owe to vendors and suppliers. Managing these payments strategically helps optimize cash flow and maintain good vendor relationships.',
    learnMoreLink: '/help/reports/accounts-payable',
  },
  reconciliation: {
    title: 'Why reconciliation matters',
    description:
      'Bank reconciliation ensures your records match your bank statements, catching errors, fraud, and discrepancies. Regular reconciliation is critical for accurate financial reporting.',
    learnMoreLink: '/help/banking/reconciliation',
  },
  balanceSheet: {
    title: 'Why balance sheet matters',
    description:
      'The balance sheet shows your business financial position at a specific point in time, including assets, liabilities, and equity. Essential for understanding business health.',
    learnMoreLink: '/help/reports/balance-sheet',
  },
}
