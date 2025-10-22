# OpportunityOS - Deployment & Testing Guide

**Status:** Phase 0-18 Complete ✅
**Build:** Passing (14.8s, ZERO ERRORS)
**Last Updated:** 2025-01-22

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (recommended: 20+)
- pnpm 8+
- Supabase CLI
- OpenAI API key
- Git

### Local Development Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd v0-accounting-software

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY

# 4. Start development server
pnpm dev

# Open http://localhost:3000
```

---

## 📦 Supabase Setup

### 1. Create Supabase Project

```bash
# Login to Supabase
supabase login

# Link to existing project
supabase link --project-ref <your-project-ref>

# OR create new project
supabase init
```

### 2. Run Database Migrations

```bash
# Run all migrations in order
supabase db push

# Verify migrations
supabase db diff --use-migra
```

**Migration Order:**
1. `20250120000000_initial_schema.sql` - Core database schema
2. `20250122000000_add_ai_insights.sql` - AI insights table
3. `20250122000001_add_agent_feedback.sql` - Agent feedback system
4. `20250122000002_configure_pg_cron.sql` - Scheduled jobs setup

### 3. Seed Sample Data (Optional)

```bash
# Load sample data for testing
supabase db execute -f supabase/seed.sql

# Verify seed data
supabase db execute -c "SELECT COUNT(*) FROM organizations;"
supabase db execute -c "SELECT COUNT(*) FROM bank_transactions WHERE needs_review = true;"
```

**Sample Data Includes:**
- 2 demo organizations (Acme Corp, Tech Startup)
- Complete chart of accounts (20+ accounts)
- 2 bank accounts
- 20 bank transactions for AI categorization testing
- 3 vendors and 2 customers
- Sample journal entries for reconciliation

### 4. Configure pg_cron (Production Only)

**Note:** pg_cron requires superuser privileges. On Supabase, configure via Dashboard:

1. Navigate to **Database > Cron Jobs** in Supabase Dashboard
2. Create the following jobs (or run migration `20250122000002_configure_pg_cron.sql`):

| Job Name                    | Schedule   | Function URL                           | Description                    |
|-----------------------------|------------|----------------------------------------|--------------------------------|
| daily-fx-rate-update        | 0 1 * * *  | /functions/v1/nightly-fx-rates         | Daily FX rate updates (1 AM)   |
| nightly-anomaly-detection   | 0 2 * * *  | /functions/v1/nightly-anomaly-detection| Anomaly detection (2 AM)       |
| nightly-ai-categorization   | 0 3 * * *  | /functions/v1/nightly-categorization   | AI categorization (3 AM)       |
| daily-bank-feed-sync        | 0 4 * * *  | /functions/v1/daily-bank-sync          | Bank feed sync (4 AM)          |
| weekly-reconciliation       | 0 5 * * 0  | /functions/v1/weekly-reconciliation    | Weekly reconciliation (Sun 5AM)|

**Alternative:** Run SQL migration directly in Supabase SQL Editor:
```sql
-- Copy contents of supabase/migrations/20250122000002_configure_pg_cron.sql
-- Paste and execute in Supabase SQL Editor
```

### 5. Deploy Edge Functions

```bash
# Deploy all Edge Functions
supabase functions deploy nightly-categorization
supabase functions deploy nightly-anomaly-detection
supabase functions deploy nightly-fx-rates
supabase functions deploy daily-bank-sync
supabase functions deploy weekly-reconciliation

# Set environment variables for functions
supabase secrets set OPENAI_API_KEY=<your-key>
supabase secrets set NEXT_APP_URL=https://your-app.vercel.app

# Verify deployment
supabase functions list
```

---

## 🏗️ Production Deployment

### Vercel (Recommended)

```bash
# 1. Install Vercel CLI
pnpm add -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Set environment variables in Vercel Dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY

# 5. Deploy to production
vercel --prod
```

### Alternative Platforms

#### Netlify
```bash
netlify init
netlify env:set NEXT_PUBLIC_SUPABASE_URL <value>
netlify env:set OPENAI_API_KEY <value>
netlify deploy --prod
```

#### Docker
```bash
docker build -t opportunity-os .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=<url> \
  -e OPENAI_API_KEY=<key> \
  opportunity-os
```

---

## 🧪 Testing AI Workflows

### 1. Test AI Categorization

**Manual Test:**
```bash
# 1. Seed sample data
supabase db execute -f supabase/seed.sql

# 2. Navigate to http://localhost:3000/accounting/bank-transactions

# 3. You should see ~20 uncategorized transactions

# 4. Click "Auto-Categorize" button

# 5. Watch AI categorize transactions in real-time

