# Runbook: Database Connection Issues

## Symptoms
- Application showing "Database connection error"
- High latency on all requests
- Connection pool exhausted errors
- Timeouts on database queries

## Severity
**SEV1** if affecting all users
**SEV2** if affecting specific features or intermittent

## Quick Diagnosis

### 1. Check Database Status
```bash
# Supabase Dashboard
# Go to: https://app.supabase.com/project/[project-id]
# Check: Database > Health

# Or via CLI
supabase status
```

### 2. Check Connection Pool
```sql
-- See active connections
SELECT count(*) as connections
FROM pg_stat_activity
WHERE datname = 'postgres';

-- See max connections
SHOW max_connections;

-- See connection pool status
SELECT
  datname,
  count(*) as connections,
  max_val.setting as max_connections
FROM pg_stat_activity,
     (SELECT setting FROM pg_settings WHERE name = 'max_connections') max_val
WHERE datname = 'postgres'
GROUP BY datname, max_val.setting;
```

### 3. Check for Long-Running Queries
```sql
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - pg_stat_activity.query_start > interval '5 minutes'
ORDER BY duration DESC;
```

## Common Causes & Solutions

### Cause 1: Connection Pool Exhausted

**Symptoms:**
- Error: "sorry, too many clients already"
- Connection count near max_connections

**Fix:**
```bash
# 1. Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < now() - interval '10 minutes'
  AND pid != pg_backend_pid();

# 2. Increase connection pool (temporary)
# Contact Supabase support or upgrade tier

# 3. Optimize connection pooling in application
# Check: lib/supabase/server.ts
# Ensure proper connection cleanup
```

**Prevention:**
- Implement connection pooling with pgBouncer
- Set max_connections in environment
- Monitor connection usage with alerts

### Cause 2: Long-Running Queries

**Symptoms:**
- Queries timing out
- High database CPU
- Slow response times

**Fix:**
```sql
-- 1. Identify slow queries
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 2. Kill problematic query
SELECT pg_cancel_backend([pid]);

-- If that doesn't work:
SELECT pg_terminate_backend([pid]);
```

**Prevention:**
- Add missing indexes (see migration 20250110000001)
- Implement query timeouts
- Add query pagination
- Review and optimize N+1 queries

### Cause 3: Database Instance Down

**Symptoms:**
- All connections failing
- Supabase dashboard shows instance stopped

**Fix:**
```bash
# 1. Check Supabase status
# https://status.supabase.com

# 2. Restart database (if self-hosted)
supabase db restart

# 3. Contact Supabase support (if hosted)

# 4. Implement graceful degradation
# Show cached data or maintenance page
```

**Prevention:**
- Set up database monitoring
- Configure auto-restart
- Implement health checks
- Set up status page notifications

### Cause 4: Network Issues

**Symptoms:**
- Intermittent connection failures
- Timeouts
- Works from some locations but not others

**Fix:**
```bash
# 1. Test connectivity
ping [database-host]
telnet [database-host] 5432

# 2. Check firewall rules
# Supabase: Ensure IP allowlist is correct

# 3. Check DNS resolution
nslookup [database-host]

# 4. Verify SSL/TLS certificates
openssl s_client -connect [database-host]:5432
```

**Prevention:**
- Monitor network latency
- Configure retry logic with exponential backoff
- Set up redundant connections (read replicas)

### Cause 5: Disk Space Full

**Symptoms:**
- Write operations failing
- "No space left on device" errors

**Fix:**
```sql
-- Check disk usage
SELECT
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;

-- Find large tables
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

**Immediate Actions:**
1. Clean up old data (audit logs, temp tables)
2. Archive old records
3. Upgrade storage tier

**Prevention:**
- Set up disk usage alerts (< 80%)
- Implement data retention policies
- Regular vacuum and analyze

## Monitoring & Alerts

### Key Metrics to Monitor
- Active connections
- Connection pool utilization
- Query latency (P95, P99)
- CPU usage
- Disk usage
- Error rate

### Alert Thresholds
- **Critical:** Connections > 90% of max
- **Warning:** Connections > 70% of max
- **Critical:** Query latency P95 > 5s
- **Warning:** Query latency P95 > 2s
- **Critical:** Error rate > 5%
- **Warning:** Error rate > 1%

## Escalation

1. **0-15 min:** On-call engineer investigates
2. **15-30 min:** Notify engineering lead
3. **30-60 min:** Contact Supabase support
4. **60+ min:** Escalate to CTO, consider failover

## Recovery Steps

1. Verify database is accessible
2. Check connection pool is healthy
3. Run health check queries
4. Monitor error rates
5. Post status page update
6. Write post-incident review

## Related Runbooks
- [High Error Rates](./high-error-rates.md)
- [Performance Degradation](./performance-degradation.md)
- [Supabase Outage](./supabase-outage.md)
