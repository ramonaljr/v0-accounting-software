import { NextResponse } from "next/server";
import { features } from "@/lib/env";
import { whoAmI } from "@/lib/erpnext/client";

export async function GET() {
  if (!features.hasERPNext) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "ERPNext is not configured. Set ERPNEXT_BASE_URL, ERPNEXT_API_KEY, and ERPNEXT_API_SECRET.",
      },
      { status: 400 }
    );
  }

  try {
    const data = await whoAmI();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

