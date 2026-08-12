# Assidua Ops — Requirements Baseline

**Feature ID:** AO-MVP-001  
**Source:** `docs/requirements/source/Assidua Ops.md` + requirements grilling + Session 2/3/4/5/6 (adversarial resolution)  
**Authority:** This baseline (`Assidua-Ops-requirements-baseline.md`) is the **single source of truth**. Grilling and Session 2/3/4/5/6 decisions override the source summary wherever they conflict. Acceptance criteria in this document are authoritative over illustrative Test requirements lists. The source file is historical intake only.  
**Status:** **FROZEN** (2026-08-11) **+ RC-001 HUMAN APPROVED** (2026-08-13). Requirements grilling and discovery remain **stopped** except explicit change docs. Architecture may proceed against this document **plus human-approved requirements changes**. Do not silently invent or assume new business needs.

---

## Freeze notice

- **Frozen scope:** All confirmed behavior, decisions 1–114, FRs/NFRs, and acceptance criteria through Session 6 resolutions (B1–B9, I1–I53, M1–M42 as applied), **plus Decision 115 / I58 (RC-001)**.
- **Parked (deferred — not decided):** I54–I57, M43–M47 — recorded under **Assumptions (deferred at freeze)** and **Open questions**. Architecture must **not** treat parking as a product decision; if a choice is required to design/build, stop and request a requirements change.
- **Intentionally open for implementation:** NFR-1 delivery/retry (M42) — not a business freeze gap.
- **Unfreeze:** Only by explicit stakeholder decision to reopen requirements, or by adopting a numbered requirements change (RC-*).
- **Adopted requirements change:** [RC-001 — Customer inquiry SMS + inquiry number](Assidua-Ops-requirements-change-RC-001-customer-inquiry-sms.md) — **HUMAN APPROVED (2026-08-13)**.

---

## Objective

Enable Assidua Ops staff to intake customer service inquiries, create department-owned jobs from leaf categories, assign technicians via directory + WhatsApp shareable links, track job lifecycle to Close within a critical time window, and provide admin/DH oversight through notifications, audit log, and weekly performance reports.

---

## Business context

Assidua Ops runs field service work across three departments (Rivon, Rover, Assidua). Front desk receives customer calls; department heads select technicians; technicians (no app login in MVP) update jobs through a shareable link. Admins oversee all departments.

---

## User story

As front desk, department heads, coordinators, and admins, we need a shared system of record for customer inquiries and service jobs so work is routed to the correct department, technicians receive job details, deadlines are visible, and management can review performance weekly—without technician accounts, billing, or customer self-service in MVP.

---

## Confirmed behavior

### Roles and access (as decided in grilling; overrides source headcount where noted)

| Role | Count (MVP) | Access |
|------|-------------|--------|
| Front desk | Planning only (not a hard seat cap) | View all departments’ inquiries/jobs; create inquiries/jobs; edit per rules below; **read-only** view of technician directory; cannot manage technicians, audit, weekly reports, users, taxonomy, notification settings, Close/Cancel/Reopen, select technicians, or **add notes**. **Exactly one staff role per user** (I50). |
| Department head | **Exactly one per department (3)** — hard rule; vacancy **and** dual assignment not allowed | Read/write for **their department’s jobs only** (on a multi-dept inquiry, other departments’ jobs are **hidden**, with a **non-detailed indicator** that sibling jobs exist — I51). May **create** inquiries/jobs **only** with leaves in their department. **Exactly one staff role per user**; **Admin and DH roles are mutually exclusive**. Deactivating/removing the sole DH, or assigning a **second** DH while one exists, is **blocked** unless done as a **one-step replacement**. |
| Admin (role) | Planning only (not a hard seat cap); titles are **org labels only** | One **Admin** role with identical full read/write; “all admins” = all users with the Admin role. **Exactly one staff role per user**; **Cannot** also be a DH (I44/I50). |
| Coordinators | Planning only (not a hard seat cap) | View-only access to all departments’ inquiries/jobs; **cannot** manage/view technician directory, audit, weekly reports, users, taxonomy, or notification settings. **Exactly one staff role per user** (I50). |
| Technicians | Planning only (directory size not capped) | No staff role / no login in MVP; use shareable link only |

### Departments and categories

- **Rivon** → Car (leaf)
- **Rover** → Bike (leaf)
- **Assidua** → A/C, UPS, Smart Board (leaves); Home Appliances → Tv, Washing Machine, Fridge (leaves)

Front desk must select a **leaf** category. Department is **derived** from the selected category’s department. Admins only may add/edit/deactivate departments and category leaves. Deactivating a department or leaf is **blocked** while **any** job (any status, including Closed/Cancelled) still references that leaf/department. **Accepted consequence:** leaves with historical jobs are effectively permanent unless all referencing jobs are reclassified first (M17).

### Inquiry and job structure

- One customer call creates one **inquiry**.
- On successful create, each inquiry receives a **customer-facing inquiry number** `YYYYMMDD-NNN` (Asia/Colombo date + daily zero-padded sequence starting at `001`, e.g. `20260813-001`). The number is shown in **staff UI** and is assigned whether or not customer SMS is enabled (**RC-001 / I58**).
- One inquiry may contain **multiple jobs** in one create action (one job per leaf category — duplicate leaf in the same submission is rejected), including jobs for **different departments** (e.g. Rivon + Assidua). Each job notifies its own department head independently. If any job in the batch is invalid, the **entire** create is rejected (no partial inquiry). Create requires **at least one** job.
- Jobs from the same call are **grouped under that inquiry**. When a **DH** views an inquiry that also contains other departments’ jobs, they see **only their department’s jobs** on that inquiry (other departments’ jobs’ details are hidden). Show a **non-detailed indicator** that the inquiry has jobs in other departments (e.g. count or “jobs in other departments exist”) — **no** foreign job fields (I51). Admin/FD/coordinator visibility unchanged (full inquiry as already scoped by role).
- Jobs are **not** added to an existing inquiry later; a follow-up call creates a **new inquiry**.
- **Shared on inquiry:** customer.
- Per job: service location (site), **issue** (required non-empty free text), category/subcategory (leaf), priority.

### Customer

- No unique business key; front desk searches by name/phone and selects a record; **duplicates allowed**.
- Required to save: **name, phone, primary contact address**.
- Customer **email is optional**.
- Customer may have **multiple saved sites**; front desk, Admin, or DH picks an existing site or adds/edits one as needed for a job. **DH may create/edit sites for any customer** (customers are shared across departments); site delete rules unchanged (Admin only when unreferenced).
- A site requires a **label/name** and **address**. Editing a site updates it for all jobs that reference it (including past jobs). **Deleting** a site is **blocked** while **any** job references it. When unreferenced, **only Admin** may delete a site (FD and DH cannot delete).
- Job service location must come from the **sites list** (add a site if needed). Primary contact address is **not** usable as job location unless saved as a site.
- **No deletion** of customers, inquiries, or jobs in MVP. Jobs are retired via **Cancel** or **Close** only; customer and inquiry records remain.

### Job field edit rights (front desk)

- Front desk may edit a job’s issue, location (site), priority, and category until **that job** has a technician selected.
- If front desk changes the leaf so the **derived department changes** while the job is still unassigned, notify **both** the **old** department’s DH and the **new** department’s DH. If old and new department are the **same** (same DH), send **one** notification (not a duplicate).
- After a technician is selected for that job, only department head or admin may change that job’s data **while the job is open** (not Closed/Cancelled).
- DH/admin **cannot** edit job issue/site/priority/category on **Closed** or **Cancelled** without **Reopen** first.

### Job statuses (operational)

Standing statuses: **New**, **Assigned**, **In Progress**, **On Hold**, **Resolved**, **Cancelled**, **Closed**.

- **On Hold** = blocked/stalled.
- **Resolved** = field work finished (awaiting administrative close).
- **Closed** = department head or admin confirmed after review; **Close requires the job’s current status to be Resolved** (Resolved may be set by technician or by DH/admin). If the job was Resolved earlier but was then moved to In Progress or On Hold, Close is **rejected** until status is set to Resolved again.
- **Reopened** is **not** a lasting status; it is an action/audit event. On reopen: if a technician is present, status becomes **Assigned**; if no technician is present, status becomes **New**. **Assigned** implies a technician is selected.

### Status authority

| Actor | May set / do |
|-------|----------------|
| System / create | New |
| Selecting a technician | Sets status to **Assigned** when selecting on a New job; sends WhatsApp link. **Assigned** is entered only by technician selection (or by reopen when a technician already exists). First select is always from **New** → **Assigned**. |
| Technician (shareable link) | **In Progress**, **On Hold**, **Resolved** only; must have been **In Progress** at least once before **Resolved**; may resolve from On Hold if In Progress already occurred |
| Department head / admin | May set **In Progress / On Hold / Resolved** when a technician is present (Resolved note rules as before). **Cancel**, **Close**, and **Reopen** are dedicated actions only (not free-jump targets). **Cannot** free-jump to **New**, **Assigned**, **Cancelled**, or **Closed**. Assigned only via technician selection or reopen-with-technician. **Close requires current status Resolved** (ever-Resolved alone is not enough). Reopen from Closed/Cancelled → Assigned if technician present else New. Reclassify category allowed. May add notes to the job notes thread (visible on technician link while link is valid); **DH/Admin may still add notes after Closed/Cancelled** (I39). |
| Front desk / technician | Cannot Cancel or Reopen |

### Technician model

