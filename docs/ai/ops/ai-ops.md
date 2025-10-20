# ⚙️ AI-Ops.md — Automation & Maintenance Protocols

## Purpose
Define how automated AI routines maintain the workspace, MCP health, and build integrity.

---

## Daily Tasks
- Run Boot Context and MCP Health Sweep.  
- Execute Playwright smoke tests.  
- Validate Supabase schema and RLS.  
- Check Vercel and Supabase connection health.  
- Generate `daily-ops-report.md` with results.

---

## Weekly Tasks
- Reinstall all MCP servers using latest stable versions.  
- Run full dependency upgrade via `pnpm update --latest`.  
- Clear `.cursor/cache` and regenerate context indexes.  
- Validate lint and format consistency.  
- Produce `weekly-integrity-report.md`.

---

## Monthly Tasks
- Full security audit of Supabase RLS and environment variables.  
- Schema backup to `/artifacts/db/backup-<date>.sql`.  
- Run long-form Browser Automation audit of key routes.  
- Review Vibe-Check metrics and adjust copy tone guidance.

---

## Incident Response
If MCP failure detected:  
1. Run `/docs/ai/auto-repair.md`.  
2. Rebuild environment via Boot Context.  
3. Generate `incident-report.md` with timestamps and fixes applied.

---

## Artifacts Directory
| Category | Path |
|-----------|------|
| Browser Logs | `/artifacts/browser/` |
| E2E Results | `/artifacts/e2e/` |
| Database Schema | `/artifacts/db/` |
| Reports | `/artifacts/reports/` |

---

✅ **AI-Ops Routine Initialized**
