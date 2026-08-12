# ADR-009: Staff UI foundation (Tailwind + shadcn/ui)

- **ADR ID:** ADR-009
- **Title:** Code-first UI foundation with Tailwind CSS and shadcn/ui
- **Status:** Accepted
- **Confirmed:** HUMAN DECIDED 2026-08-13 (foundation choice A)

## Context

Assidua Ops has no Figma design system. Feature specs now include **UI contracts** (screens, flows, roles, states) via the UI/UX Agent, but look-and-feel would still drift if each feature invents styles. Staff and technician-link UIs need one shared visual language with minimal process overhead.

## Decision

1. **Stack:** Next.js App Router UI uses **Tailwind CSS** + **shadcn/ui** (Radix primitives + project-owned components under `apps/web/components/ui`).
2. **Source of truth:** Code is the design system. Optional Figma later may mirror code; it does not authorize divergence.
3. **Tokens:** One small theme (CSS variables / Tailwind theme): color, typography, spacing, radius, focus rings. No per-feature palettes or type scales.
4. **Components:** Prefer shadcn defaults and shared wrappers (`Button`, `Input`, `Select`, `Table`, `PageHeader`, `EmptyState`, `Alert`, `ConfirmDialog`, etc.). Extract shared components only after **rule-of-three** (or when UI contract names a shared primitive).
5. **UI contracts** name screens/flows and may name shared components; they **do not** invent colors, fonts, or one-off visual systems.
6. **Technician link** (`/t/[token]`) uses the same foundation with a minimal chrome variant (no staff nav) — not a second design system.
7. **Not introduced:** MUI/Chakra or other full kits; custom illustration/animation language; marketing landing patterns for staff ops screens.

## Alternatives considered

| Alternative | Why not |
|-------------|---------|
| Tailwind only + fully hand-rolled `ui/` | More upfront work; shadcn already gives accessible primitives we own in-repo |
| Heavier kit (e.g. MUI) | Heavier than MVP staff-tool needs; harder to keep thin |
| Per-feature freehand CSS / Figma-first | Drift and blocker without designers; contradicts code-first approach |

## Rationale

Fastest path to consistent staff UI without a design team. Components live in the repo (shadcn copy-in model), so we control upgrades and stay evolutionary.

## Consequences

- **Positive:** Consistent look; Builder reuses primitives; Reviewer can reject one-off styles; no Figma gate.
- **Negative / limitations:** Default shadcn aesthetic until tokens are tuned; brand polish is a later pass on the same components (`ponytail:` theme tokens are the upgrade path, not a rewrite).
- **Constraint:** First staff screen PLAN must establish Tailwind + shadcn scaffolding and baseline tokens before feature chrome proliferates.

## Requirements affected

- Stack authority (Next.js staff + tech UI)
- UI/UX Agent / UI contracts (interaction only; visual via this foundation)
- NFR-4 unchanged (UI is not the authz boundary)
