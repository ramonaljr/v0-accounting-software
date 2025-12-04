/**
 * Shared Action Types
 * Standardized response types for all server actions
 */

/**
 * Standard result type for server actions
 * @template T - The type of data returned on success
 */
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Paginated result type for list actions
 * @template T - The type of items in the list
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Standard paginated action result
 * @template T - The type of items in the paginated list
 */
export type PaginatedActionResult<T> = ActionResult<PaginatedResult<T>>;

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  success: string[];
  failed: Array<{ id: string; error: string }>;
}

/**
 * Validation error with field information
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Action result with validation errors
 * @template T - The type of data returned on success
 */
export interface ValidatedActionResult<T = unknown> extends ActionResult<T> {
  validationErrors?: ValidationError[];
}
