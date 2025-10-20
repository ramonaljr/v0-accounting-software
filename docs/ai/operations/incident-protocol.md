# 💻 System-Health.md — Runtime Status and Diagnostic Overview

## Purpose
Provide ongoing visibility into system integrity, MCP stability, and AI performance.  
Used to detect degradation early and trigger the incident protocol if needed.

---

## Health Checks
| Service | Metric | Threshold | Status |
|----------|----------|------------|----------|
| Cursor IDE | Response time | < 2s | ✅ |
| Claude Code | Context load success | > 95% | ✅ |
| Supabase | DB latency | < 200ms | ✅ |
| Browser MCP | Headless run success | > 90% | ✅ |
| Playwright MCP | Test completion rate | 100% | ✅ |
| Vibe-Check MCP | Content pass rate | > 95% | ✅ |

---

## Memory Usage
| Component | Avg Memory | Peak | Notes |
|------------|-------------|------|-------|
| Cursor Session |  |  |  |
| Claude Context |  |  |  |

---

## Error Frequency
| Type | Count | Trend |
|-------|--------|--------|
| Build Failures |  |  |
| Timeout Errors |  |  |
| API Errors |  |  |

---

## AI System Integrity
- Boot Context validation: ✅  
- MCP heartbeat response: ✅  
- Model coherence: stable  
- Token usage: optimal  

---

## Recommendations
- Clean cache weekly.  
- Run `auto-repair.md` if any MCP returns timeout > 5s.  
- Verify Supabase indexes monthly.

---

✅ **System Health Nominal**