# 6. Verify:
#    - Transactions with confidence ≥90% are auto-approved
#    - Transactions with confidence <90% are queued for review
```

**API Test:**
```bash
# Call categorization API directly
curl -X POST http://localhost:3000/api/ai/categorize \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "<transaction-uuid>",
    "description": "GOOGLE WORKSPACE",
    "merchantName": "Google",
    "amount": -30.00,
    "orgId": "00000000-0000-0000-0000-000000000001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accountId": "uuid-of-software-expense-account",
    "accountCode": "6300",
    "accountName": "Software Subscriptions",
    "confidence": 0.95,
    "reasoning": "This appears to be a software subscription expense..."
  }
}
```

### 2. Test Reconciliation

**Manual Test:**
```bash
# 1. Ensure journal entries exist
supabase db execute -c "SELECT * FROM journal_entries WHERE org_id = '00000000-0000-0000-0000-000000000001';"

# 2. Navigate to http://localhost:3000/accounting/reconcile

# 3. Select bank account and date range

# 4. Click "Auto-Reconcile"

# 5. Verify:
#    - Matches with confidence ≥95% are auto-approved
#    - Lower confidence matches queued for review
```

**API Test:**
```bash
curl -X POST http://localhost:3000/api/ai/reconcile \
  -H "Content-Type: application/json" \
  -d '{
    "bankTransaction": {
      "id": "<transaction-uuid>",
      "date": "2025-01-15",
      "description": "STRIPE TRANSFER",
      "amount": 4500.00,
      "merchantName": "Stripe"
    },
    "ledgerEntries": [
      {
        "id": "<entry-uuid>",
        "date": "2025-01-15",
        "description": "Customer payment",
        "amount": 4500.00,
        "accountCode": "1010",
        "accountName": "Cash - Operating"
      }
    ],
    "accountId": "<bank-account-uuid>",
    "orgId": "00000000-0000-0000-0000-000000000001"
  }'
```

### 3. Test Anomaly Detection

**Trigger Edge Function:**
```bash
# Call nightly anomaly detection manually
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/nightly-anomaly-detection \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"timestamp": "2025-01-22T02:00:00Z"}'
```

**Expected Response:**
```json
{
  "success": true,
  "orgsProcessed": 2,
  "totals": {
    "critical": 2,
    "warnings": 5,
    "info": 3
  },
  "results": [
    {
      "orgId": "00000000-0000-0000-0000-000000000001",
      "orgName": "Acme Corp Demo",
      "critical": 1,
      "warnings": 3,
      "info": 2
    }
  ]
}
```

**Verify Insights Created:**
```bash
supabase db execute -c "
  SELECT
    agent_type,
    severity,
    confidence,
    title,
    description
  FROM ai_insights
  WHERE org_id = '00000000-0000-0000-0000-000000000001'
  ORDER BY created_at DESC
  LIMIT 10;
"
```

### 4. Test Feedback Learning

**Submit Feedback:**
```bash
# User rejects AI categorization and provides correct account
# This automatically stores feedback in agent_feedback table

# Verify feedback stored:
supabase db execute -c "
  SELECT
    agent_type,
    feedback_type,
    was_helpful,
    original_suggestion,
    user_correction
  FROM agent_feedback
  WHERE org_id = '00000000-0000-0000-0000-000000000001'
  ORDER BY created_at DESC;
"
```

### 5. Test Explainability

**Manual Test:**
```bash
# 1. Generate some AI insights (via anomaly detection or categorization)

# 2. Navigate to http://localhost:3000/ai/explain/<insight-id>

# 3. Verify:
#    - Multi-step reasoning displayed
#    - Confidence score shown
#    - Affected transactions listed
#    - AI recommendation provided
```

---

## 📊 Monitoring & Observability

### pg_cron Job Monitoring

```sql
-- View recent cron job executions
SELECT * FROM recent_cron_jobs ORDER BY started_at DESC LIMIT 20;

-- Check job health
SELECT
  job_name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_runs,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
  AVG(execution_time_ms) as avg_execution_time_ms
FROM cron_job_logs
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY job_name;

-- View errors
SELECT
  job_name,
  started_at,
  error_details
