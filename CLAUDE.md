# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.5+ application built with TypeScript, React 19, and Tailwind CSS v4, intended as an **AI-powered accounting SaaS platform (OpportunityOS)**. The project uses the App Router architecture with Turbopack for development and build optimization.

**Product Vision:** Accounting that runs itself—autonomous reconciliation, explainable insights, and global compliance out of the box.

**Primary Goal:** Ship an MVP that automates ≥85% of day-to-day bookkeeping with ≥98% accuracy across initial regions (US, EU, PH, JP), while demonstrating reliable bank feeds and one-click reconciliation.

**Brand Palette:** Gold `#D4AF37`, Black `#0D0D0D`, White `#FFFFFF`

## Development Commands

**Package Manager**: This project uses `pnpm`.

```bash
# Start development server with Turbopack
pnpm dev

# Build for production with Turbopack
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Install dependencies
pnpm install
```

The development server runs on http://localhost:3000 by default.

## Technology Stack

- **Framework**: Next.js 15.5.6 (App Router)
- **React**: 19.1.0
- **TypeScript**: v5 with strict mode enabled
- **Styling**: Tailwind CSS v4 with PostCSS
- **Font**: Geist (sans & mono) via next/font
- **Planned Integrations**: Supabase (auth, database, storage), Shadcn UI, Radix UI

## Architecture & Organization

### Multi-Tenant Design
- **Every data model must include `org_id`** - all queries and mutations must scope by `org_id`
- Role hierarchy: `owner`, `admin`, `accountant`, `staff`, `viewer` stored in `org_members` table
- Storage buckets use per-org folder prefixes (e.g., `/org_id/receipts/`, `/org_id/invoices/`)

### Planned Directory Structure
The project is designed to scale into the following domain-driven structure:

```
app/
├── (marketing)/          # Public marketing pages
├── dashboard/            # Main dashboard with KPIs and charts
├── transactions/         # Transaction list and management
├── ledger/              # General ledger and journal entries
├── accounts/            # Chart of accounts management
├── bank-feeds/          # Bank connection and sync
├── invoices/            # Invoicing and AR
├── expenses/            # Expense tracking and OCR
├── reconciliation/      # Reconciliation workflows
├── reports/             # P&L, Balance Sheet, Cash Flow
├── integrations/        # Integration marketplace
├── accountant/          # Multi-client workspace for accountants
└── settings/            # Org settings, tax, currency

features/
├── auth/                # Authentication flows
├── ai-agents/           # LedgerBot, ReconAI, InsightAI, ExplainBot
├── categorization/      # Auto-categorization engine
├── reconciliation/      # Reconciliation engine
└── copilot/            # AI Co-Pilot chat interface

lib/
├── supabase/
│   ├── server.ts        # Server-side Supabase client
│   └── client.ts        # Client-side Supabase client
├── auth/                # Auth utilities
├── rls/                 # Row Level Security helpers
├── audit/               # Audit logging
├── crypto/              # Encryption for sensitive data
├── ai/                  # OpenAI and LangGraph utilities
├── ocr/                 # OCR processing
├── pdf/                 # PDF generation for reports
├── emails/              # Email service integration
└── integrations/        # Bank, payment, commerce APIs
```

### Path Aliases
- `@/*` maps to the project root (configured in tsconfig.json)

## Key Architectural Patterns

### Supabase Integration
- **Never access Supabase directly in components** - use server actions or API routes
- Separate server and client environments via `lib/supabase/server.ts` and `lib/supabase/client.ts`
- **Enable Row Level Security (RLS) on every table** - validate via `auth.uid()` and enforce `org_id` scoping
- Use `anon` key for client-side safe queries only; `service_role` key server-side only
- Store environment variables in `.env.local` for development

### Security Requirements
- **Encrypt sensitive financial data**: Bank access tokens, tax IDs, payment gateway credentials
- **Field-level encryption** for PII and sensitive account information
- **Audit all sensitive actions**: Journal entry posts, reconciliation approvals, bank connections, data exports, permission changes
- Audit logs must include: `org_id`, actor (`user_id` or `ai_agent`), action, timestamp, entity type, entity ID, minimal diffs
- **Storage policies**: enforce read/write by org membership and role via RLS
- Generate sensitive exports (reports, audit logs) server-side with short-lived signed URLs (15 mins for exports)
- Validate all inputs with `zod`
- **Immutable audit logs**: append-only table with cryptographic signatures

### AI Agent Framework
Core AI agents with autonomous workflows under guardrails:

**LedgerBot** - Categorization Agent
- Auto-categorize bank transactions based on merchant, description, amount patterns
- Confidence threshold: ≥0.90 for auto-post, else queue for review
- Provide explainable reasoning with source references

**ReconAI** - Reconciliation Agent
- Automated matching: bank ↔ ledger ↔ payments
- One-click approve for high-confidence matches
- Handle partial matches and difference posting

**InsightAI** - Anomaly Detection Agent
- Detect unusual amounts, duplicates, vendor changes, category drift
- Surface alerts with severity levels
- Notify-only (no autonomous actions)

**ReportGen** - Report Generation Agent
- Generate P&L, Balance Sheet, Cash Flow reports
- Add narrative summaries with insights
- Schedule recurring reports

