# 🧠 Prompt Library — Standardized Prompt Collection

## Purpose
Reusable prompts for AI-assisted workflows in Cursor and Claude Code.  
All outputs should be Markdown or unified diffs. Do not auto-apply changes unless explicitly approved.

---

## Development Prompts

### Code Review
Perform a structured code review:
- Identify logic, typing, and performance issues
- Flag security or data-leak risks
- Propose minimal diffs (do not apply)
- Summarize findings by priority (High/Med/Low)

### Build Audit
Run a complete build inspection:
- Detect compilation/import/dependency errors
- Recommend pnpm commands to resolve
- Group results: blockers, warnings, cleanup
- Output a concise Markdown report

### UI Optimization
Audit the UI layer:
- Ensure accessibility and responsiveness
- Suggest Shadcn/Untitled UI components where helpful
- Reduce layout shift and initial payload
- Provide a small diff plan (do not apply)

### Performance Profiling (App)
Profile hot paths:
- Identify expensive renders, large bundles, and N+1 calls
- Recommend code-splitting and memoization targets
- Output specific next actions with estimated impact

### Refactor With Safety
Before any refactor:
- List affected files and risks
- Show a rollback plan
- Provide a single, minimal diff proposal (do not apply)

---

## QA & MCP Prompts

### Pre-Merge Checklist (Unified)
Run coordinated MCP tasks and output `premerge-report.md`:
1. Playwright MCP → E2E happy path
2. Browser Automation MCP → screenshots, console, network summary
3. Supabase MCP → schema integrity + RLS spot check
4. Context7 MCP → verify library usage vs installed versions
5. Vibe-Check MCP → tone/compliance on user-visible copy

### Smoke Test (Browser Automation)
Run a 3-route smoke on `/`, `/pricing`, `/signup`:
- Save screenshots to `/artifacts/browser/`
- Collect console errors and slow/failed requests
- Return a Markdown table with links to artifacts

### E2E Path (Playwright)
Validate: login → dashboard → billing → logout
- Use stable `data-testid` selectors (propose if missing)
- Attach screenshots and a short summary of failures

### Supabase Schema Guard
- List tables, relationships, and RLS for critical flows
- Flag missing indexes and potential slow queries
- Provide a minimal migration plan (do not apply)

### Library Doc Check (Context7)
- Fetch docs for Next.js, React Query, and Supabase matching `package.json`
- Confirm our API usage and list discrepancies
- Provide references and small code corrections (diff only)

### Tone & Compliance (Vibe-Check)
- Scan marketing/onboarding copy
- Enforce rules from `vibe.md`
- Propose precise rewrites, grouped by severity

---

## Operational Utilities

### Session Warm-Up
Reread:
- `/docs/ai/cursor.md`
- `/docs/ai/claude.md`
- `/docs/ai/system.md`
- `/docs/ai/vibe.md`
- `/docs/ai/prompt-library.md`
- `/docs/ai/boot-context.md`

Confirm active MCP: Playwright, Browser Automation, Supabase, Context7, Vibe-Check.

### Auto-Repair Trigger
If Boot Context or any MCP fails, execute:
`/docs/ai/auto-repair.md`

---

✅ **Prompt Library Synchronized**
