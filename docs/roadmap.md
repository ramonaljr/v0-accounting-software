Accounting Roadmap (ERPNext Parity)
===================================

Purpose
-------
- Deliver full, production‑grade accounting with ERPNext parity where feasible.
- Use ERPNext as the system of record for financial postings; our app provides UX, workflows, automation, and reporting over a synced data model.
- Phase the work to de‑risk delivery and allow incremental validation with real data.

Guiding Principles
------------------
- Double‑entry correctness first; never post an unbalanced JE.
- Write‑through to ERPNext on authoritative events; read‑replicate for analytics and UX.
- Clear id mappings for every synced entity; deterministic retries; observable sync.
- Role‑based access, audit log, period locks, and environment‑gated destructive actions.
- Always reconcile reports to ERPNext to the cent for a given period.

Cross‑Cutting Components (All Phases)
-------------------------------------
- Mapping Tables: `erp_map(entity, our_id, erp_doctype, erp_name, last_synced_at, hash)`.
- Sync Infra: job queue, retries with backoff, dead‑letter, manual retry, diff viewer.
- Health: sync dashboard, per‑entity gauges, error drill‑downs, webhooks log.
- Security: RLS policies, per‑org isolation, permission matrix, tamper‑evident audit.
- Test Data: seed org, accounts, items, vendors, customers; golden datasets per phase.

Phase 0 — Foundation & Config
-----------------------------
Goals
- Wire ERPNext credentials, base URL, feature flag; confirm connectivity.
- Establish id mapping, audit logging, and background jobs.

Scope
- Env: `ERPNEXT_BASE_URL`, `ERPNEXT_API_KEY`, `ERPNEXT_API_SECRET` (done).
- Health: WhoAmI endpoint and connectivity test (done).
- Tables: `erp_map`, `sync_events`, `audit_log`.
- Jobs: generic `erp_push` and `erp_pull` with backoff and DLQ.

Deliverables
- API: `/api/integrations/erpnext/*` namespace and auth middleware.
- UI: Integration settings page with check/rotate keys, sync status, recent errors.
- Tests: integration smoke tests for auth and basic pull.

Phase 1 — Core Double‑Entry
----------------------------
Goals
- Chart of Accounts (COA) + Opening Balances + Periods and Locks.
- Journal Entry (create/post/reverse) with attachments and approvals.

ERPNext Parity
- Doctypes: `Company`, `Account`, `Cost Center`, `Fiscal Year`, `Period Closing Voucher`, `Journal Entry`, `Journal Entry Account`.
- Features to include beyond current project: period closing voucher, cost centers, accounting dimensions (baseline), journal reversal.

Deliverables
- DB: `accounts`, `periods`, `journal_entries`, `journal_lines`, `cost_centers`, `attachments` (exists for many; extend as needed).
- API: COA CRUD, JE post/reverse, open/close period, opening balances wizard (posts JE: opening entry).
- Sync: write‑through JEs to ERPNext; COA sync (import/refresh from ERPNext or push template).
- UI: COA list/tree, JE new/detail/list, period management, opening balance wizard.
- Tests: balance validation; JE round‑trip equals ERPNext JE within tolerance.

Phase 2 — Banking & Reconciliation
----------------------------------
Goals
- Bank accounts, feeds (Plaid/Wise/CSV), categorization rules, and reconciliation.

ERPNext Parity
- Doctypes: `Bank Account`, `Bank Transaction`, `Payment Entry` (received/paid), Statement Import; Bank Reconciliation Tool parity.
- Features to include: bank clearance date, statement import (CSV/OFX/QIF), reconciliation report, multi-currency bank handling.

Deliverables
- DB: `bank_accounts`, `bank_transactions`, `categorization_rules`, `reconciliation_matches`.
- API: import feeds/CSV, rule engine, suggest matches, auto-post `Payment Entry` (canonical) or JE when required, clearance date support.
- Sync: push Payment Entry/JE to ERPNext; optional pull of bank transactions; id-mapped bank accounts.
- UI: Bank feed inbox, rules UI, reconciliation workspace, exception queue.
- Metrics: auto-match rate, settlement latency, time-to-reconcile; audit trail for each match.

