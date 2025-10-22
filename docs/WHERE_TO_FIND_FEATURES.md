# Where to Find Implemented Features

**Last Updated:** 2025-10-22
**Development Server:** http://localhost:3004

This guide explains where to find all the implemented features from Phases 0-19 of the accounting software.

---

## 🎯 Quick Navigation Guide

### The Application Has 3 Main Areas:

1. **Dashboard** (`/dashboard`) - Summary tiles and widgets
2. **Navigation Sidebar** - Full-featured pages (click "My apps" icon in left sidebar)
3. **Direct Routes** - Specific feature pages

---

## 📍 How to Navigate the Application

### Step 1: Access the Application
- Open your browser to: **http://localhost:3004**
- You should see the landing page

### Step 2: Navigate to Dashboard
- **Primary Sidebar** (narrow left sidebar) has a "Dashboard" icon
- Click it to go to `/dashboard`
- **OR** directly navigate to: http://localhost:3004/dashboard

### Step 3: Access Full Features via "My Apps"
- Click the **"My apps"** icon (grid icon) in the primary sidebar
- This opens the **Secondary Sidebar** with all application sections
- You'll see these sections:
  - 🆕 **AI & Automation** (NEW - Purple badge)
  - Accounting
  - Expenses & Bills
  - Sales & Get Paid
  - Customer Hub
  - Payroll
  - Team
  - Time
  - Projects

---

## 🤖 AI & Automation Features (Phases 15-19)

### Where They Are Located:

#### 1. **Dashboard Widgets** (`/dashboard`)
Located in **Rows 7-8** of the dashboard grid (scroll down):

**Row 7 - AI & Automation:**
- **AI Co-Pilot Widget** - Quick chat interface with sample queries
- **Automation Center Widget** - Shows active rules and performance
- **Agent Performance Widget** - Displays LedgerBot, ReconAI, InsightAI, TaxAI metrics

**Row 8 - Review & Alerts:**
- **Review Queue Widget** - Items needing human review
- **Alerts Widget** - Critical system alerts

#### 2. **Full Pages** (via "My Apps" → "AI & Automation")

Open the secondary sidebar and click "AI & Automation" to see:

| Page Name | Route | What's There |
|-----------|-------|--------------|
| **AI Co-Pilot** | `/copilot` | Full AI chat interface for natural language queries |
| **Automation Center** | `/automation` | Manage automation rules and workflows |
| **Agent Performance** | `/ai/agents` | Detailed metrics for all AI agents |
| **Review Queue** | `/review` | Full review interface for flagged items |
| **AI Explainability** | `/ai/explain` | View explanations for AI decisions |
| **Insights & Anomalies** | `/ai/insights` | AI-detected anomalies and recommendations |

---

## 🏦 Core Accounting Features (Phases 0-14)

### Dashboard View (`/dashboard`)

The dashboard contains **summary widgets** organized in rows:

**Row 1 - Banking & Receivables:**
- Bank Accounts tile (with sync status)
- AR Summary tile (aging buckets, DSO)

**Row 2 - Financial Performance:**
- Profit & Loss tile (with trend chart)
- Expenses tile (by category pie chart)

**Row 3 - Sales & Cash:**
- Sales Trend tile (30-day line chart)
- Cash Flow tile (money in/out)

**Row 4 - Payables & Tax:**
- AP Summary tile (aging buckets, DPO)
- Taxes tile (sales tax, payroll tax)

**Row 5 - Balance Sheet & Reconciliation:**
- Balance Sheet Snapshot tile
- Reconciliation Progress tile
- KPIs & Ratios tile

**Row 6 - Working Capital & Insights:**
- Working Capital tile
- AI Insights tile

**Row 9 - Actions:**
- Quick Actions tile (12 common workflows)

**Row 10 - Operations:**
- To Deposit tile
- Unbilled tile
- Estimates tile

### Full Feature Pages (via "My Apps")

#### Accounting Section
- **Bank transactions** → `/accounting/bank-transactions`
- **Reconcile** → `/accounting/reconcile`
- **Chart of accounts** → `/accounts`
- **Journal Entries** → `/journal-entries`
- **Rules** → `/accounting/rules`
- **Fixed Assets** → `/accounting/fixed-assets`

#### Expenses & Bills
- **Overview** → `/expenses/overview`
- **Expense transactions** → `/expenses/transactions`
- **Vendors** → `/expenses/vendors`
- **Bills** → `/expenses/bills`
- **1099s** → `/expenses/1099s`

#### Sales & Get Paid
- **Invoices** → `/invoices`
- **Create Invoice** → `/invoices/new`
- **Payment links** → `/sales/payment-links`
- **Sales channels** → `/sales/channels`

#### Reports
- **Profit & Loss** → `/reports/profit-loss`
- **Balance Sheet** → `/reports/balance-sheet`
- **AR Aging** → `/reports/ar-aging`
- **Trial Balance** → `/reports/trial-balance`

---

## 🔍 What You WON'T Find on the Dashboard

