import pino from 'pino'

/**
 * Structured logging with Pino
 * Production: JSON format for log aggregation
 * Development: Pretty format for readability
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Pretty print in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Base configuration for all logs
  base: {
    env: process.env.NODE_ENV,
  },

  // Timestamp
  timestamp: pino.stdTimeFunctions.isoTime,

  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'token',
      'apiKey',
      'secret',
      'authorization',
      'cookie',
      'accessToken',
      'refreshToken',
      '*.password',
      '*.token',
      '*.apiKey',
      '*.secret',
    ],
    remove: true,
  },
})

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context)
}

/**
 * Log bank sync event
 */
export function logBankSync(orgId: string, accountId: string, status: 'started' | 'completed' | 'failed', metadata?: Record<string, unknown>) {
  logger.info(
    {
      event: 'bank_sync',
      org_id: orgId,
      account_id: accountId,
      status,
      ...metadata,
    },
    `Bank sync ${status} for account ${accountId}`
  )
}

/**
 * Log AI agent run
 */
export function logAgentRun(
  orgId: string,
  agentName: string,
  status: 'started' | 'completed' | 'failed',
  metadata?: Record<string, unknown>
) {
  logger.info(
    {
      event: 'agent_run',
      org_id: orgId,
      agent_name: agentName,
      status,
      ...metadata,
    },
    `${agentName} ${status}`
  )
}

/**
 * Log reconciliation run
 */
export function logReconciliation(
  orgId: string,
  accountId: string,
  status: 'started' | 'completed' | 'failed',
  metadata?: Record<string, unknown>
) {
  logger.info(
    {
      event: 'reconciliation',
      org_id: orgId,
      account_id: accountId,
      status,
      ...metadata,
    },
    `Reconciliation ${status} for account ${accountId}`
  )
}

/**
 * Log report generation
 */
export function logReportGeneration(
  orgId: string,
  reportType: string,
  status: 'started' | 'completed' | 'failed',
  metadata?: Record<string, unknown>
) {
  logger.info(
    {
      event: 'report_generation',
      org_id: orgId,
      report_type: reportType,
      status,
      ...metadata,
    },
    `${reportType} report ${status}`
  )
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  userId?: string,
  orgId?: string,
  metadata?: Record<string, unknown>
) {
  logger.warn(
    {
      event: 'security',
      security_event: event,
      user_id: userId,
      org_id: orgId,
      ...metadata,
    },
    `Security event: ${event}`
  )
}

/**
 * Log error with context
 */
export function logError(
  error: Error,
  context?: Record<string, unknown>
) {
  logger.error(
    {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    },
    error.message
  )
}
