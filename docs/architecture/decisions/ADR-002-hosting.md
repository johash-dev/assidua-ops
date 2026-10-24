# ADR-002: Hosting

- **Status:** Accepted
- **Date:** 2026-10-25   **Jira:** AO-21

## Context
- **Fixed by the proposal:**
  - Three deployed environments: QA, staging and production (§3.9).
  - A single instance. High availability is out of scope (§4).
  - Scheduled jobs: the 08:00 Asia/Colombo reminder and the Monday weekly report (§3.5).
  - Attachments of up to 5 files per job, 10 MB each, stored on the Company's hosting (§3.6).
  - Backups: daily snapshots, 14-day retention as a starting point, in the production region. The Company restores using the operating guide (§9).
  - Infrastructure accounts in the Company's name where available (§10.5).
  - Operating cost planning ranges (§6.3, from the v1.3 PDF; confirm v1.4 did not change them): hosting LKR 7,000–57,000 per month, email 0–8,000, SMS 500–15,000, backups and monitoring 500–15,000.
- **From ADR-001:**
  - A Node.js 24 process runs the app and the pg-boss scheduler.
  - PostgreSQL 18. This rules out Supabase, which does not offer 18.
  - Development is zero-cost, and email, SMS and file storage sit behind adapters with fakes.
- **Preferences (Johash, 2026-10-25):** Render, Notify.lk and EmailJS. Cloudflare was considered and set aside: it has no managed PostgreSQL, and its Containers option was spike-gated and unproven.
- **Team:** one developer builds it and covers the 6-month warranty.

## Options considered
| Option | Pros | Cons | Cost/risk |
|---|---|---|---|
| **A. Render for app and Postgres.** Files on a Render persistent disk. EmailJS and Notify.lk behind adapters. | One vendor for compute, database and files. Postgres 18 is supported, with a Singapore region. App and database share a private network. PITR is built in. Same deploy path for all environments. | A disk blocks zero-downtime deploys and cannot shrink. PITR is 3 days (Hobby) or 7 days (Pro), and logical exports last 7 days, so a 14-day job is needed. The Starter 512 MB instance may be too small. | QA about $13 per month, staging about $13–31 during UAT, production about $44 or more. |
| **B. As A, with Cloudflare R2 for files and dumps.** | Durable files. A 14-day lifecycle rule for dumps held at a second vendor. | A fourth account and an S3 adapter. | About $1 per month more. |
| **C. Hetzner VPS with Docker Compose.** | About half the price (CX23 €5.99). `docker-compose.yml` already exists. | The developer or Company patches and secures the OS. Singapore pricing was not confirmed. Production would run on a different platform from QA. | About $6.5 per month for QA. |

## Decision
Option A, with environments created only when their gate needs them. Billing is per second.

| Topic | Choice |
|---|---|
| App host | Render web service in Singapore, deployed as a Docker image (it carries the PostgreSQL 18 client for `pg_dump`). One instance per environment, with pg-boss in the same process and `tz: 'Asia/Colombo'`. |
| Database | Render Postgres 18, same region. Render cannot change a service's region later. |
| Workspace | Hobby ($0 plus compute) for QA. Production moves to Pro if the 7-day PITR window is needed. |
| Files | Render persistent disk behind the storage adapter. Cloudflare R2 (Option B) is the swap if the disk limits bite. |
| Email | EmailJS Personal, behind an email adapter. A Company mailbox is connected (§10.5). |
| SMS | Notify.lk, behind the SMS adapter. The Company opens the account and gets the sender ID approved. |

**Phasing**
1. **QA:** Starter web service plus the $6 database, when the first `/qa` is due. Until then, `/qa` uses the local fallback and must say it is not environment QA.
2. **Staging:** created at the first `vX.Y.Z-rc.N` tag. That tag cannot be cut until AO-22 sets `hosting.deployScript`, because `deploy-staging` fails without it.
3. **Production:** created at release.

**Backups (§9):** Render PITR, plus a nightly `pg_dump` job that keeps 14 days on the disk. The same dump is the §3.9 handover procedure. The operating guide adds a step to copy a dump off-platform, because the disk and the database share a vendor.

**EmailJS guardrails**
- It is browser-first. Verify the server-side API from Node with the private key before relying on it.
- For the 08:00 reminder and the weekly report, send one digest per recipient, not one email per job. Event emails follow the §3.5 settings the Admin chooses.
- Count requests and log failures. Over-quota requests are dropped silently.
- Render the HTML in the app and pass it to one generic template, so templates stay in the repo.

**SMS rule:** at most one SMS per inquiry (§3.5), enforced by a unique constraint on a send log written before the send. A failed send is never retried automatically.

**Why:** it meets the stated preferences with the fewest vendors, and ADR-001 stays intact. The indicative total is about $80 per month across environments, roughly LKR 26k at an assumed LKR 320 per USD, inside the §6.3 ranges.

## Consequences
- **Easier:** one vendor to hand over, a private app-to-database network, and the same deploy script for every environment.
- **Harder:**
  - A disk blocks zero-downtime deploys.
  - Retention beyond 7 days depends on our own job.
  - EmailJS quota drops are silent.
- **Open risks:**
  - Render prices and the Pro workspace fee are unverified, and the Render pricing page carried no date.
  - Memory: the production build may not fit 512 MB (AO-23).
  - EmailJS server-side use and Notify.lk sender ID lead time are unproven (AO-24).
  - Disk limits: the disk cannot shrink, blocks zero-downtime deploys, and holds both attachments and 14 days of dumps. Size it from the §3.6 maximum and swap to R2 (Option B) if it runs short; the size and trigger are to be set in AO-22.
  - Account ownership: not confirmed that Render can transfer services between workspaces. The Company should own the workspace before QA is created.
  - The §6.3 and §9 figures come from the v1.3 PDF while CLAUDE.md says v1.4.
- **Harness updates:**
  - AO-22: the Dockerfile, `scripts/deploy/render.sh <env> <ref>`, `hosting.deployScript`, the QA URL in `harness.config.json`, and the GitHub environments through `node scripts/harness/github-bootstrap.mjs`.
  - Updated with this ADR: `docs/architecture/ARCHITECTURE.md`, the CLAUDE.md Stack and Commands sections, `docs/runbooks/deploy.md`, and `harness.config.json` (`hosting.decided` and `adr`). `deployScript` stays empty until AO-22, so `deploy-qa` keeps skipping safely.
- **Follow-up stories (through `/breakdown`):** the storage adapter with local disk and Render disk, the nightly dump job, and the real EmailJS and Notify.lk adapters.

## Sources
- Render pricing: https://render.com/pricing.md
- Render free-tier limits: https://render.com/docs/free
- Render regions: https://render.com/docs/regions
- Render Postgres versions: https://render.com/docs/postgresql-upgrading
- Render backups and recovery: https://render.com/docs/postgresql-backups
- EmailJS pricing: https://www.emailjs.com/pricing/
- Notify.lk pricing: https://www.notify.lk/pricing/
- Notify.lk API: https://developer.notify.lk/api-endpoints
- Hetzner cost-optimized plans: https://www.hetzner.com/cloud/cost-optimized/
- Fly.io pricing: https://docs.fly.io/about/pricing
- Cloudflare Containers pricing: https://developers.cloudflare.com/containers/pricing/
- Supabase backups (PostgreSQL 18 unavailable, confirmed by Johash): https://supabase.com/docs/guides/platform/backups
