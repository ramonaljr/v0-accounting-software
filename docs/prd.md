# OpportunityOS — Product Requirements Document (PRD)

**Product:** OpportunityOS (Global Accounting SaaS)  
**Version:** 2.0  
**Date:** 2025-10-06  
**Owner:** Product Strategy & AI Systems Team  
**Brand Palette:** Gold `#D4AF37`, Black `#0D0D0D`, White `#FFFFFF`  
**Status:** Final Draft for Executive & Engineering Review

---

## 1) Executive Summary

OpportunityOS is a mobile-first, AI-powered accounting platform for SMBs, accountants, and global startups. It replaces rules-only automations with **agentic workflows** that reconcile, categorize, and report with human-in-the-loop oversight. Core advantages: autonomous reconciliation, explainable actions, multi-currency + tax intelligence, and developer-friendly integrations.

**Primary Launch Goal:** Ship an MVP that automates ≥85% of day-to-day bookkeeping with ≥98% accuracy across initial regions (US, EU, PH, JP), while demonstrating reliable bank feeds and one-click reconciliation.

---

## 2) Competitive Context (Snapshot)

**QuickBooks Online:** strong ecosystem, rules-based automations; pain points: UI churn, bank-feed reliability, rising costs for advanced features.

**Xero:** clean UX and partner network; gaps around deeper automation and certain multi-currency scenarios.

**Zoho Books:** value-packed, integrated suite; gaps in advanced workflows and some regional tax depth.

**FreshBooks:** freelancer-focused simplicity; limited automation depth and reporting flexibility.

**Wave:** free core features; limited scale features and trust/support concerns for some users.

**Fiskl:** mobile-first simplicity; gaps in accountant collaboration and some integrations at scale.

### Opportunity

Deliver **true workflow automation** (agentic reconciliation, anomaly detection, explainable posting) with **global compliance** and **premium yet simple** UX.

---

## 3) Objectives & Success Metrics

### 3.1 Objectives

- Deliver MVP modules: **GL, Bank Feeds, OCR Expenses, Invoicing, Reconciliation, Reports, AI Co-Pilot, FX & Tax presets**.
- Prove agentic value: **one-click reconciliation** with explainable reasoning + confidence thresholds.
- Enable **multi-tenant accountant workspace** and **migration importers** (CSV, QBO/Xero starter).

### 3.2 KPIs

| KPI | Target |
|---|---|
| Automation coverage | ≥ 85% |
| Categorization/recon accuracy | ≥ 98% |
| Monthly close time | ≤ 2 hours |
| P95 dashboard latency | < 2s |
| NPS (post-GA) | ≥ +70 |
| Uptime | 99.9% |

---

## 4) Users & Use Cases

### 4.1 Personas

**Freelancer/Micro-SMB:** quick invoicing, receipt scanning, basic reports.

**SME Owner/Manager:** cash visibility, fast close, team roles.

**Bookkeeper/Accountant:** multi-client workspace, bulk actions, audit logs.

**Startup CFO/Controller:** forecasting, dashboards, compliance exports.

### 4.2 Jobs-to-Be-Done

- "As a business owner, I want bank transactions **auto-categorized** so I stop doing manual data entry."
- "As an accountant, I want **reliable reconciliation** and a clear **audit trail** for reviews."
- "As a CFO, I want **real-time P&L/CF** and **anomaly alerts** to act quickly."

---

## 5) Scope

### 5.1 In-Scope (MVP / P0)

- **General Ledger & Chart of Accounts** (industry/region templates)
- **Bank Feeds** (Plaid, Wise) + ingestion queue + retry/fallback
- **OCR Expenses** (mobile/web), receipt → expense → tax
- **Invoicing & Payments** (Stripe/PayPal matching)
- **Reconciliation Engine** (one-click **ReconAI**)
- **Reports:** P&L, Balance Sheet, Cash Flow (+ CSV/PDF export)
- **AI Co-Pilot** (chat + actions; explainability)
- **Multi-currency (FX)** & **regional tax presets** (US/EU/PH/JP)
- **RBAC**, accountant multi-tenant workspace
- **Migration importers** (CSV + QBO/Xero starter)

### 5.2 Near-Term (P1)

- Anomaly detection, forecasting
- Integrations marketplace v1 (Shopify, Woo)
- Approvals workflow, journal lock/close
- Report builder (custom columns, groupings)
- QBO/Xero importer deepening

### 5.3 Out-of-Scope (MVP)

- Full payroll engine (connectors only)
- Advanced inventory/warehousing
- All jurisdictions e-filing (focus pilot regions first)

---

## 6) Functional Requirements

### 6.1 Ledger & Transactions

- Double-entry; accrual basis baseline; cash view toggle
- COA templates by industry + region; COA editor
- CRUD for journals; attachments; **immutable audit log** per action

### 6.2 Bank Feeds

