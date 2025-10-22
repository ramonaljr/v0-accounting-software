/**
 * Expense Management Server Actions
 * Handle receipt upload, OCR processing, and expense creation
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { processReceipt } from "@/lib/ocr";
import { ledgerBot } from "@/lib/ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const UploadReceiptSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp|pdf)$/),
  fileData: z.string(), // Base64 encoded
});

const CreateExpenseSchema = z.object({
  receiptId: z.string().uuid().optional(),
  vendorName: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  taxAmount: z.number().nonnegative().default(0),
  category: z.string().optional(),
  description: z.string().optional(),
  accountId: z.string().uuid().optional(),
  status: z.enum(["draft", "submitted"]).default("draft"),
});

const ApproveExpenseSchema = z.object({
  expenseId: z.string().uuid(),
  approved: z.boolean(),
  notes: z.string().optional(),
});

// =====================================================
// UPLOAD AND PROCESS RECEIPT
// =====================================================

export async function uploadReceipt(formData: FormData) {
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

    const orgId = membership.org_id;

    // Extract file from FormData
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file
    const validation = UploadReceiptSchema.safeParse({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      fileData: "", // Will process below
    });

    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const filePath = `${orgId}/receipts/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[Upload] Storage error:", uploadError);
      return { success: false, error: "Failed to upload file" };
    }

    // Create receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        org_id: orgId,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        ocr_status: "processing",
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (receiptError || !receipt) {
      console.error("[Upload] Receipt creation error:", receiptError);
      return { success: false, error: "Failed to create receipt record" };
    }

    // Process OCR in background (non-blocking)
    processOCRBackground(receipt.id, orgId, buffer).catch((error) => {
      console.error("[OCR] Background processing failed:", error);
    });

    revalidatePath("/expenses");
    revalidatePath("/receipts");

    return {
      success: true,
      receiptId: receipt.id,
      message: "Receipt uploaded successfully. OCR processing in progress...",
    };
  } catch (error) {
    console.error("[Upload] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Background OCR processing
 * @private
 */
async function processOCRBackground(
  receiptId: string,
  orgId: string,
  imageBuffer: Buffer
): Promise<void> {
  const supabase = await createClient();

  try {
    // Process receipt with OCR
    const ocrResult = await processReceipt(imageBuffer);

    if (!ocrResult.success || !ocrResult.data) {
      await supabase
        .from("receipts")
        .update({
          ocr_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", receiptId);
      return;
    }

    // Update receipt with OCR results
    await supabase
      .from("receipts")
      .update({
        ocr_status: "completed",
        ocr_result: ocrResult.data,
        ocr_confidence: ocrResult.data.confidence,
        updated_at: new Date().toISOString(),
      })
      .eq("id", receiptId);

    // Auto-create draft expense if confidence is high
    if (ocrResult.data.confidence >= 0.80 && ocrResult.data.total) {
      await supabase.from("expenses").insert({
        org_id: orgId,
        receipt_id: receiptId,
        vendor_name: ocrResult.data.vendor?.name,
        date: ocrResult.data.date || new Date().toISOString().split("T")[0],
        amount: ocrResult.data.total,
        currency: ocrResult.data.currency || "USD",
        tax_amount: ocrResult.data.tax || 0,
        description: ocrResult.data.lineItems?.[0]?.description,
        status: "draft",
        submitted_by: orgId, // System-generated
      });
    }
  } catch (error) {
    console.error("[OCR] Processing error:", error);
    await supabase
      .from("receipts")
      .update({
        ocr_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", receiptId);
  }
}

// =====================================================
// CREATE EXPENSE
// =====================================================

export async function createExpense(input: z.infer<typeof CreateExpenseSchema>) {
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

    // Validate input
    const validation = CreateExpenseSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
    }

    const data = validation.data;

    // If no account specified, try to auto-categorize
    let accountId = data.accountId;
    if (!accountId && data.vendorName) {
      // Use LedgerBot to suggest category
      const categorization = await ledgerBot.execute(
        {
          id: "temp-" + Date.now(),
          date: data.date,
          description: data.description || data.vendorName,
          amount: data.amount,
          merchantName: data.vendorName,
        },
        { orgId: membership.org_id, userId: user.id, tier: "starter" as const }
      );

      if (categorization.success && categorization.data) {
        accountId = categorization.data.accountId;
      }
    }

    // Create expense
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .insert({
        org_id: membership.org_id,
        receipt_id: data.receiptId,
        vendor_name: data.vendorName,
        date: data.date,
        amount: data.amount,
        currency: data.currency,
        tax_amount: data.taxAmount,
        category: data.category,
        description: data.description,
        account_id: accountId,
        status: data.status,
        submitted_by: user.id,
      })
      .select()
      .single();

    if (expenseError || !expense) {
      console.error("[Expense] Creation error:", expenseError);
      return { success: false, error: "Failed to create expense" };
    }

    revalidatePath("/expenses");

    return {
      success: true,
      expenseId: expense.id,
      message: "Expense created successfully",
    };
  } catch (error) {
    console.error("[Expense] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// APPROVE/REJECT EXPENSE
// =====================================================

export async function approveExpense(input: z.infer<typeof ApproveExpenseSchema>) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user has approval permissions (admin or accountant)
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin", "accountant"].includes(membership.role)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    const validation = ApproveExpenseSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed" };
    }

    const { expenseId, approved } = validation.data;

    // Update expense status
    const { error: updateError } = await supabase
      .from("expenses")
      .update({
        status: approved ? "approved" : "rejected",
        approved_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId)
      .eq("org_id", membership.org_id);

    if (updateError) {
      console.error("[Expense] Approval error:", updateError);
      return { success: false, error: "Failed to update expense" };
    }

    // TODO: If approved, create journal entry to post to GL

    revalidatePath("/expenses");

    return {
      success: true,
      message: approved ? "Expense approved" : "Expense rejected",
    };
  } catch (error) {
    console.error("[Expense] Approval error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// GET EXPENSES
// =====================================================

export async function getExpenses(filters?: {
  status?: string;
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
      .from("expenses")
      .select("*, receipt:receipts(*), account:accounts(code, name)")
      .eq("org_id", membership.org_id)
      .order("date", { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.startDate) {
      query = query.gte("date", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("date", filters.endDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Expenses] Query error:", error);
      return { success: false, error: "Failed to fetch expenses" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[Expenses] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

