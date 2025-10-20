# 🌐 API-Map.md — Endpoint and Contract Reference

## Purpose
Provide a clear index of all backend and frontend API routes so AI agents can generate or validate code correctly.

---

## Public REST Endpoints
| Route | Method | Purpose |
|--------|---------|----------|
| /api/auth/signup | POST | Register new user |
| /api/auth/login | POST | Authenticate and return token |
| /api/user/profile | GET | Retrieve profile |
| /api/projects | GET | List all projects |
| /api/projects | POST | Create new project |
| /api/projects/{id} | PATCH | Update project |
| /api/projects/{id} | DELETE | Archive project |

---

## Supabase Functions (Edge)
| Function | Purpose |
|-----------|----------|
| handle_webhook | Process external triggers |
| calculate_metrics | Run background computations |
| sync_reports | Update analytics dashboards |

---

## Authentication
- Supabase Auth JWT required for all private routes.  
- Tokens passed via `Authorization: Bearer <jwt>` header.  
- Frontend automatically refreshes via Supabase client.

---

## Rate Limits
- Standard API: 100 req/min per user  
- Edge Functions: 50 req/min per user

---

## Error Conventions
Return format:
{ "error": true, "message": "description", "code": "ERR_CODE" }

yaml
Copy code

---

## Versioning
- Base: `/api/v1`  
- Future: `/api/v2` for breaking changes

---

✅ **API Map Indexed**