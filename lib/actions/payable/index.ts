'use server';

/**
 * Payable (Accounts Payable) Server Actions
 * Server-side actions for purchase invoices (bills) and suppliers
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { PurchaseInvoiceService, SupplierService } from '@/lib/services/payable';

// =============================================
// HELPER: Get current org
// =============================================

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
  isActive?: boolean;
  supplierType?: string;
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
      isActive: options?.isActive,
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
  supplierType?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  paymentTerms?: string;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const supplier = await SupplierService.create({
      orgId,
      ...data,
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
  status?: string;
  fromDate?: string;
  toDate?: string;
  isPaid?: boolean;
  search?: string;
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
      isPaid: options?.isPaid,
      search: options?.search,
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
    description?: string;
    taxRate?: number;
  }>;
  remarks?: string;
}): Promise<ActionResult> {
  try {
    const orgId = await getCurrentOrg();
    if (!orgId) {
      return { success: false, error: 'Organization not found' };
    }

    const bill = await PurchaseInvoiceService.create({
      orgId,
      supplierId: data.supplierId,
      supplierInvoiceNo: data.supplierInvoiceNo,
      postingDate: new Date(data.postingDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      items: data.items.map((item, idx) => ({
        idx,
        itemName: item.itemName,
        qty: item.qty,
        rate: item.rate,
        description: item.description,
        taxRate: item.taxRate,
      })),
      remarks: data.remarks,
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
    const bill = await PurchaseInvoiceService.submit(id);

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
    const bill = await PurchaseInvoiceService.cancel(id);

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
