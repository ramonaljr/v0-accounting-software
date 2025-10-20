# 💥 Error Playbook — Common Issues & Rapid Fixes

## Purpose
Serve as a lightweight internal knowledgebase for resolving recurring errors in builds, integrations, and MCP operations.

---

## Build & Dependency
| Error | Likely Cause | Recommended Fix |
|--------|---------------|-----------------|
| Module not found | Missing dependency or workspace link | Run `pnpm install` |
| TS2307 | Missing type declarations | `pnpm add -D @types/<library>` |
| Import alias errors | Incorrect `tsconfig.json` paths | Verify alias mapping |

---

## MCP Connectivity
| Error | Cause | Solution |
|--------|--------|-----------|
| MCP server timeout | Version mismatch | `pnpm dlx <mcp-package>@latest` |
| Playwright MCP not detected | Missing binary | `pnpm playwright install` |
| Supabase schema drift | Cloud vs local mismatch | `pnpm supabase db diff` then sync |
| Browser MCP fails | Chrome not detected | Launch with `--remote-debugging-port=9222` |

---

## Runtime & Network
| Issue | Description | Action |
|--------|-------------|---------|
| ECONNRESET | Network timeout | Retry or switch network |
| 500 Internal Error | Unhandled server exception | Check server logs via Browser Automation MCP |
| API mismatch | Outdated endpoint or schema | Validate with Context7 MCP |

---

## AI Context
| Issue | Cause | Remedy |
|--------|--------|--------|
| Context lost after restart | New chat or session | Re-execute Boot Context |
| Inconsistent reasoning | Outdated docs | Force reread all `/docs/ai/*.md` files |
| Incorrect tone or phrasing | Missing vibe.md | Reload Vibe Constitution |

---

✅ **Error Playbook Ready for Use**