Phase 2.5 — Auto‑Reconciliation Engine (Rules + ML)
---------------------------------------------------
Goals
- Automatically match bank transactions to invoices, bills, payment entries, and JEs.
- Support one‑to‑one, one‑to‑many, and many‑to‑one matching; handle splits and fee lines.
- Auto‑post high‑confidence matches; queue medium confidence for review.

Deterministic Rules (baseline)
- Exact amount and currency match; tolerance bands (e.g., ±$0.50, ±2 days).
- Payee/memo token match to known customer/supplier; check/reference numbers.
- Known gateway patterns (Stripe/Square/PayPal payouts and fees) via templates.
- Historical mapping memory (counterparty/description → prior GL account/doc type).

ML Scoring (assist)
- Features: amount delta, date gap, token similarity (n‑gram/Jaccard), historical mapping, open balance ratio, recurrence, currency/FX.
- Candidate ranking: top‑k per transaction; calibrated thresholds per org.
- Active learning: capture user corrections; nightly retrain; version models.
- Explainability: show reasons for suggestion; confidence bands.

Deliverables
- DB: `reconciliation_candidates`, `reconciliation_models`, `reconciliation_feedback`.
- Jobs: candidate generation, nightly retrain, threshold tuning, backtesting harness.
- API/UI: suggestions with reasons; one‑click apply/split; fee line auto‑create; audit trail.
- Metrics: precision@auto (>99.9%), precision@review (>95%), recall@top3 (>98%), false‑auto‑post <0.1%.

Phase 3 — Accounts Receivable (AR)
----------------------------------
Goals
- Customers, items, price lists; Sales Invoices; customer payments; credit notes; aging.

ERPNext Parity
- Doctypes: `Customer`, `Item`, `Item Group`, `Sales Invoice`, `Payment Entry`, `Credit Note`, `Pricing Rule`, `Payment Terms`, `Dunning`.
- Include: credit limits enforcement, dunning flows, payment terms schedules, early‑payment discount, advances allocation.

Deliverables
- DB: `customers`, `items`, `item_prices`, `sales_invoices`, `invoice_lines`, `payments`.
- API: create SI, `Payment Entry` (Receive), allocate to invoices/advances, credit note; enforce credit limit; send invoice; payment link; payment terms schedule application and early‑payment discount posting.
- Sync: write SI/Payment/Credit to ERPNext; read state (submitted/cancelled), dunning status.
- UI: Customers, Items, Invoices list/detail, Receive Payment, Aging (with credit limit flags).

Phase 4 — Accounts Payable (AP)
-------------------------------
Goals
- Suppliers, purchase invoices, bill payments, credits, 1099 support (US).

ERPNext Parity
- Doctypes: `Supplier`, `Supplier Group`, `Purchase Invoice`, `Payment Entry`.
- Include: hold/unhold invoice, payment terms schedule, early‑payment discount, debit notes/returns, vendor credits.

Deliverables
- DB: `suppliers`, `bills`, `bill_lines`, `vendor_payments`, `vendor_credits`.
- API: create bill, `Payment Entry` (Pay), apply vendor credit/debit note, 1099 export; support withholding at payment when configured.
- Sync: push PIs and payments; pull bill status/holds from ERPNext.
- UI: Vendors, Bills, Pay Bills, AP Aging with holds/credits.

Phase 5 — Taxes & Compliance
----------------------------
Goals
- Sales tax/VAT/GST; tax templates; returns and filings; rounding.

ERPNext Parity
- Doctypes: `Tax Category`, `Sales Taxes and Charges Template`, `Purchase Taxes and Charges Template`, `Tax Rule`.
- Include: retention, withholding (TDS/TCS) integrated with `Payment Entry`, EU OSS/IOSS options, reverse charge, tax registers and returns.

