# 📚 Knowledge-Base.md — Persistent AI Reference

## Purpose
Maintain a structured repository of recurring facts, commands, and project-wide knowledge.

---

## Section 1 — Core Commands
| Action | Command | Notes |
|---------|----------|-------|
| Build | `pnpm run build` | Preferred for all environments |
| Test | `pnpm test` | Runs unit + integration tests |
| Lint | `pnpm lint` | Enforces Prettier + ESLint |
| Start Dev Server | `pnpm dev` | Local development mode |
| Schema Check | `pnpm supabase db diff` | Compare local vs remote schema |

---

## Section 2 — MCP Operations
| MCP | Purpose | Trigger Doc |
|------|----------|-------------|
| Playwright MCP | E2E automation | premerge-report.md |
| Browser Automation MCP | Smoke test, console capture | boot-context.md |
| Supabase MCP | Database checks | ai-ops.md |
| Context7 MCP | Library validation | prompt-library.md |
| Vibe-Check MCP | Tone and copy compliance | vibe.md |

---

## Section 3 — Conventions
- Always use pnpm for installs and builds.  
- Store all environment variables in `.env.local`.  
- Save audit artifacts under `/artifacts/`.  
- Commit docs only after human or AI Ops review.  

---

## Section 4 — Reference Notes
- Boot Context ensures consistency between all MCPs.  
- Auto-Repair restores environment if desynced.  
- Vibe-Check maintains consistent tone and professionalism.  
- Memory-Architecture ensures decisions persist beyond sessions.

---

✅ **Knowledge Base Loaded**