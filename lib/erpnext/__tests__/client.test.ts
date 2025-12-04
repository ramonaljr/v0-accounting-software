import { describe, it, expect, vi, beforeEach } from "vitest";

// Helper to mock env/features module per test
function mockEnvModule({ hasERPNext, baseUrl = "https://example.com", key = "k", secret = "s" }: { hasERPNext: boolean; baseUrl?: string; key?: string; secret?: string; }) {
  vi.doMock("../../env", () => ({
    features: { hasERPNext },
    env: {
      ERPNEXT_BASE_URL: baseUrl,
      ERPNEXT_API_KEY: key,
      ERPNEXT_API_SECRET: secret,
    },
  }));
}

describe("ERPNext client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    // default mock fetch
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } })) as any;
  });

  it("throws if not configured", async () => {
    mockEnvModule({ hasERPNext: false });
    const mod = await import("../client");
    expect(() => mod.assertERPNextConfigured()).toThrow(/not configured/i);
  });

  it("builds proper auth header when configured", async () => {
    mockEnvModule({ hasERPNext: true, key: "abc", secret: "xyz" });
    const mod = await import("../client");
    expect(mod.getERPNextAuthHeader()).toBe("token abc:xyz");
  });

  it("calls fetch with composed URL and headers", async () => {
    mockEnvModule({ hasERPNext: true, baseUrl: "https://example.com/" });
    const mod = await import("../client");
    const spy = vi.spyOn(global, "fetch");
    const res = await mod.erpnextFetch("/api/resource/Customer?limit=1");
    expect(res).toEqual({ ok: true });
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0] as any;
    expect(String(url)).toBe("https://example.com/api/resource/Customer?limit=1");
    expect(init.headers.Authorization).toMatch(/^token\s/);
  });
});