- Directory entry: name + **required phone** + optional email; no login.
- Each technician has one **primary department**; DH selects from their department’s pool; **admin may select across departments**. Changing a technician’s **primary department** is **blocked** while that technician has any open (non-Closed/Cancelled) jobs — same spirit as deactivate (I53).
- Admins manage all technicians; each DH may manage technicians in their own department.
- Deactivating a technician is **blocked** while that technician has any open job (not **Closed** and not **Cancelled**). Those jobs must be reassigned or Closed/Cancelled first.
- On technician selection for a New job: status → **Assigned**; shareable link sent **automatically via WhatsApp**; if WhatsApp send fails, show **copyable** fallback with the **same summary text + link** as the WhatsApp body (I52). WhatsApp/copyable message body = **link + short summary**: customer **name**, site **label**, **issue**, **priority** (not customer phone, primary address, or email in the message text — phone remains viewable on the link per I27). If **issue** is too long for the channel, **truncate issue in the summary** so send/copy still succeeds; **full issue** remains on the technician link (I52). Exact truncation length follows provider/channel limits (implementation constraint).
- Technician select/reassign is **rejected** while status is **Closed** or **Cancelled** — must **Reopen** first.
- Shareable links must be **unpredictable secrets**. A link remains valid until reassign, **Closed**, or **Cancelled**, or until **10 days after that link was issued**, whichever comes first. While the job is still open, DH/admin may **regenerate/resend** a new link (old link dies).
- Technician via link may **view:** job issue, priority, status, category/leaf, service site (label + address), customer **name**, customer **phone**, deadline, and the **full notes thread** (including notes authored by technician, DH, or Admin). May set allowed statuses and add notes; **note required for On Hold** (technician; non-empty after trim); notes optional for Resolved — if a Resolved note is **whitespace-only**, treat as **no note** (allow; do not store) (M33).
- Technician link must **not** show: customer primary contact address, customer email, cancel reasons, audit log, or other staff-only internals.
- **Notes authors:** Technician, DH, and Admin may **add** notes to the job notes thread (**add-only** — no edit or delete of existing notes in MVP — I48). **Front desk may not** add notes. All notes in the thread are visible on the technician shareable link **while the link is valid**. After **Closed** or **Cancelled**, technicians cannot add notes (link invalid); **DH and Admin may still add notes** without Reopen (I39). Notes are **not** required in the MVP audit log (I45).
- When DH/admin sets **On Hold**, a note is **optional** (if provided, non-empty after trim; whitespace-only optional note treated as no note).
- Cancel requires a **non-empty after trim** reason (whitespace-only rejected; no further min/max length). After Cancel, **DH/Admin may edit** the cancel reason (still non-empty after trim) (M41).
- On reassignment to a different technician: previous link **stops working**; if job was already In Progress / On Hold / Resolved, **status is kept**; only technician + link change. New link delivery is the **same as first select**: auto WhatsApp; on failure show copyable link.
- Selecting the **same** technician already on the job is treated as **regenerate/resend**: previous link dies; WhatsApp send attempted with copyable fallback (same as regenerate).
- On **Closed** or **Cancelled**: shareable link **stops working entirely**.
- When a link is invalid or expired, the technician must see a message with this intent: **“This job link is no longer valid. Contact your department head.”** They cannot view or update the job. Exact visual layout may vary.

### Reclassification

- DH or admin may change category/subcategory; department is re-derived; **both** the **old** and **new** department heads are notified (same as FD department-changing edit). If old and new department yield the **same** DH, send **one** notification (M32).
- Existing technician and status are **kept**; new DH may select a different technician if needed.

### Critical time window (SLA)

- Default **10 days** from job creation (**New**), counted as **Asia/Colombo calendar dates**: deadline date = create date + N calendar days; job is due through end of that calendar day (**23:59:59** Asia/Colombo).
- Department default period **N** must be an integer **≥ 1** (reject 0 and negative); **no upper cap** in MVP (I43).
- “Processed” = reached **Closed** only.
- **Cancelled** immediately **exits** the critical window and **stops** at-risk. Cancelled is a terminal outcome but is **not** “processed.”
- **On Hold does not pause** the clock; On Hold time **counts** in calendar metrics and must be **highlighted / summed** in reports (On Hold **duration** population per I32 / Decision 83).
- DH may configure **their department default** period and **per-job override** for their department’s jobs.
- Admin may configure **any department’s default** and **per-job overrides** on any job. Changing a department default (by DH or Admin) uses the same prompt: whether to also update existing open jobs without per-job override.
- **Per-job SLA override** sets a deadline that must be **today or a future calendar date** (Asia/Colombo); past dates are **rejected** (same rule as reopen custom deadline).
- When DH or Admin changes a department default: **new jobs** use the new default. The actor is **prompted** whether to also recalculate deadlines for **existing open** jobs (not Closed/Cancelled) that have **no per-job override** (using create date + new N calendar days). Jobs with a per-job override are left unchanged by that prompt. If the actor declines the prompt, existing open jobs keep their current deadlines.
- At-risk starts at the **start of the calendar day** that is **2 days before** the deadline date, and continues daily while the job is still open for SLA (not **Closed** and not **Cancelled**): **daily** at-risk prompts at **08:00 Asia/Colombo** to owning **department head** and **all Admin-role users**. There is **no immediate at-risk notification** on reopen (or other actions) when the resulting deadline is already past or inside the at-risk window — the next 08:00 run covers eligible jobs (M28).
- On **Reopen**: prompt immediately with: keep original deadline, restart window from now (department default length), or enter custom deadline. Custom deadline must be **today or a future calendar date** (Asia/Colombo); past dates are **rejected**. Keeping an original deadline that is already in the past is **allowed**; it does **not** trigger an immediate at-risk ping. If a technician is present, status → **Assigned** (prior technician remains by default; DH may select a different technician). If no technician is present, status → **New** (DH must select a technician later → Assigned + link).

### Time-to-resolve (reporting metric)

- Primary interval: first **Assigned** → first **Resolved**.
- After reopen: **also** report the **latest** cycle — last **Assigned** (including post-reopen Assigned) → the **following Resolved**.
- On Hold time is **included** in those calendar intervals; On Hold duration also surfaced separately in reports.

### Notifications

- New job: notify owning department head (default in-app + email).
- At-risk: notify owning DH + all Admin-role users (default in-app + email), daily while eligible at 08:00 Asia/Colombo.
- Admin may configure **per event type** toggle of in-app and/or email on/off; **recipients stay fixed** by role rules above.
- Technician link delivery: WhatsApp (not staff in-app).
- **Customer inquiry SMS (RC-001 / I58):** After successful inquiry create, when Admin customer-SMS toggle is **on**, send **exactly one** SMS to the **customer phone** (one SMS per inquiry even with multiple jobs). Body = Admin-editable English template requiring placeholders `{INQUIRY_NUMBER}` and `{JOB_COUNT}`; seed template: `Thank you. We received your inquiry {INQUIRY_NUMBER} with {JOB_COUNT} job(s).`. Toggle **defaults off**. **No manual resend** in MVP. SMS failure: inquiry/jobs remain; **in-app warning to the actor** (same pattern as action-triggered email failure). English only in MVP.
- When an action-triggered **email** fails: show an **in-app warning to the actor**; the primary action still **succeeds**. **In-app** notification delivery is **best-effort** in MVP — no required user-facing failure UX if in-app notify fails (M19). Scheduled at-risk/auto weekly emails have no interactive actor — delivery is best-effort.

### Weekly report

- Auto weekly email + **manual generation** available.
- **Who may run manual:** admins (all-department report scope) and each DH (their department only).
- Auto recipients: all admins (all departments); each DH (their department only).
- **Auto period:** previous complete **Mon–Sun** week (Asia/Colombo); send **Monday 08:00 Asia/Colombo**.
- **Manual period (B9 / I46 / I47):** requester picks start and end **calendar dates** (Asia/Colombo). Period is **inclusive on both ends**: start **00:00:00** through end **23:59:59** Asia/Colombo. **End date must be ≤ today** (Asia/Colombo). Inclusive span may be at most **90 calendar days** (end − start + 1 ≤ 90). Start = end (single day) is allowed. Reject: end before start; end in the future; span > 90 days. Metrics use the **same formulas** as below over that period (not required to be Mon–Sun).
- After **manual** generation, email goes **only to the user who triggered** it (for their allowed scope). Auto fan-out unchanged. If that email fails: in-app warning to the actor; generation still succeeds; the report remains **available in-app** for the requester to view/download.
- **In-app manual report retention:** the system keeps the **latest** successfully generated manual report **per requester** (for their allowed scope) available in-app until that requester generates again (then the new artifact replaces the previous). **No multi-period in-app report history** in MVP. **Auto** weekly reports are **email-only** (no in-app archive of past auto weeks).
- Report generation (auto and manual) is **all-or-nothing**: on generation failure, show an error; no partial report artifact; requester may retry (manual) / next schedule (auto).
- Content: comprehensive performance insights including (for auto: “the week”; for manual: “the selected period”):
  - Volume: **jobs** created / closed / cancelled / reopened counts — **events during that period only** (created = jobs created in the period; reopened = reopen actions in the period). Cancelled volume is a count of cancellation events; Cancelled jobs remain excluded from performance-outcome calculations (B1).
  - Aging:
    - **Open past deadline:** snapshot at report time — jobs not Closed/Cancelled whose deadline is before now.
    - **Avg/median days to Close:** only jobs **Closed during that period**, measured create → Close using **Asia/Colombo calendar dates** (calendar-day difference, consistent with SLA calendar rules); Cancelled excluded. If **no** jobs Closed in the period, display **N/A** (I40).
  - Workload (**snapshots at report time**):
    - Jobs per technician: open jobs (not Closed/Cancelled) currently assigned to each technician in scope. **Include technicians with zero open jobs** as **0** (M34). For DH reports, department technician pool; for Admin all-dept reports, all technicians.
    - Unassigned New: count of jobs in **New** with no technician.
  - Quality/flow:
    - **On Hold count:** snapshot of jobs currently On Hold.
    - **On Hold rate:** (jobs that entered On Hold at least once during the period) ÷ (jobs that were open at any time during the period). Jobs that later **Cancelled during the same period** **still count** in both numerator (if they entered On Hold) and denominator (if they were open). Jobs already Cancelled before the period starts are excluded.
    - **Reopen rate:** reopen actions in the period ÷ jobs Closed in the period. If denominator is 0, display **N/A**.
    - **On Hold duration sum:** total time spent On Hold **during the period** for jobs that were open at any time during the period, **including** jobs **Cancelled mid-period** (count On Hold intervals that fall within the period, up to Cancel). Jobs already Cancelled before the period starts are excluded. Aligns with On Hold rate population (I32).
  - **Time-to-resolve (I49):** include on auto and manual reports — primary first Assigned→first Resolved; when a reopen occurred, also latest Assigned→following Resolved cycle (Cancelled excluded from performance outcomes). If no applicable Resolved cycle exists in scope for a summary display, show **N/A** where a single aggregate would otherwise divide by zero / have an empty set.
