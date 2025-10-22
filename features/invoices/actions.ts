/**
 * Invoice Management Server Actions
 * CRUD operations for invoices, line items, and payments
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const InvoiceLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative().default(0),
  amount: z.number().nonnegative(),
  taxRate: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
  accountId: z.string().uuid().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
});

const CreateInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().default("USD"),
  lineItems: z.array(InvoiceLineItemSchema).min(1),
  notes: z.string().optional(),
  terms: z.string().optional(),
  status: z.enum(["draft", "sent"]).default("draft"),
});

const RecordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  paymentMethod: z.enum(["stripe", "paypal", "bank", "cash", "check", "other"]),
  reference: z.string().optional(),
});

// =====================================================
// CREATE INVOICE
// =====================================================

export async function createInvoice(input: z.infer<typeof CreateInvoiceSchema>) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    if (!["owner", "admin", "accountant", "staff"].includes(membership.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    const validation = CreateInvoiceSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
    }

    const data = validation.data;

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("org_id", membership.org_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let invoiceNumber = "INV-0001";
    if (lastInvoice?.invoice_number) {
      const match = lastInvoice.invoice_number.match(/INV-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        invoiceNumber = `INV-${nextNumber.toString().padStart(4, "0")}`;
      }
    }

    // Calculate totals
    const subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxTotal = data.lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + taxTotal;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        org_id: membership.org_id,
        invoice_number: invoiceNumber,
        customer_id: data.customerId,
        issue_date: data.issueDate,
        due_date: data.dueDate,
        currency: data.currency,
        subtotal,
        tax_total: taxTotal,
        total,
        amount_paid: 0,
        amount_due: total,
        status: data.status,
        notes: data.notes,
        terms: data.terms,
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      console.error("[Invoice] Creation error:", invoiceError);
      return { success: false, error: "Failed to create invoice" };
    }

    // Create line items
    const lineItemsToInsert = data.lineItems.map((item, index) => ({
      invoice_id: invoice.id,
      org_id: membership.org_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      amount: item.amount,
      tax_rate: item.taxRate,
      tax_amount: item.taxAmount,
      account_id: item.accountId,
      sort_order: item.sortOrder || index,
    }));

    const { error: lineItemsError } = await supabase
      .from("invoice_line_items")
      .insert(lineItemsToInsert);

    if (lineItemsError) {
      console.error("[Invoice] Line items error:", lineItemsError);
      // Rollback invoice creation
      await supabase.from("invoices").delete().eq("id", invoice.id);
      return { success: false, error: "Failed to create invoice line items" };
    }

    revalidatePath("/invoices");

    return {
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      message: "Invoice created successfully",
    };
  } catch (error) {
    console.error("[Invoice] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// UPDATE INVOICE
// =====================================================

export async function updateInvoice(
  invoiceId: string,
  input: Partial<z.infer<typeof CreateInvoiceSchema>>
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    // Verify invoice exists and belongs to org
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("org_id", membership.org_id)
      .single();

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Don't allow editing paid/cancelled invoices
    if (["paid", "cancelled"].includes(invoice.status)) {
      return { success: false, error: "Cannot edit paid or cancelled invoices" };
    }

    // Update invoice fields
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    if (input.issueDate) updateData.issue_date = input.issueDate;
    if (input.dueDate) updateData.due_date = input.dueDate;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.terms !== undefined) updateData.terms = input.terms;
    if (input.status) updateData.status = input.status;

    const { error: updateError } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoiceId)
      .eq("org_id", membership.org_id);

    if (updateError) {
      console.error("[Invoice] Update error:", updateError);
      return { success: false, error: "Failed to update invoice" };
    }

    // Update line items if provided
    if (input.lineItems) {
      // Delete existing line items
      await supabase
        .from("invoice_line_items")
        .delete()
        .eq("invoice_id", invoiceId);

      // Insert new line items
      const lineItemsToInsert = input.lineItems.map((item, index) => ({
        invoice_id: invoiceId,
        org_id: membership.org_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: item.amount,
        tax_rate: item.taxRate,
        tax_amount: item.taxAmount,
        account_id: item.accountId,
        sort_order: item.sortOrder || index,
      }));

      await supabase.from("invoice_line_items").insert(lineItemsToInsert);
    }

    revalidatePath("/invoices");

    return {
      success: true,
      message: "Invoice updated successfully",
    };
  } catch (error) {
    console.error("[Invoice] Update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// RECORD PAYMENT
// =====================================================

export async function recordPayment(input: z.infer<typeof RecordPaymentSchema>) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    // Validate input
    const validation = RecordPaymentSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
    }

    const data = validation.data;

    // Get invoice
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", data.invoiceId)
      .eq("org_id", membership.org_id)
      .single();

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Verify payment amount doesn't exceed amount due
    if (data.amount > invoice.amount_due) {
      return { success: false, error: "Payment amount exceeds amount due" };
    }

    // Record payment
    const { error: paymentError } = await supabase
      .from("invoice_payments")
      .insert({
        invoice_id: data.invoiceId,
        org_id: membership.org_id,
        payment_date: data.paymentDate,
        amount: data.amount,
        payment_method: data.paymentMethod,
        reference: data.reference,
        created_by: user.id,
      });

    if (paymentError) {
      console.error("[Payment] Recording error:", paymentError);
      return { success: false, error: "Failed to record payment" };
    }

    // Invoice totals will be automatically recalculated by trigger

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${data.invoiceId}`);

    return {
      success: true,
      message: "Payment recorded successfully",
    };
  } catch (error) {
    console.error("[Payment] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// GET INVOICES
// =====================================================

export async function getInvoices(filters?: {
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { success: false, error: "No organization found" };
    }

    // Build query
    let query = supabase
      .from("invoices")
      .select("*, customer:customers(name, email), line_items:invoice_line_items(count)")
      .eq("org_id", membership.org_id)
      .order("issue_date", { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.customerId) {
      query = query.eq("customer_id", filters.customerId);
    }
    if (filters?.startDate) {
      query = query.gte("issue_date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("issue_date", filters.endDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Invoices] Query error:", error);
      return { success: false, error: "Failed to fetch invoices" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[Invoices] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// DELETE INVOICE
// =====================================================

export async function deleteInvoice(invoiceId: string) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get organization
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Verify invoice exists
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("org_id", membership.org_id)
      .single();

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Don't allow deleting paid invoices
    if (invoice.status === "paid") {
      return { success: false, error: "Cannot delete paid invoices. Please void instead." };
    }

    // Delete invoice (cascade will delete line items and payments)
    const { error: deleteError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId)
      .eq("org_id", membership.org_id);

    if (deleteError) {
      console.error("[Invoice] Delete error:", deleteError);
      return { success: false, error: "Failed to delete invoice" };
    }

    revalidatePath("/invoices");

    return {
      success: true,
      message: "Invoice deleted successfully",
    };
  } catch (error) {
    console.error("[Invoice] Delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
