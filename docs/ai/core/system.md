# 🧩 System.md — Architecture & Integration Overview

## Overview
Defines the system structure, environment stack, and how all integrations interact.
This serves as the master reference for AI context loading, orchestration, and MCP connectivity.

---

## Core Stack
- **Frontend:** Next.js, TypeScript, Tailwind, Shadcn/UI, Radix/UI, Untitled/UI 
- **Backend:** Supabase (PostgreSQL) and Edge Functions  
- **Authentication:** Supabase Auth  
- **AI Layer:** OpenAI SDK, LangGraph, Vercel AI SDK  
- **Tooling:** Cursor IDE, pnpm, Playwright, MCP7  
- **Deployment:** Vercel + Supabase

---

## Data Flow
```mermaid
graph TD
A[Frontend - Next.js] --> B[Supabase Edge Functions]
B --> C[Database - PostgreSQL]
C --> D[AI Layer - LangGraph / SDK]
D --> E[Frontend Render / API Response]