- When **On Hold rate** denominator is 0 (no jobs open at any time during the period), display **N/A**.
- When **Reopen rate** denominator is 0 (no jobs Closed in the period), display **N/A**.
- **Performance outcome** calculations (e.g. aging averages/medians, SLA/processed outcomes, time-to-resolve and other outcome metrics) **exclude Cancelled jobs**. Cancelled is not treated as a successful or failed performance outcome in those calculations. Volume may still count cancellation **events**.
- Auto week = Monday 00:00 → Sunday 23:59 **Asia/Colombo** (inclusive calendar week, same day-boundary rule as I47); auto send **Monday 08:00 Asia/Colombo** for previous week.

### Audit log

- Capture data changes; viewable as a report.
- Admins: full audit access.
- DHs: audit for their department’s jobs only.
- MVP audit **must** include: status changes; technician select/reassign; Cancel/Reopen (with reasons); reclassify; SLA deadline overrides (including department-default bulk update when chosen); create inquiry/job; customer create/edit; site create/edit/delete attempts; technician directory changes; staff user/role changes.
- MVP audit **does not require**: notification channel setting changes; taxonomy (department/leaf) changes; **note add/edit** (I45 — intentional).

### Admin oversight

- Admins can oversee all departments and jobs.
- Staff user accounts and role assignment: **admins only**. Each staff user has **exactly one** role: Front desk, Coordinator, DH, or Admin (I50). **Admin and DH are mutually exclusive**. Exactly one DH per department: reject dual DH assignment unless one-step replacement (I38).

### Priority

- Values: **Low / Normal / High / Urgent**.
- Default on create: **Normal** (user may change).
- Display/sort only; no automatic SLA or notification changes from priority.

---

## Decisions

