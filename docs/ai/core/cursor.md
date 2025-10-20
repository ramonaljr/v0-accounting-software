# ⚙️ Cursor.md — Repository Intelligence Constitution

## Purpose
Define Cursor’s behavioral rules, repository context, and AI workflow standards.  
This file governs **how Cursor, Claude, and connected MCP servers interact** with the workspace.

---

## Environment Overview
**Stack:** Next.js • TypeScript • Supabase • LangGraph • Vercel  
**Workflow Manager:** Cursor IDE (pnpm-based)  
**AI Agents:** GPT-5 • Claude • DeepSeek  

---

## AI Behavioral Rules
- Always **propose diffs**, never auto-apply unless explicitly approved.  
- Prioritize **build integrity**, **performance**, and **clarity of code**.  
- Default to **pnpm** commands for installs and builds.  
- Maintain consistent formatting (Prettier + ESLint).  
- Use **Playwright MCP** for end-to-end testing.  
- Enforce tone and compliance standards defined in `vibe.md`.  

---

## Context Awareness
Cursor automatically loads:
- `/docs/ai/boot-context.md`  
- `/docs/ai/claude.md`  
- `/docs/ai/system.md`  
- `/docs/ai/vibe.md`  
- `/docs/ai/prompt-library.md`  
- `/docs/ai/error-playbook.md`

If missing, execute `/docs/ai/auto-repair.md`.

---

## Code Generation Rules
- Write modular, well-documented TypeScript.  
- Prefer async/await syntax.  
- Avoid hard-coded credentials or secrets.  
- Include inline explanations for complex logic.  

---

## Testing Workflow
- **Playwright MCP** → structured tests  
- **Browser Automation MCP** → quick runtime checks  
- **Supabase MCP** → schema validation  

---

## Version Control Standards
- Branch naming: `feat/`, `fix/`, `chore/`, `refactor/`  
- Commit style: short, imperative (e.g., `Fix login redirect`)  
- Tag releases semantically: `v1.0.0`  

---

✅ **End of Cursor Constitution**