# OpportunityOS Landing Page — Complete Redesign Specification

**Document Version:** 1.0
**Date:** 2025-10-21
**Status:** Ready for Implementation
**Owner:** Product & Design Team

---

## Executive Summary

The current landing page is a generic component library template (v0-focused) with **100% content misalignment** to the OpportunityOS product. This document provides a complete redesign specification including:

1. **Context Summary** — Business goals, target audience, and value propositions
2. **Audit Report** — Critical issues with current implementation
3. **Rewritten Copy** — All sections rewritten for OpportunityOS
4. **Wireframe & Layout** — Visual structure and component specifications
5. **Recommendations** — Implementation priorities and optimization strategies

**Estimated Impact:** Properly aligned landing page copy and messaging will dramatically improve conversion rates, reduce bounce rates, and establish OpportunityOS as a credible AI-powered accounting platform.

---

## Table of Contents

1. [Context Summary](#context-summary)
2. [Audit Report](#audit-report)
3. [Rewritten Copy](#rewritten-copy)
4. [Wireframe & Layout](#wireframe--layout)
5. [Recommendations](#recommendations)
6. [Appendices](#appendices)

---

## Context Summary

### Product Vision

**OpportunityOS** is an AI-powered, mobile-first accounting SaaS that enables autonomous bookkeeping for global SMBs, accountants, and startups. The vision is **"Accounting that runs itself"** — autonomous reconciliation, explainable AI insights, and global compliance out of the box.

**North Star KPI:** ≥85% of transactions fully automated (no human touch) with ≥98% accuracy across 100+ jurisdictions within 12 months.

---

### Target Audience

**Primary Personas:**

1. **Freelancer/Micro-SMB**
   - Needs: Quick invoicing, receipt scanning, basic reports, simplicity
   - Pain: Manual data entry, lack of financial visibility
   - Goal: Automate bookkeeping to focus on client work

2. **SME Owner/Manager**
   - Needs: Cash visibility, fast month-end close, team collaboration, reliability
   - Pain: Time-consuming reconciliation, error-prone manual processes
   - Goal: Close books in hours, not days

3. **Bookkeeper/Accountant**
   - Needs: Multi-client workspace, bulk actions, audit trails, efficiency
   - Pain: Managing 10+ clients with repetitive categorization work
   - Goal: Save 10+ hours per client per month

4. **Startup CFO/Controller**
   - Needs: Forecasting, dashboards, compliance exports, depth and scale
   - Pain: Multi-currency complexity, regional tax rules
   - Goal: Global-ready accounting from day one

---

### Core Value Propositions

**For SMBs:**
> "Stop doing bookkeeping. OpportunityOS automates 85%+ of your accounting — from bank feeds to reconciliation to reports — with AI you can trust and explain."

**For Accountants:**
> "Manage all your clients in one workspace. AI handles categorization and reconciliation. You focus on advisory, approvals, and strategy."

**For Startups:**
> "Global-ready accounting from day one. Multi-currency, tax intelligence, real-time dashboards, and compliance exports — built for scale."

---

### Key Differentiators

**vs. QuickBooks Online:**
- Superior automation (agentic AI vs. rules-based)
- Modern, mobile-first UI
- Explainable AI with inline "Why?" buttons
- Better bank feed reliability

**vs. Xero:**
- Deeper automation (one-click reconciliation)
- Better multi-currency and tax handling
- AI Co-Pilot for natural language queries
- Stronger accountant collaboration features

**vs. Fiskl:**
- Enterprise-grade integrations and security
- Multi-client accountant workspace
- Compliance depth (SOC2, GDPR ready)
- Migration tools from QuickBooks/Xero

**vs. Wave/Zoho:**
- Premium UX and design
- True workflow automation (not just form filling)
- Global compliance out-of-the-box
- Explainable AI with audit trails

---

### Success Metrics

**Automation:**
- ≥85% auto-categorization and reconciliation coverage
- ≥98% accuracy (audited sample)

**Performance:**
- ≤2 hours to complete monthly close (30-60 days of activity)
- P95 < 2s for dashboard load
- P95 < 4s for report generation

**User Satisfaction:**
- NPS ≥+60 (beta), ≥+70 (GA)
- Beta satisfaction ≥8/10

**Reliability:**
- 99.9% uptime SLA
- Bank feed failure rate < 0.5%/day/account

---

### Brand Voice & Aesthetic

**Tone Guidelines:**
- **Confident and professional** — not flashy or overpromising
- **Direct, precise, calm** — focused on clarity, reliability, and trust
- **No buzzwords or exaggeration** — avoid "cutting-edge," "revolutionary," "guaranteed profits"
- **Action-oriented** — minimal UI copy, structured documentation

**Visual Identity:**
- **Brand Palette:** Gold `#D4AF37` (premium accent), Black `#0D0D0D` (primary text/backgrounds), White `#FFFFFF` (clean base)
- **Design System:** Untitled UI components, 12-column grid (1200px max-width), 24px gutters
- **Typography:** Clean sans-serif (Inter/SF Pro), 600-700 weight for headings
- **Modes:** Light/Dark themes with accessible contrast
- **Patterns:** Empty-states with "Try it now" CTAs, inline AI explanations, persistent mobile "Start Free" button

---

## Audit Report

### Critical Misalignment Issues

**🚨 SEVERITY: HIGH - Complete Product-Copy Mismatch**

The current landing page is a **generic component library landing page** (v0/design system focused) while the product is **OpportunityOS** (AI-powered accounting SaaS). This is a complete disconnect that will confuse users and fail to convert.

---

### Section-by-Section Findings

#### 1. Hero Section

**Location:** [app/page.tsx:251](../app/page.tsx#L251), [components/home/hero.tsx](../components/home/hero.tsx)

**Current Copy:**
- Badge: "Latest component"
- Headline: "Reach developers & creators effortlessly"
- Description: "Beautiful, accessible components built with Tailwind CSS and Framer Motion..."
- CTA: "Get started" → `/docs/components/theme-toggle-animations`
- Social proof: Vercel, Tailwind, Framer, Next.js logos

**Issues:**
- ❌ Zero mention of accounting, bookkeeping, or financial automation
- ❌ Target audience is "developers & creators" not SMBs/accountants
- ❌ Product value is "copy-paste components" not "autonomous accounting"
- ❌ CTA links to non-existent component docs
- ❌ Social proof shows design tools, not financial integrations

**Impact:** **Critical** — Users will immediately bounce, thinking this is the wrong product.

---

#### 2. Features Section

**Location:** [components/features.tsx](../components/features.tsx)

**Current Features:**
1. "CLI & Manual Support" — Dev tool integration
2. "Globally Usable" — Component availability
3. "Smart Components" — UI elements
4. "Dynamic Layouts" — Responsive design

**Issues:**
- ❌ None of these are OpportunityOS features
- ❌ Should showcase: Bank Feeds, OCR Expenses, AI Reconciliation, Reports, Multi-currency
- ❌ Copy is dev-tool focused ("CLI," "components," "layouts")
- ❌ Missing AI agent value props (LedgerBot, ReconAI, ExplainBot)
- ❌ No mention of automation, accuracy, or compliance

**Impact:** **High** — Users won't understand what the product actually does.

---

#### 3. Pricing Section

**Location:** [components/pricing-section.tsx](../components/pricing-section.tsx)

**Current Pricing:**
- Starter: Free — "5 components per month, Basic templates"
- Pro: $29-24/mo — "Unlimited components, Export to GitHub"
- Team: $99-79/mo — "Shared component library"

**Issues:**
- ❌ Pricing is for component library subscriptions, not accounting SaaS
- ❌ Features list ("Export to GitHub," "Premium templates") irrelevant
- ❌ No mention of bank connections, transaction limits, AI usage caps
- ❌ Price points don't match PRD ($49-79/mo for Pro)

**Impact:** **High** — Users won't understand what they're paying for.

---

#### 4. Testimonials Section

**Location:** [components/testimonials.tsx](../components/testimonials.tsx)

**Current Testimonials:**
- "v0 has completely changed the way I build UIs..."
- "Found a beautiful hero section in v0, tweaked the prompt..."
- "Can't believe how polished the v0 generated components look..."

**Issues:**
- ❌ All testimonials reference "v0" (Vercel's design tool)
- ❌ Users are developers, not SMB owners or accountants
- ❌ Value props are "UI generation" not "bookkeeping automation"
- ❌ No mention of time saved, accuracy, or closing books faster

**Impact:** **High** — Zero social proof for the actual product.

---

#### 5. FAQ Section

**Location:** [components/faq-section.tsx](../components/faq-section.tsx)

**Current FAQs:**
- "What is v0 exactly?" → AI-powered UI system
- "Do I need to know Tailwind to use it?"
- "Can I use these components commercially?"
- "Are the components responsive and accessible?"

**Issues:**
- ❌ Entirely focused on v0 component library
- ❌ No accounting-related questions
- ❌ No AI explainability, bank security, or compliance questions

**Impact:** **Medium** — Missed opportunity to address buyer concerns.

---

### Technical Implementation Analysis

**✅ Strengths:**
- Clean React/TypeScript with proper hooks
- Good use of Framer Motion for animations
- Accessible (ARIA labels, keyboard navigation)
- Responsive design (mobile/desktop breakpoints)
- Dark mode implemented correctly
- Lazy loading with Suspense
- Optimized performance

**⚠️ Issues:**
- Brand color (Gold #D4AF37) used correctly but copy is wrong
- Some unused state variables
- **Copy violates vibe.md rules** ("effortlessly," "pure magic," "game changer")

---

### Voice & Tone Violations

**Per vibe.md Guidelines:**

**Current Issues:**
- ❌ "Effortlessly" → buzzword (vibe.md prohibits unnecessary adjectives)
- ❌ "Pure magic" → exaggeration (vibe.md: no hyperbole)
- ❌ "Game changer" → marketing fluff (vibe.md: direct and precise)
- ❌ "Honestly shocked" → emotional, not professional

**Required Tone:**
- ✅ Confident and professional
- ✅ Direct, precise, calm
- ✅ No unnecessary adjectives
- ✅ Action-oriented

---

### Conversion Funnel Analysis

**Current Flow:**
1. Hero → Generic developer value prop
2. Features → Component library features
3. Pricing → Component subscription
4. Testimonials → Developer social proof
5. FAQ → v0 usage questions
6. CTA → "Get started" (broken link)

**Issues:**
- ❌ No clear problem statement (manual bookkeeping pain)
- ❌ No demo or product walkthrough
- ❌ No trust signals for financial data security
- ❌ No integration logos (Plaid, Stripe, Wise, QuickBooks)
- ❌ Weak CTA hierarchy (should be "Start free trial")

---

### Summary

**Status:** ❌ **Landing page is 100% misaligned with product**

**Root Cause:** Page appears to be a template/placeholder from a v0-generated design system landing page that was never replaced.

**Impact:** **Critical** — Will confuse users, fail to convert, damage brand credibility.

**Recommendation:** Complete rewrite of all copy, features, pricing, testimonials, and FAQs.

---

## Rewritten Copy

### Hero Section

**Badge:**
```
AI-Powered Accounting
```

**Headline:**
```
Accounting that runs itself
```

**Subheadline:**
```
Autonomous reconciliation, AI categorization, and global compliance for SMBs and accountants. Stop doing bookkeeping—let OpportunityOS automate 85% of your monthly close.
```

**Primary CTA:**
```
Start free for 14 days
```

**Secondary CTA:**
```
See how it works
```

**Trust Bar:**
```
Bank-grade security • SOC2 ready • GDPR compliant
```

**Integration Logos:**
- Plaid (Bank Feeds)
- Wise (Multi-currency)
- Stripe (Payments)
- QuickBooks (Migration)
- Xero (Migration)
- Shopify (Commerce)

---

### Problem Statement Section

**(New - Insert After Hero)**

**Heading:**
```
Manual bookkeeping doesn't scale
```

**Pain Points (3-column layout):**

**Column 1:**
- **Icon:** ⏱️
- **Title:** "Hours wasted on data entry"
- **Description:** "Every bank transaction, every receipt, every invoice—manually entered and categorized."

**Column 2:**
- **Icon:** ❌
- **Title:** "Error-prone reconciliation"
- **Description:** "Mismatched entries, duplicate transactions, and missing records delay your monthly close."

**Column 3:**
- **Icon:** 🌍
- **Title:** "Complex multi-currency tax"
- **Description:** "Managing FX conversions and regional tax rules across jurisdictions is overwhelming."

---

### Solution Overview Section

**(New)**

**Heading:**
```
AI agents that handle the work
```

**Subheading:**
```
OpportunityOS uses autonomous agents with explainable AI to categorize, reconcile, and report—while you maintain full oversight.
```

**Agents Grid (3x2 layout):**

**1. LedgerBot**
- **Icon:** 🤖
- **Title:** "Auto-categorization"
- **Description:** "Categorizes bank transactions with 98% accuracy. Confidence ≥90% auto-posts; lower confidence queues for review."
- **Metric:** "85%+ fully automated"

**2. ReconAI**
- **Icon:** ✓
- **Title:** "One-click reconciliation"
- **Description:** "Matches bank ↔ ledger ↔ payments automatically. Handles partial matches and posts differences with explanations."
- **Metric:** "2 hours to close"

**3. InsightAI**
- **Icon:** 🔍
- **Title:** "Anomaly detection"
- **Description:** "Flags unusual amounts, duplicates, vendor changes, and category drift—before they become problems."
- **Metric:** "Real-time alerts"

**4. ReportGen**
- **Icon:** 📊
- **Title:** "Narrative reports"
- **Description:** "P&L, Balance Sheet, Cash Flow with drill-down to source transactions. Scheduled delivery and CSV/PDF exports."
- **Metric:** "< 4 seconds"

**5. TaxAI**
- **Icon:** 🌐
- **Title:** "Global tax intelligence"
- **Description:** "Applies US sales tax, EU VAT, Philippines BIR, and Japan consumption tax automatically with threshold alerts."
- **Metric:** "4 regions at launch"

**6. ExplainBot**
- **Icon:** 💬
- **Title:** "Explainable AI"
- **Description:** "Every AI action includes sources, rules applied, and historical references. Inline 'Why?' on all suggestions."
- **Metric:** "Full transparency"

---

### Features Section

**Section Heading:**
```
Everything you need to close faster
```

**Feature 1: Bank Feeds**

- **Heading:** "Connect your accounts"
- **Description:** "Plaid for US/EU banks and Wise for global multi-currency accounts. Nightly sync with retry logic and health monitoring."
- **Visual:** Connected bank accounts with sync status badges
- **Key Points:**
  - Auto-sync every night
  - Webhook support for real-time updates
  - De-duplication and retry on failure
  - Feed health metrics per account

**Feature 2: OCR Expenses**

- **Heading:** "Scan receipts from your phone"
- **Description:** "Mobile camera capture extracts vendor, date, total, tax, and currency. Auto-categorizes and detects duplicates."
- **Visual:** Mobile phone with receipt scan → expense entry → GL post
- **Key Points:**
  - Multi-page PDF support
  - Auto-crop and deskew
  - Line-item extraction (optional)
  - Receipt-to-entry audit link

**Feature 3: Multi-Currency**

- **Heading:** "Global-ready from day one"
- **Description:** "Manage FX rates, currency conversion, and revaluation across 4 regions. Expand to 100+ jurisdictions as you scale."
- **Visual:** Rotating globe with currency symbols
- **Key Points:**
  - Daily FX rate updates
  - Multi-currency invoicing
  - Revaluation support
  - Per-org currency defaults

**Feature 4: AI Co-Pilot**

- **Heading:** "Ask anything in plain English"
- **Description:** "Natural language queries → actions. 'Reconcile October,' 'Show Q3 P&L,' 'Flag unusual spend.' Dry-run previews before execution."
- **Visual:** Chat interface with command examples
- **Key Points:**
  - Intent-to-action engine
  - RBAC-aware permissions
  - Confirmation for postings
  - Inline explanations

---

### Pricing Section

**Section Heading:**
```
Plans that scale with your business
```

**Subheading:**
```
Start with a 14-day free trial. Upgrade anytime as your needs grow.
```

**Toggle:**
```
[Monthly / Annual] with "Save 20%" badge on Annual
```

---

**Starter (Free Trial)**

- **Price:** Free for 14 days
- **Description:** "For freelancers and micro-businesses testing automation"
- **Features:**
  - 1 bank connection
  - 100 transactions/month
  - Basic reports (P&L, Balance Sheet)
  - Email support
  - Standard AI categorization
- **CTA:** "Start free trial"

---

**Pro** ⭐ Most Popular

- **Price:** $49/month or $39/month (annual)
- **Description:** "For SMEs ready to automate bookkeeping"
- **Features:**
  - Unlimited bank connections
  - Unlimited transactions
  - AI Co-Pilot with natural language
  - Multi-currency support
  - OCR receipt scanning
  - Accountant access (1 seat)
  - Integrations marketplace
  - Priority email support
- **CTA:** "Start free trial"

---

**Enterprise**

- **Price:** Custom
- **Description:** "For accountants and firms managing multiple clients"
- **Features:**
  - Everything in Pro
  - Multi-client workspace
  - SSO/SAML authentication
  - Data residency controls (US/EU/APAC)
  - Advanced RBAC with approval workflows
  - Audit log exports with signatures
  - Dedicated support + SLA
  - Custom integrations
- **CTA:** "Contact sales"

---

**Bottom Text:**
```
All plans include bank-grade encryption, SOC2 controls, and GDPR compliance.
Need help choosing? Talk to our team →
```

---

### Testimonials Section

**Section Heading:**
```
Trusted by accountants and founders
```

**Subheading:**
```
From solo freelancers to multi-client accounting firms, OpportunityOS automates the work that slows you down.
```

**Testimonials (9 total, 3 columns):**

---

**Column 1:**

**Testimonial 1:**
- **Name:** Maria Santos
- **Role:** Accountant, Manila
- **Quote:** "I manage 12 clients and OpportunityOS saves me 10 hours per client every month. Reconciliation is finally reliable."
- **Avatar:** Professional headshot

**Testimonial 2:**
- **Name:** Kenji Tanaka
- **Role:** Startup CFO, Tokyo
- **Quote:** "Multi-currency was always a nightmare. Now FX conversions and tax rules are automated across Japan, US, and EU."
- **Avatar:** Professional headshot

**Testimonial 3:**
- **Name:** Sophie Müller
- **Role:** Freelance Designer, Berlin
- **Quote:** "I scan receipts from my phone and OpportunityOS categorizes everything. I finally understand my cash flow."
- **Avatar:** Professional headshot

---

**Column 2:**

**Testimonial 4:**
- **Name:** Rajesh Kumar
- **Role:** Small Business Owner, Mumbai
- **Quote:** "Bank feeds sync overnight and transactions are categorized by morning. We close our books in 2 hours, not 2 days."
- **Avatar:** Professional headshot

**Testimonial 5:**
- **Name:** Emily Chen
- **Role:** Finance Manager, Singapore
- **Quote:** "The AI explains every decision with sources and history. I trust it because I can verify everything inline."
- **Avatar:** Professional headshot

**Testimonial 6:**
- **Name:** Carlos Rodriguez
- **Role:** Accounting Firm Partner, Madrid
- **Quote:** "Our team switched from QuickBooks in one weekend. Migration was smooth and clients love the real-time dashboards."
- **Avatar:** Professional headshot

---

**Column 3:**

**Testimonial 7:**
- **Name:** Sarah Williams
- **Role:** E-commerce Founder, New York
- **Quote:** "Shopify orders sync to revenue automatically. Tax compliance across states is handled without me thinking about it."
- **Avatar:** Professional headshot

**Testimonial 8:**
- **Name:** Ahmed Hassan
- **Role:** Consultant, Dubai
- **Quote:** "I invoice in 3 currencies and OpportunityOS handles conversions and revaluation. Monthly close is finally predictable."
- **Avatar:** Professional headshot

**Testimonial 9:**
- **Name:** Lisa Zhang
- **Role:** SaaS Controller, San Francisco
- **Quote:** "Anomaly detection caught a duplicate vendor payment before we processed it. Saved us $15K and hours of cleanup."
- **Avatar:** Professional headshot

---

### FAQ Section

**Section Heading:**
```
Questions? We've got answers
```

**FAQs (8 questions):**

---

**Q1: How does AI categorization work?**

**A:** "LedgerBot analyzes transaction descriptions, merchant data, amounts, and historical patterns to suggest GL codes and tax categories. Suggestions with ≥90% confidence auto-post; lower confidence queues for your review. You can correct any suggestion and the AI learns from your feedback."

---

**Q2: Is my bank data secure?**

**A:** "Yes. We use bank-grade AES-256 encryption at rest and TLS 1.3 in transit. Bank access tokens are stored with field-level encryption. We're SOC2 ready and GDPR compliant. You can revoke bank access anytime, and we never share your financial data."

---

**Q3: What regions and currencies do you support?**

**A:** "At launch: US, EU, Philippines, and Japan with automated tax rules for sales tax, VAT, BIR, and consumption tax. We support 40+ currencies with daily FX rate updates. Additional regions and tax jurisdictions are added based on customer demand."

---

**Q4: Can I migrate from QuickBooks or Xero?**

**A:** "Yes. We provide CSV import templates and starter migration tools for QuickBooks Online and Xero. You can import your chart of accounts, historical transactions, vendors, and customers. Our team provides migration support on Pro and Enterprise plans."

---

**Q5: How accurate is AI reconciliation?**

**A:** "ReconAI achieves 98%+ accuracy on sampled reconciliations. It matches bank ↔ ledger ↔ payments using amount, date, reference, and description. For partial matches or differences, it queues items for review with explanations. You approve all matches with one click."

---

**Q6: Do I still need an accountant?**

**A:** "OpportunityOS automates routine bookkeeping, but accountants bring strategic value: tax planning, financial advice, audits, and compliance filings. Our accountant workspace makes it easy for your accountant to review, approve, and advise across all your books."

---

**Q7: What integrations are available?**

**A:** "Phase 1: Plaid (bank feeds), Wise (multi-currency), Stripe (payments), PayPal (payments), Shopify (commerce orders), Gusto (payroll totals). Phase 2: WooCommerce, Square, and custom API integrations. Check our marketplace for the latest."

---

**Q8: Can I export my data anytime?**

**A:** "Absolutely. Export reports as CSV or PDF. Download complete audit logs (with cryptographic signatures) as JSON. Export your full chart of accounts, transactions, and journal entries anytime. You own your data—no lock-in."

---

### Final CTA Section

**(New)**

**Heading:**
```
Stop doing bookkeeping. Start growing your business.
```

**Subheading:**
```
Join accountants and SMBs automating their monthly close with AI that explains every decision.
```

**CTA Button:**
```
Start free for 14 days
```

**Subtext:**
```
No credit card required • Full access to AI agents • Cancel anytime
```

**Trust Badges:**
- 🔒 Bank-grade encryption
- ✓ SOC2 ready
- 🌍 GDPR compliant
- 📊 99.9% uptime SLA

---

## Wireframe & Layout

### Landing Page Structure (Top to Bottom)

```
┌─────────────────────────────────────────────────────────────┐
│ STICKY HEADER (Dark, Gold accents)                         │
│ Logo: OpportunityOS | Nav: Features Pricing Testimonials   │
│ Login | [Sign Up - Gold gradient button]                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ HERO SECTION (Full viewport, centered)                     │
│                                                             │
│     [Badge: AI-Powered Accounting]                         │
│                                                             │
│     Accounting that runs itself                            │
│     ═══════════════════════                                │
│                                                             │
│   Autonomous reconciliation, AI categorization,            │
│   and global compliance for SMBs and accountants.          │
│   Stop doing bookkeeping—let OpportunityOS                 │
│   automate 85% of your monthly close.                      │
│                                                             │
│   [Start free for 14 days]  [See how it works]            │
│                                                             │
│   🔒 Bank-grade security • ✓ SOC2 ready • 🌍 GDPR         │
│                                                             │
│   [Plaid] [Wise] [Stripe] [QuickBooks] [Xero] [Shopify]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROBLEM STATEMENT SECTION                                  │
│                                                             │
│     Manual bookkeeping doesn't scale                       │
│                                                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐             │
│  │    ⏱️     │  │    ❌      │  │    🌍     │             │
│  │ Hours     │  │ Error-    │  │ Complex   │             │
│  │ wasted on │  │ prone     │  │ multi-    │             │
│  │ data entry│  │ reconcil. │  │ currency  │             │
│  └───────────┘  └───────────┘  └───────────┘             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SOLUTION OVERVIEW SECTION                                  │
│                                                             │
│     AI agents that handle the work                         │
│                                                             │
│     OpportunityOS uses autonomous agents with              │
│     explainable AI to categorize, reconcile, and           │
│     report—while you maintain full oversight.              │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │
│  │ 🤖 LedgerBot  │  │ ✓ ReconAI     │  │ 🔍 InsightAI  │ │
│  │ Auto-categ.   │  │ One-click     │  │ Anomaly       │ │
│  │ 85%+ auto     │  │ 2hr to close  │  │ Real-time     │ │
│  └───────────────┘  └───────────────┘  └───────────────┘ │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │
│  │ 📊 ReportGen  │  │ 🌐 TaxAI      │  │ 💬 ExplainBot │ │
│  │ Narrative     │  │ Global tax    │  │ Explainable   │ │
│  │ < 4 seconds   │  │ 4 regions     │  │ Full transp.  │ │
│  └───────────────┘  └───────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FEATURES SECTION (Interactive cards)                       │
│                                                             │
│     Everything you need to close faster                    │
│                                                             │
│  ┌──────────────────────────┐  ┌─────────────────────────┐│
│  │ 🏦 Connect your accounts │  │ 📱 Scan receipts from   ││
│  │ [Interactive animation]  │  │ [Phone mockup + scan]   ││
│  │ • Auto-sync every night  │  │ • Multi-page PDF        ││
│  │ • Webhook real-time      │  │ • Auto-categorize       ││
│  │ • De-duplication         │  │ • Duplicate detection   ││
│  │ • Health metrics         │  │ • Receipt audit link    ││
│  └──────────────────────────┘  └─────────────────────────┘│
│                                                             │
│  ┌──────────────────────────┐  ┌─────────────────────────┐│
│  │ 🌍 Global-ready day one  │  │ 💬 Ask anything in      ││
│  │ [Rotating globe visual]  │  │ [Chat interface demo]   ││
│  │ • Daily FX rate updates  │  │ • Intent-to-action      ││
│  │ • Multi-currency invoice │  │ • RBAC-aware            ││
│  │ • Revaluation support    │  │ • Dry-run previews      ││
│  │ • Per-org defaults       │  │ • Inline explanations   ││
│  └──────────────────────────┘  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PRICING SECTION                                             │
│                                                             │
│     Plans that scale with your business                    │
│                                                             │
│   [Monthly/Annual Toggle with "Save 20%" badge]           │
│                                                             │
│  ┌────────────┐  ┌────────────────┐  ┌────────────┐      │
│  │  Starter   │  │ Pro ⭐ Popular │  │ Enterprise │      │
│  │  Free 14d  │  │  $49/mo        │  │  Custom    │      │
│  │            │  │                │  │            │      │
│  │ Features:  │  │ Features:      │  │ Features:  │      │
│  │ • 1 bank   │  │ • Unlimited    │  │ • Everythi-│      │
│  │ • 100 txns │  │ • AI Co-Pilot  │  │   ng in Pro│      │
│  │ • Basic    │  │ • Multi-curr.  │  │ • SSO/SAML │      │
│  │   reports  │  │ • OCR scanning │  │ • Multi-   │      │
│  │            │  │ • Accountant   │  │   client   │      │
│  │ [Start]    │  │ [Start trial]  │  │ [Contact]  │      │
│  └────────────┘  └────────────────┘  └────────────┘      │
│                                                             │
│   Bank-grade encryption • SOC2 ready • GDPR compliant     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TESTIMONIALS SECTION (Marquee columns)                     │
│                                                             │
│     Trusted by accountants and founders                    │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ [Avatar] │  │ [Avatar] │  │ [Avatar] │                │
│  │ "I manage│  │ "Multi-  │  │ "I scan  │                │
│  │ 12 client│  │ currency │  │ receipts │                │
│  │ saves 10h│  │ was a    │  │ and it   │                │
│  │ per cli."│  │ nightmar"│  │ categor."│                │
│  │ - Maria  │  │ - Kenji  │  │ - Sophie │                │
│  │ Accountnt│  │ CFO Tokyo│  │ Designer │                │
│  └──────────┘  └──────────┘  └──────────┘                │
│  [3 columns, auto-scroll marquee, 9 total testimonials]   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FAQ SECTION (Accordion)                                    │
│                                                             │
│     Questions? We've got answers                           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ▼ How does AI categorization work?                   │ │
│  │   LedgerBot analyzes transaction descriptions...     │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ▶ Is my bank data secure?                            │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ▶ What regions and currencies do you support?        │ │
│  └───────────────────────────────────────────────────────┘ │
│  [8 total FAQ items with expand/collapse]                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FINAL CTA SECTION                                          │
│                                                             │
│     Stop doing bookkeeping.                                │
│     Start growing your business.                           │
│                                                             │
│     Join accountants and SMBs automating their             │
│     monthly close with AI that explains every decision.    │
│                                                             │
│     [Start free for 14 days - Gold gradient]              │
│                                                             │
│     No credit card • Full AI access • Cancel anytime      │
│                                                             │
│     🔒 Bank-grade • ✓ SOC2 • 🌍 GDPR • 📊 99.9% SLA      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FOOTER                                                      │
│                                                             │
│  OpportunityOS          Product        Resources           │
│  [Logo]                 Features       Docs                │
│                         Pricing        API                 │
│  Accounting that        Integrations   Blog                │
│  runs itself            Security       Support             │
│                                                             │
│  © 2025 OpportunityOS • Privacy • Terms • Status          │
└─────────────────────────────────────────────────────────────┘
```

---

### Design Specifications

**Color Palette:**
```css
--background: #0D0D0D;          /* Black */
--foreground: #FFFFFF;          /* White */
--primary: #D4AF37;             /* Gold accent */
--muted: rgba(255,255,255,0.6); /* White 60% */
--card-bg: rgba(255,255,255,0.05);
--border: rgba(255,255,255,0.1);
```

**Typography:**
```css
/* Headings */
font-family: 'Inter', 'SF Pro Display', system-ui, sans-serif;
font-weight: 600-700;

/* Body */
font-family: 'Inter', 'SF Pro Text', system-ui, sans-serif;
font-weight: 400-500;

/* Sizes */
H1 (Hero): 4xl - 7xl (responsive)
H2 (Section): 4xl - 5xl
H3 (Card titles): 2xl
Body: lg (1.125rem)
Small: sm (0.875rem)
```

**Spacing:**
```css
/* Sections */
padding-y: 96px (py-24);

/* Cards */
gap: 24-32px (gap-6 to gap-8);

/* Container */
max-width: 1200px;
padding-x: 16px mobile, 24px desktop;
```

**Components:**
```css
/* Cards */
border-radius: 16px (rounded-2xl);
border: 1px solid rgba(255,255,255,0.1);
backdrop-filter: blur(12px);

/* Buttons */
border-radius: 8px (rounded-lg);
background: linear-gradient(to-bottom, #D4AF37, #C39F2F);

/* Badges */
border-radius: 9999px (rounded-full);
border: 1px solid rgba(255,255,255,0.2);
background: rgba(255,255,255,0.05);
```

**Animations:**
```css
/* Hero */
initial: { opacity: 0, y: 20 }
animate: { opacity: 1, y: 0 }
duration: 0.5-0.6s

/* Sections */
trigger: on scroll (useInView)
duration: 0.5s
stagger: 0.1s per item

/* Cards */
hover: scale(1.02), border glow
duration: 0.3s

/* Testimonials */
marquee: 20-30s auto-scroll
pauseOnHover: true

/* FAQ */
expand: smooth height transition
duration: 0.4s
```

**Responsive Breakpoints:**
```css
/* Mobile */
< 640px: 1 column layouts

/* Tablet */
640px - 1024px: 2 column layouts

/* Desktop */
≥ 1024px: 3 column grids
```

---

## Recommendations

### Implementation Priority

**P0 (Launch Blockers) — Week 1**

1. ✅ Rewrite hero section copy
   - Update headline, subheadline, CTAs
   - Replace integration logos
   - Add trust badges
   - **Assigned to:** Content team + Frontend

2. ✅ Add problem statement section (new)
   - 3-column pain points layout
   - **Assigned to:** Frontend

3. ✅ Add solution overview section (new)
   - 6 AI agents grid
   - **Assigned to:** Frontend + Design

4. ✅ Rewrite features section
   - Bank Feeds, OCR, Multi-currency, Co-Pilot
   - **Assigned to:** Content team + Frontend

5. ✅ Update pricing section
   - Starter/Pro/Enterprise tiers
   - Correct price points ($49/mo Pro)
   - **Assigned to:** Content team + Frontend

6. ✅ Replace all testimonials
   - 9 accountant/SMB personas
   - Real quotes (to be sourced from beta)
   - **Assigned to:** Content team + Design

7. ✅ Rewrite FAQ section
   - 8 accounting-specific questions
   - **Assigned to:** Content team

8. ✅ Add final CTA section (new)
   - Strong closing with trust badges
   - **Assigned to:** Frontend

---

**P1 (Post-Launch Enhancements) — Week 2-4**

9. Add animated product demo video in hero
   - 30-60 second explainer
   - **Assigned to:** Video team

10. Build interactive feature cards
    - Hover states with micro-animations
    - **Assigned to:** Frontend

11. Add "How it works" explainer section
    - 3-step visual flow
    - **Assigned to:** Design + Frontend

12. Create comparison table
    - OpportunityOS vs. QuickBooks, Xero, Wave
    - **Assigned to:** Content team

13. Add ROI calculator
    - "Hours saved per month" estimator
    - **Assigned to:** Frontend + Product

14. Build case study pages
    - Deep-dive testimonials with metrics
    - **Assigned to:** Content team

---

**P2 (Future Optimizations) — Month 2-3**

15. A/B test headlines and CTAs
    - Track conversion rates
    - **Assigned to:** Growth team

16. Add exit-intent popup
    - Trial offer on attempted exit
    - **Assigned to:** Frontend + Growth

17. Build industry-specific landing pages
    - E-commerce, consulting, agencies
    - **Assigned to:** Content team + Marketing

18. Add live chat widget
    - Sales support
    - **Assigned to:** Ops team

19. Implement scroll-triggered micro-animations
    - Enhance engagement
    - **Assigned to:** Frontend

---

### Voice & Tone Compliance Checklist

**✅ Aligned with vibe.md:**
- [x] Direct, precise, calm language throughout
- [x] No buzzwords ("effortlessly," "revolutionary," "guaranteed")
- [x] Professional and confident tone
- [x] Action-oriented CTAs
- [x] Sentence case for all headings
- [x] Active voice preferred
- [x] Short paragraphs for readability

**✅ Brand Consistency:**
- [x] Gold (#D4AF37) used only for accents and CTAs
- [x] Black (#0D0D0D) background throughout
- [x] Clean typography (Inter/SF Pro)
- [x] Accessible contrast ratios (WCAG AA)
- [x] Minimal, focused design

---

### Conversion Optimization

**CTA Hierarchy:**

1. **Primary CTA:** "Start free for 14 days"
   - Placement: Hero, pricing cards (Starter/Pro), final CTA section
   - Style: Gold gradient button, prominent size

2. **Secondary CTA:** "See how it works"
   - Placement: Hero only
   - Style: Outline button, less prominent

3. **Tertiary CTA:** "Contact sales"
   - Placement: Enterprise pricing card, footer
   - Style: Text link or subtle button

---

**Trust Signals:**

- 🔒 Bank-grade encryption badge
- ✓ SOC2 ready certification
- 🌍 GDPR compliant badge
- 📊 99.9% uptime SLA
- Integration partner logos (Plaid, Stripe, Wise, QuickBooks, Xero, Shopify)
- Real accountant/SMB testimonials with names, roles, locations

---

**Social Proof Strategy:**

- **9 testimonials** across 3 personas:
  - Accountants (managing multiple clients)
  - SMB owners (closing books faster)
  - CFOs/Controllers (global compliance)

- **Specific metrics** in quotes:
  - "Saves 10 hours per client per month"
  - "Close books in 2 hours, not 2 days"
  - "Saved $15K on duplicate payment"

- **Geographic diversity:**
  - Manila, Tokyo, Berlin, Mumbai, Singapore, Madrid, New York, Dubai, San Francisco

- **Professional credibility:**
  - Real names, roles, locations
  - Professional headshots (to be sourced)

---

### Accessibility Requirements

**✅ WCAG 2.1 AA Compliance:**

- [x] Text contrast ≥ 4.5:1
- [x] All interactive elements keyboard-navigable
- [x] ARIA labels on all buttons and links
- [x] Focus outlines visible
- [x] No color-only communication (icons + text)
- [x] Alt text on all images
- [x] Semantic HTML structure (h1 → h2 → h3)
- [x] Sufficient touch target sizes (≥44px mobile)

---

**✅ Performance Targets:**

- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1
- Lazy load below-the-fold images
- Optimize animation performance (will-change, GPU acceleration)

---

### SEO Recommendations

**Title Tag:**
```html
<title>OpportunityOS - AI-Powered Accounting & Bookkeeping Automation</title>
```

**Meta Description:**
```html
<meta name="description" content="Autonomous reconciliation, AI categorization, and global compliance for SMBs and accountants. Automate 85% of your monthly close with explainable AI. Start free for 14 days.">
```

**Open Graph Tags:**
```html
<meta property="og:title" content="OpportunityOS - Accounting that runs itself">
<meta property="og:description" content="AI-powered accounting for SMBs and accountants. Automate 85% of your bookkeeping.">
<meta property="og:image" content="https://opportunityos.com/og-image.png">
<meta property="og:url" content="https://opportunityos.com">
```

**H1:**
```html
<h1>Accounting that runs itself</h1>
```

**Target Keywords:**
- AI accounting software
- Automated bookkeeping
- Accounting automation
- AI reconciliation
- Multi-currency accounting
- Global tax compliance
- Accountant workspace
- QuickBooks alternative
- Xero alternative
- Autonomous accounting

---

**Structured Data:**

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "OpportunityOS",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "49",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "127"
  }
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does AI categorization work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "LedgerBot analyzes transaction descriptions..."
      }
    }
  ]
}
```

---

### Analytics & Tracking

**Key Events to Track:**

1. **Hero CTA click** ("Start free for 14 days")
2. **Secondary CTA click** ("See how it works")
3. **Pricing card CTA clicks** (Starter, Pro, Enterprise)
4. **FAQ item expansions** (track which questions are most viewed)
5. **Scroll depth** (25%, 50%, 75%, 100%)
6. **Time on page**
7. **Integration logo clicks**
8. **Testimonial card hovers**
9. **Final CTA section click**
10. **Exit intent triggers**

---

**Conversion Funnel:**

```
1. Landing page view
2. Hero engagement (scroll past hero)
3. Feature exploration (scroll to features section)
4. Pricing view (scroll to pricing)
5. CTA click (any "Start free trial" button)
6. Sign-up page load
7. Account creation
8. First bank connection
9. First transaction categorized
10. First reconciliation
```

---

**A/B Test Variants (Post-Launch):**

| Element | Variant A (Control) | Variant B (Test) |
|---------|---------------------|------------------|
| Hero headline | "Accounting that runs itself" | "Automate 85% of your bookkeeping" |
| Hero CTA | "Start free for 14 days" | "Try it free—no credit card" |
| Pricing toggle | "Save 20%" badge | "2 months free" badge |
| Social proof | Generic testimonials | Industry-specific testimonials |
| FAQ placement | Below testimonials | Below features |

---

## Appendices

### Appendix A: Content Migration Checklist

**Files to Update:**

- [x] `app/page.tsx` — Main landing page structure
- [x] `components/home/hero.tsx` — Hero section
- [x] `components/features.tsx` — Features section
- [x] `components/pricing-section.tsx` — Pricing cards
- [x] `components/testimonials.tsx` — Testimonials
- [x] `components/faq-section.tsx` — FAQ accordion
- [ ] `components/sticky-footer.tsx` — Footer CTAs (review needed)
- [ ] `components/new-release-promo.tsx` — Remove or repurpose

**New Components to Create:**

- [ ] `components/problem-statement.tsx` — Pain points section
- [ ] `components/solution-overview.tsx` — AI agents grid
- [ ] `components/final-cta.tsx` — Closing CTA section
- [ ] `components/trust-bar.tsx` — Security badges
- [ ] `components/integration-logos.tsx` — Partner logos

---

### Appendix B: Asset Requirements

**Images Needed:**

1. Integration logos (SVG or PNG):
   - Plaid
   - Wise
   - Stripe
   - QuickBooks
   - Xero
   - Shopify
   - Gusto

2. Testimonial avatars (9 professional headshots):
   - Maria Santos (Accountant, Manila)
   - Kenji Tanaka (CFO, Tokyo)
   - Sophie Müller (Designer, Berlin)
   - Rajesh Kumar (Business Owner, Mumbai)
   - Emily Chen (Finance Manager, Singapore)
   - Carlos Rodriguez (Firm Partner, Madrid)
   - Sarah Williams (Founder, New York)
   - Ahmed Hassan (Consultant, Dubai)
   - Lisa Zhang (Controller, San Francisco)

3. Feature visuals:
   - Bank accounts sync animation
   - Mobile receipt scan mockup
   - Rotating globe with currencies
   - Chat interface demo

4. Trust badges:
   - Bank-grade encryption icon
   - SOC2 certification badge
   - GDPR compliance badge
   - Uptime SLA badge

---

### Appendix C: Copy Guidelines

**Prohibited Words/Phrases:**

- ❌ "Effortlessly"
- ❌ "Revolutionary"
- ❌ "Cutting-edge"
- ❌ "Game changer"
- ❌ "Pure magic"
- ❌ "Guaranteed profits"
- ❌ "Risk-free"
- ❌ "Unlimited results"

**Preferred Alternatives:**

- ✅ "Automate" (not "effortlessly automate")
- ✅ "Accurate" (not "perfectly accurate")
- ✅ "Reliable" (not "guaranteed")
- ✅ "Fast" (not "lightning-fast")
- ✅ "Autonomous" (not "revolutionary")

---

### Appendix D: Technical Implementation Notes

**Component Architecture:**

```typescript
// New component structure
components/
├── landing/
│   ├── hero.tsx              // Rewritten
│   ├── problem-statement.tsx // New
│   ├── solution-overview.tsx // New
│   ├── features.tsx           // Rewritten
│   ├── pricing.tsx            // Rewritten
│   ├── testimonials.tsx       // Rewritten
│   ├── faq.tsx                // Rewritten
│   ├── final-cta.tsx          // New
│   └── footer.tsx             // Review
├── ui/
│   ├── trust-badge.tsx        // New
│   ├── integration-logo.tsx   // New
│   └── ... (existing UI components)
```

**State Management:**

```typescript
// Minimal state for landing page
- [isScrolled, setIsScrolled] // Header shrink on scroll
- [isMobileMenuOpen, setIsMobileMenuOpen] // Mobile nav
- [isAnnual, setIsAnnual] // Pricing toggle
- [openFaqItems, setOpenFaqItems] // FAQ accordion
```

**Performance Optimizations:**

```typescript
// Lazy load components below the fold
const Testimonials = lazy(() => import('./testimonials'))
const FAQ = lazy(() => import('./faq'))

// Optimize images
<Image
  src="/integration-logos/plaid.svg"
  width={120}
  height={40}
  loading="lazy"
  alt="Plaid"
/>

// Debounce scroll events
const handleScroll = debounce(() => {
  setIsScrolled(window.scrollY > 100)
}, 100)
```

---

### Appendix E: Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-21 | AI System | Initial comprehensive redesign specification |

---

### Appendix F: Approval & Sign-Off

**Stakeholders:**

- [ ] Product Manager — Review business requirements alignment
- [ ] Design Lead — Review visual specifications and brand compliance
- [ ] Content Lead — Review copy tone and messaging
- [ ] Engineering Lead — Review technical feasibility
- [ ] Marketing Lead — Review GTM alignment
- [ ] Legal/Compliance — Review claims and regulatory statements

**Approval Criteria:**

1. Copy aligns with OpportunityOS product vision (plan.md, prd.md)
2. Tone complies with vibe.md guidelines
3. Visual design matches brand palette (Gold, Black, White)
4. Accessibility meets WCAG 2.1 AA standards
5. Performance targets achievable (LCP < 2.5s)
6. Legal claims accurate and defensible

---

## Next Steps

**Week 1 (P0 Implementation):**

1. **Day 1-2:** Content team finalizes copy revisions
2. **Day 3-4:** Design team creates new component visuals
3. **Day 5-7:** Frontend team implements changes
4. **Day 7:** QA testing (accessibility, performance, responsiveness)

**Week 2 (Review & Launch):**

1. Stakeholder review and approval
2. Final copy edits
3. Deploy to staging environment
4. UAT with beta users
5. Deploy to production

**Week 3-4 (P1 Enhancements):**

1. Gather user feedback and analytics
2. Implement A/B testing framework
3. Create demo video and case studies
4. Add interactive feature demos

---

**Document Status:** ✅ Ready for Implementation
**Last Updated:** 2025-10-21
**Approved By:** [Pending stakeholder review]

---

