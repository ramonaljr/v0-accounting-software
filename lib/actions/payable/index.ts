'use server';

/**
 * Payable (Accounts Payable) Server Actions
 * Server-side actions for purchase invoices (bills) and suppliers
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { PurchaseInvoiceService, SupplierService } from '@/lib/services/payable';
import { logAuditEvent } from '@/lib/audit/logger';

// =============================================
// HELPER: Get current org and user
// =============================================

interface AuthContext {
  orgId: string;
  userId: string;
}

async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  if (!membership?.org_id) return null;

  return {
    orgId: membership.org_id,
    userId: user.id,
  };
}

async function getCurrentOrg(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();

  return membership?.org_id ?? null;
}

// =============================================
// ACTION RESULT TYPE
// =============================================

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================
// SUPPLIER ACTIONS
// =============================================

/**
 * List suppliers
 */
export async function listSuppliers(options?: {
  supplierType?: 'Company' | 'Individual' | 'Government' | 'Partnership';
  search?: string;
  limit?: number;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const suppliers = await SupplierService.list({
      orgId,
      supplierType: options?.supplierType,
      search: options?.search,
      limit: options?.limit,
    });

    return { success: true, data: suppliers };
  } catch (error) {
    console.error('[listSuppliers] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list suppliers',
    };
  }
}

/**
 * Get supplier by ID
 */
export async function getSupplier(id: string): Promise<ActionResult> {
  try {
    const supplier = await SupplierService.getById(id);
    return { success: true, data: supplier };
  } catch (error) {
    console.error('[getSupplier] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get supplier',
    };
  }
}

/**
 * Create supplier
 */
export async function createSupplier(data: {
  supplierName: string;
  supplierType?: 'Company' | 'Individual' | 'Government' | 'Partnership';
  taxCategory?: 'VAT Registered' | 'Non-VAT' | 'Exempt' | 'Zero-Rated' | 'Government';
  isWhtAgent?: boolean;
  currency?: string;
  creditLimit?: number;
  contactPerson?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  tinNumber?: string;
  paymentTerms?: string;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const supplier = await SupplierService.create({
      orgId,
      supplierName: data.supplierName,
      supplierType: data.supplierType ?? 'Company',
      taxCategory: data.taxCategory ?? 'VAT Registered',
      isWhtAgent: data.isWhtAgent ?? false,
      currency: data.currency ?? 'PHP',
      creditLimit: data.creditLimit ?? 0,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      tinNumber: data.tinNumber,
      paymentTerms: data.paymentTerms,
    });

    revalidatePath('/expenses/vendors');

    return { success: true, data: supplier };
  } catch (error) {
    console.error('[createSupplier] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create supplier',
    };
  }
}

// =============================================
// PURCHASE INVOICE (BILL) ACTIONS
// =============================================

/**
 * List purchase invoices (bills)
 */
export async function listBills(options?: {
  supplierId?: string;
  status?: 'Draft' | 'Submitted' | 'Paid' | 'Partly Paid' | 'Overdue' | 'Cancelled' | 'Return' | 'On Hold';
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const bills = await PurchaseInvoiceService.list({
      orgId,
      supplierId: options?.supplierId,
      status: options?.status,
      fromDate: options?.fromDate ? new Date(options.fromDate) : undefined,
      toDate: options?.toDate ? new Date(options.toDate) : undefined,
      limit: options?.limit,
    });

    return { success: true, data: bills };
  } catch (error) {
    console.error('[listBills] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list bills',
    };
  }
}

/**
 * Get bill by ID
 */
export async function getBill(id: string): Promise<ActionResult> {
  try {
    const bill = await PurchaseInvoiceService.getById(id);
    return { success: true, data: bill };
  } catch (error) {
    console.error('[getBill] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get bill',
    };
  }
}

/**
 * Create purchase invoice (bill)
 */
