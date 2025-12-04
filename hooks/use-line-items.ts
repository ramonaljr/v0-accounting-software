'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

/**
 * Base interface for line items with an ID
 */
export interface LineItem {
  id: string;
}

/**
 * Options for useLineItems hook
 */
export interface UseLineItemsOptions<T extends LineItem> {
  /** Minimum number of items (default: 1) */
  minItems?: number;
  /** Maximum number of items (default: unlimited) */
  maxItems?: number;
  /** Factory function to create a new item */
  createItem: () => T;
  /** Validation function for items */
  validateItem?: (item: T) => boolean;
}

/**
 * Return type for useLineItems hook
 */
export interface UseLineItemsReturn<T extends LineItem> {
  /** Current list of items */
  items: T[];
  /** Set entire items array */
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  /** Add a new item */
  addItem: () => void;
  /** Remove an item by ID */
  removeItem: (id: string) => void;
  /** Update a specific field on an item */
  updateItem: <K extends keyof T>(id: string, field: K, value: T[K]) => void;
  /** Update multiple fields on an item */
  updateItemFields: (id: string, fields: Partial<T>) => void;
  /** Move an item up in the list */
  moveUp: (id: string) => void;
  /** Move an item down in the list */
  moveDown: (id: string) => void;
  /** Clear all items and reset to initial state */
  reset: () => void;
  /** Get valid items only (if validateItem provided) */
  validItems: T[];
  /** Check if can add more items */
  canAdd: boolean;
  /** Check if can remove items */
  canRemove: boolean;
  /** Number of items */
  count: number;
}

/**
 * Generate a unique ID for line items
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook for managing arrays of line items in forms.
 *
 * Useful for bill items, journal entry lines, order lines, etc.
 * Provides add/remove/update/reorder functionality with validation support.
 *
 * @example
 * ```tsx
 * interface BillItem extends LineItem {
 *   itemName: string;
 *   qty: number;
 *   rate: number;
 *   description?: string;
 * }
 *
 * function BillForm() {
 *   const {
 *     items,
 *     addItem,
 *     removeItem,
 *     updateItem,
 *     validItems,
 *     canAdd,
 *     canRemove,
 *   } = useLineItems<BillItem>({
 *     minItems: 1,
 *     maxItems: 20,
 *     createItem: () => ({
 *       id: generateId(),
 *       itemName: '',
 *       qty: 1,
 *       rate: 0,
 *     }),
 *     validateItem: (item) => item.itemName.trim() !== '' && item.qty > 0,
 *   });
 *
 *   const totalAmount = validItems.reduce(
 *     (sum, item) => sum + item.qty * item.rate,
 *     0
 *   );
 *
 *   return (
 *     <div>
 *       {items.map((item) => (
 *         <div key={item.id}>
 *           <input
 *             value={item.itemName}
 *             onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
 *           />
 *           <input
 *             type="number"
 *             value={item.qty}
 *             onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
 *           />
 *           <input
 *             type="number"
 *             value={item.rate}
 *             onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
 *           />
 *           <button
 *             onClick={() => removeItem(item.id)}
 *             disabled={!canRemove}
 *           >
 *             Remove
 *           </button>
 *         </div>
 *       ))}
 *       <button onClick={addItem} disabled={!canAdd}>
 *         Add Item
 *       </button>
 *       <div>Total: {totalAmount}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLineItems<T extends LineItem>(
  options: UseLineItemsOptions<T>
): UseLineItemsReturn<T> {
  const {
    minItems = 1,
    maxItems = Infinity,
    createItem,
    validateItem,
  } = options;

  // Initialize with minimum required items
  const [items, setItems] = useState<T[]>(() => {
    const initial: T[] = [];
    for (let i = 0; i < minItems; i++) {
      initial.push({ ...createItem(), id: generateId() });
    }
    return initial;
  });

  const addItem = useCallback(() => {
    if (items.length >= maxItems) return;
    setItems((prev) => [...prev, { ...createItem(), id: generateId() }]);
  }, [items.length, maxItems, createItem]);

  const removeItem = useCallback(
    (id: string) => {
      if (items.length <= minItems) return;
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [items.length, minItems]
  );

  const updateItem = useCallback(
    <K extends keyof T>(id: string, field: K, value: T[K]) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  const updateItemFields = useCallback((id: string, fields: Partial<T>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...fields } : item
      )
    );
  }, []);

  const moveUp = useCallback((id: string) => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index <= 0) return prev;
      const newItems = [...prev];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      return newItems;
    });
  }, []);

  const moveDown = useCallback((id: string) => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index < 0 || index >= prev.length - 1) return prev;
      const newItems = [...prev];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      return newItems;
    });
  }, []);

  const reset = useCallback(() => {
    const initial: T[] = [];
    for (let i = 0; i < minItems; i++) {
      initial.push({ ...createItem(), id: generateId() });
    }
    setItems(initial);
  }, [minItems, createItem]);

  const validItems = useMemo(() => {
    if (!validateItem) return items;
    return items.filter(validateItem);
  }, [items, validateItem]);

  const canAdd = items.length < maxItems;
  const canRemove = items.length > minItems;
  const count = items.length;

  return {
    items,
    setItems,
    addItem,
    removeItem,
    updateItem,
    updateItemFields,
    moveUp,
    moveDown,
    reset,
    validItems,
    canAdd,
    canRemove,
    count,
  };
}

/**
 * Hook for journal entry lines with debit/credit tracking
 */