1. Front desk picks leaf category; system derives department.
2. One call → one inquiry → multiple jobs allowed (one per leaf).
3. Jobs grouped under inquiry; customer shared; issue/priority/site/category per job.
4. No later add-job-to-inquiry; new call = new inquiry.
5. DH count is **3** (one per department), not source’s 6.
6. **One Admin role** (identical permissions). Titles admin / director technical / director finance are org labels only; “all admins” = all Admin-role users.
7. Coordinators: all-department read-only.
8. Status meanings and authorities as in Confirmed behavior.
9. Reopened = action/audit only → Assigned if technician present, else New. Assigned implies a technician is selected.
10. Technician = directory + WhatsApp link; phone required; email optional; WhatsApp fail → copyable link.
11. Tech primary department; admin cross-department selection allowed.
12. SLA: start at create; processed = Closed only; Cancelled exits window/at-risk and is not processed; Cancelled excluded from performance-outcome calculations; no On Hold pause; DH/Admin department default + per-job override; daily at-risk to DH + Admin-role users while not Closed/Cancelled.
13. Reopen deadline: prompt keep / restart / custom (custom = today or future only — I28).
14. Time-to-resolve: first Assigned → first Resolved; after reopen also report latest Assigned→Resolved cycle; On Hold counts; also report On Hold duration sums (I32 population).
15. Customer: non-unique match; name/phone/primary address required; email optional; multi-site; job location from sites only.
16. Customer editable anytime by FD/DH/admin; job fields lock for FD on that job’s technician selection.
17. Performance reports: comprehensive metrics; auto Mon–Sun Asia/Colombo Monday 08:00; manual any date range (B9); latest manual in-app per requester (I36).
18. Audit: admin full; DH department jobs; event list per I17; notes out of MVP audit (I45).
19. Taxonomy and staff accounts: admin-managed. Exactly one DH per department (zero and dual blocked — I34/I38). Admin≠DH (I44).
20. Cancel requires reason (non-empty after trim — M24); On Hold requires note from **technician** only (DH/admin On Hold note optional); free-form notes Tech/DH/Admin (I35/I39).
21. MVP out of scope: technician login/app; invoicing/payments/inventory; customer portal; GPS/live tracking; in-app staff chat; photos; API-as-deliverable.
22. Notification channels default in-app+email; admin toggles channels per event type; recipients fixed. **Customer inquiry SMS** is a separate Admin toggle (default **off**) + editable English template (**RC-001 / I58**).
23. **(Session 2 / B1)** Cancelled exits critical window and at-risk immediately; not “processed”; excluded from performance-outcome calculations (volume may still count cancellations separately).
24. **(Session 2 / B2)** Closed requires **current** status Resolved (clarified Session 4 / B8). DH/admin may set Resolved. Close/Cancel/Reopen are dedicated actions (I20).
25. **(Session 2 / B3)** On reopen: Assigned only if a technician exists; otherwise New. Assigned means a technician is selected. Assigned is entered only via technician selection or reopen-with-technician.
26. **(Session 2 / B4)** Deactivate technician is blocked while they have any open (non-Closed/Cancelled) jobs; reassign or Close/Cancel first.
27. **(Session 2 / B5)** Deactivate department/leaf is blocked while any job in any status still references that leaf/department.
28. **(Session 2 / B6)** Issue is mandatory non-empty free text on every job; no further min/max length.
29. **(Session 2 / I1; Session 5 / B9)** Manual report may be run by admins (all-department scope) and by each DH (own department only). Manual: user picks start/end dates; email goes only to the triggering user.
30. **(Session 2 / I2a; Session 5 / B9)** Volume counts are events within the report **period** only (auto: that Mon–Sun week; manual: selected inclusive date range).
31. **(Session 2 / I2b)** Aging: past-deadline snapshot; avg/median days-to-Close for jobs Closed in the period (**calendar dates**, Asia/Colombo — M26); N/A if none Closed (I40).
32. **(Session 2 / I2c)** Workload metrics are snapshots at report time (include techs with 0 — M34).
33. **(Session 2 / I2d)** Quality/flow metrics as Confirmed behavior (On Hold rate includes mid-period Cancelled if open/On Hold — I23; On Hold duration includes mid-period Cancelled On Hold time — I32); N/A on zero denominator (I29).
34. **(Session 2 / I3; Session 6 / I49)** Time-to-resolve: keep first Assigned→first Resolved; also report latest Assigned→following Resolved after reopen; **include TTR on auto and manual performance reports**.
35. **(Session 2 / I11)** Site requires label/name + address; edit updates all referencing jobs; delete blocked while any job references the site (delete actor: Admin only when unreferenced — B7). DH may create/edit sites for any customer (M27).
36. **(Session 2 / I4)** SLA uses Asia/Colombo calendar dates: deadline = create date + N days end-of-day; at-risk from start of calendar day 2 days before deadline.
37. **(Session 2 / I5)** Daily at-risk prompts at 08:00 Asia/Colombo; weekly auto report Monday 08:00 Asia/Colombo confirmed. No immediate at-risk on reopen-into-past-deadline (M28).
38. **(Session 2 / I16)** Shareable link: unpredictable secret; valid until reassign/Close/Cancel or 10 days after issuance; DH/admin may regenerate/resend while open.
39. **(Session 2 / I6)** Department default SLA change applies to new jobs; actor prompted whether to also update existing open jobs without per-job override; per-job overrides unchanged (Admin may set any dept default — I26). Per-job override deadline = today or future only (I33).
40. **(Session 2 / I7)** In Progress / On Hold / Resolved require a technician. First technician select is always New → Assigned (+ link).
41. **(Session 2 / I9)** One inquiry may include jobs across different departments; each job notifies its own DH.
42. **(Session 2 / I10)** Create intake: front desk (any), admin (any), DH (own department leaves only).
43. **(Session 2 / I8)** FD category change that changes department on an unassigned job notifies both old and new DH.
44. **(Session 2 / I15)** Reassign and regenerate/resend use the same WhatsApp + copyable-fallback delivery as first select.
45. **(Session 2 / I12)** Default priority on create is Normal.
46. **(Session 2 / I13)** Single Admin role; three titles are labels only; “all admins” = all Admin-role users.
47. **(Session 2 / I14)** On Hold note required for technician only; optional for DH/admin. Free-form notes: Tech/DH/Admin may add; FD may not; all visible on link (I35).
48. **(Session 2 / I17; Session 5 / I45)** Audit includes A’s list except notification settings, taxonomy changes, and note add/edit.
49. **(Session 2 / I18)** Action-triggered email failure: in-app warning to actor; action still succeeds. Scheduled emails best-effort.
50. **(Session 2 / I19)** Front desk may view all departments’ inquiries/jobs; edits remain limited as already decided.
51. **(Session 2 / M2)** Customer email is optional (confirmed).
52. **(Session 2 / M3)** Invalid/expired link must show message intent: “This job link is no longer valid. Contact your department head.”; no view/update.
53. **(Session 2 / M4; Session 4 / M24)** Cancel reason and technician On Hold note: non-empty **after trim**; whitespace-only rejected; no further min/max.
54. **(Session 2 / M5)** FD/coordinator deny list as A; FD may view technician directory read-only; coordinator cannot view directory.
55. **(Session 2 / M6)** Concurrent edits: last-write-wins in MVP; no merge/lock required.
56. **(Session 2 / M7)** Grilling + Session 2 override source summary on conflicts; source is historical intake only.
57. **(Session 2 / M8)** MVP out-of-scope list reconfirmed (tech login/app, billing/inventory, portal, GPS, chat, photos, API-as-deliverable).
58. **(Session 2 / M9)** Role headcounts are planning figures only except **one DH per department**; no hard seat caps for FD, coordinator, Admin users, or technician directory size.
59. **(Session 3 / B7)** Sites: FD, Admin, and DH may create/edit; only Admin may delete when unreferenced (delete still blocked while any job references the site).
60. **(Session 3 / I20)** DH/admin may set In Progress/On Hold/Resolved (with tech); Cancel/Close/Reopen are dedicated actions; cannot free-jump to New, Assigned, Cancelled, or Closed.
61. **(Session 3 / I21)** Technician select/reassign rejected on Closed/Cancelled; must Reopen first.
62. **(Session 3 / I25)** No delete of customers, inquiries, or jobs in MVP; retire jobs via Cancel/Close only.
63. **(Session 3 / I22)** DH/admin reclassify notifies both old and new DH (aligned with FD). FR-4.3 aligned (I31).
64. **(Session 3 / I23)** On Hold rate: jobs Cancelled mid-week still count if they were open / entered On Hold that week.
65. **(Session 3 / I24)** Manual report: on email failure, warn in-app; report still available in-app for requester (retention = latest per requester — I36).
66. **(Session 3 / I26)** Admin may set any department SLA default and any per-job override; DH limited to own department (same bulk-update prompt).
67. **(Session 3 / I27)** Technician link shows issue, priority, status, category, site, customer name+phone, deadline, notes; hides primary address, email, cancel reasons, audit.
68. **(Session 3 / I28)** Reopen custom deadline must be today or future (Asia/Colombo); past dates rejected.
69. **(Session 3 / I29)** Reopen rate and On Hold rate show N/A when denominator is 0.
70. **(Session 3 / I30)** Report generation is all-or-nothing; no partial artifact; error + retry.
71. **(Session 3 / M10)** Baseline hygiene applied so stale Risks/Error/Edge/Constraints/Human-decisions/auth-table/decision-list match Confirmed behavior.
72. **(Session 3 / M11)** Issue must be non-empty after trim; whitespace-only rejected.
73. **(Session 3 / M12)** Weekly “created” volume = jobs created that week (not inquiries).
74. **(Session 3 / M13)** Re-selecting the same technician = regenerate/resend (new link; old dies).
75. **(Session 3 / M14)** No job field edits on Closed/Cancelled without Reopen.
76. **(Session 3 / M15)** Site delete actor confirmed as B7 (Admin only when unreferenced).
77. **(Session 3 / M16)** `docs/requirements/Assidua-Ops-requirements-baseline.md` is the single source of truth; Acceptance criteria within it are authoritative over illustrative Test requirements lists.
78. **(Session 3 / M17)** B5 taxonomy deactivate permanence acknowledged as accepted ops consequence; no rule change.
79. **(Session 3 / M18)** Audit retention period deferred for MVP (no required period).
80. **(Session 3 / M19)** In-app notification delivery is best-effort; no required failure UX in MVP.
81. **(Session 3 / M20)** Multi-job create is atomic — any invalid job rejects the entire submission.
82. **(Session 4 / B8)** Close requires **current** status Resolved; ever-Resolved alone is insufficient after a later jump to In Progress/On Hold.
83. **(Session 4 / I32)** On Hold duration sum includes On Hold time during the week for mid-week Cancelled jobs (same population spirit as On Hold rate).
84. **(Session 4 / I33)** Per-job SLA override deadline must be today or a future calendar date (Asia/Colombo); past rejected.
85. **(Session 4 / I34; Session 5 / I38)** Exactly one DH per department: block zero DHs and block second DH unless one-step replacement.
86. **(Session 4 / I35)** Notes: Technician, DH, Admin may author; Front desk may not; all notes visible on technician link.
87. **(Session 4 / I36)** In-app: keep latest manual report per requester until they generate again; auto reports email-only; no multi-week in-app history.
88. **(Session 4 / I31)** FR-4.3 aligned to dual-DH notify on reclassify (hygiene; Decision 63 unchanged).
89. **(Session 4 / I37)** Acceptance criteria added for same-tech regenerate, N/A rates, past custom/override deadlines, technician field allow/deny list, Admin cross-dept SLA.
90. **(Session 4 / M21–M26, M29)** Hygiene: restore FR-2.4 link invalidation; FR-3.1 allow/deny; decisions header; trim on cancel/On Hold notes; duplicate-leaf and empty-inquiry ACs; days-to-Close = calendar dates.
91. **(Session 4 / M27)** DH site create/edit for any customer confirmed (shared customers across departments).
92. **(Session 4 / M28)** Reopen keeping a past deadline does not trigger immediate at-risk; next 08:00 run applies.
93. **(Session 4 / M30)** NFR-1 delivery/retry beyond WhatsApp→copyable remains intentionally open for implementation constraints.
94. **(Session 5 / B9; Session 6 / I46–I47)** Manual report: inclusive start/end dates (Asia/Colombo); end ≤ today; span ≤ 90 days; metrics use same formulas; email only to requester. Auto remains prior Mon–Sun at Monday 08:00.
95. **(Session 5 / I38)** Exactly one DH: reject assigning a second DH unless one-step replacement (zero and dual both blocked).
96. **(Session 5 / I39)** DH/Admin may add notes on Closed/Cancelled; technicians cannot (link invalid).
97. **(Session 5 / I40)** Avg/median days-to-Close shows N/A when no jobs Closed in the period.
98. **(Session 5 / I41; Session 6 / I51)** DH viewing multi-dept inquiry sees only own-department jobs; non-detailed sibling indicator; no foreign details.
99. **(Session 5 / I42; Session 6 / I52)** WhatsApp body = link + customer name, site label, issue, priority; copyable fallback same content; truncate long issue in summary.
100. **(Session 5 / I43)** Department default N must be integer ≥ 1; no upper cap in MVP.
101. **(Session 5 / I44)** Admin and DH roles are mutually exclusive.
102. **(Session 5 / I45)** Note add/edit intentionally out of MVP audit.
103. **(Session 5 / M31–M36)** Hygiene: Session 5 authority in Risks; same-DH notify once (M32); optional Resolved whitespace = no note (M33); workload includes techs with 0 (M34); go-live requires three DHs (M35); NFR-1 remains open (M36).
104. **(Session 6 / I46)** Manual report: end ≤ today; inclusive span ≤ 90 calendar days; reject future end and oversize span.
105. **(Session 6 / I47)** Report periods inclusive both ends (start 00:00:00–end 23:59:59 Asia/Colombo).
106. **(Session 6 / I48)** Notes are add-only; no edit or delete in MVP.
107. **(Session 6 / I49)** Time-to-resolve included on auto and manual performance reports.
108. **(Session 6 / I50)** Each staff user has exactly one role (FD or Coordinator or DH or Admin).
109. **(Session 6 / I51)** DH sees non-detailed indicator that multi-dept inquiry has other departments’ jobs; no foreign details.
110. **(Session 6 / I52)** Copyable fallback = same summary+link as WhatsApp; long issue truncated in summary; full issue on link.
111. **(Session 6 / I53)** Block technician primary-department change while they have open jobs.
112. **(Session 6 / M37–M40, M42)** Hygiene: Decision 30 period wording; FR-8.1 same-DH notify once; ACs for same-dept notify-once and single-day manual range; NFR-1 remains open.
113. **(Session 6 / M41)** DH/Admin may edit cancel reason after Cancel (non-empty after trim).
114. **(Freeze 2026-08-11)** Requirements baseline **FROZEN**. I54–I57 and M43–M47 parked as deferred assumptions (not decided). No further grilling/discovery. Architecture may proceed; new business needs require an explicit requirements change.
115. **(RC-001 / I58 / 2026-08-13)** Customer-facing inquiry number `YYYYMMDD-NNN` (Asia/Colombo daily sequence) on every inquiry create; staff UI shows it. Optional customer SMS on create (one SMS per inquiry): Admin toggle default **off**; Admin-editable English template requiring `{INQUIRY_NUMBER}` and `{JOB_COUNT}`; seed text per RC-001; SMS fail → create succeeds + actor in-app warning; no manual resend; English only in MVP. See `Assidua-Ops-requirements-change-RC-001-customer-inquiry-sms.md`.

---

## Assumptions

1. “Reopened counts” in volume means count of reopen **actions/events**, since Reopened is not a lasting status.
2. New-job notification recipients are the single DH of the derived department (and channel toggles apply).
3. Reopen “restart from now” uses department default N **calendar days** from the reopen date (Asia/Colombo), same calendar rule as I4.
4. Audit retention period is **out of MVP scope** until a later compliance decision (M18).
5. **(Session 4)** Per-job SLA override is expressed as a **deadline calendar date** (validated today-or-future), not a separate product path from reopen custom.
6. **(Session 4 / M26)** Avg/median “days to Close” uses Asia/Colombo **calendar-date** difference (create date → Close date), not fractional elapsed hours.
7. **(Session 4)** “Latest manual report per requester” means one retained in-app artifact per user for their last successful manual generation (Admin all-dept or DH own-dept scope as applicable).
8. **(Session 5 / B9)** Manual “selected period” applies the same metric definitions with “week/period” substituted by the chosen date range; snapshot metrics remain “at report generation time.”
9. **(Session 5 / M35)** Go-live / seed requires each of the three departments to have its DH assigned before production use.
10. **(Session 6 / I52)** Exact WhatsApp/copyable issue truncation length is whatever the channel/provider requires; business rule is truncate-in-summary, full text on link.
11. **(RC-001)** Inquiry number is always assigned on create (independent of SMS toggle). Daily sequence padding is three digits (`001`…). SMS destination is customer phone.

