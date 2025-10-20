# 🔄 Update-Protocol.md — System Change and Version Control Process

## Purpose
Standardize how updates to documentation, configuration, or AI behavior are proposed, tested, and deployed.

---

## Change Pipeline
1. **Proposal** → create update summary in `/proposals/<date>-<topic>.md`.  
2. **Review** → AI Ops + Human Owner evaluate impact and risk.  
3. **Testing** → Run `premerge-report.md` suite.  
4. **Approval** → Log decision in `decision-log.md`.  
5. **Merge** → Commit changes and regenerate affected indexes.  

---

## Semantic Versioning
`MAJOR.MINOR.PATCH`

| Type | Trigger | Example |
|-------|----------|----------|
| Major | Breaking schema or workflow changes | 2.0.0 |
| Minor | New feature or module | 1.2.0 |
| Patch | Fix or correction | 1.1.5 |

Each version must update the header in affected `.md` files.

---

## Notification Flow
- Successful updates → logged to `audit-history.md`  
- Critical errors → auto-notify AI Ops  
- Major releases → broadcast in Weekly Ops Report

---

## Emergency Rollback
1. Revert to last known stable commit.  
2. Restore associated `artifacts/backup/` data.  
3. Annotate rollback cause and timestamp in `audit-history.md`.

---

✅ **Update Protocol Operational**
