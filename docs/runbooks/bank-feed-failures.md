# Runbook: Bank Feed Failures

## Symptoms
- Bank transactions not syncing
- Users reporting "Bank sync failed" errors
- High failure rate in bank_sync logs
- Plaid/Wise webhooks failing

## Severity
**SEV2** if affecting multiple customers
**SEV3** if affecting specific banks or small number of users

## Quick Diagnosis

### 1. Check Sync Status Dashboard
```sql
-- Get recent sync failures
SELECT
  bc.id,
  bc.org_id,
  bc.institution_name,
  bc.last_sync_at,
  bc.sync_status,
  bc.error_message
FROM bank_connections bc
WHERE sync_status = 'failed'
  AND last_sync_at > now() - interval '24 hours'
ORDER BY last_sync_at DESC
LIMIT 50;

-- Check failure rate by institution
SELECT
  institution_name,
  COUNT(*) as total,
  SUM(CASE WHEN sync_status = 'failed' THEN 1 ELSE 0 END) as failures,
  ROUND(100.0 * SUM(CASE WHEN sync_status = 'failed' THEN 1 ELSE 0 END) / COUNT(*), 2) as failure_rate
FROM bank_connections
WHERE last_sync_at > now() - interval '24 hours'
GROUP BY institution_name
HAVING SUM(CASE WHEN sync_status = 'failed' THEN 1 ELSE 0 END) > 0
ORDER BY failure_rate DESC;
```

### 2. Check Provider Status
```bash
# Plaid Status
curl https://status.plaid.com/api/v2/status.json

# Wise Status (check website)
# https://wise.statuspage.io/
```

### 3. Check Application Logs
```bash
# Search for bank sync errors
grep "bank_sync" logs/app.log | grep "ERROR"

# Or in Sentry
# Filter by: feature:bank_feeds, level:error
```

## Common Causes & Solutions

### Cause 1: Provider Outage (Plaid/Wise)

**Symptoms:**
- All bank syncs failing
- Provider status page shows incidents
- API returning 5xx errors

**Fix:**
1. Check provider status page
2. Update status page with external dependency issue
3. Enable retry queue with exponential backoff
4. Wait for provider to resolve

**Communication:**
```
We're experiencing issues with bank syncs due to a temporary
issue with our banking data provider. We're monitoring the
situation and syncs will resume automatically once resolved.

Status: https://status.plaid.com
```

**Prevention:**
- Subscribe to provider status webhooks
- Implement circuit breaker pattern
- Set up automatic retries
- Consider multi-provider failover (P2)

### Cause 2: Authentication Expired

**Symptoms:**
- Specific banks failing
- Error: "ITEM_LOGIN_REQUIRED"
- User needs to re-authenticate

**Fix:**
```typescript
// 1. Identify affected connections
const expiredConnections = await supabase
  .from('bank_connections')
  .select('*')
  .eq('sync_status', 'failed')
  .contains('error_message', 'ITEM_LOGIN_REQUIRED')

// 2. Send re-auth notifications
for (const connection of expiredConnections) {
  await sendReAuthEmail(connection.org_id, connection.id)
}

// 3. Update connection status
await supabase
  .from('bank_connections')
  .update({ requires_reauth: true })
  .in('id', expiredConnections.map(c => c.id))
```

**User Communication:**
```
Your [Bank Name] connection requires re-authentication.
Please reconnect your bank account to resume automatic syncing.

[Reconnect Button]
```

**Prevention:**
- Monitor auth token expiry
- Send proactive re-auth reminders (7 days before expiry)
- Implement refresh token flow where supported

### Cause 3: Rate Limiting

**Symptoms:**
- Error: "RATE_LIMIT_EXCEEDED"
- 429 HTTP status codes
- Failures during peak sync times (morning)

**Fix:**
```typescript
// 1. Implement rate limiting with queue
import pQueue from 'p-queue'

const queue = new pQueue({
  concurrency: 10, // Max concurrent syncs
  interval: 1000,  // Per second
  intervalCap: 10  // Max 10 per second
})

// 2. Distribute sync times
// Instead of all syncing at 2 AM, spread across 1-4 AM
const syncHour = 1 + (Math.abs(hashOrgId(orgId)) % 3) // 1, 2, or 3 AM

// 3. Implement exponential backoff
async function syncWithBackoff(connectionId: string, attempt = 1) {
  try {
    await syncBankConnection(connectionId)
  } catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED' && attempt < 5) {
      const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s, 16s, 32s
      await sleep(delay)
      return syncWithBackoff(connectionId, attempt + 1)
    }
    throw error
  }
}
```

