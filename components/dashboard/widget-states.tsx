/**
 * Widget State Components
 * Provides empty, error, and loading states for dashboard widgets
 * Implements Nielsen's Visibility of System Status and Error Prevention/Recovery
 */

import { AlertCircle, FileQuestion, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface WidgetLoadingProps {
  title?: string
  rows?: number
  className?: string
}

/**
 * Loading state with skeleton UI
 */
export function WidgetLoading({ title, rows = 3, className }: WidgetLoadingProps) {
  return (
    <Card className={cn('p-6', className)}>
      {title && (
        <div className="mb-4">
          <Skeleton className="h-5 w-32" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </Card>
  )
}

interface WidgetEmptyProps {
  title?: string
  message: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
  className?: string
}

/**
 * Empty state with optional action
 */
export function WidgetEmpty({
  title,
  message,
  actionLabel,
  onAction,
  icon,
  className,
}: WidgetEmptyProps) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-3 text-muted-foreground">
          {icon || <FileQuestion className="h-6 w-6" aria-hidden="true" />}
        </div>
        {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
        <p className="mb-4 text-sm text-muted-foreground max-w-sm">{message}</p>
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            variant="outline"
            className="focus:ring-[--brand-gold]"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  )
}

interface WidgetErrorProps {
  title?: string
  message: string
  error?: Error | string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

/**
 * Error state with retry action
 */
export function WidgetError({
  title = 'Unable to load data',
  message,
  error,
  onRetry,
  retryLabel = 'Try again',
  className,
}: WidgetErrorProps) {
  return (
    <Card className={cn('p-6 border-[--danger]/30 bg-[--danger]/5', className)}>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4 rounded-full bg-[--danger]/10 p-3 text-[--danger]">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-[--danger]">{title}</h3>
        <p className="mb-2 text-sm text-muted-foreground max-w-sm">{message}</p>
        {error && (
          <details className="mb-4 text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:underline">Technical details</summary>
            <code className="mt-2 block rounded bg-muted p-2 text-left">
              {typeof error === 'string' ? error : error.message}
            </code>
          </details>
        )}
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="focus:ring-[--brand-gold]"
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {retryLabel}
          </Button>
        )}
      </div>
    </Card>
  )
}

interface WidgetContainerProps {
  isLoading?: boolean
  isEmpty?: boolean
  error?: Error | string
  loadingProps?: Omit<WidgetLoadingProps, 'className'>
  emptyProps?: Omit<WidgetEmptyProps, 'className'>
  errorProps?: Omit<WidgetErrorProps, 'className'>
  children: React.ReactNode
  className?: string
}

/**
 * Smart container that automatically handles loading, empty, and error states
 */
export function WidgetContainer({
  isLoading,
  isEmpty,
  error,
  loadingProps,
  emptyProps,
  errorProps,
  children,
  className,
}: WidgetContainerProps) {
  if (isLoading) {
    return <WidgetLoading {...loadingProps} className={className} />
  }

  if (error) {
    return (
      <WidgetError
        message="An error occurred while loading this widget."
        error={error}
        {...errorProps}
        className={className}
      />
    )
  }

  if (isEmpty) {
    return (
      <WidgetEmpty
        message="No data available for the selected period."
        {...emptyProps}
        className={className}
      />
    )
  }

  return <>{children}</>
}