### Assumptions (deferred at freeze — not product decisions)

These Session 6 residual items are **explicitly parked**. They are **not** resolved. Do not invent answers in architecture; escalate as a **requirements change** if blocking design/build.

12. **(Deferred / I54)** Time-to-resolve **report shape** (per-job vs avg/median vs both), **population** for a period, and **unit** (calendar days vs elapsed) remain undecided beyond “include TTR on the report” (I49).
13. **(Deferred / I55)** Whether **cancel-reason edits** after Cancel are captured in the MVP audit log remains undecided.
14. **(Deferred / I56)** Whether **DH** may change a technician’s primary department (when no open jobs) vs **Admin only** remains undecided.
15. **(Deferred / I57)** Whether cancel reason may still be edited **after Reopen** (historical Cancelled reason) vs only while status is Cancelled remains undecided.
16. **(Deferred / M43)** Sibling indicator may be a count or a simple existence message — either acceptable until a later preference.
17. **(Deferred / M44)** Issue field has no business max length; storage/UI caps are implementation constraints unless a later requirements change sets one.
18. **(Deferred / M45)** Phone format / WhatsApp / SMS suitability validation rule not specified; dependency remains “suitable for WhatsApp” / SMS provider as applicable.
19. **(Deferred / M47)** Snapshot metrics on historical manual periods are at **generation time** (Assumption 8); call out in UX so users are not surprised — not a new metric rule.

---

## Open questions

1. **(M30 / M36 / M42 / M46 / NFR-1)** Delivery reliability/retry policy for staff email, WhatsApp, and customer SMS beyond “WhatsApp fail → copyable link” / “SMS fail → actor warning” remains intentionally unspecified for implementation constraints.
2. **(Deferred at freeze)** I54, I55, I56, I57 — see Assumptions 12–15. Not resolved; require an explicit requirements change to decide.
3. **(RC-001 open for architecture)** SMS provider; concurrent daily-sequence uniqueness; whether SMS toggle/template edits or send attempts appear in audit (do not invent — parallel to notification-settings audit exclusion unless a later change requires them); template max length vs provider limits.

**Freeze:** No further open-ended requirements grilling or discovery. Explicit RC-* changes only. Architecture proceeds on this baseline (+ approved RCs).

---

## Functional requirements

### FR-1 Inquiry and job intake

- FR-1.1 Front desk, admins, and department heads can create a customer (name, phone, primary address required) or select an existing customer via search (name/phone; duplicates allowed). Coordinators cannot create.
- FR-1.2 Front desk, Admin, and DH may **create/edit** customer sites (required **label/name + address**); DH may do so for **any** customer. Job service location must reference a site. Site edit updates all referencing jobs. Site delete is blocked while any job references it; when unreferenced, **only Admin** may delete.
- FR-1.3 Front desk and admins can create an inquiry with one or more jobs (any departments). A DH can create an inquiry/jobs only with leaves in **their** department (no cross-dept jobs on a DH-created inquiry). Multi-job submit is **atomic**: if any job in the batch is invalid, **reject the entire submission** (no inquiry/jobs created). Create requires **one or more** jobs; zero-job inquiry is rejected. Within one inquiry, **at most one job per leaf**; duplicate leaf in the same submission is rejected.
- FR-1.4 Each job requires leaf category, **issue** (required non-empty free text after trim — whitespace-only rejected; no further min/max length), priority (Low/Normal/High/Urgent; default **Normal**), and site; department is derived; status = New.
- FR-1.5 System notifies owning DH of each new job per notification settings.
- FR-1.6 Follow-up work uses a new inquiry, not appending jobs to an old inquiry.
- FR-1.7 On successful inquiry create, assign a unique customer-facing inquiry number `YYYYMMDD-NNN` (Asia/Colombo date + daily sequence padded to three digits). Display the number in staff UI. Number is assigned whether or not customer SMS is enabled (RC-001 / I58).
- FR-1.8 When the Admin customer-SMS toggle is **on**, after successful inquiry create, send **exactly one** SMS to the customer phone using the current Admin template with `{INQUIRY_NUMBER}` and `{JOB_COUNT}` substituted (`JOB_COUNT` = jobs created in that inquiry). When the toggle is **off**, do not send SMS. No manual resend in MVP (RC-001 / I58).
- FR-1.9 SMS send failure must not roll back inquiry/job create; show an in-app warning to the creating actor (RC-001 / I58).

### FR-2 Assignment and technician link

- FR-2.1 DH (own department pool) or admin (any department) selects a technician on a job.
- FR-2.2 Selecting a technician on a New job sets status to Assigned and triggers WhatsApp link send (body: link + customer name, site label, issue, priority; truncate issue in summary if needed); on failure, show copyable **same summary + link**.
- FR-2.3 Changing technician invalidates the old link; keeps status if already In Progress/On Hold/Resolved. Reassign/regenerate message body same as first select.
- FR-2.4 On **Closed** or **Cancelled**, the shareable link stops working entirely (same invalid-link message as reassign/expiry).
- FR-2.5 Technician select/reassign on Closed or Cancelled is rejected; Reopen required first.
- FR-2.6 Selecting the **same** technician already on the job is regenerate/resend: old link dies; WhatsApp attempted with copyable fallback.

### FR-3 Technician shareable link

- FR-3.1 Technician can view only the allow-list fields (I27): issue, priority, status, category/leaf, service site (label + address), customer name, customer phone, deadline, notes thread. Must not show: customer primary contact address, customer email, cancel reasons, audit, or other staff-only internals.
- FR-3.2 Technician can set In Progress, On Hold, Resolved only, subject to “In Progress at least once before Resolved.”
- FR-3.3 Technician can add notes while link is valid (**add-only**; no edit/delete); On Hold requires a note (non-empty after trim). Optional Resolved note that is whitespace-only is treated as no note.

### FR-4 Lifecycle completion and exceptions

- FR-4.1 DH/admin may set **Resolved** (with technician present). **Closed** only via Close action when **current status is Resolved**. If status was Resolved then moved to In Progress/On Hold, Close is rejected until Resolved again. DH/admin may set In Progress/On Hold/Resolved with technician; cannot free-jump to New, Assigned, Cancelled, or Closed.
- FR-4.2 DH/admin may Cancel (dedicated action, reason required non-empty after trim); may **edit cancel reason** after Cancel (non-empty after trim); may Reopen from Closed or Cancelled with deadline prompt. Reopen → **Assigned** if technician present, else **New**.
- FR-4.3 DH/admin may reclassify leaf category; department re-derived; **both old and new DH notified** (once if same DH); technician/status kept.
- FR-4.4 DH and Admin may **add** notes (add-only; including on **Closed/Cancelled**); Front desk may not; technicians only via valid link. No note edit/delete in MVP. Notes not in MVP audit.

### FR-5 Critical window

- FR-5.1 Default 10-day window from job creation; DH department default and per-job override (own dept). Admin may set any department’s default and any per-job override. Department default N must be integer ≥ 1. Per-job override deadline must be today or a future calendar date; past rejected.
- FR-5.2 Daily at-risk notifications to DH + all admins while not Closed, not Cancelled, and within/past 2-day warning window (08:00 Asia/Colombo only — no immediate at-risk on reopen).
- FR-5.3 On Hold does not pause deadline.
- FR-5.4 Cancelled exits the critical window immediately; does not count as processed; Cancelled jobs are excluded from performance-outcome calculations.

### FR-6 Oversight, audit, reports

- FR-6.1 Admins oversee all departments/jobs; DHs manage their department’s jobs only (multi-dept inquiry: other depts’ jobs hidden + sibling indicator); coordinators view all read-only. One staff role per user.
- FR-6.2 Audit log of data changes; admin full view; DH department-job scope; notes not required in MVP audit.
- FR-6.3 Performance report: **auto** Monday 08:00 prior Mon–Sun Asia/Colombo; **manual** with inclusive start/end dates, end ≤ today, span ≤ 90 days; same metric formulas including **time-to-resolve**; email only to manual requester; latest in-app artifact per requester; auto email-only.

### FR-7 Administration

- FR-7.1 Admins manage staff users/roles (one role per user), full technician directory, and taxonomy. Deactivating a technician or changing primary department is blocked while they have open (non-Closed/Cancelled) jobs. Deactivating a department or leaf is blocked while any job (any status) references it. Sole-DH / dual-DH rules as decided.
- FR-7.2 DHs manage technicians in their department (same deactivate / primary-dept change blocks); configure their department critical-period default (N ≥ 1) and per-job overrides. Admins may set any department’s default and any per-job override. Changing department default prompts whether to update existing open jobs without per-job override.
- FR-7.3 Admins configure notification channel toggles (in-app/email) per event type.
- FR-7.4 Admins may enable/disable customer inquiry SMS (default **off**) and edit the English SMS template; template save is rejected unless both `{INQUIRY_NUMBER}` and `{JOB_COUNT}` appear in the text (RC-001 / I58).

### FR-8 Front desk edits after create

- FR-8.1 Front desk may edit job issue/site/priority/category until that job has a technician selected. If that edit changes derived department, notify old and new DH (**once** if same DH).
- FR-8.2 Front desk/DH/admin may edit customer details anytime.

---

## Non-functional requirements