**Prevention:**
- Monitor API quota usage
- Implement smart scheduling
- Use webhook-based updates instead of polling
- Upgrade provider tier if needed

### Cause 4: Invalid Credentials / Institution Changes

**Symptoms:**
- Specific institution failing for all users
- Error: "INVALID_CREDENTIALS" or "INSTITUTION_ERROR"
- Recent bank website changes

**Fix:**
1. Check Plaid institution status:
```bash
curl -X POST https://production.plaid.com/institutions/get \
  -H 'Content-Type: application/json' \
  -d '{
    "institution_id": "ins_XXX",
    "client_id": "$PLAID_CLIENT_ID",
    "secret": "$PLAID_SECRET",
    "country_codes": ["US"]
  }'
```

2. If institution is degraded:
   - Notify affected users
   - Disable auto-sync for that institution temporarily
   - Monitor Plaid status for resolution

3. If credentials issue:
   - Send re-auth email to all affected users
   - Create help center article

**Prevention:**
- Subscribe to Plaid institution status webhooks
- Monitor per-institution failure rates
- Keep institution status updated in UI

### Cause 5: Webhook Failures

**Symptoms:**
- Manual syncs work, but automatic syncs don't trigger
- Missing webhook events in logs
- Stale transaction data

**Fix:**
```bash
# 1. Check webhook endpoint health
curl https://yourdomain.com/api/webhooks/plaid

# 2. Verify webhook configuration
# Plaid Dashboard > Webhooks > Verify endpoint

# 3. Check webhook logs
grep "webhook" logs/app.log | tail -100

# 4. Re-register webhooks if needed
# Via Plaid Dashboard or API
```

**Test Webhook:**
```typescript
// Send test webhook
import { testWebhook } from '@/lib/integrations/plaid'

await testWebhook()
```

**Prevention:**
- Monitor webhook delivery rate
- Implement webhook retry logic
- Set up alerting for webhook failures
- Test webhooks in staging regularly

## Monitoring & Alerts

### Key Metrics
- Bank sync success rate (target: > 95%)
- Time since last successful sync per connection
- Provider API error rates
- Webhook delivery success rate
- Re-auth rate

### Alert Thresholds
- **Critical:** Sync failure rate > 20% across all connections
- **Warning:** Sync failure rate > 10%
- **Critical:** Specific institution failure rate > 50%
- **Warning:** Connection hasn't synced in > 48 hours
- **Info:** Webhook delivery failure

## Immediate Actions

1. **Triage:** Determine if issue is provider-wide or specific
2. **Check Status:** Plaid/Wise status pages
3. **Notify Users:** If widespread issue, update status page
4. **Enable Retries:** For transient failures
5. **Escalate:** If provider issue, contact provider support

## User Communication Templates

### Provider Outage
```
We're experiencing temporary issues with bank syncing due to
our banking data provider. Syncs will resume automatically
once the issue is resolved.

Manual syncs may still work - you can try refreshing your
connection from Settings > Bank Accounts.
```

### Re-Auth Required
```
Your [Bank Name] connection needs to be refreshed.

This is a security measure required by your bank. Please
reconnect to continue syncing transactions.

[Reconnect Now]
```

### Institution-Specific Issue
```
We're experiencing issues syncing [Bank Name] due to recent
changes on their website. We're working with our provider to
resolve this.

Your data is safe. Syncing will resume automatically once fixed.

Estimated resolution: [timeframe]
```

## Escalation

1. **0-2 hours:** On-call engineer investigates
2. **2-4 hours:** Contact Plaid/Wise support
3. **4-8 hours:** Notify engineering lead
4. **8+ hours:** Consider manual workarounds, escalate to CTO

## Recovery Verification

```sql
-- Verify syncs are working
SELECT
  COUNT(*) as successful_syncs
FROM bank_connections
WHERE sync_status = 'completed'
  AND last_sync_at > now() - interval '1 hour';

-- Check for new transactions
SELECT
  COUNT(*) as new_transactions
FROM bank_transactions
WHERE created_at > now() - interval '1 hour';
```

## Post-Incident

1. Update affected users
2. Document root cause
3. Review retry logic
4. Update monitoring thresholds
5. Schedule PIR if SEV2

## Related Runbooks
- [High Error Rates](./high-error-rates.md)
- [API Integration Failures](./api-integration-failures.md)
- [Plaid-Specific Issues](./plaid-issues.md)
