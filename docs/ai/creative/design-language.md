# 🎨 Design-Language.md — Universal Visual & Interaction Principles

## Purpose
Provide a global set of design and usability principles that apply across all projects.  
This document defines **how** design systems behave — not **what** they look like.  
Individual products should define their own palettes and visual identities in `/docs/ai/projects/<project>/brand-design.md`.

---

## Core Principles
1. **Clarity** — every element must have a clear purpose.  
2. **Hierarchy** — use scale, spacing, and contrast to direct attention.  
3. **Consistency** — shared patterns reduce cognitive load.  
4. **Accessibility** — all interfaces must meet or exceed WCAG AA.  
5. **Efficiency** — designs should support fast comprehension and action.  

---

## Layout System
- **Grid:** 12-column responsive grid with standard 8 px spacing units.  
- **Breakpoints:** mobile ≤ 640 px • tablet ≤ 1024 px • desktop ≥ 1280 px.  
- **Containers:** centered max-width = 1200 px unless full-bleed media.  
- **Spacing:** follow the 4 / 8 px rule; use multiples for rhythm and alignment.  

---

## Typography
| Element | Font Family | Weight | Scale |
|----------|--------------|---------|-------|
| Headings | Inter / SF Pro Display / system-sans | 600–700 | 2 rem – 4 rem |
| Body | Inter / SF Pro Text / system-sans | 400–500 | 1 rem – 1.125 rem |
| Code | JetBrains Mono / Menlo / monospace | 400 | 0.9 rem |

- Line-height ≈ 1.6 ; letter-spacing ≈ -0.01 em.  
- Use relative units (`rem`, `em`, `clamp`) for responsiveness.  

---

## Components & Interaction
### Structure
- Components must be modular and reusable (Button, Card, Modal, Input, Table, Toast, Tooltip).  
- Maintain visual consistency through shared spacing, border-radius, and typography.  

### Feedback
- Provide visual confirmation for every interactive state (hover, active, focus, disabled).  
- Avoid animation that blocks input or delays feedback.

### Motion
- Duration: 200 – 300 ms  
- Easing: `ease-in-out`  
- Motion should communicate state change, not decoration.

---

## Accessibility Standards
- Minimum text contrast ratio ≥ 4.5 : 1.  
- All interactive elements keyboard-navigable.  
- Provide ARIA labels and focus outlines.  
- Avoid color-only communication; always pair with icon or label.  

---

## Imagery & Illustration
- Use images to clarify, not decorate.  
- Prefer high-contrast, simple compositions.  
- Maintain consistent lighting direction and tone.  
- Avoid text baked into images.  

---

## Theming & Extensibility
- Each product defines its own colors and brand identity in a local `brand-design.md`.  
- The system must allow **theming** without breaking component logic.  
- Global tokens (spacing, typography, radius) stay constant; colors and icons may vary.  

---

## Implementation Notes
- Use Tailwind, Shadcn, or custom tokens for consistency.  
- Store reusable design decisions (radius, motion, grid) in code tokens or variables.  
- Always version updates to this file when foundational changes occur.  

---

✅ **Universal Design Language Loaded**
