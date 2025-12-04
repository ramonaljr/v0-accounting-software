/**
 * Bills Component Types
 */

export interface Bill {
  id: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNo?: string;
  postingDate: string;
  dueDate: string;
  grandTotal: number;
  outstandingAmount: number;
  paidAmount: number;
  currency: string;
  status: 'Draft' | 'Submitted' | 'Paid' | 'Cancelled' | 'Return';
}

export interface Supplier {
  id: string;
  supplierName: string;
  supplierType?: string;
}

export interface BillStats {
  unpaidTotal: number;
  unpaidCount: number;
  overdueTotal: number;
  overdueCount: number;
  dueSoonTotal: number;
  dueSoonCount: number;
  paidThisMonth: number;
  paidThisMonthCount: number;
}

export interface BillItem {
  itemName: string;
  qty: number;
  rate: number;
  description?: string;
}

export type BillStatus = 'Draft' | 'Submitted' | 'Paid' | 'Partly Paid' | 'Overdue' | 'Cancelled' | 'Return' | 'On Hold';
