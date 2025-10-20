# ⚙️ MCP-Config.md — Managed Compute Protocol Registry

## Purpose
Maintain a reference of all MCP servers, their commands, and validation rules.

---

## Active MCP Servers
| MCP | Function | Validation Command |
|------|-----------|-------------------|
| Playwright MCP | End-to-end UI testing | `browser_navigate("about:blank")` |
| Browser Automation MCP | Chrome debugging, console logs | `browser_evaluate("navigator.userAgent")` |
| Supabase MCP | Schema + RLS inspection | `db_list_tables()` |
| Context7 MCP | Library documentation fetch | `resolve-library-id()` |
| Vibe-Check MCP | Tone and copy enforcement | `check_constitution()` |

---

## Standard Directories
- `/artifacts/browser/` — screenshots and network logs  
- `/artifacts/e2e/` — Playwright test outputs  
- `/artifacts/db/` — schema snapshots  
- `/artifacts/reports/` — QA and ops summaries

---

## Refresh Routine
1. Run **Boot Context** to verify connectivity.  
2. Use **Auto-Repair** if any MCP fails.  
3. Log health results in `ai-ops.md` daily report.

---

## MCP Version Policy
- Always use latest minor version.  
- Patch versions can auto-upgrade.  
- Log major version changes in `decision-log.md`.

---

✅ **MCP Configuration Loaded**