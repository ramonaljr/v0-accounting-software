import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names with Tailwind CSS classes
 * Handles conflicts intelligently using tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency with proper locale and currency code
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format date with proper locale
 */
export function formatDate(
  date: Date | string,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, options).format(dateObj)
}

/**
 * Format number with proper locale
 */
export function formatNumber(
  value: number,
  locale: string = 'en-US',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Abbreviate large numbers (1000 → 1K, 1000000 → 1M)
 */
export function abbreviateNumber(value: number, decimals: number = 1): string {
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absValue >= 1000000000) {
    return sign + (absValue / 1000000000).toFixed(decimals) + 'B'
  }
  if (absValue >= 1000000) {
    return sign + (absValue / 1000000).toFixed(decimals) + 'M'
  }
  if (absValue >= 1000) {
    return sign + (absValue / 1000).toFixed(decimals) + 'K'
  }
  return value.toFixed(decimals === 1 ? 0 : decimals)
}

/**
 * Format currency with abbreviation for dashboard display
 * Examples: $1.2M, $345K, $12.5B, -$500K
 */
export function formatCurrencyAbbrev(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US',
  decimals: number = 1
): string {
  const absValue = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  // Get currency symbol
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  const parts = formatter.formatToParts(0)
  const currencySymbol = parts.find(part => part.type === 'currency')?.value || '$'

  if (absValue >= 1000000000) {
    return `${sign}${currencySymbol}${(absValue / 1000000000).toFixed(decimals)}B`
  }
  if (absValue >= 1000000) {
    return `${sign}${currencySymbol}${(absValue / 1000000).toFixed(decimals)}M`
  }
  if (absValue >= 1000) {
    return `${sign}${currencySymbol}${(absValue / 1000).toFixed(decimals)}K`
  }

  return formatter.format(amount)
}

/**
 * Format relative time (e.g., "2 minutes ago", "just now")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`

  return formatDate(dateObj, 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
