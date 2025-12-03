import { NextResponse } from "next/server";
import { features } from "@/lib/env";
import { postJournalEntry, type PostJournalEntryInput } from "@/lib/erpnext/journal-entry";

export async function POST(req: Request) {
  if (!features.hasERPNext) {
    return NextResponse.json({ ok: false, error: "ERPNext not configured" }, { status: 400 });
  }

  let body: PostJournalEntryInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const data = await postJournalEntry(body);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to post journal entry";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 400 }
    );
  }
}

