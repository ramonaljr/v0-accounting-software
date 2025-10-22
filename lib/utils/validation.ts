/**
 * Validation Utilities
 * Helper functions for Zod validation error handling
 */

import { z } from "zod";

/**
 * Get first error message from Zod validation error
 */
export function getFirstZodError(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  return firstIssue?.message || "Validation failed";
}
