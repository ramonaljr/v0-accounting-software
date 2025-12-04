'use client';

import { useState, useCallback } from 'react';

/**
 * Form state interface
 */
export interface FormState {
  /** Whether the form is currently loading/submitting */
  isLoading: boolean;
  /** Current error message (if any) */
  error: string | null;
  /** Whether form submission was successful */
  isSuccess: boolean;
}

/**
 * Return type for useFormState hook
 */
export interface UseFormStateReturn extends FormState {
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set error message */
  setError: (error: string | null) => void;
  /** Set success state */
  setSuccess: (success: boolean) => void;
  /** Reset all form state */
  reset: () => void;
  /** Start form submission (sets loading, clears error/success) */
  startSubmit: () => void;
  /** Complete form submission with success */
  completeSuccess: () => void;
  /** Complete form submission with error */
  completeError: (error: string) => void;
}

/**
 * Hook for managing form loading, error, and success states.
 *
 * Provides a standardized way to handle form submission states
 * across the application.
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const {
 *     isLoading,
 *     error,
 *     startSubmit,
 *     completeSuccess,
 *     completeError,
 *   } = useFormState();
 *
 *   async function handleSubmit(e: FormEvent) {
 *     e.preventDefault();
 *     startSubmit();
 *
 *     try {
 *       await loginAction(email, password);
 *       completeSuccess();
 *       router.push('/dashboard');
 *     } catch (err) {
 *       completeError(err.message);
 *     }
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <ErrorAlert message={error} />}
 *       <button disabled={isLoading}>
 *         {isLoading ? 'Loading...' : 'Submit'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useFormState(initialState?: Partial<FormState>): UseFormStateReturn {
  const [isLoading, setIsLoading] = useState(initialState?.isLoading ?? false);
  const [error, setErrorState] = useState<string | null>(initialState?.error ?? null);
  const [isSuccess, setIsSuccess] = useState(initialState?.isSuccess ?? false);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setError = useCallback((err: string | null) => {
    setErrorState(err);
  }, []);

  const setSuccess = useCallback((success: boolean) => {
    setIsSuccess(success);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setErrorState(null);
    setIsSuccess(false);
  }, []);

  const startSubmit = useCallback(() => {
    setIsLoading(true);
    setErrorState(null);
    setIsSuccess(false);
  }, []);

  const completeSuccess = useCallback(() => {
    setIsLoading(false);
    setErrorState(null);
    setIsSuccess(true);
  }, []);

  const completeError = useCallback((err: string) => {
    setIsLoading(false);
    setErrorState(err);
    setIsSuccess(false);
  }, []);

  return {
    isLoading,
    error,
    isSuccess,
    setLoading,
    setError,
    setSuccess,
    reset,
    startSubmit,
    completeSuccess,
    completeError,
  };
}

/**
 * Options for useFormSubmit hook
 */
export interface UseFormSubmitOptions<T> {
  /** Called on successful submission */
  onSuccess?: (data: T) => void | Promise<void>;
  /** Called on submission error */
  onError?: (error: string) => void;
  /** Whether to reset form state after success (default: false) */
  resetOnSuccess?: boolean;
}

/**
 * Return type for useFormSubmit hook
 */
export interface UseFormSubmitReturn<T> extends FormState {
  /** Submit handler that wraps async function */
  submit: (asyncFn: () => Promise<T>) => Promise<T | undefined>;
  /** Reset form state */
  reset: () => void;
}

/**
 * Hook for handling form submissions with automatic state management.
 *
 * This is a higher-level abstraction over useFormState that automatically
 * manages loading/error/success states during async operations.
 *
 * @example
 * ```tsx
 * function CreateUserForm() {
 *   const { isLoading, error, submit } = useFormSubmit({
 *     onSuccess: (user) => {
 *       toast({ title: `Created user ${user.name}` });
 *       router.push('/users');
 *     },
 *   });
 *
 *   async function handleSubmit(e: FormEvent) {
 *     e.preventDefault();
 *     const formData = new FormData(e.target);
 *
 *     await submit(async () => {
 *       const result = await createUser(formData);
 *       if (!result.success) throw new Error(result.error);
 *       return result.data;
 *     });
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <ErrorAlert message={error} />}
 *       <button disabled={isLoading}>Create</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useFormSubmit<T = unknown>(
  options: UseFormSubmitOptions<T> = {}
): UseFormSubmitReturn<T> {
  const {
    onSuccess,
    onError,
    resetOnSuccess = false,
  } = options;

  const formState = useFormState();

  const submit = useCallback(
    async (asyncFn: () => Promise<T>): Promise<T | undefined> => {
      formState.startSubmit();

      try {
        const result = await asyncFn();
        formState.completeSuccess();

        if (resetOnSuccess) {
          formState.reset();
        }

        await onSuccess?.(result);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        formState.completeError(errorMessage);
        onError?.(errorMessage);
        return undefined;
      }
    },
    [formState, onSuccess, onError, resetOnSuccess]
  );

  return {
    isLoading: formState.isLoading,
    error: formState.error,
    isSuccess: formState.isSuccess,
    submit,
    reset: formState.reset,
  };
}

/**
 * Hook for managing dialog form state (combines open state with form state)
 *
 * @example
 * ```tsx
 * function UserDialog() {
 *   const {
 *     isOpen,
 *     open,
 *     close,
 *     isLoading,
 *     error,
 *     submit,
 *   } = useDialogForm({
 *     onSuccess: () => refreshUsers(),
 *   });
 *
 *   return (
 *     <>
 *       <Button onClick={open}>Add User</Button>
 *       <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
 *         <form onSubmit={(e) => {
 *           e.preventDefault();
 *           submit(async () => {
 *             const result = await createUser(data);
 *             if (!result.success) throw new Error(result.error);
 *             return result.data;
 *           });
 *         }}>
 *           {error && <ErrorAlert message={error} />}
 *           <Button disabled={isLoading}>Create</Button>
 *         </form>
 *       </Dialog>
 *     </>
 *   );
 * }
 * ```
 */
export interface UseDialogFormOptions<T> extends UseFormSubmitOptions<T> {
  /** Initial open state */
  initialOpen?: boolean;
}

export interface UseDialogFormReturn<T> extends UseFormSubmitReturn<T> {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Open the dialog */
  open: () => void;
  /** Close the dialog and reset form */
  close: () => void;
  /** Toggle dialog open state */
  toggle: () => void;
  /** Controlled onOpenChange handler for Dialog component */
  onOpenChange: (open: boolean) => void;
}

export function useDialogForm<T = unknown>(
  options: UseDialogFormOptions<T> = {}
): UseDialogFormReturn<T> {
  const { initialOpen = false, ...submitOptions } = options;
  const [isOpen, setIsOpen] = useState(initialOpen);
  const formSubmit = useFormSubmit<T>({
    ...submitOptions,
    onSuccess: async (data) => {
      setIsOpen(false);
      await submitOptions.onSuccess?.(data);
    },
  });

  const open = useCallback(() => {
    formSubmit.reset();
    setIsOpen(true);
  }, [formSubmit]);

  const close = useCallback(() => {
    setIsOpen(false);
    formSubmit.reset();
  }, [formSubmit]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  const onOpenChange = useCallback((open: boolean) => {
    if (open) {
      formSubmit.reset();
    }
    setIsOpen(open);
  }, [formSubmit]);

  return {
    ...formSubmit,
    isOpen,
    open,
    close,
    toggle,
    onOpenChange,
  };
}
