# 🚀 Deployment.md — Production Release Protocol

## Purpose
Provide a repeatable, AI-driven deployment guide for consistent releases  
using Vercel (front-end) and Supabase (back-end).

---

## Prerequisites
- Boot Context executed successfully.  
- All MCP servers active and healthy.  
- Pre-Merge Report status: ✅ Ready to Merge.  
- Supabase URL and Anon Key loaded from `.env`.

---

## Step 1 — Build
Run:
1. `pnpm install --prefer-offline`  
2. `pnpm run build`  
3. Verify `out/` and `.next/` artifacts exist.  

Output: `build-report.md`

---

## Step 2 — Database Sync
- Run `pnpm supabase db diff` to confirm no pending migrations.  
- Apply schema only after approval.  
- Generate `db-migration-summary.md` with diff details.  

---

## Step 3 — Vercel Deployment
- Confirm environment variables in Vercel Dashboard.  
- Deploy via `vercel --prod`.  
- Save deployment logs to `/artifacts/deployment/`.  

---

## Step 4 — Verification
- Run Browser Automation MCP to validate live routes.  
- Capture console logs and network metrics.  
- Output `post-deploy-report.md`.  

---

## Step 5 — Rollback Procedure
If deployment fails:  
1. Revert to last commit tagged `stable`.  
2. Redeploy previous build artifact.  
3. Notify Ops via `incident-report.md`.  

---

## Step 6 — Post-Deployment Checklist
| Check | Status |
|--------|--------|
| DNS and SSL active | ✅ / ❌ |
| API endpoints responding | ✅ / ❌ |
| Database migrations clean | ✅ / ❌ |
| App monitoring active | ✅ / ❌ |
| Error rate < 2 % | ✅ / ❌ |

---

✅ **Deployment Completed Successfully**