- Connect accounts; nightly + on-demand sync; webhooks
- Idempotent ingestion; de-duplication; retry on failure; **clear error surfacing**
- Feed health metrics per account (lag, errors, last sync)

### 6.3 Categorization (**LedgerBot**)

- ML classification using description, merchant, history, vendor
- **Confidence threshold** setting per workspace; auto-post ≥ 0.90; else queue for review
- Inline **"Why?"** with features used and history references
- Bulk review/approve; smart suggestions

### 6.4 Reconciliation (**ReconAI**)

- Automated matching across bank ↔ ledger ↔ payments
- Tolerance rules (FX, rounding); partial match handling; difference posting (with reason)
- **One-click approve**; reconciliation report with exceptions list

### 6.5 Expenses & OCR

- File/Camera upload; multi-page PDF; auto-crop/deskew
- Extract vendor, date, total, tax, currency; line-item optional
- Map to expense + tax codes; duplicate detection; receipt-to-entry link

### 6.6 Invoicing & Payments

- Templates; line items; discounts; taxes; multi-currency
- Payment links (Stripe/PayPal); auto-match receipts
- Dunning emails; **predictive reminder schedule**

### 6.7 Reports

- P&L, BS, CF; filters by period, dimension, currency
- Drill-down to source entries and attachments
- Scheduled delivery; CSV/PDF; narrative summary (**ReportGen**)

### 6.8 AI Co-Pilot

- Natural-language queries to actions: "reconcile October," "show Q3 P&L," "flag unusual spend"
- Guardrails: RBAC-aware; confirmation for postings; **dry-run previews**
- Context shortcuts (selected transactions → "Explain" / "Re-classify")

### 6.9 Collaboration & Roles

- Roles: Owner, Admin, Accountant, Staff, Viewer
- Client switcher for accountants; task assignments; comments
- Close/lock periods, approval trail; exportable audit pack

---

## 7) Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | P95 < 2s dashboard; < 4s report gen (≤ 50k tx range) |
| Scalability | 1M tx/day/cluster; horizontal scale |
| Availability | 99.9% |
| Security | SOC2, GDPR; MFA; RLS; KMS |
| Privacy | Data residency: US/EU/APAC buckets |
| Auditability | Immutable logs for user/AI actions |
| Accessibility | WCAG 2.1 AA |
| Localization | i18n (EN at GA; JP/ES/FR post-GA) |

---

## 8) Architecture

### 8.1 Stack

- **Frontend:** Next.js + TypeScript + React Query; PWA; i18n
- **Backend:** Supabase/Postgres; worker queues; event bus
- **AI Layer:** OpenAI SDK + LangGraph (agents: LedgerBot, ReconAI, InsightAI, ReportGen, TaxAI, ExplainBot)
- **Automation:** n8n; cron; feature flags
- **Storage:** Supabase Storage / S3; signed URLs
- **Observability:** PostHog, Sentry, Grafana/Prometheus

### 8.2 Data Flow

```mermaid
flowchart LR
    A[Bank/Payments APIs] --> B[Ingestion Service]
    B --> C[(Ledger DB)]
    C --> D[LedgerBot]
    D --> E[ReconAI]
    E --> F[Reports/Exports]
    D --> G[ExplainBot]
    G --> H[UI/Co-Pilot]
```

---

## 9) Data Model (High-Level)

**Entities:** Organization, User, Role, ClientWorkspace, Account, Transaction, JournalEntry, Vendor/Customer, Invoice, Payment, Receipt, TaxCode, FxRate, ReportRun, AuditLog.

**Keys:** tenant_id on all rows; composite unique keys for external ids to prevent duplicates.

**Indexes:** date, account_id, amount, external_ref.

**Retention:** configurable per tenant; legal hold support.

---

## 10) AI / Agentic Design

### 10.1 Agents

| Agent | Purpose | Triggers | Autonomy |
|---|---|---|---|
| LedgerBot | Categorize/post | Ingestion, upload | Confidence-gated |
| ReconAI | Match & reconcile | Nightly/on-demand | One-click approve |
| InsightAI | Detect anomalies | Continuous | Notify only |
| ReportGen | Summaries/reports | Scheduled/request | Read-only |
| TaxAI | Apply taxes | Posting time | Rules + alerts |
| ExplainBot | "Why?" answers | On click | Read-only |

### 10.2 Guardrails

- Confidence thresholds; dry-run previews; role-based approvals
- Full action provenance: inputs, model version, decision rationale
- Canary cohorts before expanding autopost

### 10.3 Evaluation

- Weekly accuracy audits; synthetic and real eval sets
- Drift detection on classification distributions
- Rollback to last good model if accuracy drops > 1.5 pp

---

## 11) Integrations (Phase 1 Targets)

