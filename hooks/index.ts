/**
 * Hooks Barrel Export
 * Central export point for all custom hooks
 */

// Toast notifications
export { useToast, toast } from './use-toast';

// Mobile detection
export { useIsMobile } from './use-mobile';

// Async action handling with toast notifications
export {
  useAsyncAction,
  useAsyncActions,
  type ActionResult,
  type UseAsyncActionOptions,
  type UseAsyncActionReturn,
} from './use-async-action';

// Form state management
export {
  useFormState,
  useFormSubmit,
  useDialogForm,
  type FormState,
  type UseFormStateReturn,
  type UseFormSubmitOptions,
  type UseFormSubmitReturn,
  type UseDialogFormOptions,
  type UseDialogFormReturn,
} from './use-form-state';

// Line items management
export {
  useLineItems,
  useJournalLines,
  useBillLines,
  type LineItem,
  type UseLineItemsOptions,
  type UseLineItemsReturn,
  type JournalLine,
  type UseJournalLinesReturn,
  type BillLine,
  type UseBillLinesReturn,
} from './use-line-items';
