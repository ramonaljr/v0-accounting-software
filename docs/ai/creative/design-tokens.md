# 🧱 Design-Tokens.md — Global Interface Token System

## Purpose
Establish a consistent, technology-agnostic design token foundation  
for all projects in the ecosystem.  
These tokens define spacing, radius, motion, elevation, and layout metrics —  
serving as the unchanging grammar of your design language.

---

## 1. Spacing Scale
Use an **8 px base unit** (modifiable per device density).  
All spacing, padding, and margin values should derive from this grid.

| Token | Value (px) | Usage |
|--------|-------------|--------|
| space-1 | 4 | Fine adjustments (icons, labels) |
| space-2 | 8 | Small padding or tight stacks |
| space-3 | 12 | Compact blocks or inline groups |
| space-4 | 16 | Default element padding |
| space-5 | 24 | Standard section gap |
| space-6 | 32 | Group separation or card padding |
| space-7 | 48 | Large visual break |
| space-8 | 64 | Page-level margin or container padding |

---

## 2. Border Radius
Rounded corners maintain a sense of softness and approachability.  
Keep increments consistent across UI elements.

| Token | Value | Usage |
|--------|--------|--------|
| radius-sm | 4 px | Buttons, inputs |
| radius-md | 8 px | Cards, modals |
| radius-lg | 12 px | Hero blocks, containers |
| radius-full | 9999 px | Pills, avatars |

---

## 3. Elevation & Shadows
Depth should communicate hierarchy and interaction, not decoration.

| Token | Shadow | Description |
|--------|---------|-------------|
| elevation-0 | none | Flat surfaces |
| elevation-1 | 0 1px 2px rgba(0,0,0,0.05) | Subtle raised elements |
| elevation-2 | 0 4px 8px rgba(0,0,0,0.08) | Floating cards |
| elevation-3 | 0 8px 16px rgba(0,0,0,0.12) | Modals or dropdowns |
| elevation-4 | 0 12px 24px rgba(0,0,0,0.16) | Focused spotlight components |

Avoid heavy blur or overuse. Shadows should support visual hierarchy subtly.

---

## 4. Motion & Transitions
Motion provides feedback and fluidity.  
All animations should feel **fast, responsive, and purposeful.**

| Token | Duration | Easing | Use Case |
|--------|-----------|--------|----------|
| motion-fast | 150 ms | ease-in-out | Tap feedback, hover states |
| motion-medium | 250 ms | ease-in-out | Modal, dropdown transitions |
| motion-slow | 400 ms | ease-out | Page transitions, carousels |

Always combine motion with visual state changes; never rely solely on movement to indicate interaction.

---

## 5. Layout Containers
Defines global widths and content breakpoints.

| Token | Value | Usage |
|--------|--------|--------|
| container-xs | 480 px | Mobile width |
| container-sm | 640 px | Narrow sections |
| container-md | 960 px | Default content width |
| container-lg | 1200 px | Desktop standard |
| container-xl | 1440 px | Wide layouts or dashboards |

All containers should be centered and responsive.  
Use a max-width cap of 1200–1440 px for readability.

---

## 6. Typography Scale (Base)
Define global typographic rhythm separate from brand fonts.

| Token | Size | Line Height | Use |
|--------|------|-------------|-----|
| text-xs | 12 px | 16 px | Meta labels, tooltips |
| text-sm | 14 px | 20 px | Secondary text |
| text-md | 16 px | 24 px | Body content |
| text-lg | 20 px | 28 px | Subheadings |
| text-xl | 24 px | 32 px | Headings |
| text-2xl | 32 px | 40 px | Display headers |

These scale tokens map directly to Tailwind, CSS Variables, or Figma Styles.

---

## 7. Z-Index Layers
Maintain predictable stacking order to prevent conflicts.

| Layer | Token | Description |
|--------|--------|-------------|
| Base | z-0 | Content and containers |
| Overlay | z-10 | Floating buttons, cards |
| Modal | z-20 | Dialogs, drawers |
| Dropdown | z-30 | Menus and popovers |
| Toast | z-40 | Notifications |
| Tooltip | z-50 | Highest priority UI element |

---

## 8. Opacity Tokens
Used for disabled states, overlays, and layering.

| Token | Value | Description |
|--------|--------|-------------|
| opacity-low | 0.05 | Subtle background tint |
| opacity-medium | 0.2 | Dim overlays |
| opacity-high | 0.6 | Disabled states |
| opacity-full | 1 | Fully visible elements |

---

## 9. Semantic Roles (Color-Agnostic)
These semantic roles map to project-specific palettes.

| Token | Description |
|--------|-------------|
| color-primary | Key action / brand accent |
| color-secondary | Supporting accent or neutral |
| color-background | Default surface background |
| color-surface | Card or raised element background |
| color-text | Primary text color |
| color-success | Positive feedback |
| color-warning | Cautionary or pending |
| color-error | Alerts and validation |
| color-info | Informational state |
| color-border | Divider and container outlines |

Each project will define HEX or RGB values for these in its local `brand-design.md`.

---

## 10. Naming Convention
Tokens follow this syntax:
<category>-<variant>-<state>

markdown
Copy code
Examples:
- `space-4`
- `radius-md`
- `elevation-2`
- `motion-medium`
- `color-primary-hover`

---

✅ **Global Design Tokens Synced**