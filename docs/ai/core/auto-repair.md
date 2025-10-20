# 🧰 Auto-Repair Mode — AI System Self-Healing Protocol (pnpm Edition)

## Purpose
Provide a repeatable, AI-executed recovery sequence for:
- Failed or desynced MCP servers  
- Broken Supabase / Chrome connections  
- Stale project cache or schema drift  
- Missing AI system docs in /docs/ai/

Triggered automatically when Boot Context fails initialization.

---

## Step 1 — Verify Core AI Docs
> “Check presence of all required docs:
cursor.md, claude.md, system.md, vibe.md, prompt-library.md, boot-context.md, auto-repair.md.  
If missing, restore from `/docs/ai/templates/` or the latest backup branch.”

If still missing after restore, generate skeletons using default templates.

---

## Step 2 — MCP Health Sweep
Sequentially verify and repair MCP servers:

| MCP | Health Check | Auto-Repair Command |
|------|---------------|--------------------|
| **Playwright MCP** | `browser_navigate("about:blank")` | `pnpm dlx @playwright/mcp@latest` |
| **Context7 MCP** | `resolve-library-id` | `pnpm dlx @upstash/context7-mcp@latest` |
| **Vibe-Check MCP** | `check_constitution` | `pnpm --filter vibe-check-mcp-server build` |
| **Supabase MCP** | `db_list_tables` | `pnpm --filter supabase-mcp-server build` |
| **Browser Automation (ChromeDev)** | `browser_evaluate("navigator.userAgent")` | Relaunch Chrome with `--remote-debugging-port=9222` |

If multiple MCPs fail:  
> Delete `.cursor/mcp-lock.json` then rerun Boot Context.

---

## Step 3 — Supabase Regeneration
> “Reconnect Supabase MCP using `.env` credentials.  
Regenerate schema cache and compare against `supabase/schema.sql`.  
If mismatch > 5%, dump live schema to `/artifacts/db/snapshot.sql` and create migration diff.”

Then re-index local cache with:
```bash
pnpm supabase db dump --db-url $SUPABASE_URL --file ./artifacts/db/schema-latest.sql
Step 4 — ChromeDev / Browser Recovery
“Restart Browser Automation MCP.
If Chrome is not detected, relaunch with:
chrome.exe --remote-debugging-port=9222
or
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222”

If connection still fails:

Delete .cursor/mcp.json entry for Browser Automation

Re-add via Boot Context re-scan

## Step 5 — Cache & Index Rebuild
bash
Copy code
rm -rf .cursor/cache .cursor/index
pnpm install --prefer-offline
“Reindex repository, reread all /docs/ai/ markdowns, and reload environment variables from .env.”

Expected confirmation:

[Cache Rebuilt ✅] [Docs Reloaded ✅] [MCP Registry Updated ✅]

## Step 6 — Diagnostics Summary
Generate a Markdown report:

yaml
Copy code
# Auto-Repair Report
Date: {{timestamp}}
MCPs Fixed: [List]
Docs Restored: [List]
Supabase Schema Regenerated: [Yes/No]
Browser Reattached: [Yes/No]
Status: [✅ All Systems Restored | ⚠️ Manual Action Required]
Save as /artifacts/auto-repair-report.md.

## Step 7 — Post-Repair Validation
Immediately run:

“Execute Boot Context sequence.”

Expected output:

mathematica
Copy code
System Context Initialized — Claude Ready.
Active MCP: Playwright ✅ Context7 ✅ Vibe-Check ✅ Supabase ✅ Browser Automation ✅
🧩 Emergency Manual Fallback (if automation fails)
bash
Copy code
pnpm dlx @playwright/mcp@latest
pnpm dlx @upstash/context7-mcp@latest
pnpm --filter vibe-check-mcp-server build
pnpm --filter supabase-mcp-server build
Then:

bash
Copy code
rm -rf .cursor
pnpm install
Restart Cursor → run Boot Context again.

✅ Success Criteria
Once all MCPs and docs validate, respond:

“Auto-Repair complete — System Context Restored 🧠💪”

yaml
Copy code

---

## 🔗 Integration Instructions
In your `boot-context.md`, append this line near the end:

```md
If Boot Context initialization or any MCP health check fails,
automatically execute `/docs/ai/auto-repair.md` (pnpm edition).