# 📘 Decision-Log.md — Engineering and Strategy Journal

## Purpose
Record rationale, trade-offs, and conclusions from major technical or operational decisions.

---

## Format
Each entry should include:
- **Date**
- **Decision Title**
- **Context**
- **Options Considered**
- **Decision Made**
- **Reasoning**
- **Impact Level**
- **Follow-Up Actions**

---

## Example Entry
**Date:** 2025-10-10  
**Decision:** Adopt pnpm as the package manager  
**Context:** npm install times and lock-file conflicts causing delays.  
**Options:**  
1. npm  
2. yarn  
3. pnpm  
**Decision:** pnpm selected for deterministic installs.  
**Reasoning:** 40% faster installs, better workspace linking, easier MCP script control.  
**Impact Level:** High  
**Follow-Up:** Update all build scripts and docs.

---

## Logging Policy
- Every major change must be logged.  
- AI may summarize past 10 entries for contextual recall.  
- Logs older than 6 months move to `archive/decision-history.md`.

---

✅ **Decision Journal Active**