- Deliverables
- DB: `tax_templates`, `tax_rules`, `jurisdictions`, `returns`.
- API: tax calculation service; return preparation; withholding/retention and reverse‑charge handling; JE postings for rounding/exchange differences.
- UI: Tax setup, tax on invoice/bill, returns dashboard with exports.

Phase 6 — Inventory & COGS (Perpetual)
--------------------------------------
Goals
- Items, warehouses, stock ledger, valuation (FIFO/Avg), stock entries, COGS integration.

ERPNext Parity
- Doctypes: `Warehouse`, `Stock Ledger Entry`, `Stock Entry`, `Delivery Note`, `Purchase Receipt`, `Item Price`, `Landed Cost Voucher`, `Stock Reconciliation`.
- Include: landed cost capitalization, valuation method per item (Avg/FIFO), stock reconciliation, cost of goods sold JE generation.

Deliverables
- DB: `warehouses`, `stock_ledger`, `stock_entries`, `item_prices`.
- API: post delivery/purchase receipts; LCV application; stock reconciliation; auto‑create GL entries for COGS.
- Sync: push stock docs to ERPNext; pull GL/stock as needed to tie.
- UI: Inventory overview, stock movements, valuation report.

Phase 7 — Fixed Assets
----------------------
Goals
- Asset register, capitalization, depreciation schedule, disposals, CWIP.

ERPNext Parity
- Doctypes: `Asset`, `Asset Category`, `Depreciation Schedule`, `Asset Movement`.
- Include: component depreciation, asset capitalization from PI, revaluation, disposal (gain/loss) with JE and movement entries.

Deliverables
- DB: `assets`, `asset_categories`, `depreciation_jobs`.
- API: create asset from PI; schedule depreciation; post monthly JEs; revaluation; disposals with movement trail.
- Sync: push assets and depreciation/revaluation JEs; pull state from ERPNext.
- UI: Asset list/detail, schedules, disposal wizard.

Phase 8 — Multi‑Currency & FX
------------------------------
Goals
- Currency tables, exchange rates, realized/unrealized gains/losses, revaluation.

ERPNext Parity
- Doctypes: `Currency`, `Currency Exchange`, `Exchange Rate Revaluation`.
- Include: multi‑currency invoices/payments, bank FX, revaluation JEs.

Deliverables
- DB: `currencies`, `fx_rates`, `fx_revaluations`.
- API: FX calc service; scheduled Exchange Rate Revaluation job (unrealized); realized FX on settlement; postings for banks and AR/AP.
- UI: Currency setup, FX exposure, revaluation run.

Phase 9 — Financial Reporting
-----------------------------
Goals
- GL, Trial Balance, PL, BS, Cash Flow, AR/AP Aging, audit drill‑downs.

ERPNext Parity
- Reports parity and tie‑outs to ERPNext financial statements.

Deliverables
- DB: materialized views or rollups for performance.
- API: reporting endpoints with dimension filters (period, basis, org, cost center, currency).
- UI: Reports with drill‑through to source docs; export CSV/PDF.
- Validation: automated tie‑out test vs. ERPNext GL for selected periods.

Phase 10 — Automation & Workflows
---------------------------------
Goals
- Scheduled jobs, approvals, notifications, OCR pipeline, auto‑categorization.

ERPNext Parity
- Include: approval workflows for JEs/Invoices/Bills/Payment Entries; assignments and reminders; scheduled jobs (depreciation, revaluation, recurrences, dunning).

Deliverables
- DB: `approvals`, `workflows`, `notifications`, `ocr_queue`.
- API: rule engine; multi‑step approval definitions; webhook processors; dunning scheduler.
- UI: approval inbox; automation center; audit log views; escalation policies.

Phase 11 — Budgets, Cost Centers, Dimensions
--------------------------------------------
Goals
- Budgets per account/cost center/project; variance; dimensional reporting.

ERPNext Parity
- Doctypes: `Budget`, `Cost Center`, `Accounting Dimension`.

Deliverables
- DB: `budgets`, `dimensions` (project, department, location).
- API/UI: budget setup, variance reports; enforcement policies (warn/block) at draft/submit.