**TaxAI** - Tax Calculation Agent
- Apply jurisdiction-specific tax rules
- Calculate VAT, sales tax, withholding tax
- Alert on threshold triggers and filing deadlines

**ExplainBot** - Explainability Agent
- Provide plain English explanations for AI actions
- Link to source rules, historical transactions, and documentation
- Inline "Why?" button on all AI suggestions

### Automated Jobs (Supabase Edge Functions + Cron)
- **Daily bank sync** (2 AM): Fetch transactions from all connected accounts
- **Nightly auto-categorization** (3 AM): Run LedgerBot on uncategorized transactions
- **Weekly reconciliation** (Sundays): Run ReconAI for all accounts
- **Daily FX rate updates** (1 AM): Fetch latest exchange rates
- **Invoice dunning**: Send payment reminders for overdue invoices
- **Anomaly detection**: Run InsightAI continuously

**All scheduled jobs must be idempotent** per `(org_id, period_id)` or equivalent key.

## Code Style & Conventions

### TypeScript
- All code must be TypeScript with strict mode enabled
- Use **interfaces** (not types) for object shapes
- Avoid enums; use plain object maps
- Avoid `any`; prefer `unknown` or explicit types
- File structure: exported component → subcomponents → helpers → static → types

### Naming
- Directories: lowercase with dashes (e.g., `components/auth-wizard`)
- Components: use named exports
- Variables: descriptive with auxiliary verbs (e.g., `isLoading`, `hasError`)

### React Patterns
- Prefer **Server Components** over Client Components
- Minimize use of `'use client'`, `useEffect`, and `useState`
- Use Server Actions with `useFormState` and `useFormStatus`
- Use `useOptimistic` for lightweight interactive state
- Wrap Client Components in `<Suspense>` with fallbacks
- Avoid global state libraries unless necessary

### UI & Styling
- Use **Shadcn UI + Radix** for components
- Tailwind CSS for all styling (mobile-first, responsive)
- Support dark mode with `dark:` variants
- Ensure accessibility: proper `aria-*`, focus handling, keyboard support
- Optimize images: use WebP, include dimensions, lazy-load

### Performance
- Optimize Core Web Vitals (LCP, CLS, FID)
- Lazy load non-critical components
- Return only required fields from database queries

### Linting & Validation
- ESLint configured with Next.js best practices
- TypeScript strict mode enforced
- All inputs validated with `zod`
- `pnpm dev` should start cleanly with no TypeScript errors

## Core Features (MVP Scope)

### P0 - Must Have for Launch
- **General Ledger & Chart of Accounts**: Industry/region templates, double-entry validation
- **Bank Feeds**: Plaid (US/EU) and Wise (global) integration with auto-sync
- **OCR Expenses**: Mobile camera capture, receipt extraction, auto-categorization
- **Invoicing & Payments**: Stripe/PayPal integration, auto-matching, dunning emails
- **Reconciliation Engine**: One-click ReconAI with explainable matches
- **Reports**: P&L, Balance Sheet, Cash Flow (with drill-down and exports)
- **AI Co-Pilot**: Natural language queries → actions with dry-run previews
- **Multi-currency**: FX rate management, currency conversion, revaluation
- **Regional Tax Presets**: US sales tax, EU VAT, Philippines BIR, Japan consumption tax
- **RBAC**: Owner, Admin, Accountant, Staff, Viewer roles with permission matrix
- **Accountant Workspace**: Multi-client management, task assignments, approvals
- **Import/Export**: CSV, QuickBooks Online, Xero migration tools

### P1 - Near-Term Enhancements
- Anomaly detection with InsightAI
- Cash flow forecasting
- Integration marketplace v1 (Shopify, Gusto, WooCommerce)
- Approval workflows for journal entries
- Custom report builder
- Period close and locking

### P2 - Future Roadmap
- Predictive tax filing
- Voice Co-Pilot
- Industry-specific plug-ins
- Advanced analytics packs
- Native mobile apps (iOS, Android)
- Additional regions and e-filing integrations

## Success Metrics

**Automation Coverage:** ≥85% of transactions auto-categorized and reconciled
**Accuracy:** ≥98% correct category/reconciliation suggestions (audited sample)
**Time to Close:** ≤2 hours for typical small ledger (30-60 days of activity)
**Performance:** P95 < 2s for main dashboard, < 4s for report generation
**NPS:** ≥+60 beta, ≥+70 public GA
**Reliability:** 99.9% uptime; bank feed failure rate < 0.5%/day/account

## Integration Ecosystem

### Banking & Payments
- **Plaid**: US and EU bank connections
- **Wise**: Global multi-currency accounts
- **Stripe**: Payment processing and invoicing
- **PayPal**: Payment gateway integration

### Commerce & Payroll
- **Shopify**: Order sync to revenue
- **WooCommerce**: E-commerce integration (P1)
- **Gusto**: Payroll totals (read-only)
- **Square**: POS integration (P2)

### Migration & Accounting
- **CSV Import**: Flexible templates
- **QuickBooks Online**: Full data migration
- **Xero**: Full data migration

## Scalability Target
Aim to support **1M transactions/day/cluster** and **10k concurrent users** for v1 without degraded performance.
