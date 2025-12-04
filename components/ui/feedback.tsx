'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';
import { Skeleton } from './skeleton';

/**
 * Error Alert Component
 * Displays error messages in a consistent format across the app
 */
interface ErrorAlertProps {
  /** Error message to display */
  message: string;
  /** Optional title (defaults to "Error") */
  title?: string;
  /** Optional className for customization */
  className?: string;
  /** Optional retry handler */
  onRetry?: () => void;
  /** Whether retry is loading */
  isRetrying?: boolean;
}

export function ErrorAlert({
  message,
  title = 'Error',
  className,
  onRetry,
  isRetrying,
}: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className={cn('', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-2">
        <span>{message}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="shrink-0"
          >
            {isRetrying ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3 w-3" />
            )}
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Success Alert Component
 * Displays success messages in a consistent format
 */
interface SuccessAlertProps {
  /** Success message to display */
  message: string;
  /** Optional title (defaults to "Success") */
  title?: string;
  /** Optional className for customization */
  className?: string;
}

export function SuccessAlert({
  message,
  title = 'Success',
  className,
}: SuccessAlertProps) {
  return (
    <Alert className={cn('border-green-200 bg-green-50 text-green-800', className)}>
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">{title}</AlertTitle>
      <AlertDescription className="text-green-700">{message}</AlertDescription>
    </Alert>
  );
}

/**
 * Warning Alert Component
 * Displays warning messages in a consistent format
 */
interface WarningAlertProps {
  /** Warning message to display */
  message: string;
  /** Optional title (defaults to "Warning") */
  title?: string;
  /** Optional className for customization */
  className?: string;
}

export function WarningAlert({
  message,
  title = 'Warning',
  className,
}: WarningAlertProps) {
  return (
    <Alert className={cn('border-yellow-200 bg-yellow-50 text-yellow-800', className)}>
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">{title}</AlertTitle>
      <AlertDescription className="text-yellow-700">{message}</AlertDescription>
    </Alert>
  );
}

/**
 * Loading Spinner Component
 * Consistent loading indicator
 */
interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className for customization */
  className?: string;
}

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-muted-foreground', spinnerSizes[size], className)}
    />
  );
}

/**
 * Loading State Component
 * Full loading state with spinner and optional text
 */
interface LoadingStateProps {
  /** Optional loading text */
  text?: string;
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className for customization */
  className?: string;
}

export function LoadingState({
  text = 'Loading...',
  size = 'md',
  className,
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-8', className)}>
      <LoadingSpinner size={size} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

/**
 * Empty State Component
 * Displays when no data is available
 */
interface EmptyStateProps {
  /** Main message */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional icon component */
  icon?: React.ReactNode;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Optional className for customization */
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-12 text-center',
        className
      )}
    >
      {icon && (
        <div className="rounded-full bg-muted p-4">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * Page Loading State
 * Full page loading skeleton
 */
interface PageLoadingProps {
  /** Number of skeleton rows to show */
  rows?: number;
  /** Optional className for customization */
  className?: string;
}

export function PageLoading({ rows = 5, className }: PageLoadingProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Table Loading State
 * Loading skeleton for tables
 */
interface TableLoadingProps {
  /** Number of columns */
  columns?: number;
  /** Number of rows */
  rows?: number;
  /** Optional className for customization */
  className?: string;
}

export function TableLoading({ columns = 5, rows = 5, className }: TableLoadingProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex gap-4 border-b pb-3 mb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={`row-${rowIdx}`} className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <Skeleton key={`cell-${rowIdx}-${colIdx}`} className="h-8 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Card Loading State
 * Loading skeleton for cards
 */
interface CardLoadingProps {
  /** Number of cards */
  count?: number;
  /** Optional className for customization */
  className?: string;
}

export function CardLoading({ count = 4, className }: CardLoadingProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Inline Error Component
 * Small inline error message for form fields
 */
interface InlineErrorProps {
  /** Error message */
  message?: string | null;
  /** Optional className for customization */
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  if (!message) return null;

  return (
    <p className={cn('text-sm text-destructive mt-1', className)}>
      {message}
    </p>
  );
}

/**
 * Form Error Summary Component
 * Displays multiple form errors at once
 */
interface FormErrorSummaryProps {
  /** Map of field names to error messages */
  errors: Record<string, string | string[] | undefined>;
  /** Optional className for customization */
  className?: string;
}

export function FormErrorSummary({ errors, className }: FormErrorSummaryProps) {
  const errorEntries = Object.entries(errors).filter(
    ([, value]) => value !== undefined
  );

  if (errorEntries.length === 0) return null;

  return (
    <Alert variant="destructive" className={cn('', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Please fix the following errors</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4 space-y-1">
          {errorEntries.map(([field, error]) => (
            <li key={field}>
              <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
              : {Array.isArray(error) ? error.join(', ') : error}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Submit Button Component
 * Button with built-in loading state
 */
interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the form is submitting */
  isLoading?: boolean;
  /** Loading text to display */
  loadingText?: string;
  /** Button variant */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SubmitButton({
  children,
  isLoading,
  loadingText,
  disabled,
  variant = 'default',
  size = 'default',
  className,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={isLoading || disabled}
      className={className}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || 'Loading...'}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
