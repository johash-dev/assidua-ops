# Dependency licences (ADR-001 stack)

Checked in the AO-6 spike on 2026-10-24 with `npm view <pkg> version license` against the npm registry. Versions are the latest at that date. Exact patch pins are set at scaffold (AO-4).

Cost rule: initial development must have no paid services or licences ([ADR-001](decisions/ADR-001-stack.md)).

## npm packages

| Package | Version | Licence | Use |
|---|---|---|---|
| next | 16.4.3 | MIT | Framework |
| react, react-dom | 19.3.1 | MIT | UI |
| typescript | 6.0.3 | Apache-2.0 | Language (7.x not used: typescript-eslint 8.72.0 peers `<6.1.0`) |
| typescript-eslint, @eslint/js, @types/pg, @types/react, @types/react-dom | see lockfile | MIT | Lint and type packages (dev) |
| @img/sharp-libvips-* (optional, via Next) | see lockfile | LGPL-3.0 | Image optimisation, optional; some transitive packages are MPL-2.0 |
| drizzle-orm | 0.45.4 | Apache-2.0 | ORM |
| drizzle-kit | 0.31.11 | MIT | Migrations (dev) |
| pg | 8.23.1 | MIT | Postgres driver |
| better-auth | 1.7.12 | MIT | Auth |
| pg-boss | 12.38.0 | MIT | Scheduler and queue |
| zod | 4.6.7 | MIT | Validation |
| vitest | 5.0.5 | MIT | Tests (dev) |
| @playwright/test | 1.64.1 | Apache-2.0 | E2E (dev) |
| @axe-core/playwright | 4.14.0 | **MPL-2.0** | Accessibility checks (dev) |
| prettier | 3.9.10 | MIT | Format (dev) |
| eslint | 10.13.0 | MIT | Lint (dev) |
| tailwindcss | 4.3.3 | MIT | Styling |
| shadcn (CLI) | 4.22.1 | MIT | Component generator (dev) |
| radix-ui | 1.8.1 | MIT | Component primitives |
| @types/node | 26.6.5 | MIT | Types (dev) |

Transitive tree of `better-auth` + `pg-boss` + `pg` (the spike install, 45 packages): MIT 40, Apache-2.0 2, ISC 2, `MIT OR CC0-1.0` 1. No GPL, AGPL, SSPL, BUSL or commercial licence.

## Services run outside npm

| Component | Licence | How verified |
|---|---|---|
| PostgreSQL 18 | PostgreSQL Licence (permissive) | Image `postgres:18.3` ran in the spike. Licence from the project's published terms, **not re-checked in this spike**. |
| Node.js 24 | MIT | Same: published terms, not re-checked. |
| Mailpit | MIT | Same: published terms, not re-checked. Not run in this spike. |

## Findings
- **No paid or incompatible licence.** All direct dependencies are free to use, including for the client's production deployment.
- **MPL-2.0 (`@axe-core/playwright`)** is file-level copyleft. It applies only if we modify its own files and redistribute them. It is a dev-only test dependency, is not shipped to users, and is used unmodified. No action needed. Record it here so the handover licence list is complete.
- **Apache-2.0** packages (typescript, drizzle-orm, @playwright/test) need their NOTICE text kept if redistributed. We do not redistribute them.
- Re-run the lookup when AO-4 pins the exact versions.
