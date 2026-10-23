# Approved Scope — Assidua Ops MVP

Source: *Assidua Ops MVP Project Proposal v1.4 (10 Sep 2026)*. "Approved Scope" means proposal §3 and §4, plus the agreed requirements and approved RC-001/RC-002. It changes only through a written Change Request approved by both parties (§14.1).

Each section is tagged `§x.y`. Jira stories cite these tags in their **Scope ref** field.

## In scope (§3)

### §3.1 Customers and sites
- Maintain customer information.
- Store multiple locations (sites) per customer.
- Select the correct site when creating a job.

### §3.2 Staff access and organisation
- Sign in with role-based access: **Front Desk, Department Head, Coordinator, Admin**.
- Admin manages departments, job categories, staff users and roles.
- Admin creates and deactivates staff accounts. Deactivation **immediately** prevents login.
- Passwords: minimum 8 characters, stored as one-way hashes. Admin sets and resets passwords (**no self-service reset**).
- Reject any change that would leave **zero active Admins**.
- **Exactly one active Department Head per department.** Admin and Department Head roles are mutually exclusive.

### §3.3 Inquiries and jobs
- Create an inquiry with one or more jobs in a single step, including jobs for different departments.
- Each inquiry gets a short customer-facing reference number: **Asia/Colombo date + daily sequence**.
- Assign jobs to departments and technicians.
- Track job progress. Notes are **add-only, not editable**.
- Close, cancel or reopen jobs.

### §3.4 Technician directory and communication
- Technician directory: name, phone, optional email.
- Share unique access-controlled job links through WhatsApp.
- Provide a copyable link when WhatsApp delivery is unavailable.
- Technicians do **not** have staff accounts.

### §3.5 Deadlines and notifications
- Department-specific deadline defaults. Deadlines can be adjusted per job.
- Identify jobs approaching their deadline, with a daily reminder at **08:00 Asia/Colombo**.
- Configurable in-app and email notifications for staff. Admin controls which of the included events trigger notifications.
- Optional customer SMS when an inquiry is created: Admin toggle, English template, **off by default**, **at most one SMS per inquiry**.
- Weekly performance report email every **Monday**.

### §3.6 Job photo and document attachments (RC-002)
- Photos and PDFs on a job, as site evidence and completed work.
- **Max 5 files per job, 10 MB per file.** Types: JPEG, PNG, WebP, PDF.
- Staff (roles that manage the job) and technicians (via share link) may upload within these limits.
- Stored on the Company's hosting. This is not unlimited document management.

### §3.7 Reporting and agreed KPIs
| KPI | Definition |
|---|---|
| Total inquiries | Inquiries created in period |
| Jobs created | Jobs created in period |
| Jobs completed | Jobs closed in period |
| Pending jobs | Open (not Closed/Cancelled) at report time |
| Overdue jobs | Open jobs past deadline at report time |
| Department-wise performance | Metrics scoped by department (a Department Head sees only their own) |
| Technician-wise workload | Open jobs per technician at report time |
| Average completion time | Avg/median calendar days create→close for jobs closed in period |
| Cancelled jobs | Cancellation events in period |
| Reopened jobs | Reopen actions in period |

- Manual date range (**≤ 90 days**), plus a scheduled weekly email covering the previous Mon–Sun in Asia/Colombo.
- CSV export of the performance report: Admin, and Department Head scoped to their department (see §3.9).

### §3.8 Activity history (audit)
The audit log is append-only. Each entry records the user and date/time. Events to record:
- inquiry and job creation
- job status changes
- technician assignment and reassignment
- deadline changes (including department default updates when applied)
- close, cancel and reopen (with reasons where captured)
- reclassification
- customer and site create/edit/delete
- technician directory changes
- staff user and role changes

**Not required:** note text, department/category taxonomy changes, notification-setting changes. There is no retention or purge tooling.

Visibility: Department Heads see their department's jobs. Admin sees all.

### §3.9 Handover and data export
- Repository in the Company's name.
- Deployed environments: QA, staging, production.
- Initial departments, categories and an Admin user.
- Operating guide covering:
  - env settings
  - DB updates
  - time zone
  - credential updates
  - PostgreSQL dump procedure
- Testing checklist.
- One live training session, plus credentials.
- CSV export of performance reports, scoped by role.

## Out of scope (§4) — always a Change Request
- Technician staff accounts or mobile app
- Invoicing, payments, inventory
- Customer self-service portal
- GPS / live tracking
- In-app staff chat
- Public or partner API
- High-availability multi-instance redesign
- Unlimited attachment storage or a document management system
- Long-term audit-retention tooling
- Extra training sessions
- A paid support retainer after the warranty
- Any functionality outside this document

## Weekly plan (§2)
| Week | Focus | Deliverables |
|---|---|---|
| 1 | Foundation | User access; departments & categories; customers; technicians |
| 2 | Core job workflow | Inquiry/job creation; technician assignment; WhatsApp links; job status & notes |
| 3 | Operational features | Deadlines; notifications; scheduled reports; performance reports; activity history; attachments |
| 4 | Launch readiness | Client UAT; final fixes; acceptance support; go-live prep |

There is a demo against scope at the end of every week. Delays in access, decisions or feedback move the schedule (§5).

## Acceptance (§7)
- **UAT period:** 20 business days after the UAT build and checklist are delivered. The client gives written feedback with reproduction steps.
- **Defect:** a reproducible failure of in-scope functionality to work materially as agreed. A defect blocks acceptance only if it materially prevents intended use.
- **Non-blocking (§7.4):** these never block acceptance:
  - cosmetic preferences
  - minor usability preferences
  - new functionality
  - business-rule changes
  - extra reports or workflows
  - out-of-scope items
  - third-party limitations
  - Company misconfiguration
- **Critical Defect (§7.8):** materially prevents one of these: staff login; inquiry/job creation; job assignment; technician link access; job closure. These must be fixed before acceptance.
- **Deemed acceptance (§7.6):** acceptance is deemed when either:
  - no written defect list arrives within the UAT period, or
  - the system goes into normal production use.

## Warranty (§8): 6 months after go-live, genuine in-scope defects only
| Priority | Meaning | Response target |
|---|---|---|
| Critical | Outage, or a core workflow blocked (login, create inquiry/job, assign technician/share link, close job) | 2–3 hours |
| High | Major function impaired; a workaround may exist | 1–2 business days |
| Medium | Partial impact | 2–5 business days |
| Low | Minor or cosmetic defect within scope | Within 1 week |

**Not covered:**
- cosmetic or preference changes
- new features
- business-rule changes
- unpaid hosting
- Company misconfiguration
- client-deleted data
- third-party outages or policy changes

## Change requests (§13)
- A written CR, an impact estimate and written approval are all required **before** work starts.
- Rate: **LKR 18,000 per developer-day**. A new module, role, integration or major UX change gets a separate estimate and may extend the timeline.
- Verbal discussion, meeting notes, demos and emails do **not** count as approval.