FROM cron_job_logs
WHERE status = 'failed'
ORDER BY started_at DESC
LIMIT 10;
```

### AI Performance Metrics

```sql
-- Categorization accuracy (based on feedback)
SELECT
  agent_type,
  COUNT(*) as total_feedback,
  SUM(CASE WHEN was_helpful = true THEN 1 ELSE 0 END) as helpful_count,
  ROUND(
    100.0 * SUM(CASE WHEN was_helpful = true THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as accuracy_percent
FROM agent_feedback
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY agent_type;

-- Reconciliation auto-approval rate
SELECT
  COUNT(*) as total_matches,
  SUM(CASE WHEN auto_approved = true THEN 1 ELSE 0 END) as auto_approved_count,
  ROUND(
    100.0 * SUM(CASE WHEN auto_approved = true THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as auto_approval_rate
FROM reconciliation_matches
WHERE created_at > NOW() - INTERVAL '30 days';

-- Anomaly detection insights
SELECT
  severity,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence
FROM ai_insights
WHERE agent_type = 'anomaly'
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY severity;
```

### OpenAI Cost Tracking

```sql
-- View AI agent costs (if agent_runs table tracks costs)
SELECT
  agent_type,
  COUNT(*) as total_runs,
  SUM(tokens_used) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(execution_time_ms) as avg_execution_time_ms
FROM agent_runs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY agent_type;
```

---

## 🔧 Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
pnpm install
pnpm build
```

### pg_cron Jobs Not Running

```bash
# Check pg_cron is enabled
supabase db execute -c "SELECT * FROM pg_extension WHERE extname = 'pg_cron';"

# List scheduled jobs
supabase db execute -c "SELECT * FROM cron.job;"

# Check job run history
supabase db execute -c "
  SELECT * FROM cron.job_run_details
  ORDER BY start_time DESC
  LIMIT 20;
"

# Manually trigger a job
supabase db execute -c "SELECT cron.schedule('test-job', '* * * * *', 'SELECT 1');"
supabase db execute -c "SELECT cron.unschedule('test-job');"
```

### OpenAI API Errors

```bash
# Check API key is set
echo $OPENAI_API_KEY

# Test API connectivity
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check rate limits
# OpenAI returns rate limit headers in responses
```

### Edge Functions Not Deploying

```bash
# Check function exists
ls supabase/functions/nightly-categorization/

# Verify Deno runtime
deno --version

# Deploy with verbose logging
supabase functions deploy nightly-categorization --debug

# Check function logs
supabase functions logs nightly-categorization --tail
```

---

## 🧹 Maintenance

### Database Cleanup

```bash
# Remove old AI insights (expired)
supabase db execute -c "
  DELETE FROM ai_insights
  WHERE expires_at < NOW()
  AND dismissed_at IS NOT NULL;
"

# Remove old cron logs (>30 days)
supabase db execute -c "
  DELETE FROM cron_job_logs
  WHERE started_at < NOW() - INTERVAL '30 days';
"

# Vacuum database
supabase db execute -c "VACUUM ANALYZE;"
```

### Backup Strategy

```bash
# Backup database
supabase db dump -f backup-$(date +%Y%m%d).sql

# Restore from backup
supabase db reset
supabase db push
cat backup-20250122.sql | supabase db execute
```

---

## 📈 Performance Optimization

### Database Indexes

```sql
-- Check for missing indexes
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
ORDER BY n_distinct DESC;

-- Add indexes for slow queries
CREATE INDEX CONCURRENTLY idx_bank_transactions_org_date
  ON bank_transactions(org_id, transaction_date DESC);

CREATE INDEX CONCURRENTLY idx_ai_insights_org_created
  ON ai_insights(org_id, created_at DESC);
```

### Query Optimization

```sql
-- Analyze slow queries
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## 🎯 Success Metrics

### Automation Coverage
**Target:** ≥85% of transactions auto-categorized and reconciled

```sql
SELECT
  COUNT(*) as total_transactions,
  SUM(CASE WHEN account_id IS NOT NULL THEN 1 ELSE 0 END) as categorized,
  SUM(CASE WHEN is_reconciled = true THEN 1 ELSE 0 END) as reconciled,
  ROUND(
    100.0 * SUM(CASE WHEN account_id IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as categorization_rate,
  ROUND(
    100.0 * SUM(CASE WHEN is_reconciled = true THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as reconciliation_rate
FROM bank_transactions
WHERE created_at > NOW() - INTERVAL '30 days';
```

### AI Accuracy
**Target:** ≥98% correct categorization/reconciliation (audited sample)

```sql
-- Based on user feedback (corrections = mistakes)
SELECT
  100 - ROUND(
    100.0 * COUNT(CASE WHEN feedback_type = 'correction' THEN 1 END) / COUNT(*),
    2
  ) as accuracy_percent
FROM agent_feedback
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Performance
**Target:** P95 < 2s for dashboard, < 4s for reports

```sql
-- Track response times in application logs
-- Use Vercel Analytics or custom APM solution
```

---

## 📚 Additional Resources

- **Architecture:** [CLAUDE.md](CLAUDE.md)
- **Phase 15-18 Summary:** [PHASE_15_18_COMPLETE.md](PHASE_15_18_COMPLETE.md)
- **Task Tracking:** [docs/task_01.md](docs/task_01.md)
- **API Documentation:** Coming soon
- **User Guide:** Coming soon

---

**Last Updated:** 2025-01-22
**Version:** 0.1.0 (Phase 0-18 Complete)
