# 🔗 External-Integrations.md — Third-Party Service Directory

## Purpose
Describe all external services connected to the environment so AI agents can interact safely and predictably.

---

## Connected Services

### OpenAI API
- Purpose: AI reasoning and assistant capabilities.  
- Keys: stored in `.env.local`.  
- SDK: `openai` and `vercel ai sdk`.  
- Usage: model calls, embedding generation, text analysis.

### Vercel Platform
- Purpose: Frontend hosting and serverless deployment.  
- Integration: Git auto-deploy on `main` merge.  
- Logs accessible via Vercel Dashboard.

### Supabase
- Purpose: Database and auth management.  
- Directly connected to Supabase MCP.  
- Schema recorded in `supabase-schema.md`.

### Resend or SendGrid
- Purpose: Transactional email delivery.  
- Optional integration for notification systems.  
- Configurable through `.env`.

### Twilio (SMS)
- Purpose: User notification and multi-factor auth.  
- Keys in secure environment variables.

---

## Security Practices
- All secrets stored in `.env.local`, never in code.  
- Rotate API keys every 90 days.  
- Restrict write access for AI agents to read-only unless approved manually.

---

## Audit Policy
- List all integrations in this file.  
- Update whenever a new third-party service is added or removed.  
- Log reason and impact in `decision-log.md`.

---

✅ **External Integrations Cataloged**
