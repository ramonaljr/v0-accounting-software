# 🧱 Dev-Standards.md — Engineering Guidelines

## Purpose
Set universal rules for writing, reviewing, and merging code in an AI-assisted environment.

---

## Coding Conventions
- Language: TypeScript / React / Next.js  
- Formatter: Prettier (default rules)  
- Style: ESLint + pnpm scripts  
- Use async/await — no chained `.then()` except in utilities.  
- Use environment variables; never hard-code credentials.  
- All components must be functional and exported as default.

---

## Folder Structure
src/
├── components/
├── lib/
├── hooks/
├── pages/
├── styles/
└── tests/

yaml
Copy code

---

## Commit Conventions
Use Conventional Commits syntax:  
`<type>(scope): short description`

| Type | Meaning |
|------|----------|
| feat | new feature |
| fix | bug fix |
| chore | tooling / config |
| refactor | non-breaking change |
| docs | documentation update |
| test | adds or updates tests |

---

## Branch Rules
- Default: `main`  
- Feature: `feat/<feature-name>`  
- Fix: `fix/<issue-name>`  
- Use short, clear names and delete merged branches.

---

## Testing Requirements
- Unit tests for all new logic.  
- Integration tests for major flows.  
- E2E validation via Playwright MCP.  
- All tests must pass before merge.  

---

## Review Workflow
1. Create a Pre-Merge Report via MCP chain.  
2. Fix critical issues flagged (High).  
3. Get peer review or AI approval summary.  
4. Merge only after status: ✅ Ready to Merge.

---

✅ **Dev Standards Enforced**