Phase 12 — Period Close & Audit
-------------------------------
Goals
- Year‑end closing to retained earnings; audit log; freeze/lock periods.

ERPNext Parity
- Doctypes: `Period Closing Voucher`, `GL Entry` audits, freeze settings.

Deliverables
- API: close year wizard; JE postings; lock enforcement.
- UI: close period flow; audit trails and change history.

Phase 13 — Advanced & Localizations
-----------------------------------
Goals
- Deferred revenue/expense, subscription recognition, withholding tax, and regional add‑ons.

ERPNext Parity
- Doctypes: `Deferred Revenue`, `Deferred Expense`, TDS/TCS, e‑invoicing connectors.

Deliverables
- Jobs: monthly recognition JEs; withholding on payments; localization toggles.

Data Model & Sync Notes
-----------------------
- Every our‑side record that maps to ERPNext must have a stable `erp_map` entry.
- On update, compute a content hash to avoid noisy syncs; only post diffs.
- Handle hard deletes as soft deletes with `archived_at` unless ERPNext forbids.
- Provide manual resync per object and bulk re‑pull for a date range.

Security & Compliance
---------------------
- RLS for all tables; per‑role permissions; sensitive columns encrypted at rest.
- Tamper‑evident audit log with hash chain per org.
- Backups and restore runbook; migration versioning and checksum verification.

Phase 10A — AI Automation & Insights
------------------------------------
Goals
- Reduce manual work across categorization, reconciliation, and explanations; provide trustworthy AI copilots.

Scopes
- Categorization: GL account and tax suggestion for expenses/bank transactions with justification.
- Reconciliation assist: rank candidates, propose splits/fees; natural‑language rationale.
- JE generation proposals: from natural language or patterns (accruals/deferrals).
- OCR and document AI: extract from receipts/bills/invoices, map to items/accounts.
- Anomaly detection: outliers in spend/revenue, unusual postings, duplicate payments.

Architecture
- Providers: OpenAI (pluggable), with strict PII minimization and redaction.
- Guardrails: token budgets, allowlist prompts, safe retries, deterministic fallbacks.
- Feature store for signals; feedback loop captures accepts/edits/rejects.
- A/B evaluation and offline test sets per org/industry.

Deliverables
- DB: `ai_suggestions` (type, payload, confidence, reasons), `ai_feedback`, `anomalies`.
- Jobs: nightly anomaly detection, suggestions refresh, drift monitoring.
- API/UI: suggestion banners, inline accept/apply, “Explain this JE/variance” actions.
- Metrics: suggestion acceptance rate (>60%), time‑saved per task, anomaly precision (>90%).

Validation & Success Metrics
----------------------------
- JE correctness: 100% balanced; reversal symmetry; period lock respected.
- AI Assist: suggestion acceptance rate >60%; average time saved >40%; false‑positive anomaly <10%.
- Reconciliation: >95% auto-match on seeded dataset; <2m time-to-first-match; >90% auto‑settlement via Payment Entry on simple cases.
- Reporting: 100% tie‑out vs. ERPNext for selected months across PL/BS/TB.
- Sync reliability: <0.5% DLQ rate; 99.9% eventual consistency within 60s.

Appendix — Key ERPNext Doctypes (Reference)
-------------------------------------------
- Company, Fiscal Year, Period Closing Voucher
- Account, Cost Center, Accounting Dimension
- Journal Entry, Payment Entry, Sales Invoice, Purchase Invoice, Credit Note
- Customer, Supplier, Item, Item Group, Item Price
- Warehouse, Stock Entry, Delivery Note, Purchase Receipt, Stock Ledger Entry, Landed Cost Voucher, Stock Reconciliation
- Tax Category, Sales/Purchase Taxes and Charges Template, Tax Rule
- Bank Account, Bank Transaction, Payment Entry, Reconciliation Tool
- Asset, Asset Category, Depreciation Schedule
- Currency, Currency Exchange, Exchange Rate Revaluation
- Budget, Pricing Rule, Payment Terms, Dunning
