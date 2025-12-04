/**
 * Application Error Classes
 * Standardized error types for consistent error handling across the application
 */

/**
 * Base error class for application-specific errors
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
  }
}

/**
 * Error thrown when user is not authenticated
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

/**
 * Error thrown when user lacks permission for an action
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 'FORBIDDEN', 403);
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    fields: Record<string, string[]> = {}
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.fields = fields;
  }

  static fromZodError(error: { issues: Array<{ path: (string | number)[]; message: string }> }): ValidationError {
    const fields: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      if (!fields[path]) {
        fields[path] = [];
      }
      fields[path].push(issue.message);
    }
    return new ValidationError('Validation failed', fields);
  }
}

/**
 * Error thrown when there's a conflict (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 'CONFLICT', 409);
  }
}

/**
 * Error thrown when a business rule is violated
 */
export class BusinessRuleError extends AppError {
  public readonly rule: string;

  constructor(message: string, rule: string = 'BUSINESS_RULE') {
    super(message, rule, 422);
    this.rule = rule;
  }
}

/**
 * Error thrown when an external service fails
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string) {
    super(`${service} error: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502);
    this.service = service;
  }
}

/**
 * Error thrown for database operations
 */
export class DatabaseError extends AppError {
  public readonly operation: string;

  constructor(operation: string, message: string) {
    super(`Database ${operation} failed: ${message}`, 'DATABASE_ERROR', 500);
    this.operation = operation;
  }
}

// =============================================================================
// HR Module Specific Errors
// =============================================================================

/**
 * Base error class for HR module errors
 */
export class HrError extends AppError {
  constructor(message: string, code: string = 'HR_ERROR') {
    super(message, code, 400);
  }
}

/**
 * Error thrown when leave balance is insufficient
 */
export class InsufficientLeaveBalanceError extends HrError {
  public readonly available: number;
  public readonly requested: number;

  constructor(available: number, requested: number) {
    super(
      `Insufficient leave balance. Available: ${available}, Requested: ${requested}`,
      'INSUFFICIENT_LEAVE_BALANCE'
    );
    this.available = available;
    this.requested = requested;
  }
}

/**
 * Error thrown for invalid leave application state transitions
 */
export class InvalidLeaveStateError extends HrError {
  public readonly currentState: string;
  public readonly attemptedAction: string;

  constructor(currentState: string, attemptedAction: string) {
    super(
      `Cannot ${attemptedAction} leave application in '${currentState}' state`,
      'INVALID_LEAVE_STATE'
    );
    this.currentState = currentState;
    this.attemptedAction = attemptedAction;
  }
}

/**
 * Error thrown for payroll-related issues
 */
export class PayrollError extends HrError {
  constructor(message: string) {
    super(message, 'PAYROLL_ERROR');
  }
}

/**
 * Error thrown when payroll entry is in wrong state for an operation
 */
export class InvalidPayrollStateError extends PayrollError {
  public readonly currentState: string;
  public readonly attemptedAction: string;

  constructor(currentState: string, attemptedAction: string) {
    super(`Cannot ${attemptedAction} payroll entry in '${currentState}' state`);
    this.currentState = currentState;
    this.attemptedAction = attemptedAction;
  }
}

// =============================================================================
// Accounting Module Specific Errors
// =============================================================================

/**
 * Base error class for accounting module errors
 */
export class AccountingError extends AppError {
  constructor(message: string, code: string = 'ACCOUNTING_ERROR') {
    super(message, code, 400);
  }
}

/**
 * Error thrown when journal entry doesn't balance
 */
export class UnbalancedJournalEntryError extends AccountingError {
  public readonly debitTotal: number;
  public readonly creditTotal: number;

  constructor(debitTotal: number, creditTotal: number) {
    const difference = Math.abs(debitTotal - creditTotal);
    super(
      `Journal entry is unbalanced. Debits: ${debitTotal}, Credits: ${creditTotal}, Difference: ${difference}`,
      'UNBALANCED_JOURNAL_ENTRY'
    );
    this.debitTotal = debitTotal;
    this.creditTotal = creditTotal;
  }
}

/**
 * Error thrown when period is closed for transactions
 */
export class ClosedPeriodError extends AccountingError {
  public readonly periodEnd: Date;

  constructor(periodEnd: Date) {
    super(
      `Cannot post transactions to a closed period (ended ${periodEnd.toISOString()})`,
      'CLOSED_PERIOD'
    );
    this.periodEnd = periodEnd;
  }
}

// =============================================================================
// ERROR UTILITIES
// =============================================================================

/**
 * Check if an error is an operational error (expected, can be handled gracefully)
 */
export function isOperationalError(error: unknown): error is AppError {
  return error instanceof AppError && error.isOperational;
}

/**
 * Convert any error to a consistent error response format
 */
export function toErrorResponse(error: unknown): {
  success: false;
  error: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
} {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error instanceof ValidationError ? { fields: error.fields } : undefined,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: false,
    error: String(error),
  };
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<{ success: true; data: R } | { success: false; error: string; code?: string }> {
  return async (...args: T) => {
    try {
      const result = await fn(...args);
      return { success: true, data: result };
    } catch (error) {
      const response = toErrorResponse(error);
      return {
        success: false,
        error: response.error,
        code: response.code,
      };
    }
  };
}
