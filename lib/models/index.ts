/**
 * Domain Models - Barrel Export
 *
 * Central export point for all domain models.
 * Import from '@/lib/models' to access any model type.
 *
 * Note: Some modules have conflicting exports (e.g., Address).
 * Import from specific sub-modules for those:
 *   - '@/lib/models/payable' for SupplierAddress
 *   - '@/lib/models/receivable' for CustomerAddress
 *
 * @example
 * import { Account, Employee, SalesInvoice } from '@/lib/models';
 */

// Accounting domain - no conflicts
export * from './accounting';

// Human Resources domain - no conflicts
export * from './hr';

// Manufacturing domain - no conflicts
export * from './manufacturing';

// Accounts Payable domain - export with renames to avoid conflicts
export {
  // Supplier
  SupplierTaxCategory,
  SupplierType,
  SupplierStatus,
  AddressSchema as SupplierAddressSchema,
  type Address as SupplierAddress,
  SupplierSchema,
  type Supplier,
  CreateSupplierSchema,
  type CreateSupplier,
  UpdateSupplierSchema,
  type UpdateSupplier,
  type SupplierListFilters,
  type SupplierWithBalance,
  PAYMENT_TERMS_OPTIONS,
  calculateDueDate,
} from './payable/supplier';

// Purchase Invoice (payable)
export {
  PurchaseInvoiceType,
  PurchaseInvoiceStatus,
  PurchaseInvoiceItemSchema,
  type PurchaseInvoiceItem,
  PurchaseInvoiceTaxSchema,
  type PurchaseInvoiceTax,
  PurchaseInvoiceSchema,
  type PurchaseInvoice,
  CreatePurchaseInvoiceSchema,
  type CreatePurchaseInvoice,
  UpdatePurchaseInvoiceSchema,
  type UpdatePurchaseInvoice,
  type PurchaseInvoiceListFilters,
  PH_WITHHOLDING_TAX_TYPES,
  calculateItemAmounts as calculatePurchaseItemAmounts,
  calculateInvoiceTotals as calculatePurchaseInvoiceTotals,
} from './payable/purchase-invoice';

// Accounts Receivable domain - export with renames to avoid conflicts
export {
  // Customer
  CustomerType,
  TaxCategory,
  AddressSchema as CustomerAddressSchema,
  type Address as CustomerAddress,
  CustomerSchema,
  type Customer,
  CreateCustomerSchema,
  type CreateCustomer,
  UpdateCustomerSchema,
  type UpdateCustomer,
  type CustomerWithBalance,
  type CustomerListFilters,
} from './receivable/customer';

// Sales Invoice (receivable)
export {
  SalesInvoiceType,
  SalesInvoiceStatus,
  SalesInvoiceItemSchema,
  type SalesInvoiceItem,
  SalesInvoiceTaxSchema,
  type SalesInvoiceTax,
  SalesInvoiceSchema,
  type SalesInvoice,
  CreateSalesInvoiceSchema,
  type CreateSalesInvoice,
  UpdateSalesInvoiceSchema,
  type UpdateSalesInvoice,
  type SalesInvoiceListFilters,
  calculateItemAmounts as calculateSalesItemAmounts,
  calculateInvoiceTotals as calculateSalesInvoiceTotals,
} from './receivable/sales-invoice';

// Stock/Inventory domain - no conflicts
export * from './stock';
