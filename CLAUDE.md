# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.5+ application built with TypeScript, React 19, and Tailwind CSS v4, intended as an HR/accounting software platform (PeoplesOneHR). The project uses the App Router architecture with Turbopack for development and build optimization.

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
- Role hierarchy: `owner`, `admin`, `manager`, `employee` stored in `org_members` table
- Storage buckets use per-org folder prefixes (e.g., `/org_id/payslips/`)

### Planned Directory Structure
The project is designed to scale into the following domain-driven structure:

```
app/
├── (marketing)/          # Public marketing pages
├── dashboard/            # Main dashboard
├── employees/
├── payroll/
├── leave/
├── requests/            # Generic approval requests
├── loans/
├── surveys/
├── onboarding/
├── compliance/
└── settings/

features/
├── auth/
├── approvals/           # Generic approvals framework
└── pulse/

lib/
├── supabase/
│   ├── server.ts        # Server-side Supabase client
│   └── client.ts        # Client-side Supabase client
├── auth/
├── rls/                 # Row Level Security helpers
├── audit/               # Audit logging
├── crypto/              # Encryption for PII
├── pdf/
└── emails/
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
- **Encrypt government IDs** (TIN, SSS, PhilHealth, Pag-IBIG) before storing; store "last4" separately for UX
- **Audit all sensitive actions**: payroll approvals, document requests, loan decisions, field changes
- Audit logs must include: `org_id`, actor, action, timestamp, minimal diffs
- **Storage policies**: enforce read/write by org membership and role
- Generate sensitive exports server-side with short-lived signed URLs
- Validate all inputs with `zod`

### Generic Approvals Framework
Use a single approvals system for:
- Leave requests
- Overtime requests
- Timesheets
- Document requests (COE, 2316/ITR, SSS, PhilHealth, Pag-IBIG)
- Loans

Provide a unified Manager Approvals view with SLA indicators.

### Automated Jobs (Edge Functions + Cron)
- Daily payroll pre-runs
- 13th-month accruals
- Document expiry reminders
- Survey digests

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

## Scalability Target
Aim to support **1,000 employees per tenant** for v1 without degraded performance.
