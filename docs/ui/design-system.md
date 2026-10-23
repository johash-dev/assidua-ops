# UI Design System Rules

Generated UI must **compose from known-good primitives**, not invent them. These rules come from the AI-generated UI/UX research brief. Concrete tokens and components are filled in after ADR-001 picks the stack and component library.

## Principles
1. **Task first.** Each screen serves a named role and task (Front Desk logs an inquiry in under 1 minute; a Department Head sees overdue jobs at a glance).
2. **Prefer direct manipulation.** Use forms, tables, filters and buttons. No chat UIs.
3. **System state is always visible:** loading, saving, saved, failed, needs confirmation.
4. **The user stays in control.** Consequential actions (cancel/close job, deactivate user, reassign technician) show what will change, then confirm. Cancel is always available.
5. **Design failure states first:**
   - invalid input
   - permission denied
   - network failure
   - WhatsApp unavailable (fall back to a copyable link)
   - upload rejected (say the reason: type or size)
6. **Consistency beats novelty.** The navigation shell, terminology (see the glossary) and component behaviour stay identical across screens.
7. **Accessibility is a hard constraint:** WCAG 2.2 AA.

## Tokens (fill after ADR-001)
| Token group | Values |
|---|---|
| Color (semantic: surface, text, primary, danger, warning, success, focus) | TBD |
| Typography scale | TBD |
| Spacing scale (4px base) | TBD |
| Radius, elevation, motion (respect `prefers-reduced-motion`) | TBD |

## Components (fill after ADR-001)
Button, Input, Select, DatePicker (Asia/Colombo), Table (sortable, paginated, empty state), StatusBadge (job statuses), Dialog/ConfirmDialog, Toast, FileUpload (caps shown up front), Tabs, Breadcrumb, PageHeader, EmptyState, ErrorState.

## Interaction contracts
| State | Required behaviour |
|---|---|
| Loading | Skeleton or spinner after 300ms. Never a blank screen |
| Empty | Explains why it's empty, plus the primary action |
| Error | What happened, what was affected, what to do next. Form input is preserved |
| Success | Inline confirmation or toast. The new item is visible |
| Disabled | A tooltip or helper text explains why |

## Technician link pages
- Mobile-first (375px), one job only, large targets.
- No navigation to anything else, and no staff data beyond the job.
- Works on slow connections: compress images before upload and show upload progress.
