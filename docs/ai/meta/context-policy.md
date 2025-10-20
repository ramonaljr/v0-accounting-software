# 🧭 Context-Policy.md — Context Management and Access Rules

## Purpose
Define how AI systems access, cache, and expire contextual knowledge to maintain performance and privacy.

---

## Context Layers
| Layer | Lifespan | Purpose |
|--------|-----------|----------|
| Ephemeral | Session | Scratch reasoning and logs |
| Short-term | Sprint / Feature | Temporary memory for active tasks |
| Long-term | Persistent | Docs in `/docs/ai/` and archived knowledge |

---

## Access Control
- Agents can **read** any `.md` in `/docs/ai/`.  
- Agents can **write only** to designated output directories (`/artifacts/`, `/reports/`).  
- Personal or confidential data must never be cached in plain text.

---

## Context Refresh
At startup (Boot Context):
1. Flush ephemeral cache.  
2. Reload `/docs/ai/core/`, `/ai/creative/`, `/ai/integrations/`.  
3. Log context checksum in `audit-history.md`.  

---

## Expiration Rules
- Ephemeral: destroy on session close.  
- Short-term: purge after 14 days of inactivity.  
- Long-term: archive after 90 days if unchanged.  

---

## Security
All context exchanges between MCPs must use authenticated local channels.  
No API keys or tokens stored in memory beyond session scope.

---

✅ **Context Policy Enforced**
