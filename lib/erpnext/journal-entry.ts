import { erpnextFetch } from "./client";
import { validateBalancedEntry } from "@/lib/ledger/validation";

export interface ERPNextJELine {
  account: string;
  debit?: number;
  credit?: number;
  cost_center?: string;
  party_type?: string;
  party?: string;
  reference_type?: string;
  reference_name?: string;
  exchange_rate?: number;
  account_currency?: string;
  is_advance?: "Yes" | "No";
  user_remark?: string;
}

export interface PostJournalEntryInput {
  company: string;
  posting_date: string; // YYYY-MM-DD
  remark?: string;
  voucher_type?: string; // defaults to "Journal Entry"
  accounts: ERPNextJELine[];
}

export async function postJournalEntry(input: PostJournalEntryInput) {
  if (!input.company) throw new Error("company is required");
  if (!input.posting_date) throw new Error("posting_date is required");
  if (!input.accounts || input.accounts.length < 2) {
    throw new Error("At least two lines are required");
  }

  // Local balance validation to fail fast before API call
  const provisional: Parameters<typeof validateBalancedEntry>[0] = {
    entry_date: new Date(input.posting_date),
    description: input.remark || "Journal Entry",
    lines: input.accounts.map((l) => ({
      // account mapping not known here; this is just for balancing
      account_id: l.account,
      debit: Number(l.debit || 0),
      credit: Number(l.credit || 0),
      description: l.user_remark,
    })),
  };

  const bal = validateBalancedEntry(provisional);
  if (!bal.isValid) {
    throw new Error(bal.error || "Journal entry not balanced");
  }

  const payload = {
    doctype: "Journal Entry",
    voucher_type: input.voucher_type || "Journal Entry",
    posting_date: input.posting_date,
    company: input.company,
    user_remark: input.remark,
    accounts: input.accounts.map((l) => ({
      doctype: "Journal Entry Account",
      account: l.account,
      debit: Number(l.debit || 0),
      credit: Number(l.credit || 0),
      debit_in_account_currency:
        typeof l.debit === "number" && l.debit > 0
          ? Number(l.debit)
          : undefined,
      credit_in_account_currency:
        typeof l.credit === "number" && l.credit > 0
          ? Number(l.credit)
          : undefined,
      exchange_rate: l.exchange_rate || 1,
      cost_center: l.cost_center,
      party_type: l.party_type,
      party: l.party,
      reference_type: l.reference_type,
      reference_name: l.reference_name,
      account_currency: l.account_currency,
      is_advance: l.is_advance || "No",
      user_remark: l.user_remark,
    })),
  };

  return erpnextFetch("/api/resource/Journal Entry", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