- NFR-1 Notifications and weekly report delivery are business-required channels (in-app, email, WhatsApp for technician link, and **SMS for customer inquiry acknowledgement when enabled**); reliability/retry policy beyond “WhatsApp fail → copyable link” and “SMS fail → actor in-app warning; create succeeds” is not specified (open for implementation constraints later).
- NFR-2 Audit log must capture the Session 2 / I17 event list and be viewable as a report; **retention period deferred** (M18).
- NFR-3 Business calendar for SLA, weekly report, and inquiry-number date/sequence uses **Asia/Colombo**.
- NFR-4 Role boundaries must be enforceable (admin vs DH vs front desk vs coordinator vs unauthenticated link).
- NFR-5 Shareable links: unpredictable secret; invalidate on reassign/Close/Cancel; **expire 10 days after issuance**; DH/admin may regenerate/resend while job open.
- NFR-6 Concurrent edits use **last-write-wins** in MVP (no merge/lock required).
- NFR-7 Performance, scalability, accessibility, and further security standards beyond NFR-5 were **not** specified in discovery.
- NFR-8 Customer SMS delivery requires an SMS provider/process (provider not chosen in requirements — architecture) (RC-001).

---

## Acceptance criteria

### Intake

- Given front desk submits a job with empty or whitespace-only issue text, when validating, then create is rejected.
- Given front desk selects leaf “Assidua → A/C”, when the job is submitted with non-empty issue, then department is Assidua and status is New, and Assidua’s DH is notified per channel settings.
- Given front desk selects only “Home Appliances” without Tv/Washing Machine/Fridge, when submitting, then the system rejects the job (leaf required).
- Given a DH for Rivon, when creating a job with Assidua→A/C leaf, then create is rejected.
- Given a DH for Rivon, when creating Rivon→Car, then create succeeds and Rivon DH is notified (may be self).
- Given a multi-job create where one job has whitespace-only issue and others are valid, when submitting, then nothing is created and the whole submission is rejected.
- Given one inquiry with Rivon→Car and Assidua→A/C jobs all valid, when created, then Rivon DH and Assidua DH are each notified for their job; jobs share one inquiry/customer.
- Given an inquiry with Rivon and Assidua jobs, when Rivon DH opens that inquiry, then only Rivon jobs are visible (Assidua job details hidden) and a non-detailed indicator shows that other departments’ jobs exist on the inquiry.
- Given an existing inquiry, when front desk needs another job later, then they create a new inquiry (no add-to-existing).
- Given an inquiry create with zero jobs, when submitting, then create is rejected.
- Given one inquiry submission with two jobs that use the same leaf, when submitting, then create is rejected.
- Given a successful inquiry create (any job count), when create completes, then the inquiry has a customer-facing number `YYYYMMDD-NNN` (Asia/Colombo) visible in staff UI (RC-001 / I58).
- Given a successful multi-job inquiry create with customer-SMS toggle **on**, when create completes, then **exactly one** SMS is attempted to the customer phone and the body contains that inquiry number and the correct job count (RC-001 / I58).
- Given a successful inquiry create with customer-SMS toggle **off**, when create completes, then **no** SMS is sent and the inquiry number still exists (RC-001 / I58).
- Given customer-SMS toggle **on** and SMS provider failure, when create completes, then inquiry/jobs exist and the actor sees an in-app warning (RC-001 / I58).
- Given Admin saves a customer SMS template missing `{INQUIRY_NUMBER}` or `{JOB_COUNT}`, when saving, then the save is rejected (RC-001 / I58).
- Given an existing inquiry, when staff look for a resend-customer-SMS action, then none exists in MVP (RC-001 / I58).
- Given two inquiries created on the same Asia/Colombo calendar day, when inspecting numbers, then they share the same `YYYYMMDD` prefix and have distinct ascending `NNN` values (RC-001 / I58).

### Customer / sites

- Given search by phone/name, when multiple matches exist, then front desk can pick one (duplicates allowed).
- Given customer primary address only and no sites, when DH or Admin creates a job, then they may add a site (label/name + address) and select it.
- Given a customer with no jobs in the DH’s department, when that DH creates or edits a site for that customer, then the change is allowed.
- Given an unreferenced site, when FD or DH attempts delete, then delete is rejected; when Admin deletes, then delete succeeds.
- Given a site referenced by any job, when any role attempts delete, then delete is rejected.
- Given a site is edited, when saved, then all jobs referencing that site show the updated label/address.
- Given FD/DH/admin, when editing customer phone/email/address anytime, then the change is allowed.
- Given a New Assidua job, when front desk changes leaf to Rivon→Car, then department becomes Rivon and both Assidua DH and Rivon DH are notified.
- Given a New Assidua→A/C job, when front desk changes leaf to Assidua→UPS (same department), then Assidua DH is notified once (not twice).

### Assignment / link

- Given a New job, when DH selects a technician, then status is Assigned and WhatsApp send is attempted with body containing the link plus customer name, site label, issue, and priority (not phone/address/email in the WhatsApp text); on failure a copyable **same summary + link** is shown; if issue is very long, summary issue is truncated and full issue remains on the link.
- Given technician B replaces technician A, when selection is saved, then A’s link shows the invalid-link message and B receives a new link; if status was In Progress, it stays In Progress.
- Given a job already assigned to technician A, when DH/admin selects technician A again, then the previous link stops working and a new link send is attempted (regenerate/resend); status is unchanged.
- Given Closed, Cancelled, or expired link, when technician opens it, then they see message intent “This job link is no longer valid. Contact your department head.” and cannot view or update the job.
- Given an open Assigned job, when more than 10 days have passed since the current link was issued, then the invalid-link message is shown until DH/admin regenerates/resends.
- Given DH/admin regenerates a link, when saved/sent, then the previous link stops working and WhatsApp send is attempted (same failure → copyable fallback as selection).
- Given a valid technician link, when the technician views the job, then they see issue, priority, status, category/leaf, site label+address, customer name, customer phone, deadline, and notes; they do **not** see customer primary contact address, customer email, cancel reasons, or audit.
- Given DH or Admin adds a note, when the technician opens the link, then that note is visible in the notes thread.
- Given Front desk attempts to add a note, when saving, then the action is rejected.
- Given Closed or Cancelled, when DH or Admin adds a note, then the note is accepted; when technician attempts to add a note, then it is not possible (link invalid).
- Given an existing note, when any role attempts to edit or delete it, then the change is rejected (add-only).

### Technician updates

- Given Assigned, when technician sets Resolved without ever setting In Progress, then the system rejects the change.
- Given In Progress then On Hold, when technician sets Resolved with prior In Progress, then Resolved is allowed; On Hold requires a note from technician (non-empty after trim); Resolved note optional; whitespace-only Resolved note is treated as no note and allowed.
- Given technician On Hold note is whitespace-only, when saving, then On Hold is rejected.
- Given DH/admin sets On Hold with no note, when saving, then On Hold is allowed.
- Given technician link, when technician attempts Closed/Cancelled/New, then those statuses are not available.

### Close / cancel / reopen

- Given a job that has never been Resolved, when DH/admin attempts Closed, then Close is rejected.
- Given Resolved (set by technician or by DH/admin), when DH/admin sets Closed, then job is Closed and link stops working; job counts as processed for SLA.
- Given a job that was Resolved then moved to In Progress or On Hold, when DH/admin attempts Close while current status is not Resolved, then Close is rejected.
- Given Cancel, when reason missing or whitespace-only, then Cancel is rejected; when reason provided (non-empty after trim), then Cancelled and link stops; job exits critical window and at-risk; job does not count as processed; job is excluded from performance-outcome calculations.
- Given Cancelled, when DH/Admin edits the cancel reason to a new non-empty-after-trim value, then the edit is accepted; when edited to empty/whitespace-only, then the edit is rejected.
- Given Closed or Cancelled with a technician, when DH/admin reopens, then status becomes Assigned, deadline prompt offers keep / restart (dept default) / custom, and prior technician remains unless changed.
- Given Closed or Cancelled with no technician, when DH/admin reopens, then status becomes New (not Assigned), deadline prompt still applies, and no shareable link exists until a technician is selected.
- Given reopen custom deadline is a past calendar date, when confirming, then reopen is rejected.
- Given reopen with keep original deadline where that deadline is already past, when reopen completes, then no immediate at-risk notification is sent; the job is eligible for the next 08:00 at-risk run if still open and not Cancelled.
- Given DH/admin attempts to free-jump status to New, Assigned, Cancelled, or Closed, when saving, then the change is rejected (use Cancel/Close/Reopen or technician select as applicable).
- Given a New job with no technician, when DH/admin attempts In Progress, On Hold, or Resolved, then the change is rejected.
- Given Closed or Cancelled, when DH/admin edits issue/site/priority/category, then the edit is rejected until Reopen.

### SLA

- Given job created on Colombo date D0 with 10-day default, when still not Closed and not Cancelled on/after the calendar day that is 2 days before the deadline date, then DH and all admins receive at-risk prompts daily until Closed or Cancelled.
- Given a job is Cancelled while inside the at-risk window, when the next at-risk run occurs, then that job is not included.
- Given On Hold for several days, when viewing deadline, then deadline is unchanged by On Hold.
- Given DH changes department default, when prompted and declines updating existing jobs, then only subsequently created jobs use the new default; existing open deadlines unchanged.
- Given DH changes department default and accepts updating existing open jobs without override, when confirmed, then those jobs’ deadlines are recalculated from create date + new N; jobs with per-job override are unchanged.
- Given DH or Admin sets a per-job override deadline to a past calendar date, when saving, then the override is rejected.
- Given Admin sets another department’s SLA default or a per-job override on a job in another department, when saving, then the change is allowed (same bulk-update prompt rules for department default).
- Given DH or Admin sets department default N to 0 or a negative number, when saving, then the change is rejected.

### Reports / audit / roles

