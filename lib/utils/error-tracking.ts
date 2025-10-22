import * as Sentry from '@sentry/nextjs'

export interface ErrorContext {
  userId?: string
  orgId?: string
  requestId?: string
  action?: string
  feature?: string
  [key: string]: unknown
}

/**
 * Capture an exception with custom context
 */
export function captureException(error: Error, context?: ErrorContext) {
  if (context) {
    Sentry.setContext('custom', context)

    if (context.userId) {
      Sentry.setUser({ id: context.userId })
    }

    if (context.orgId) {
      Sentry.setTag('org_id', context.orgId)
    }

    if (context.feature) {
      Sentry.setTag('feature', context.feature)
    }

    if (context.action) {
      Sentry.setTag('action', context.action)
    }
  }

  return Sentry.captureException(error)
}

/**
 * Capture a message with custom context
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: ErrorContext) {
  if (context) {
    Sentry.setContext('custom', context)

    if (context.userId) {
      Sentry.setUser({ id: context.userId })
    }

    if (context.orgId) {
      Sentry.setTag('org_id', context.orgId)
    }

    if (context.feature) {
      Sentry.setTag('feature', context.feature)
    }
  }

  return Sentry.captureMessage(message, level)
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    data,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Set user context
 */
export function setUserContext(userId: string, email?: string, orgId?: string) {
  Sentry.setUser({
    id: userId,
    email,
  })

  if (orgId) {
    Sentry.setTag('org_id', orgId)
  }
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null)
}
