import { env, features } from "../env";

export function assertERPNextConfigured() {
  if (!features.hasERPNext) {
    throw new Error(
      "ERPNext is not configured. Set ERPNEXT_BASE_URL, ERPNEXT_API_KEY, and ERPNEXT_API_SECRET in your environment."
    );
  }
}

export function getERPNextAuthHeader() {
  assertERPNextConfigured();
  return `token ${env.ERPNEXT_API_KEY}:${env.ERPNEXT_API_SECRET}`;
}

export async function erpnextFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  assertERPNextConfigured();

  const url = new URL(path, env.ERPNEXT_BASE_URL);
  const headers: HeadersInit = {
    Authorization: getERPNextAuthHeader(),
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  };

  const res = await fetch(url.toString(), { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `ERPNext request failed: ${res.status} ${res.statusText}${text ? ` -> ${text}` : ""}`
    );
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

export async function whoAmI() {
  // Returns the logged-in user when auth works
  return erpnextFetch("/api/method/frappe.auth.get_logged_user");
}

