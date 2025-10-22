# Incident Severity Matrix

## Severity Levels

### SEV1 - Critical (P0)
**Response Time:** Immediate (< 15 minutes)
**Resolution Time:** < 4 hours
**On-Call Required:** Yes
**Customer Impact:** Complete system outage or data loss

#### Examples:
- Complete application downtime
- Database unavailable
- Data loss or corruption
- Security breach (unauthorized access)
- Payment processing completely broken
- Bank feed sync failing for all customers

#### Response:
1. Page on-call engineer immediately
2. Create war room (Slack/Teams channel)
3. Post status page update within 15 minutes
4. Notify leadership
5. All hands on deck until resolved

---

### SEV2 - High (P1)
**Response Time:** < 1 hour
**Resolution Time:** < 24 hours
**On-Call Required:** Yes (during business hours)
**Customer Impact:** Major feature broken, significant degradation

#### Examples:
- Invoice sending broken
- Report generation failing
- AI categorization completely down
- Bank sync failing for specific banks
- Authentication issues (intermittent)
- Major performance degradation (> 10s page loads)

#### Response:
1. Alert on-call engineer
2. Create incident channel
3. Post status page update within 1 hour
4. Begin investigation immediately
5. Provide updates every 2 hours

---

### SEV3 - Medium (P2)
**Response Time:** < 4 hours
**Resolution Time:** < 3 days
**On-Call Required:** No
**Customer Impact:** Minor feature issues, workarounds available

#### Examples:
- UI bugs (non-blocking)
- Slow performance for specific features
- Export failing for specific report types
- Email notifications delayed
- Dashboard widget not loading
- OCR accuracy degraded

#### Response:
1. Create ticket
2. Assign to appropriate team
3. Investigate during business hours
4. Fix in next deployment cycle
5. Update customers if needed

---

### SEV4 - Low (P3)
**Response Time:** < 1 week
**Resolution Time:** < 2 weeks
**On-Call Required:** No
**Customer Impact:** Cosmetic issues, no functional impact

#### Examples:
- Visual glitches
- Typos in UI
- Minor layout issues
- Tooltip missing
- Console warnings

#### Response:
1. Create ticket in backlog
2. Fix in regular development cycle
3. No customer notification needed

---

## Escalation Path

### SEV1
1. On-call engineer (immediate)
2. Engineering lead (< 15 min)
3. CTO (< 30 min)
4. CEO (if customer-facing outage > 1 hour)

### SEV2
1. On-call engineer (< 1 hour)
2. Engineering lead (< 2 hours)
3. CTO (if unresolved > 12 hours)

### SEV3
1. Assigned engineer (< 4 hours)
2. Engineering lead (next business day)

### SEV4
1. Assigned engineer (next sprint planning)

---

## Communication Templates

### SEV1 - Initial Update
```
🚨 INCIDENT ALERT - SEV1

Status: Investigating
Impact: [Description of customer impact]
Affected: [Scope - all users, specific feature, etc.]
Started: [Timestamp]
ETA: Investigating

We are aware of [issue] and are actively investigating.
Updates every 30 minutes.

Next update: [Time]
```

### SEV1 - Resolution
```
✅ RESOLVED - SEV1

The issue affecting [feature] has been resolved.
Root cause: [Brief description]
Duration: [Time from start to resolution]

Post-mortem will be shared within 48 hours.

We apologize for the disruption.
```

### SEV2 - Update
```
⚠️ INCIDENT UPDATE - SEV2

Status: [Investigating/Identified/Monitoring]
Impact: [Description]
Affected: [Scope]

Current status: [What we know]
Next steps: [What we're doing]

Next update: [Time]
```

---

## Post-Incident Review (PIR)

**Required for:** SEV1, SEV2
**Timeline:** Within 48 hours of resolution

### Template:
1. **Incident Summary**
   - What happened
   - Duration
   - Customer impact

2. **Timeline**
   - Detection time
   - Response time
   - Resolution time
   - Key events

3. **Root Cause**
   - What caused the incident
   - Why it wasn't caught earlier

4. **Resolution**
   - How it was fixed
   - Verification steps

5. **Action Items**
   - Prevent recurrence
   - Improve detection
   - Improve response
   - Assign owners and due dates

6. **Lessons Learned**
   - What went well
   - What could be improved
