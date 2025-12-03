/**
 * Supplier Model
 * Based on ERPNext's Supplier DocType
 */

import { z } from 'zod';

// Tax categories for Philippines
export const SupplierTaxCategory = z.enum([
  'VAT Registered',
  'Non-VAT',
  'Exempt',
  'Zero-Rated',
  'Government',
]);
export type SupplierTaxCategory = z.infer<typeof SupplierTaxCategory>;

// Supplier types
export const SupplierType = z.enum([
  'Company',
  'Individual',
  'Government',
  'Partnership',
]);
export type SupplierType = z.infer<typeof SupplierType>;

// Supplier status
export const SupplierStatus = z.enum([
  'Active',
  'Inactive',
  'Blocked',
]);
export type SupplierStatus = z.infer<typeof SupplierStatus>;

// Address schema (shared)
export const AddressSchema = z.object({
  addressLine1: z.string().max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100),
  stateProvince: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).default('Philippines'),
  phone: z.string().max(50).optional(),
  fax: z.string().max(50).optional(),
  email: z.string().email().optional(),
});

export type Address = z.infer<typeof AddressSchema>;

// Supplier schema
export const SupplierSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  // Basic Info
  supplierCode: z.string().max(50),
  supplierName: z.string().min(1).max(255),
  supplierType: SupplierType.default('Company'),
  status: SupplierStatus.default('Active'),

  // Tax Information (Philippines specific)
  tinNumber: z.string().max(20).optional(),  // Tax Identification Number
  taxCategory: SupplierTaxCategory.default('VAT Registered'),
  isWhtAgent: z.boolean().default(false),  // Withholding tax agent

  // Contact
  contactPerson: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  website: z.string().url().optional(),

  // Address
  billingAddress: AddressSchema.optional(),
  shippingAddress: AddressSchema.optional(),

  // Financial
  currency: z.string().length(3).default('PHP'),
  defaultPayableAccount: z.string().uuid().optional(),
  paymentTerms: z.string().max(100).optional(),  // e.g., "Net 30", "Due on Receipt"
  creditLimit: z.number().min(0).default(0),

  // Banking
  bankName: z.string().max(255).optional(),
  bankAccountNo: z.string().max(50).optional(),
  bankAccountName: z.string().max(255).optional(),
  bankBranch: z.string().max(255).optional(),

  // Defaults
  defaultExpenseAccount: z.string().uuid().optional(),
  defaultCostCenter: z.string().uuid().optional(),

  // Supplier Group
  supplierGroup: z.string().max(100).optional(),

  // Additional
  notes: z.string().optional(),

  // Audit
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid().optional(),
});

export type Supplier = z.infer<typeof SupplierSchema>;

// Create Supplier input schema
export const CreateSupplierSchema = z.object({
  orgId: z.string().uuid(),
  supplierName: z.string().min(1).max(255),
  supplierType: SupplierType.default('Company'),

  // Tax
  tinNumber: z.string().max(20).optional(),
  taxCategory: SupplierTaxCategory.default('VAT Registered'),
  isWhtAgent: z.boolean().default(false),

  // Contact
  contactPerson: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  website: z.string().url().optional(),

  // Address
  billingAddress: AddressSchema.optional(),
  shippingAddress: AddressSchema.optional(),

  // Financial
  currency: z.string().length(3).default('PHP'),
  defaultPayableAccount: z.string().uuid().optional(),
  paymentTerms: z.string().max(100).optional(),
  creditLimit: z.number().min(0).default(0),

  // Banking
  bankName: z.string().max(255).optional(),
  bankAccountNo: z.string().max(50).optional(),
  bankAccountName: z.string().max(255).optional(),
  bankBranch: z.string().max(255).optional(),

  // Defaults
  defaultExpenseAccount: z.string().uuid().optional(),
  defaultCostCenter: z.string().uuid().optional(),

  // Group
  supplierGroup: z.string().max(100).optional(),

  notes: z.string().optional(),
});

export type CreateSupplier = z.infer<typeof CreateSupplierSchema>;

// Update Supplier schema
export const UpdateSupplierSchema = CreateSupplierSchema.partial().extend({
  id: z.string().uuid(),
  status: SupplierStatus.optional(),
});

export type UpdateSupplier = z.infer<typeof UpdateSupplierSchema>;

// Supplier list filters
export interface SupplierListFilters {
  orgId: string;
  status?: SupplierStatus;
  supplierType?: SupplierType;
  supplierGroup?: string;
  taxCategory?: SupplierTaxCategory;
  search?: string;
  limit?: number;
  offset?: number;
}

// Supplier with balance
export interface SupplierWithBalance extends Supplier {
  outstandingAmount: number;
  advanceAmount: number;
}

// Payment terms options (Philippines common terms)
export const PAYMENT_TERMS_OPTIONS = [
  { value: 'Due on Receipt', label: 'Due on Receipt', days: 0 },
  { value: 'Net 7', label: 'Net 7 Days', days: 7 },
  { value: 'Net 15', label: 'Net 15 Days', days: 15 },
  { value: 'Net 30', label: 'Net 30 Days', days: 30 },
  { value: 'Net 45', label: 'Net 45 Days', days: 45 },
  { value: 'Net 60', label: 'Net 60 Days', days: 60 },
  { value: 'Net 90', label: 'Net 90 Days', days: 90 },
  { value: '2/10 Net 30', label: '2% 10 Days, Net 30', days: 30 },
  { value: 'EOM', label: 'End of Month', days: 30 },
];

// Helper to calculate due date from payment terms
export function calculateDueDate(postingDate: Date, paymentTerms: string): Date {
  const term = PAYMENT_TERMS_OPTIONS.find(t => t.value === paymentTerms);
  const days = term?.days || 0;

  const dueDate = new Date(postingDate);

  if (paymentTerms === 'EOM') {
    // End of month
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(0);
  } else {
    dueDate.setDate(dueDate.getDate() + days);
  }

  return dueDate;
}
