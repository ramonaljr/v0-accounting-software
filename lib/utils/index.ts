/**
 * Utilities - Barrel Export
 *
 * Central export point for utility functions.
 * Import from '@/lib/utils' to access utilities.
 *
 * Note: The main utility functions are in '@/lib/utils.ts' (cn, etc.)
 * This file exports additional domain-specific utilities.
 *
 * @example
 * import { logger, parseNumber, ValidationError } from '@/lib/utils';
 */

// Logging utilities
export {
  logger,
  createLogger,
  logBankSync,
  logAgentRun,
  logReconciliation,
  logReportGeneration,
  logSecurityEvent,
  logError,
} from './logger';

// Feature flags
export {
  isFeatureEnabled,
  getEnabledFeatures,
  getFeatureFlagConfig,
  useFeatureFlag,
  requireFeature,
  type FeatureFlag,
} from './feature-flags';

// Error tracking (Sentry)
export {
  captureException,
  captureMessage,
  addBreadcrumb,
  setUserContext,
  clearUserContext,
  type ErrorContext,
} from './error-tracking';

// Validation utilities
export { getFirstZodError } from './validation';

// Database mappers
export {
  type DbRow,
  getString,
  getOptionalString,
  getStringWithDefault,
  parseNumber,
  parseNumberWithDefault,
  getNumber,
  getNumberWithDefault,
  parseInteger,
  getInteger,
  parseDate,
  parseOptionalDate,
  getDate,
  getOptionalDate,
  parseBoolean,
  parseBooleanWithDefault,
  getBoolean,
  getBooleanWithDefault,
  castToType,
  getTypedValue,
  getTypedValueWithDefault,
  mapArray,
  mapOptionalArray,
  extractBaseFields,
  extractDocStatus,
  extractEmployeeRef,
  extractDateRange,
  extractPostingDates,
  snakeToCamel,
  snakeToCamelKeys,
  camelToSnake,
  camelToSnakeKeys,
} from './db-mappers';

// Formula parser
export {
  evaluateFormula,
  validateFormula,
  extractVariables,
  PAYROLL_VARIABLES,
} from './formula-parser';
