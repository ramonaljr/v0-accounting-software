# 🧾 Pre-Merge Report — Unified QA Summary Template

## Purpose
Provide a single, human-readable and AI-parsable report summarizing all quality checks  
before merging code into the main branch.

---

## Section 1 — Build & Compilation
**Goal:** Verify that all builds, dependencies, and configs pass successfully.

| Check | Result | Notes |
|--------|---------|-------|
| Build completed | ✅ / ❌ |  |
| TypeScript errors | 0 / n |  |
| Lint & format status | ✅ / ❌ |  |
| Dependency health | ✅ / ❌ |  |
| pnpm install audit | ✅ / ❌ |  |

---

## Section 2 — Playwright MCP (E2E)
**Goal:** Validate the full user journey.

| Flow | Status | Notes |
|-------|---------|-------|
| Login → Dashboard | ✅ / ❌ |  |
| Dashboard → Billing | ✅ / ❌ |  |
| Logout | ✅ / ❌ |  |

Artifacts: `/artifacts/e2e/` (screenshots, logs, and metrics)

---

## Section 3 — Browser Automation MCP
**Goal:** Capture real-time UI health and performance.

| Route | Screenshot | Console Errors | Slow Requests | Status |
|--------|-------------|----------------|----------------|--------|
| / |  |  |  |  |
| /pricing |  |  |  |  |
| /signup |  |  |  |  |

Artifacts: `/artifacts/browser/`

---

## Section 4 — Supabase MCP
**Goal:** Confirm schema, RLS, and migration integrity.

| Table | Index Check | RLS Status | Migration Needed |
|--------|--------------|-------------|------------------|
|  |  |  |  |

Artifacts: `/artifacts/db/`

---

## Section 5 — Context7 MCP
**Goal:** Ensure library usage matches official docs.

| Library | Version | Doc Match | Notes |
|----------|----------|-----------|-------|
| next |  | ✅ / ❌ |  |
| react-query |  | ✅ / ❌ |  |
| supabase-js |  | ✅ / ❌ |  |

---

## Section 6 — Vibe-Check MCP
**Goal:** Confirm tone, clarity, and compliance for visible text.

| Page or Copy | Severity | Suggestion |
|---------------|-----------|-------------|
|  |  |  |

---

## Section 7 — Overall Summary
**Status:** ✅ Ready to Merge / ⚠️ Requires Fixes / ❌ Blocked  

**High-Priority Issues**
1.   
2.   
3.   

---

✅ **Pre-Merge Report Complete**
