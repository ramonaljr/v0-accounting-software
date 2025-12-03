/**
 * Customer Model
 * Based on ERPNext's Customer DocType
 */

import { z } from 'zod';

// Customer types
export const CustomerType = z.enum(['Company', 'Individual']);
export type CustomerType = z.infer<typeof CustomerType>;

// Tax categories for Philippines
export const TaxCategory = z.enum([
  'VAT Registered',
  'Non-VAT',
  'VAT Exempt',
  'Zero Rated',
  'Government',
]);
export type TaxCategory = z.infer<typeof TaxCategory>;

// Address schema (reusable)
export const AddressSchema = z.object({
  line1: z.string().max(255).optional(),
  line2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).default('PH'),
});

export type Address = z.infer<typeof AddressSchema>;

// Customer schema
export const CustomerSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),

  // Identification
  customerCode: z.string().max(50),
  customerName: z.string().min(1).max(255),
  customerType: CustomerType.default('Company'),

  // Tax Information
  taxId: z.string().max(50).optional(),       // TIN
  taxCategory: TaxCategory.optional(),

  // Contact
  primaryContactName: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  website: z.string().url().optional(),

  // Billing Address
  billingAddress: AddressSchema.optional(),

  // Shipping Address
  shippingAddress: AddressSchema.optional(),

  // Financial
  defaultCurrency: z.string().length(3).default('PHP'),
  creditLimit: z.number().min(0).default(0),
  paymentTerms: z.number().int().min(0).default(30),  // Days
  priceListId: z.string().uuid().optional(),

  // Default Accounts
  defaultReceivableAccountId: z.string().uuid().optional(),

  // Classification
  customerGroup: z.string().max(100).optional(),
  territory: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),

  // Status
  isActive: z.boolean().default(true),
  isFrozen: z.boolean().default(false),

  // Notes
  notes: z.string().optional(),

  // Audit
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid().optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;

// Create customer schema
export const CreateCustomerSchema = z.object({
  orgId: z.string().uuid(),
  customerCode: z.string().max(50).optional(),  // Auto-generated if not provided
  customerName: z.string().min(1).max(255),
  customerType: CustomerType.default('Company'),

  taxId: z.string().max(50).optional(),
  taxCategory: TaxCategory.optional(),

  primaryContactName: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  mobile: z.string().max(50).optional(),
  website: z.string().url().optional(),

  billingAddressLine1: z.string().max(255).optional(),
  billingAddressLine2: z.string().max(255).optional(),
  billingCity: z.string().max(100).optional(),
  billingState: z.string().max(100).optional(),
  billingPostalCode: z.string().max(20).optional(),
  billingCountry: z.string().length(2).default('PH'),

  shippingAddressLine1: z.string().max(255).optional(),
  shippingAddressLine2: z.string().max(255).optional(),
  shippingCity: z.string().max(100).optional(),
  shippingState: z.string().max(100).optional(),
  shippingPostalCode: z.string().max(20).optional(),
  shippingCountry: z.string().length(2).default('PH'),

  defaultCurrency: z.string().length(3).default('PHP'),
  creditLimit: z.number().min(0).default(0),
  paymentTerms: z.number().int().min(0).default(30),
  priceListId: z.string().uuid().optional(),

  defaultReceivableAccountId: z.string().uuid().optional(),

  customerGroup: z.string().max(100).optional(),
  territory: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),

  notes: z.string().optional(),
});

export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;

// Update customer schema
export const UpdateCustomerSchema = CreateCustomerSchema.partial().extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  isFrozen: z.boolean().optional(),
});

export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;

// Customer with outstanding balance
export interface CustomerWithBalance extends Customer {
  outstandingBalance: number;
  creditAvailable: number;
}

// Customer list filters
export interface CustomerListFilters {
  orgId: string;
  search?: string;
  customerGroup?: string;
  territory?: string;
  isActive?: boolean;
  hasOutstanding?: boolean;
  limit?: number;
  offset?: number;
}
