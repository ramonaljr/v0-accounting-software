/**
 * Database Mapper Utilities
 * Common utility functions for mapping database rows to domain models
 *
 * These utilities provide type-safe, null-safe conversions between
 * database types and application domain types.
 */

/**
 * Generic database row type
 */
export type DbRow = Record<string, unknown>;

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Safely extract a string from a database row
 */
export function getString(row: DbRow, key: string): string {
  return row[key] as string;
}

/**
 * Safely extract an optional string from a database row
 */
export function getOptionalString(row: DbRow, key: string): string | undefined {
  const value = row[key];
  return value != null ? String(value) : undefined;
}

/**
 * Safely extract a string with default value
 */
export function getStringWithDefault(row: DbRow, key: string, defaultValue: string): string {
  const value = row[key];
  return value != null ? String(value) : defaultValue;
}

// =============================================================================
// NUMBER UTILITIES
// =============================================================================

/**
 * Parse a number from database value (handles string | number | null)
 * Returns 0 if value is null/undefined/NaN
 */
export function parseNumber(value: unknown): number {
  if (value == null) return 0;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse a number with custom default value
 */
export function parseNumberWithDefault(value: unknown, defaultValue: number): number {
  if (value == null) return defaultValue;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely extract a number from a database row
 */
export function getNumber(row: DbRow, key: string): number {
  return parseNumber(row[key]);
}

/**
 * Safely extract a number with default from a database row
 */
export function getNumberWithDefault(row: DbRow, key: string, defaultValue: number): number {
  return parseNumberWithDefault(row[key], defaultValue);
}

/**
 * Parse integer from database value
 */
export function parseInteger(value: unknown): number {
  if (value == null) return 0;
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Get integer from row
 */
export function getInteger(row: DbRow, key: string): number {
  return parseInteger(row[key]);
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

/**
 * Parse a Date from database value (handles string | Date | null)
 * Returns current date if value is null/undefined/invalid
 */
export function parseDate(value: unknown): Date {
  if (value == null) return new Date();
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Parse an optional Date from database value
 */
export function parseOptionalDate(value: unknown): Date | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Safely extract a date from a database row
 */
export function getDate(row: DbRow, key: string): Date {
  return parseDate(row[key]);
}

/**
 * Safely extract an optional date from a database row
 */
export function getOptionalDate(row: DbRow, key: string): Date | undefined {
  return parseOptionalDate(row[key]);
}

// =============================================================================
// BOOLEAN UTILITIES
// =============================================================================

/**
 * Parse a boolean from database value
 * Returns false if value is null/undefined
 */
export function parseBoolean(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
}

/**
 * Parse boolean with custom default
 */
export function parseBooleanWithDefault(value: unknown, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;
  return parseBoolean(value);
}

/**
 * Safely extract a boolean from a database row
 */
export function getBoolean(row: DbRow, key: string): boolean {
  return parseBoolean(row[key]);
}

/**
 * Safely extract a boolean with default from a database row
 */
export function getBooleanWithDefault(row: DbRow, key: string, defaultValue: boolean): boolean {
  return parseBooleanWithDefault(row[key], defaultValue);
}

// =============================================================================
// ENUM / TYPE UTILITIES
// =============================================================================

/**
 * Safely cast a value to a specific type (string literal union)
 * Use with caution - this bypasses runtime type checking
 */
export function castToType<T extends string>(value: unknown): T {
  return value as T;
}

/**
 * Get a typed value from a row
 */
export function getTypedValue<T>(row: DbRow, key: string): T {
  return row[key] as T;
}

/**
 * Get a typed value with default
 */
export function getTypedValueWithDefault<T>(row: DbRow, key: string, defaultValue: T): T {
  const value = row[key];
  return value != null ? (value as T) : defaultValue;
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Map an array of database rows using a mapper function
 * Handles null/undefined arrays safely
 */
export function mapArray<T, R>(
  data: T[] | null | undefined,
  mapper: (item: T) => R
): R[] {
  return (data || []).map(mapper);
}

/**
 * Map an optional array - returns undefined if input is null/undefined
 */
export function mapOptionalArray<T, R>(
  data: T[] | null | undefined,
  mapper: (item: T) => R
): R[] | undefined {
  if (data == null) return undefined;
  return data.map(mapper);
}

// =============================================================================
// COMMON FIELD EXTRACTORS
// =============================================================================

/**
 * Extract common entity fields (id, org_id, created_at, updated_at)
 */
export function extractBaseFields(row: DbRow): {
  id: string;
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: getString(row, 'id'),
    orgId: getString(row, 'org_id'),
    createdAt: getDate(row, 'created_at'),
    updatedAt: getDate(row, 'updated_at'),
  };
}

/**
 * Extract document status fields
 */
export function extractDocStatus(row: DbRow): {
  docstatus: number;
  status: string;
} {
  return {
    docstatus: getInteger(row, 'docstatus'),
    status: getString(row, 'status'),
  };
}

/**
 * Extract employee reference fields
 */
export function extractEmployeeRef(row: DbRow): {
  employeeId: string;
  employeeName?: string;
} {
  return {
    employeeId: getString(row, 'employee_id'),
    employeeName: getOptionalString(row, 'employee_name'),
  };
}

/**
 * Extract date range fields
 */
export function extractDateRange(row: DbRow): {
  fromDate: Date;
  toDate: Date;
} {
  return {
    fromDate: getDate(row, 'from_date'),
    toDate: getDate(row, 'to_date'),
  };
}

/**
 * Extract posting date fields
 */
export function extractPostingDates(row: DbRow): {
  postingDate: Date;
  startDate: Date;
  endDate: Date;
} {
  return {
    postingDate: getDate(row, 'posting_date'),
    startDate: getDate(row, 'start_date'),
    endDate: getDate(row, 'end_date'),
  };
}

// =============================================================================
// SNAKE_CASE TO CAMELCASE CONVERSION
// =============================================================================

/**
 * Convert snake_case key to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert all keys in an object from snake_case to camelCase
 */
export function snakeToCamelKeys<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[snakeToCamel(key)] = obj[key];
    }
  }
  return result;
}

// =============================================================================
// CAMELCASE TO SNAKE_CASE CONVERSION
// =============================================================================

/**
 * Convert camelCase key to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert all keys in an object from camelCase to snake_case
 */
export function camelToSnakeKeys<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[camelToSnake(key)] = obj[key];
    }
  }
  return result;
}
