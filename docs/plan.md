<!-- filename: plan.md -->

# OpportunityOS — Project Plan

A concise, execution-ready plan to build a next-generation, AI-powered accounting SaaS for global SMBs and accountants. Brand palette: **Gold (#D4AF37)**, **Black (#0D0D0D)**, **White (#FFFFFF)**.

---

## 0) North Star

**Vision:** Accounting that runs itself�autonomous reconciliation, explainable insights, and global compliance out of the box.  
**Primary KPI (12 months):** ≥85% of transactions fully automated (no human touch) with ≥98% accuracy across 100+ jurisdictions.

---

## 1) Objectives & Non-Goals

### 1.1 Objectives
- Ship a **mobile-first MVP** with: GL, bank feeds, OCR expenses, invoicing, reconciliation, reports, AI Co-Pilot.
- Demonstrate **agentic automation** (ReconAI + LedgerBot) with visible, auditable explanations.
- Support **multi-currency + tax** for initial regions (US, EU, PH, JP) and modularize for rapid expansion.
- Build an **integration marketplace** foundation (banks, payments, ecommerce, payroll).

### 1.2 Non-Goals (MVP)
- Full payroll engine (provide connectors first).
- Deep inventory/warehouse management.
- Country-specific e-filing everywhere (start with high-value targets, expand).

---

## 2) Success Metrics

- **Automation Coverage:** ≥85% auto-categorization & reconciliation.
- **Accuracy:** ≥98% correct category/recon suggestions (audited sample).
- **Time to Close:** ≤2 hours for a typical small ledger (30–60 days of activity).
- **Performance:** P95 < 2s for main dashboard, < 4s for report generation.
- **NPS:** ≥+60 beta, ≥+70 public GA.
- **Reliability:** 99.9% uptime; bank feed failure rate < 0.5%/day/account.

---

## 3) Scope (MVP → MLP)

### 3.1 MVP (P0)
- **GL & COA**, **Bank Feeds**, **OCR Expenses**, **Invoicing & Payments**, **Reconciliation Engine**, **Reports (P&L, BS, CF)**, **AI Co-Pilot (chat + actions)**, **Multi-currency (FX)**, **Regional tax presets** (US/EU/PH/JP).

### 3.2 MLP (P1)
- **Anomaly detection**, **Forecasting**, **Importers** (QBO/Xero), **Integrations marketplace v1**, **Accountant multi-client workspace**, **Team roles & approvals**, **Audit Mode**.

### 3.3 Post-GA (P2)
- **Predictive tax filing**, **Industry plug-ins**, **Voice Co-Pilot**, **Deeper payroll connectors**, **Advanced analytics packs**.

---

## 4) Milestones & Timeline (Weeks 0�12)

- **W0�1:** Finalize PRD, data model, risk & compliance checklist, design system (Untitled UI + brand).
- **W2�3:** Auth, orgs/tenants, COA, ledger CRUD, file storage, OCR pipeline.
- **W4�5:** Bank feeds (Plaid/Wise), ingestion queues, reconciliation baseline, reports v1. Add QBO-style Bank Transactions UI, Rules, Receipts Inbox, Reconcile, Bank Deposits, Recurring, Account Register.
- **W6�7:** AI Co-Pilot (intent + action), LedgerBot v1 (categorization), ReconAI v1 (one-click). Workflows Center (templates for reminders, bill due, low cash, deposit reminder).
- **W8:** Multi-currency & regional tax presets; importers (CSV + QBO starter); Customers/Vendors hubs; Sales Transactions list.
- **W9:** Sales pages parity (Invoices, Estimates, Receive payments, Sales receipts, Credit memos, Refund receipts, Payment links, Products & Services import). Purchases parity (Bills, Bill payments, Expenses, POs, Checks). Accountant workspace.
- **W10:** Reports Center; Class/Location/Tags report presets; Statements & Collections Center; Payroll connector (Gusto) with mapping UI and journal posting. Observability, rate limits, RBAC, audit logs; beta hardening.
- **W11:** Beta with 10 accountants/100 SMBs; fix high-severity issues.
- **W12:** Public launch prep: pricing, docs, GTM assets, SLOs, on-call, rollback runbook.

**Exit criteria MVP:** All P0 features shippable, security review passed, runbook + dashboards live, ≥95% automation accuracy on pilot ledgers.

---

## 5) Workstreams & Responsibilities

- **Product:** PRD, backlog, acceptance criteria, feature flags, beta program.
- **Design (UX/UI):** Responsive layouts, interaction specs, empty-state coaching, accessibility.
- **Backend:** Ledger, reconciliation, tax/FX modules, integrations, API contracts.
- **AI/ML:** Categorization models, orchestration (LangGraph), confidence policies, eval harness.
- **Data/Analytics:** Event schema, funnels, model accuracy dashboards, data retention.
- **Security/Compliance:** SOC2 controls, GDPR DPIA, PII handling, RLS policies, key mgmt.
- **DevEx/DevOps:** CI/CD, environments, blue/green, observability, incident response.
- **GTM:** Website, pricing, demo assets, community & partners, onboarding flows.

---

## 6) Architecture (High-Level)

- **Frontend:** Next.js + TypeScript + React Query; PWA; i18n.
- **Backend:** Supabase/Postgres (ledger, audit), worker queues, event bus.
- **AI Layer:** OpenAI SDK + LangGraph (agents: LedgerBot, ReconAI, InsightAI, ReportGen, TaxAI, ExplainBot).
- **Automation:** n8n for system workflows; feature flags & schedulers.
- **Storage:** Supabase Storage / S3 (receipts, docs), signed URLs.
- **Observability:** PostHog (product), Sentry (errors), Grafana/Prom (infra).
- **Security:** RLS, per-tenant keys, KMS, MFA, device/session policies.
- **Integrations:** Plaid/Wise/Stripe/PayPal/Shopify/Gusto (phased).

---

## 7) AI/Agent Plan

**Principles:** human-in-the-loop, explainability, per-tenant memory, confidence thresholds.

**Agents & Triggers**
- **LedgerBot:** on ingestion → propose GL code + tax; auto-post ≥0.9 confidence.

- **LedgerBot:** on ingestion + propose GL code + tax; auto-post =0.9 confidence; �Why?� explanations.
- **ReconAI:** nightly & on-demand; one-click auto-match; reconcile report & history.
- **Module agents:** Banking (TransferDetector, PaymentMatcher, RuleSuggester), Sales (DunningAgent, PaymentPredictor, EstimateFollowUp, SalesReceiptClassifier), Purchases (BillOCR, DueSoonNotifier, DuplicateBillDetector, POToBillRecommender), Tax (TaxCodeResolver, TaxDueForecaster, ReturnPreparer), Cash/Forecast (CashFlowPlanner, CashAlertAgent), Insights (AnomalyDetector, NarrativeGenerator).
- **Workflows Center:** templates for invoice reminder/paid, estimate follow-up, bill due, low cash, bank deposit reminder, unbilled time, recurring sales receipt. Triggers: time/event/threshold/data-change; actions: notify, create task, create/send doc, schedule payment, guarded JE, run&email report.

- **ReconAI:** nightly & on-demand → match bank ↔ ledger; surface mismatches; 1-click approve.
- **InsightAI:** continuous → anomalies, duplicate detection, unusual vendors, cash alerts.
- **ReportGen:** on request/schedule → P&L/BS/CF; narrative summary + links to entries.
- **TaxAI:** on post → jurisdictional tax application; warns on threshold triggers.
- **ExplainBot:** inline “Why?” with sources (rule, prior actions, doc refs).

**Evaluation**
- Weekly accuracy audits (random samples), regression tests, red-teaming prompts, drift alerts.

---

## 8) Integrations (Phase 1 Targets)

- **Banking:** Plaid (US/EU), Wise (global).  
- **Payments:** Stripe, PayPal.  
- **Commerce:** Shopify (orders → income), WooCommerce (phase 2).  
- **Payroll:** Gusto (read-only totals).  
- **Migration:** CSV + QBO and Xero import starters.

---

## 9) UX System

- **Design Language:** Untitled UI components, grid 12 cols (1200px), 24px gutters.  
- **Modes:** Light/Dark; accessible color contrast with Gold accents.  
- **Patterns:** Empty-states with “Try it now” inline actions; inline explanations; persistent **“Start Free”** CTA on mobile.  
- **Key screens:** Dashboard, Transactions, Reconcile, Invoices, Expenses (OCR), Reports, Settings (Tax/Currency), Integrations, Accountant Workspace.

---

## 10) Security, Privacy, Compliance

- **PII/Financial Data:** AES-256 at rest; TLS 1.3 in transit; field-level encryption (tokens, account IDs).  
- **Access:** RBAC, MFA, device binding, session limits, IP allowlist (accountant plans).  
- **Data Residency:** US/EU/APAC buckets; per-tenant routing.  
- **Audit:** Immutable append-only log for every user/AI action; exportable.  
- **Compliance:** SOC2 readiness tasks, GDPR DPIA, vendor DPA reviews, incident playbooks.

---

## 11) Testing & Quality

**Test Pyramid**
- **Unit:** Ledger math, tax calc, FX rounding.  
- **Integration/E2E:** Ingestion → recon → report; auth flows; receipts → expense → tax.  
- **AI Evals:** Categorization F1, recon precision/recall, explanation quality rubric.  
- **Load:** 1M tx/day/cluster; bank spikes; OCR burst tests.  
- **Security:** SAST/DAST, dependency scans, pen test before GA.  
- **UAT:** 10 accountants/100 SMBs; blocker/critical must fix before GA.

---

## 12) Rollout & Ops

- **Environments:** Dev, Staging, Production (blue/green).  
- **Feature Flags:** Co-Pilot actions, ReconAI auto-post, importers by cohort.  
- **Runbooks:** Incident categories, severity matrix, on-call rotation, comms templates.  
- **Backups:** Hourly WAL, daily snapshot, cross-region; restore drills monthly.  
- **SLOs:** Availability 99.9%; P95 latency 2s; error budget policies.

---

## 13) Pricing & Packaging (Launch Draft)

- **Starter:** Free trial; 1 bank, 1 user, core reports.  
- **Pro:** $49–$79/mo; multi-bank, AI Co-Pilot, accountant access, marketplace.  
- **Enterprise:** Custom; SSO/SAML, data residency controls, priority support, compliance exports.

---

## 14) Analytics & Learning

- **Product:** Activation funnel (connect bank, post first invoice, first recon), feature adoption, churn reasons.  
- **AI:** Confidence vs. accuracy curves, human-correction types, drift metrics.  
- **GTM:** Source/medium attribution, demo → trial → paid cohorts, NPS by segment.

---

## 15) Risks & Mitigations

- **Bank feed instability** → multi-provider fallback; queue buffering; user alerts; resume jobs.  
- **AI misclassification** → confidence gates; inline approvals; rapid feedback learning.  
- **Jurisdiction complexity** → modular tax packs; staged rollout; expert review loop.  
- **Security/compliance** → third-party audit, pen tests, incident response drills.  
- **Scope creep** → strict P0/P1 gating; weekly cut review; feature flags.

---

## 16) Deliverables Checklist

- PRD (final), data model spec, API contracts, UI kit (Figma), icon set.  
- Runbooks: on-call, incident, rollback, migrations.  
- QA plans + test datasets, AI eval suites, accuracy dashboards.  
- Docs: user guides, migration guides, API docs, security whitepaper.  
- GTM: website/landing, demo video, case study, pricing page, partner kit.

---

## 17) Weekly Operating Rhythm

- **Mon:** Stand-up + risk review; unblock list.  
- **Wed:** Design/Dev sync; flag readiness.  
- **Thu:** AI evals + regression dashboard; accuracy deltas.  
- **Fri:** Demo & ship review; decision log updates; next-week plan.

---

## 18) Decision Log (append as list)
- [ ] 2025-10-__: MVP regions (US/EU/PH/JP) confirmed.  
- [ ] 2025-10-__: Plaid + Wise as phase-1 bank providers.  
- [ ] 2025-10-__: Confidence threshold 0.90 for autoposting (canary cohort first).

---

## 19) Open Questions (to resolve before W2)
- Which **tax forms & filings** are “must-have” for launch regions (read-only vs e-file)?  
- Which **bank/payment providers** by region (priority ordering)?  
- Final **trial/paid** conversion rules and usage limits for AI features.

---
