# 🧠 Boot Context — AI System Warm-Up Sequence

## Purpose
Execute this sequence at the start of **every new Cursor or Claude Code session** to fully reinitialize:
- AI context & behavioral rules
- MCP servers and tools
- Supabase and Chrome automation connectivity

---

## Step 1 — Reread Core System Docs
Reload and cache the following Markdown documents for full system awareness:

- `./docs/ai/cursor.md` — main repo behavior, AI conventions, and workflow rules  
- `./docs/ai/claude.md` — model personality, verbosity, reasoning depth  
- `./docs/ai/system.md` — architecture, stack, and integration flow  
- `./docs/ai/vibe.md` — brand voice and compliance standards  
- `./docs/ai/prompt-library.md` — reusable structured prompts  
- *(optional)* `./docs/ai/error-playbook.md` — common fixes for known build/runtime issues  

If any file is missing, fetch from the `/docs/ai/` root or fallback templates.

---

## Step 2 — Reactivate and Verify MCP Servers
Ensure all MCP servers are active and healthy:

| MCP Server | Function | Health Check |
|-------------|-----------|--------------|
| **Playwright MCP** | Automated browser testing, screenshots, smoke & E2E tests | ✅ `browser_navigate`, `browser_click`, `browser_take_screenshot` |
| **Context7 MCP** | Fetches official library docs and version validation | ✅ Verify Next.js / React Query / Supabase docs fetched |
| **Vibe-Check MCP** | Enforces tone, brand, and compliance in copy | ✅ `check_constitution` returns active |
| **Supabase MCP** | Database + Auth + RLS inspection | ✅ `db_list_tables`, `auth_check` succeed |
| **Browser Automation MCP (ChromeDev)** | Ad-hoc Chrome control for fast web debugging | ✅ “Ready (Chrome detected)” appears |

> ⚠️ If any fails → run Auto-Repair Mode (below).

---

## Step 3 — Reindex Repository Context
- Rebuild repo index and dependency tree  
- Reload `.cursor/mcp.json` and `.env`  
- Detect Supabase credentials and validate schema  
- Confirm Chrome is reachable via `browser_evaluate("navigator.userAgent")`  

This syncs Claude’s reasoning with live code, DB, and browser state.

---

## Step 4 — Initialize Supabase Context
> “Connect Supabase MCP using credentials in `.env`.  
> List all schemas, tables, and RLS policies.  
> Cache structure for reasoning and confirm `[Supabase Ready ✅]`.”

Claude now understands table relations, indexes, and restricted access paths.

---

## Step 5 — Initialize Browser Automation Context
> “Activate Browser Automation MCP (ChromeDev).  
> Confirm navigation, screenshot, and console tools available.  
> Return `[Browser Automation Ready ✅]`.”

**Default artifact locations:**
- Screenshots → `/artifacts/browser/{route}.png`  
- Console logs → `/artifacts/browser/{route}-console.md`  
- Network data → `/artifacts/browser/{route}-network.md`

---

## Step 6 — Confirmation Command
Run:
> “List all loaded docs and active MCP servers.”

Expected output:
Loaded docs: cursor.md, claude.md, system.md, vibe.md
Active MCP: Playwright ✅ Context7 ✅ Vibe-Check ✅ Supabase ✅ Browser Automation ✅
Status: [Context Ready 🧩]

yaml
Copy code

---

## Step 7 — Operational Mode
Once context is ready:
- Use MCP tools automatically (no need to type “mcp”)  
- Apply repo rules in `cursor.md`  
- Run **Playwright** for automated tests, **Browser Automation** for fast probes  
- Cross-verify API/library usage with **Context7**  
- Enforce brand/tone rules via **Vibe-Check**  
- Validate DB operations through **Supabase MCP**  
- Propose diffs — **never auto-apply without explicit approval**

---

## 🧪 One-Command Web Audit
Task: Run a layered audit before merging.

A) Browser Automation MCP

Smoke test / , /pricing , /signup

Artifacts: screenshots, console, network reports → /artifacts/browser/

Output: browser-report.md

B) Playwright MCP

E2E: login → dashboard → billing → logout

Output: e2e-report.md

C) Context7

Validate library usage (next, react-query, supabase-js)

Output: api-usage-check.md

D) Supabase MCP

Inspect RLS + missing indexes

Output: db-health.md

E) Vibe-Check MCP

Tone compliance audit on marketing copy

Output: vibe-report.md

Final Output → premerge-report.md summarizing issues (High/Med/Low) with artifact links.

yaml
Copy code

---

## 🛠️ Auto-Repair Mode (Failsafe)
If any system fails to initialize:
1. “Re-scan MCP servers and re-register missing ones.”  
2. “Reindex project and reload `.cursor/mcp.json`.”  
3. “Reconnect Supabase MCP and regenerate schema cache.”  
4. “Restart Browser Automation MCP (ChromeDev).”  
5. If still failing → clear `.cursor/cache` → restart Cursor → rerun Boot Context.

---

✅ **Success Message**
> “System Context Initialized — Claude Ready.  
> Active MCP: Playwright ✅ Context7 ✅ Vibe-Check ✅ Supabase ✅ Browser Automation ✅”