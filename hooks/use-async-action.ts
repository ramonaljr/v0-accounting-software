'use client';

import { useTransition, useCallback } from 'react';
import { useToast } from './use-toast';

/**
 * Standard action result type from server actions
 */
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Options for useAsyncAction hook
 */
export interface UseAsyncActionOptions<T> {
  /** Called on successful action */
  onSuccess?: (data: T | undefined) => void | Promise<void>;
  /** Called on action error */
  onError?: (error: string) => void;
  /** Success toast message (or function returning message) */
  successMessage?: string | ((data: T | undefined) => string);
  /** Error toast message prefix */
  errorMessage?: string;
  /** Whether to show success toast (default: true if successMessage provided) */
  showSuccessToast?: boolean;
  /** Whether to show error toast (default: true) */
  showErrorToast?: boolean;
}

/**
 * Return type for useAsyncAction hook
 */
export interface UseAsyncActionReturn<TArgs extends unknown[], TResult> {
  /** Execute the action */
  execute: (...args: TArgs) => Promise<ActionResult<TResult>>;
  /** Whether the action is currently pending */
  isPending: boolean;
}

/**
 * Hook for executing server actions with built-in loading state and toast notifications.
 *
 * This hook wraps server actions with:
 * - useTransition for concurrent rendering support
 * - Automatic toast notifications on success/error
 * - Type-safe action result handling
 *
 * @example
 * ```tsx
 * const { execute: handleCreate, isPending } = useAsyncAction(
 *   createBill,
 *   {
 *     successMessage: 'Bill created successfully',
 *     onSuccess: () => {
 *       setIsDialogOpen(false);
 *       refreshData();
 *     },
 *   }
 * );
 *
 * // In form handler:
 * await handleCreate({ supplierId, items });
 * ```
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<ActionResult<TResult>>,
  options: UseAsyncActionOptions<TResult> = {}
): UseAsyncActionReturn<TArgs, TResult> {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage = 'Operation failed',
    showSuccessToast = !!successMessage,
    showErrorToast = true,
  } = options;

  const execute = useCallback(
    async (...args: TArgs): Promise<ActionResult<TResult>> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          try {
            const result = await action(...args);

            if (result.success) {
              if (showSuccessToast && successMessage) {
                const message = typeof successMessage === 'function'
                  ? successMessage(result.data)
                  : successMessage;
                toast({
                  title: 'Success',
                  description: message,
                });
              }
              await onSuccess?.(result.data);
            } else {
              const errorMsg = result.error || errorMessage;
              if (showErrorToast) {
                toast({
                  title: 'Error',
                  description: errorMsg,
                  variant: 'destructive',
                });
              }
              onError?.(errorMsg);
            }

            resolve(result);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : errorMessage;
            if (showErrorToast) {
              toast({
                title: 'Error',
                description: errorMsg,
                variant: 'destructive',
              });
            }
            onError?.(errorMsg);
            resolve({ success: false, error: errorMsg });
          }
        });
      });
    },
    [action, onSuccess, onError, successMessage, errorMessage, showSuccessToast, showErrorToast, toast]
  );

  return { execute, isPending };
}

/**
 * Hook for executing multiple server actions that need to share pending state.
 * Useful for forms or pages with multiple related actions.
 *
 * @example
 * ```tsx
 * const { isPending, createAction, wrapAction } = useAsyncActions();
 *
 * const handleCreate = createAction(createBill, {
 *   successMessage: 'Bill created',
 *   onSuccess: refreshData,
 * });
 *
 * const handleSubmit = createAction(submitBill, {
 *   successMessage: 'Bill submitted',
 *   onSuccess: refreshData,
 * });
 * ```
 */
export function useAsyncActions() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const createAction = useCallback(
    <TArgs extends unknown[], TResult>(
      action: (...args: TArgs) => Promise<ActionResult<TResult>>,
      options: UseAsyncActionOptions<TResult> = {}
    ) => {
      const {
        onSuccess,
        onError,
        successMessage,
        errorMessage = 'Operation failed',
        showSuccessToast = !!successMessage,
        showErrorToast = true,
      } = options;

      return async (...args: TArgs): Promise<ActionResult<TResult>> => {
        return new Promise((resolve) => {
          startTransition(async () => {
            try {
              const result = await action(...args);

              if (result.success) {
                if (showSuccessToast && successMessage) {
                  const message = typeof successMessage === 'function'
                    ? successMessage(result.data)
                    : successMessage;
                  toast({
                    title: 'Success',
                    description: message,
                  });
                }
                await onSuccess?.(result.data);
              } else {
                const errorMsg = result.error || errorMessage;
                if (showErrorToast) {
                  toast({
                    title: 'Error',
                    description: errorMsg,
                    variant: 'destructive',
                  });
                }
                onError?.(errorMsg);
              }

              resolve(result);
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : errorMessage;
              if (showErrorToast) {
                toast({
                  title: 'Error',
                  description: errorMsg,
                  variant: 'destructive',
                });
              }
              onError?.(errorMsg);
              resolve({ success: false, error: errorMsg });
            }
          });
        });
      };
    },
    [toast]
  );

  /**
   * Wrap an existing async function to use the shared transition
   */
  const wrapAction = useCallback(
    <TArgs extends unknown[], TResult>(
      fn: (...args: TArgs) => Promise<TResult>
    ) => {
      return (...args: TArgs): Promise<TResult> => {
        return new Promise((resolve, reject) => {
          startTransition(async () => {
            try {
              const result = await fn(...args);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });
        });
      };
    },
    []
  );

  return { isPending, createAction, wrapAction };
}