| Category | Providers |
|---|---|
| Bank Feeds | Plaid, Wise |
| Payments | Stripe, PayPal |
| Commerce | Shopify (orders/invoices) |
| Payroll | Gusto (read totals) |
| Migration | CSV, QBO, Xero |

---

## 12) UX & Design System

**Components:** Untitled UI; 12-col grid (1200px); 24px gutters; section spacing 120px.

**Modes:** Light/Dark; Gold accents; accessible contrast.

**Patterns:** Empty-states with "Try it now"; inline "Why?"; sticky mobile CTA.

**Key Screens:** Dashboard, Transactions, Reconcile, Invoices, Expenses, Reports, Integrations, Settings, Accountant Workspace.

---

## 13) API (Illustrative)

```http
POST /api/v1/transactions/import
POST /api/v1/ledger/post
POST /api/v1/reconcile/run
GET  /api/v1/reports?type=pl&period=2025-Q3
POST /api/v1/copilot/command   // intent->action with dry-run preview
```

**Auth:** OAuth2 + JWT; per-tenant scopes; rate limits per endpoint.

**Webhooks:** transaction.created, reconciliation.completed, report.generated.

---

## 14) Security & Compliance

- **Encryption:** AES-256 at rest; TLS 1.3 in transit
- **Access Control:** RBAC + MFA; device/session policy; IP allowlist (Enterprise)
- **Data Isolation:** RLS per tenant; key management via KMS
- **Compliance:** DPIA (GDPR); vendor DPAs; least-privilege access
- **Incident Response:** Playbooks; breach notification SLA
- **Auditability:** Exportable audit logs (CSV/JSON/PDF) with signatures

---

## 15) Analytics & Telemetry

**Product:** Activation steps (connect bank → first post → first recon), feature adoption, churn reasons.

**AI:** Accuracy vs. confidence, human corrections, anomaly precision/recall.

**Reliability:** Feed error rate, ingestion lag, recon queue depth.

**GTM:** Source/medium attribution; trial → paid funnel.

---

## 16) Testing Strategy

| Layer | Focus | Tools |
|---|---|---|
| Unit | Ledger math, tax calc, FX | Jest/Vitest |
| Integration | Ingestion → Recon → Report | Playwright/Cypress |
| AI Eval | F1, precision/recall, explain rubric | Custom harness |
| Load | 1M tx/day, burst OCR | K6/Locust |
| Security | SAST/DAST, pen test | OWASP ZAP, Burp |
| UAT | 10 accountants/100 SMBs | Beta portal |

---

## 17) Release Plan

| Phase | Timeline | Deliverables |
|---|---|---|
| Beta | Weeks 10–12 | MVP, runbooks, cohorts |
| GA | Q4 2025 | Pricing, docs, support |
| P1 | Q1 2026 | Marketplace, forecasting, approvals |
| P2 | Q2 2026 | Global tax packs, deeper importers |

**Rollout:** Blue/green; feature flags; canary cohorts; metrics-based promotion.

---

## 18) Pricing (Draft)

| Tier | Target | Key Inclusions |
|---|---|---|
| Starter | Freelancers | 1 bank, basic reports |
| Pro | SMEs | Multi-bank, AI Co-Pilot, accountant access |
| Enterprise | Firms | SSO/SAML, data residency, priority support |

---

## 19) Risks & Mitigations

**Bank feed instability:** multi-provider fallback, queue buffering, user alerts.

**AI misclassification:** confidence gates, human review, fast feedback learning.

**Jurisdiction complexity:** modular tax packs, phased rollout, expert validation.

**Security/compliance:** third-party audit, pen tests, incident drills.

**Scope creep:** P0/P1 gating, weekly cut reviews, strict flags.

---

## 20) Acceptance Criteria (MVP Exit)

- P0 modules functional and tested end-to-end
- ≥ 85% automation coverage on pilot ledgers; ≥ 98% accuracy sampled
- Reconciliation completes successfully for ≥ 99% of imported transactions
- Reports tie to ledger; drill-downs accurate; exports correct
- Security review passed; runbooks and dashboards live
- Beta satisfaction ≥ 8/10; critical bugs resolved

---

## 21) Open Questions

- Which e-filing targets first per region (read-only vs submit)?
- Additional bank/payment providers per country priority?
- Final AI usage limits in Starter vs Pro tiers?
- Required industry COA templates at GA?

---

## 22) Appendices

### 22.1 Glossary

**Agentic AI:** multi-agent system with autonomous actions under guardrails.

**Recon:** matching bank ↔ ledger entries.

**RLS:** Row-Level Security.

**DPIA:** Data Protection Impact Assessment.

### 22.2 Decision Log (to maintain)

- **2025-10-06:** Regions at GA (US/EU/PH/JP)
- **2025-10-06:** Autopost confidence threshold = 0.90 (canary first)
- **2025-10-06:** Plaid + Wise as phase-1 feeds