- Given Monday morning Asia/Colombo, when auto report runs, then admins receive all-department performance report and each DH receives their department only, for prior Mon–Sun, with volume (period events), aging (past-deadline snapshot; avg/median calendar days-to-Close for Closed that period, or N/A if none), workload snapshots including technicians with zero open jobs as 0, quality/flow per I2d/I32 definitions, and time-to-resolve (first and latest-after-reopen as applicable), excluding Cancelled from performance-outcome metrics.
- Given an admin or DH runs manual report with a selected start/end date range that is inclusive, end ≤ today, and span ≤ 90 days, when generation succeeds, then metrics use the same formulas over that period (including time-to-resolve), email goes only to the requester, and the report is available in-app as their latest manual artifact.
- Given manual report start equals end (single calendar day), when submitting a valid range, then generation is allowed.
- Given manual report end date is before start, or end is in the future, or inclusive span exceeds 90 days, when submitting, then generation is rejected.
- Given a period with no jobs Closed, when avg/median days-to-Close and reopen rate are calculated, then both show **N/A**.
- Given a period with no jobs open at any time, when On Hold rate is calculated, then the report shows **N/A** for On Hold rate.
- Given a job spent time On Hold during the period and was Cancelled mid-period, when On Hold duration sum is calculated, then that job’s On Hold time during the period is included.
- Given an admin or DH, when they run manual weekly report and email fails, then they see an in-app warning and can still view/download the generated report in-app.
- Given an admin or DH has a prior successful manual report in-app, when they generate a new manual report successfully, then the in-app artifact is replaced by the new report (previous manual artifact is no longer the retained one).
- Given auto weekly report send, when checking in-app report history, then no multi-period auto archive is required (email-only for auto).
- Given front desk, when opening technician directory, then entries are visible read-only; create/edit/deactivate technician is rejected.
- Given coordinator, when attempting technician directory, audit, or weekly report, then access is rejected.
- Given admin opens audit after a status change, assignment, cancel with reason, customer edit, and user-role change, when viewing the report, then those events are present; notification-setting, taxonomy changes, and note adds are not required in MVP audit.
- Given DH opens audit, when viewing, then only their department’s jobs’ audit entries are visible.
- Given coordinator, when accessing the app, then all departments’ inquiries/jobs are visible and no edits are possible.
- Given a user with the Admin role (any title label), when using the app, then permissions match other Admin-role users.
- Given admin attempts to assign Admin role to a current DH (or DH role to a current Admin) without removing the other role, when saving, then the change is rejected.
- Given admin attempts to assign a second staff role to a user who already has Front desk, Coordinator, DH, or Admin, when saving, then the change is rejected (one role per user).

### Reclassify

- Given Assidua job assigned to a tech, when admin/DH changes leaf to Rivon → Car, then department becomes Rivon, **both** Assidua DH and Rivon DH are notified, technician and status remain until Rivon DH changes technician.

### Technician deactivate / primary department

- Given a technician has an In Progress job, when admin/DH attempts deactivate, then deactivate is rejected until that job is reassigned or Closed/Cancelled.
- Given a technician has an open job, when admin/DH attempts to change that technician’s primary department, then the change is rejected until open jobs are reassigned or Closed/Cancelled.
- Given a technician’s jobs are all Closed or Cancelled, when admin/DH deactivates or changes primary department, then the change succeeds.

### DH vacancy / dual assignment prevention

- Given a department has exactly one DH, when admin attempts to deactivate that user or change their role so the department would have zero DHs without assigning a replacement DH, then the change is rejected.
- Given a department already has a DH, when admin attempts to assign a second user as DH for that department without replacing the first in the same change, then the change is rejected.
- Given admin assigns a different staff user as that department’s DH in the same change, when saving, then the previous sole-DH removal/role-change is allowed.

### Taxonomy deactivate

- Given any job (including Closed/Cancelled) references leaf Tv, when admin attempts to deactivate Tv (or Assidua), then deactivate is rejected.
- Given no jobs reference a leaf, when admin deactivates that leaf, then deactivate succeeds and new intake cannot use it.

---

## User-visible behavior

- Front desk: view all departments’ inquiries/jobs; customer search/create, create/edit sites (cannot delete), inquiry multi-job create, edit customer anytime, edit unassigned-job fields until technician selected; **cannot** add job notes.
- DH: own-dept jobs only (multi-dept inquiry: sibling indicator, no foreign details), create own-dept jobs, create/edit sites for any customer (cannot delete), select technician, status jumps, close/cancel/reopen with prompts/reasons, edit cancel reason, reclassify, department SLA defaults (N ≥ 1) and per-job overrides, add notes add-only (including after Closed/Cancelled), manage own technicians, department audit, department manual report (≤90 days, end≤today) + latest in-app.
- Admin: all of the above across departments; one role per user (cannot also be DH); staff users (sole-DH / dual-DH rules); taxonomy; all technicians; site delete when unreferenced; notification channel toggles; full audit; all-department reports.
- Coordinator: read-only browse of all inquiries/jobs.
- Technician (link): view allow-list fields (I27), full notes thread, In Progress / On Hold / Resolved only.

---

## API behavior

Not specified in discovery. No API contracts are part of this baseline.

---

## Data behavior

Business data concepts established (not a schema design):

- Customer (name, phone, primary address; optional email; duplicate-allowed)
- Customer sites (multiple; job location references a site)
- Inquiry (groups jobs; references customer; customer-facing inquiry number `YYYYMMDD-NNN`)
- Job (leaf category → department, issue, priority, site, status, technician, critical deadline, notes)
- Technician directory (name, phone required, email optional, primary department)
- Staff users with roles
- Department/category taxonomy (admin-managed)
- Audit entries for data changes
- Notification settings (per event: in-app/email toggles; customer SMS enable + English template)
- Report generation (scheduled + manual)

Persistence and IDs are implementation concerns. **Deletion:** customers, inquiries, and jobs are **not** deleted in MVP (I25). Site delete when unreferenced: Admin only (B7). Technician/taxonomy **deactivate** rules as decided (not hard-delete of historical jobs).

---

## Authorization

| Capability | Admin* | DH | Front desk | Coordinator | Technician link |
|------------|--------|----|------------|-------------|-----------------|
| All departments job R/W | Yes | Own dept jobs R/W | View all; create any; limited edits | Read all | Single job via valid link |
| Create inquiry/jobs | Yes (any dept) | Yes (own dept leaves only) | Yes (any) | No | No |
| Create/edit sites | Yes | Yes | Yes | No | No |
| Delete unreferenced site | Yes | No | No | No | No |
| Manage staff users | Yes | No | No | No | No |
| Manage taxonomy | Yes | No | No | No | No |
| View technician directory | Yes | Own dept | Read-only | No | No |
| Manage technicians | All | Own dept | No | No | No |
| Select technician cross-dept | Yes | No (own pool) | No | No | No |
| Close / Cancel / Reopen | Yes | Yes (own dept) | No | No | No |
| Add job notes | Yes | Yes (own dept jobs) | No | No | Yes (via link) |
| Configure notification channels | Yes | No | No | No | No |
| Configure customer SMS toggle + template | Yes | No | No | No | No |
| Full audit | Yes | Dept jobs only | No | No | No |
| Weekly report scope | All (auto + manual) | Own dept (auto + manual) | No | No | No |

\*Admin role — titles are labels only.

---

## Error states / Failure cases

- WhatsApp send failure on technician selection/reassign/regenerate → show copyable link; selection/status rules still apply.
- Action-triggered staff email failure → in-app warning to actor; primary action succeeds.
- Multi-job create with any invalid job → entire submission rejected.
- Technician uses invalidated or expired link (reassigned / Closed / Cancelled / 10-day expiry) → invalid-link message; no view/update.
- Attempt to delete a customer, inquiry, or job → rejected.
- Attempt to deactivate technician with open jobs → rejected.
- Attempt to deactivate department/leaf while any referencing jobs exist → rejected.
- Attempt to delete a site while any job references it → rejected.
- FD/DH attempt to delete unreferenced site → rejected (Admin only).
- Technician attempts Resolved without prior In Progress → rejected.
- Technician On Hold without note or with whitespace-only note → rejected (DH/admin On Hold without note allowed).
- Cancel without reason or whitespace-only reason → rejected.
- Close while current status is not Resolved (including after Resolved→In Progress/On Hold) → rejected.
- Per-job override or reopen custom deadline in the past → rejected.
- Department default N < 1 → rejected.
- Attempt to leave a department with zero DHs, or assign a second DH without one-step replacement → rejected.
- Attempt to combine Admin and DH on one user → rejected.
- Front desk attempts to add a note → rejected.
- Manual report with end before start, future end, or span > 90 days → rejected.
- Note edit or delete → rejected (add-only).
- Technician primary-department change while open jobs exist → rejected.
- Attempt to assign more than one staff role to a user → rejected.
- Non-leaf category selection → rejected.
- Inquiry with zero jobs or duplicate leaf in one submission → rejected.
- Job create without required customer fields or without site for location → rejected.
- Front desk attempts to edit job fields after technician selected → rejected (DH/admin only).
- Coordinator attempts edit → rejected.
- Unauthorized role attempts admin-only actions (users, taxonomy, cross-dept tech, channel config) → rejected.
- Reopen without completing deadline prompt / past custom deadline → reopen rejected.

---

## Edge cases