export interface JournalLine extends LineItem {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface UseJournalLinesReturn extends UseLineItemsReturn<JournalLine> {
  /** Total of all debit amounts */
  totalDebits: number;
  /** Total of all credit amounts */
  totalCredits: number;
  /** Difference between debits and credits */
  difference: number;
  /** Whether the journal entry is balanced */
  isBalanced: boolean;
}

/**
 * Specialized hook for journal entry lines with balance tracking.
 *
 * @example
 * ```tsx
 * function JournalEntryForm() {
 *   const {
 *     items,
 *     addItem,
 *     removeItem,
 *     updateItem,
 *     totalDebits,
 *     totalCredits,
 *     isBalanced,
 *   } = useJournalLines();
 *
 *   return (
 *     <div>
 *       {items.map((line) => (
 *         <div key={line.id}>
 *           <AccountSelect
 *             value={line.accountId}
 *             onChange={(v) => updateItem(line.id, 'accountId', v)}
 *           />
 *           <input
 *             type="number"
 *             value={line.debit}
 *             onChange={(e) => updateItem(line.id, 'debit', Number(e.target.value))}
 *           />
 *           <input
 *             type="number"
 *             value={line.credit}
 *             onChange={(e) => updateItem(line.id, 'credit', Number(e.target.value))}
 *           />
 *         </div>
 *       ))}
 *       <div>
 *         Debits: {totalDebits} | Credits: {totalCredits}
 *         {!isBalanced && <span className="text-red-500">Unbalanced!</span>}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useJournalLines(
  initialLines?: JournalLine[]
): UseJournalLinesReturn {
  const lineItems = useLineItems<JournalLine>({
    minItems: 2,
    createItem: () => ({
      id: generateId(),
      accountId: '',
      debit: 0,
      credit: 0,
      description: '',
    }),
    validateItem: (line) =>
      line.accountId !== '' && (line.debit > 0 || line.credit > 0),
  });

  // Track if initial lines have been applied
  const initializedRef = useRef(false);

  // Override initial items if provided (only once on mount)
  useEffect(() => {
    if (initialLines && !initializedRef.current) {
      initializedRef.current = true;
      lineItems.setItems(initialLines);
    }
  }, [initialLines, lineItems]);

  const totalDebits = useMemo(
    () => lineItems.items.reduce((sum, line) => sum + (line.debit || 0), 0),
    [lineItems.items]
  );

  const totalCredits = useMemo(
    () => lineItems.items.reduce((sum, line) => sum + (line.credit || 0), 0),
    [lineItems.items]
  );

  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference < 0.01; // Allow for floating point errors

  return {
    ...lineItems,
    totalDebits,
    totalCredits,
    difference,
    isBalanced,
  };
}

/**
 * Hook for bill/invoice line items with amount tracking
 */
export interface BillLine extends LineItem {
  itemName: string;
  description?: string;
  qty: number;
  rate: number;
  amount?: number;
}

export interface UseBillLinesReturn extends UseLineItemsReturn<BillLine> {
  /** Total amount of all items */
  totalAmount: number;
  /** Number of valid items */
  validCount: number;
}

/**
 * Specialized hook for bill/invoice line items with total tracking.
 *
 * @example
 * ```tsx
 * function BillForm() {
 *   const {
 *     items,
 *     addItem,
 *     removeItem,
 *     updateItem,
 *     totalAmount,
 *     validItems,
 *   } = useBillLines();
 *
 *   async function handleSubmit() {
 *     await createBill({
 *       items: validItems.map(({ itemName, qty, rate, description }) => ({
 *         itemName,
 *         qty,
 *         rate,
 *         description,
 *       })),
 *     });
 *   }
 *
 *   return (
 *     <div>
 *       {items.map((item) => (
 *         <div key={item.id}>
 *           <input
 *             value={item.itemName}
 *             onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
 *           />
 *           <input
 *             type="number"
 *             value={item.qty}
 *             onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
 *           />
 *           <input
 *             type="number"
 *             value={item.rate}
 *             onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
 *           />
 *           <span>{(item.qty * item.rate).toFixed(2)}</span>
 *         </div>
 *       ))}
 *       <button onClick={addItem}>Add Item</button>
 *       <div>Total: {totalAmount.toFixed(2)}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBillLines(initialLines?: BillLine[]): UseBillLinesReturn {
  const lineItems = useLineItems<BillLine>({
    minItems: 1,
    maxItems: 50,
    createItem: () => ({
      id: generateId(),
      itemName: '',
      qty: 1,
      rate: 0,
    }),
    validateItem: (item) => item.itemName.trim() !== '' && item.qty > 0,
  });

  // Track if initial lines have been applied
  const initializedRef = useRef(false);

  // Override initial items if provided (only once on mount)
  useEffect(() => {
    if (initialLines && !initializedRef.current) {
      initializedRef.current = true;
      lineItems.setItems(initialLines);
    }
  }, [initialLines, lineItems]);

  const totalAmount = useMemo(
    () => lineItems.items.reduce((sum, item) => sum + item.qty * item.rate, 0),
    [lineItems.items]
  );

  const validCount = lineItems.validItems.length;

  return {
    ...lineItems,
    totalAmount,
    validCount,
  };
}
