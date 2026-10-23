# Architecture

> Pending ADR-001 (stack) and ADR-002 (hosting). Update this file when they are accepted.

## Fixed constraints (proposal §12)
- Staff web application, plus access-controlled technician link pages.
- Secure API. PostgreSQL. Business time zone Asia/Colombo.
- Single instance. High-availability is out of scope (§4).
- Integrations: email (notifications and reports), WhatsApp (job links, with a copy-link fallback), optional SMS.
- Scheduled jobs: 08:00 deadline reminder, Monday weekly report.
- File storage on the Company's hosting (attachment caps per BR-9).

## Module map (to fill)
| Module | Responsibility | Scope |
|---|---|---|
| auth & staff | sessions, roles, invariants BR-13..15 | §3.2 |
| customers | customers & sites | §3.1 |
| inquiries/jobs | inquiry creation, reference numbers, job lifecycle, notes | §3.3 |
| technicians | directory, share links | §3.4 |
| notifications | in-app, email, SMS, schedulers | §3.5 |
| attachments | upload/validate/store | §3.6 |
| reporting | KPIs, CSV, weekly email | §3.7 |
| audit | append-only activity history | §3.8 |