- Multi-job inquiry: partial technician selection locks FD edits per job; customer remains editable.
- Cancel from New (never selected technician).
- Reopen from Cancelled with no prior technician → **New**; reopen with technician → **Assigned**.
- Reclassify after assignment keeps technician even if technician’s primary department differs; new DH may change technician; old and new DH notified (once if same DH).
- On Hold spanning the at-risk window: clock continues; daily prompts continue; On Hold duration reported separately (includes mid-period Cancelled On Hold time — I32).
- Duplicate customers with same phone/name: staff must choose correctly; system allows duplicates.
- Concurrent edits on the same customer/job: **last-write-wins** (MVP).
- Admin selects technician outside job’s department pool.
- Priority Urgent does not change SLA automatically.
- Source listed Reopened as status; baseline uses reopen **action** → Assigned if technician else New.
- Reopen keep past deadline: no immediate at-risk; next 08:00 run applies (M28).
- Resolved then free-jump to In Progress/On Hold: Close blocked until Resolved again (B8).
- Multi-dept inquiry for DH: only own-dept jobs visible + sibling indicator (I41/I51).
- DH/Admin notes after Closed/Cancelled allowed; notes add-only (I39/I48).
- Cancel reason editable by DH/Admin after Cancel (M41).

---

## Constraints

- Technicians have no MVP login/role.
- Department derivation is from leaf category only (no free-text department pick as primary rule).
- Business timezone Asia/Colombo for week boundaries and SLA **calendar days** (I4 decided).
- Do not invent billing, inventory, GPS, chat, or customer portal behavior.
- Each staff user has exactly one role (I50).

---

## Out of scope (MVP)

- Technician login / mobile app
- Invoicing, payments, inventory/parts
- Customer self-service portal
- GPS / live tracking of technicians
- Chat between staff inside the app
- Photo upload on technician link
- Note edit/delete
- API design as a requirements/architecture deliverable in this phase
- Architecture, technology selection, cost estimation, implementation (process exclusions)

---

## Dependencies

- Working staff identity for Admin-role, DH, front desk, coordinator (account provisioning by admin).
- **Go-live:** each of the three departments must have its DH assigned (M35); Admin users must not also be DHs (I44).
- Technician phone numbers suitable for WhatsApp delivery.
- Email delivery for staff notifications and weekly reports.
- WhatsApp delivery mechanism for technician links (provider/process not chosen); message body content per I42.
- SMS delivery mechanism for customer inquiry acknowledgement when enabled (provider not chosen); template/toggle per RC-001 / I58.
- Stable department/category leaf taxonomy seeded per confirmed tree.
- Asia/Colombo scheduling for weekly auto report and daily at-risk prompts.

---

## Risks

- Duplicate customers without unique key → wrong customer/history attachment.
- WhatsApp delivery failures → reliance on manual copyable link; jobs may stall if staff do not send.
- Shareable links are the technician channel → mitigated in MVP by secret URLs, invalidation on reassign/Close/Cancel, and **10-day expiry** with regenerate/resend; residual leakage risk remains if link is forwarded before expiry (phone visible on link — I27); WhatsApp summary also exposes name/issue/site/priority (I42).
- DH/admin may set Resolved without technician In Progress → time-to-resolve still uses Assigned→Resolved when those events exist; Close cannot skip Resolved.
- Source vs grilling contradictions — **acknowledged**: grilling/Session 2/3/4/5/6 authoritative (M7 / M31).
- Daily at-risk notifications may create alert fatigue.
- Taxonomy deactivate blocked while any historical job references a leaf → production leaves are effectively permanent (B5/M17).

---

## Human decisions

Stakeholder-owned calls (see **Decisions** 1–114), including:

- Multi-job inquiry model; DH own-dept jobs + sibling indicator
- One staff role per user; one DH per department; Admin≠DH
- Status model; notes add-only; cancel reason editable after Cancel
- WhatsApp/copyable summary parity + issue truncation
- SLA N ≥ 1; manual report ≤90 days inclusive, end ≤ today; TTR on reports
- MVP exclusions
- Notification channel toggles with fixed recipients

---

## Test requirements

- This baseline’s **Acceptance criteria** are authoritative (M16).
- Tests should cover those criteria (unit/integration/E2E as appropriate later).
- E2E illustrative list: multi-dept inquiry DH view+indicator → assign → WhatsApp/copyable summary parity+truncate → status path → Close; cancel+edit reason; notes add-only; manual report bounds (90d/future/single day) + TTR; role single-seat; tech primary-dept block; sole/dual DH rules.
- Audit assertions for status, assignment, cancel reason, reopen, reclassify, customer/job edits, user/role changes (not notes).
- No implementation test stack chosen in this baseline.

---

## Definition of Done (for later delivery of this feature set)

- All applicable acceptance criteria pass.
- Tests for critical flows above exist and pass.
- E2E for completed user flows listed under Test requirements.
- Build/type/lint clean for the implementation (when built).
- Review completed.
- This baseline and any agreed open-question resolutions updated to match shipped behavior.

---

## Traceability

| Topic | Source | Grilling |
|-------|--------|----------|
| Roles / flow / categories / statuses / SLA sketch / audit / weekly report | Assidua Ops.md | Refined & decided |
| DH count 3; status authorities; tech directory; WhatsApp; sites; report metrics; etc. | — | Session Q1–Q67 |
| Session 2/3 adversarial resolutions | Findings session 2/3 | Decisions 23–81 |
| Session 4 residual (B8, I31–I37, M21–M30) | Findings session 3 residual | Decisions 82–93 |
| Session 5 residual (B9, I38–I45, M31–M36) | Findings session 4 | Decisions 94–103 |
| Session 6 residual (I46–I53, M37–M42) | Findings session 5 | Decisions 104–113 |
| Freeze | Stakeholder decision 2026-08-11 | Decision 114; deferred I54–I57, M43–M47 |

---

## Change log (Session 4 vs prior baseline)

| ID | Change |
|----|--------|
| B8 | Close requires **current** status Resolved (not merely ever-Resolved). |
| I31 | FR-4.3 updated to notify **both** old and new DH on reclassify. |
| I32 | On Hold duration sum includes mid-week Cancelled jobs’ On Hold time during the week. |
| I33 | Per-job SLA override: today or future calendar date only; past rejected. |
| I34 | Sole-DH vacancy blocked until replacement assigned. |
| I35 | Notes: Tech/DH/Admin author; FD denied; all notes on technician link. |
| I36 | Latest manual report retained in-app per requester; auto email-only; no multi-week history. |
| I37 | ACs added: same-tech regenerate; N/A rates; past custom/override deadlines; link allow/deny fields; Admin cross-dept SLA; plus B8/I32–I36 ACs. |
| M21 | Restored FR-2.4 Closed/Cancelled link invalidation. |
| M22 | FR-3.1 points at I27 allow/deny list. |
| M23 | Human decisions header updated to Decisions 1–93. |
| M24 | Cancel reason and technician On Hold note: non-empty **after trim**. |
| M25 | AC: duplicate leaf in one inquiry rejected. |
| M26 | Days-to-Close = Asia/Colombo calendar-date difference. |
| M27 | Confirmed DH may create/edit sites for any customer. |
| M28 | Reopen keep-past-deadline: no immediate at-risk; next 08:00 applies. |
| M29 | AC: zero-job inquiry rejected. |
| M30 | NFR-1 retry left intentionally open (Open questions). |

## Change log (Session 5 vs Session 4 baseline)

| ID | Change |
|----|--------|
| B9 | Manual report: user-selected start/end dates; same metric formulas; email to requester only; auto unchanged. |
| I38 | Reject second DH unless one-step replacement. |
| I39 | DH/Admin may add notes on Closed/Cancelled. |
| I40 | Avg/median days-to-Close = N/A when no Closed in period. |
| I41 | DH multi-dept inquiry: own-dept jobs only. |
| I42 | WhatsApp = link + name, site label, issue, priority. |
| I43 | Department default N ≥ 1 integer; no upper cap. |
| I44 | Admin and DH mutually exclusive. |
| I45 | Notes intentionally out of MVP audit. |
| M31 | Risks/authority cite Session 2–5. |
| M32 | Same DH on reclassify/FD change → notify once. |
| M33 | Optional Resolved whitespace-only = no note (allow). |
| M34 | Workload includes technicians with 0 open jobs. |
| M35 | Go-live requires three DHs assigned. |
| M36 | NFR-1 remains intentionally open. |

## Change log (Session 6 vs Session 5 baseline)

| ID | Change |
|----|--------|
| I46 | Manual report: end ≤ today; max inclusive span 90 days. |
| I47 | Periods inclusive both ends (00:00–23:59:59 Asia/Colombo). |
| I48 | Notes add-only (no edit/delete). |
| I49 | TTR included on auto/manual performance reports. |
| I50 | Exactly one staff role per user. |
| I51 | DH sibling-jobs indicator; no foreign details. |
| I52 | Copyable = same summary+link; truncate long issue in summary. |
| I53 | Block tech primary-dept change while open jobs. |
| M37 | Decision 30 wording → report period (not Mon–Sun-only). |
| M38 | FR-8.1 notify once if same DH. |
| M39 | AC: same-dept leaf change notifies once. |
| M40 | AC: manual start = end allowed. |
| M41 | Cancel reason editable by DH/Admin after Cancel. |
| M42 | NFR-1 remains intentionally open. |

## Change log (Freeze)

| ID | Change |
|----|--------|
| Freeze | Baseline marked **FROZEN** (2026-08-11). |
| I54–I57 | Parked as deferred assumptions (not decided). |
| M43–M47 | Parked as deferred assumptions / intentional opens (M46 = NFR-1). |
| Policy | Architecture may proceed; silent invention forbidden — escalate requirements changes. |

## Change log (RC-001 / 2026-08-13)

| ID | Change |
|----|--------|
| I58 / Decision 115 | Customer-facing inquiry number; optional customer SMS on inquiry create; Admin toggle (default off) + editable English template; one SMS per inquiry; fail → actor warning; no resend. |
| FR-1.7–1.9, FR-7.4, NFR-1/3/8 | Adopted from RC-001. |
| Source | `Assidua-Ops-requirements-change-RC-001-customer-inquiry-sms.md` (HUMAN APPROVED). |