export async function createBill(data: {
  supplierId: string;
  supplierInvoiceNo?: string;
  postingDate: string;
  dueDate?: string;
  items: Array<{
    itemName: string;
    qty: number;
    rate: number;
    uom?: string;
    description?: string;
    discountPercentage?: number;
    taxRate?: number;
    isFixedAsset?: boolean;
  }>;
  remarks?: string;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const auth = await getAuthContext();
    const bill = await PurchaseInvoiceService.create({
      orgId,
      invoiceType: 'Invoice',
      supplierId: data.supplierId,
      supplierInvoiceNo: data.supplierInvoiceNo,
      postingDate: new Date(data.postingDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      currency: 'PHP',
      exchangeRate: 1,
      discountAmount: 0,
      applyWithholdingTax: false,
      withholdingTaxRate: 0,
      items: data.items.map((item) => ({
        itemName: item.itemName,
        qty: item.qty,
        rate: item.rate,
        uom: item.uom ?? 'Unit',
        description: item.description,
        discountPercentage: item.discountPercentage ?? 0,
        taxRate: item.taxRate ?? 12,
        isFixedAsset: item.isFixedAsset ?? false,
      })),
      remarks: data.remarks,
    });

    // Audit log for bill creation
    await logAuditEvent({
      orgId: auth?.orgId,
      userId: auth?.userId,
      action: 'create',
      entityType: 'purchase_invoice',
      entityId: bill.id,
      changes: {
        supplierId: data.supplierId,
        postingDate: data.postingDate,
        itemCount: data.items.length,
      },
    });

    revalidatePath('/expenses/bills');

    return { success: true, data: bill };
  } catch (error) {
    console.error('[createBill] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bill',
    };
  }
}

/**
 * Submit bill (post to GL)
 */
export async function submitBill(id: string): Promise<ActionResult> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return { success: false, error: 'User not authenticated' };
    }

    const bill = await PurchaseInvoiceService.submit(id, auth.userId);

    // Audit log for bill submission (financial posting)
    await logAuditEvent({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'submit',
      entityType: 'purchase_invoice',
      entityId: id,
      metadata: {
        severity: 'high',
        description: 'Bill posted to General Ledger',
      },
    });

    revalidatePath('/expenses/bills');
    revalidatePath(`/expenses/bills/${id}`);

    return { success: true, data: bill };
  } catch (error) {
    console.error('[submitBill] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit bill',
    };
  }
}

/**
 * Cancel bill
 */
export async function cancelBill(id: string): Promise<ActionResult> {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return { success: false, error: 'User not authenticated' };
    }

    const bill = await PurchaseInvoiceService.cancel(id, auth.userId);

    // Audit log for bill cancellation (financial reversal)
    await logAuditEvent({
      orgId: auth.orgId,
      userId: auth.userId,
      action: 'cancel',
      entityType: 'purchase_invoice',
      entityId: id,
      metadata: {
        severity: 'high',
        description: 'Bill cancelled and GL entries reversed',
      },
    });

    revalidatePath('/expenses/bills');
    revalidatePath(`/expenses/bills/${id}`);

    return { success: true, data: bill };
  } catch (error) {
    console.error('[cancelBill] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel bill',
    };
  }
}

/**
 * Get bills statistics
 */
export async function getBillStats(): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const supabase = await createClient();

    // Get all bills for the organization
    const { data: bills, error } = await supabase
      .from('purchase_invoices')
      .select('status, outstanding_amount, grand_total, due_date, posting_date')
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to get bill stats: ${error.message}`);
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      unpaidTotal: 0,
      unpaidCount: 0,
      overdueTotal: 0,
      overdueCount: 0,
      dueSoonTotal: 0,
      dueSoonCount: 0,
      paidThisMonth: 0,
      paidThisMonthCount: 0,
    };

    for (const bill of bills || []) {
      const outstanding = parseFloat(bill.outstanding_amount) || 0;
      const total = parseFloat(bill.grand_total) || 0;
      const dueDate = bill.due_date ? new Date(bill.due_date) : null;
      const postingDate = bill.posting_date ? new Date(bill.posting_date) : null;

      if (outstanding > 0) {
        stats.unpaidTotal += outstanding;
        stats.unpaidCount++;

        if (dueDate && dueDate < now) {
          stats.overdueTotal += outstanding;
          stats.overdueCount++;
        } else if (dueDate && dueDate <= sevenDaysFromNow) {
          stats.dueSoonTotal += outstanding;
          stats.dueSoonCount++;
        }
      }

      if (bill.status === 'Paid' && postingDate && postingDate >= firstOfMonth) {
        stats.paidThisMonth += total;
        stats.paidThisMonthCount++;
      }
    }

    return { success: true, data: stats };
  } catch (error) {
    console.error('[getBillStats] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get bill stats',
    };
  }
}
