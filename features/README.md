# Features Directory

This directory contains feature-specific modules organized by business domain.

## Structure

- **auth/** - Authentication and authorization flows
- **ai-agents/** - AI agents (LedgerBot, ReconAI, InsightAI, ExplainBot)
- **categorization/** - Auto-categorization engine
- **reconciliation/** - Reconciliation engine
- **copilot/** - AI Co-Pilot chat interface

## Conventions

- Each feature directory should be self-contained
- Features can have their own components, hooks, and utilities
- Shared utilities should be in `/lib`
- Shared UI components should be in `/components`