**The dashboard is for SUMMARIES only.** It shows tiles/widgets with key metrics and links to full pages.

**For full features, you need to:**
1. Click "My apps" (grid icon) in the primary sidebar
2. Navigate to the appropriate section
3. Click on the specific feature page

---

## 🎨 Navigation Structure

```
┌─ Primary Sidebar (Always Visible) ────┐
│ • Create                               │
│ • Bookmarks                            │
│ • Dashboard ← Shows summary tiles      │
│ • Feed                                 │
│ • Reports                              │
│ • My apps ← Opens secondary sidebar    │
│                                        │
│ PINNED:                                │
│ • Accounting                           │
│ • Expenses                             │
└────────────────────────────────────────┘

┌─ Secondary Sidebar (Opens on "My apps" click) ─┐
│ MY APPS                                         │
├─────────────────────────────────────────────────┤
│ ▼ AI & Automation (NEW!)                       │
│   • AI Co-Pilot → /copilot                     │
│   • Automation Center → /automation            │
│   • Agent Performance → /ai/agents             │
│   • Review Queue → /review                     │
│   • AI Explainability → /ai/explain            │
│   • Insights & Anomalies → /ai/insights        │
├─────────────────────────────────────────────────┤
│ ▼ Accounting                                    │
│   • Bank transactions                          │
│   • Reconcile                                  │
│   • Chart of accounts                          │
│   • ... (11 total)                             │
├─────────────────────────────────────────────────┤
│ ▼ Expenses & Bills                             │
│ ▼ Sales & Get Paid                             │
│ ▼ Customer Hub                                 │
│ ▼ Payroll                                      │
│ ▼ Team                                         │
│ ▼ Time                                         │
│ ▼ Projects                                     │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Quick Access Shortcuts

### To See AI Features:
1. **Dashboard view:** Navigate to `/dashboard` and scroll to Row 7-8
2. **Full pages:** Click "My apps" → "AI & Automation"
3. **Direct URL:** http://localhost:3004/copilot (for AI Co-Pilot)

### To Test AI Workflows:
- **Auto-categorization:** POST to `/api/ai/categorize` with transaction data
- **Reconciliation:** POST to `/api/ai/reconcile` with account data
- **Explainability:** Visit `/ai/explain/[id]` for any AI action

### To View Reports:
- Click "Reports" in primary sidebar
- Or navigate directly to `/reports/profit-loss`, `/reports/balance-sheet`, etc.

---

## ✅ Implementation Status

### Phases Complete:
- ✅ **Phase 0-1:** Dashboard Foundation (Types, Context, Global Filters)
- ✅ **Phase 2:** AR/AP Tiles with Aging
- ✅ **Phase 3:** Balance Sheet, Reconciliation, KPIs
- ✅ **Phase 4-5:** Quick Actions, Working Capital, AI Insights, Export
- ✅ **Phase 6-8:** Customization, Drag-Drop, Presets
- ✅ **Phase 9-14:** Status Bars, Additional Tiles
- ✅ **Phase 15:** ReconAI Workflow Integration
- ✅ **Phase 16:** InsightAI Anomaly Detection
- ✅ **Phase 17:** Agent Feedback Learning
- ✅ **Phase 18:** Explainability Pages with Real Data
- ✅ **Phase 19:** Production Readiness (pg_cron, seed data, deployment)

### What's Accessible Now:
- ✅ All dashboard widgets (22 total visible by default)
- ✅ AI & Automation section in navigation (6 pages)
- ✅ AI Co-Pilot page (`/copilot`)
- ✅ AI Explainability pages (`/ai/explain/[id]`)
- ✅ Core accounting pages (Accounts, Journal Entries, Invoices, etc.)
- ✅ API endpoints for AI workflows (`/api/ai/categorize`, `/api/ai/reconcile`)

### Navigation Updates:
- ✅ Added "AI & Automation" section to secondary sidebar (top position)
- ✅ Set to expand by default
- ✅ Purple badge icon to distinguish from other sections
- ✅ 6 AI feature links in the section

---

## 🛠️ Development Server Info

**Current Server:** Running on port 3004 (port 3000 was in use)
- Local: http://localhost:3004
- Network: http://192.168.100.14:3004

**To Start Dev Server:**
```bash
pnpm dev
```

**To Build:**
```bash
pnpm build
```

**Build Status:** ✅ PASSING WITH ZERO ERRORS

---

## 📝 Summary

**You asked: "Where do I find them?"**

**Answer:**

1. **Dashboard tiles** - Go to `/dashboard`, scroll down to see AI widgets in rows 7-8
2. **Full AI pages** - Click "My apps" icon (grid) in left sidebar → Click "AI & Automation" section → Choose the page you want
3. **Direct navigation** - Go directly to `/copilot`, `/ai/agents`, `/review`, etc.

**The key insight:** The dashboard shows **summary widgets**. To access the **full features**, use the **"My Apps" secondary sidebar** which now has a dedicated **"AI & Automation"** section at the top.

All implemented features from task_01.md Phases 0-19 are now accessible through this navigation structure!
