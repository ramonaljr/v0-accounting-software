# 🧩 Supabase-Schema.md — Database Structure Reference

## Purpose
Document the logical structure, relationships, and policies of the Supabase database so AI agents can reason about data safely.

---

## Core Schema Overview
**Database:** PostgreSQL (managed by Supabase)  
**Primary Schemas:** `public`, `auth`, `storage`

---

## Example Tables
### users
- id (uuid, pk)  
- email (text, unique)  
- role (text)  
- created_at (timestamp)

### organizations
- id (uuid, pk)  
- name (text)  
- owner_id (uuid → users.id)  
- created_at (timestamp)

### projects
- id (uuid, pk)  
- organization_id (uuid → organizations.id)  
- name (text)  
- status (enum: active | archived | draft)  
- created_at (timestamp)

---

## Relationships
- One User → Many Organizations  
- One Organization → Many Projects  
- Foreign-key constraints enforced

---

## Row-Level Security
- Enabled on all tables.  
- `users`: self-access only.  
- `organizations`: members with valid foreign key in join table.  
- `projects`: restricted by organization membership.

---

## Indexing
- Index all foreign keys.  
- Add `created_at` index for ordering.  
- Maintain full-text index for search-driven endpoints.

---

## Migration Policy
1. Create SQL migration file under `/supabase/migrations/`.  
2. Commit migration summary in `decision-log.md`.  
3. Run `pnpm supabase db push` only after AI review and approval.

---

✅ **Supabase Schema Context Ready**