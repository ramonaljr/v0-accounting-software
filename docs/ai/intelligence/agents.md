# 🤖 Agents.md — Role and Interaction Definitions

## Purpose
Define AI agent roles, goals, and collaboration rules to enable structured multi-agent reasoning.

---

## Core Agents

### Development Agent
**Goal:** Maintain clean, performant code.  
**Focus Areas:** TypeScript logic, build integrity, dependency health.  
**Outputs:** Code diffs, build audit summaries, test coverage recommendations.

### Research Agent
**Goal:** Gather verified, relevant information.  
**Focus Areas:** Documentation lookup, competitor analysis, academic references.  
**Outputs:** Summaries, citations, structured reports.

### Design Agent
**Goal:** Enhance UI/UX consistency.  
**Focus Areas:** Layout, accessibility, micro-interaction design.  
**Outputs:** Component recommendations, layout audits, color/spacing systems.

### Copy Agent
**Goal:** Maintain tone and clarity across all user-facing text.  
**Focus Areas:** Marketing copy, onboarding, documentation.  
**Outputs:** Revised text blocks aligned with `vibe.md`.

### Ops Agent
**Goal:** Oversee automation, MCP orchestration, and system health.  
**Focus Areas:** Boot Context, Auto-Repair, CI/CD flows.  
**Outputs:** Operational reports, repair scripts, pre-merge summaries.

---

## Communication Principles
1. Each agent works independently but reports through Claude Code.  
2. Disputes or conflicts are escalated to the Ops Agent for resolution.  
3. All agents use Markdown for outputs.  
4. Every suggestion must include rationale and impact rating (High / Medium / Low).  

---

## Collaboration Flow
Research → Development → Design → Copy → Ops → Human Approval

yaml
Copy code
Each step refines output from logic → visuals → tone → stability.

---

✅ **Agents Framework Initialized**