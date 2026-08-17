# Assidua Ops UI mockups

**Paid image models are not required.** Open the HTML files in `docs/design/mockups/` in a browser. Those are the visual source of truth for look-and-feel.

Google AI Studio image generation is behind a paid quota. The prompts below are optional if you already have access.

---

## Studio setup (only if you are paying for an image model)

You are in the **wrong mode** if the reply is `dalle.text2im` JSON or Google Search suggestions. That is a **text** Gemini with Search on. It cannot draw.

1. Open [Google AI Studio](https://aistudio.google.com) → **Playground** (not a plain text chat, not Build).
2. **Model** (right sidebar): pick an **image** model, not Gemini Pro/Flash text. Names you may see:
   - **Nano Banana Pro** / **Gemini 3 Flash Image** / **Gemini 2.5 Flash Image** / anything with **Image** in the name.
3. **Run settings → Output format:** **Images** or **Images + text**. If this says Text only, you will never get a mockup.
4. Turn **Google Search / Grounding OFF**. Search makes it emit links and fake tool JSON.
5. Aspect **16:9** if the UI offers it. Otherwise put `1440×900` in the prompt.
6. New chat for a new look. Do not continue a text-model thread.

Then paste **one** screen prompt from Part B. You do **not** need Part A as a separate first message when using an image model — each Part B block is self-contained. Use Part A only if you are in Images+text and want the model to remember the system.

**If a screen looks dated (serif, sharp corners, beige government-form):** new chat, image model, paste that screen again.

---

## Part A — Master prompt (optional; Images+text chats only)

```text
You are a senior product designer generating HIGH-FIDELITY DESKTOP WEB UI MOCKUPS for Assidua Ops.

PRODUCT
Assidua Ops is an internal staff operations tool for a Sri Lankan field-service company. Three departments: Rivon (cars), Rover (bikes), Assidua (A/C, UPS, Smart Board, home appliances). Front desk takes customer calls. Department heads assign technicians. Technicians have NO login — they open a WhatsApp shareable link. No billing, no GPS, no customer portal, no technician mobile app, no chat, no photo attachments.

USERS
- Front Desk (FD): create inquiries/jobs, edit unassigned job fields, manage customers/sites, read technician directory, see inbox. Cannot assign techs, close/cancel, add notes, manage users/taxonomy/reports/audit/notification settings.
- Department Head (DH): exactly one per department. Sees ONLY their department’s jobs. On a multi-dept inquiry, hide other jobs’ details and show a non-detailed indicator (“2 jobs in other departments”). Can assign techs from their department pool, lifecycle, notes, own-dept reports/audit.
- Coordinator: read-only all inquiries/jobs/customers. No mutations. No technicians/reports/audit/admin.
- Admin: full access across departments. Manages users, taxonomy, notification settings, SLA defaults.
- Technician: no staff chrome. Token URL /t/[token] only.

AESTHETIC LOCK — 2026 production SaaS, Figma-quality, shadcn/ui
Look like Linear, Stripe Dashboard, Ramp, or Clerk — a shipping product screenshot, not a wireframe, not a government form, not a 2004 intranet.

MANDATORY (every screen):
- Font: Work Sans (Assidua site). NEVER serif. NEVER Times, Georgia, Garamond, or “document” type.
- Corner radius: 12px cards, 10px inputs, 10px buttons, 999px pills. ZERO sharp 90° rectangles.
- Inputs: 44px tall, 14px horizontal padding, 1.5px border #E4E4E7, white fill, focus ring indigo #312E81. Placeholder in muted sans.
- Primary button: 44px tall, full-width on auth, red #EF4444, white Work Sans medium 15px, 10px radius, no gradient, no 3D bevel.
- Soft depth: cards use shadow `0 12px 40px rgba(9,9,11,0.08)` plus hairline border. Not flat gray boxes.
- Spacing: 8px grid. Labels 13px medium, 6px above field. 16px between fields.
- Anti-aliasing, crisp vectors, retina. Looks like a Tailwind + shadcn screenshot.

FORBIDDEN (instant reject if present):
- Serif fonts anywhere
- Sharp square corners on cards, inputs, or buttons
- Flat beige “paper form” with a thin gray box and no radius
- Comic icons, clipart, 3D clay, glassmorphism, neon, purple gradients
- Windows XP / Bootstrap 2 / WordPress login aesthetic
- Tiny cramped card floating in empty beige
- Photorealistic laptop bezel around the UI

Palette (from https://assiduatech.lk/ `home.css` :root — do not invent cream/teal/copper):
- Canvas / --white: #FAFAFA
- Surface / cards: #FFFFFF
- Ink / --black: #09090B
- Muted text: #71717A
- Hairline: #E4E4E7
- Brand / --primary-color (nav, wordmark panel, focus): #312E81
- Brand text: #FAFAFA
- Brand muted on indigo: #C7D2FE
- Sidebar: #312E81
- Sidebar active: #1E1B4B + 3px #EF4444 left bar
- CTA / --red (buttons): #EF4444
- CTA hover: #DC2626
- Primary button text: #FFFFFF
- At-risk / warning: #D97706
- Success / Resolved: #0F766E
- Destructive: #DC2626 (same as site hover red)
- Info / New: #312E81
- Department chips: Rivon #312E81, Rover #71717A, Assidua #4C1D95 (site also uses this in indigo→purple gradients)

Do not use cream, beige, olive forest, terracotta, copper, or teal-as-brand. Brand is indigo + red.

Typography:
- UI: Work Sans (site font). Wordmark 28–32px semibold tracking-tight. Page titles 24px semibold. Body 14px. Meta 12px.
- Inquiry numbers only: JetBrains Mono / IBM Plex Mono (20260813-001).

Layout (staff app, after login):
- Left sidebar 240px #312E81. Wordmark “Assidua Ops” + role caption under it.
- Top bar 56px white. Right: inbox bell + count pill, avatar initials in a 32px zinc circle, name, Sign out as ghost.
- Main: 32px padding, white content well, 16px radius.
- Tables: 52px rows, no zebra, hairline only, 12px-radius table container on white.
- Dialogs: 480–560px, 16px radius, overlay rgba(20,24,22,0.4), shadow.
- Empty states: one sentence + red CTA button. No mascots.

Sign-in layout (this is the quality bar for every later screen):
- SPLIT SCREEN, not a tiny centered box.
- LEFT 42%: full-bleed #312E81. Large white “Assidua Ops”. One line: “Staff operations for Rivon, Rover, and Assidua.” Three small quiet department labels. No photos, no illustrations.
- RIGHT 58%: #FAFAFA. Form column 380px, vertically centered. Title “Sign in” 28px. Subline muted. Email + password. Red “Sign in” button 44px (#EF4444). Footer under the form, not under a card: “Technicians: use the link sent on WhatsApp.”
- No nested white card-in-card. The right side IS the surface.

Status pills (exact labels):
New (slate blue) · Assigned (ink outline) · In Progress (teal) · On Hold (amber) · Resolved (teal solid) · Cancelled (muted) · Closed (ink).
At-risk jobs: small amber “At risk” chip next to deadline. Deadline dates in Asia/Colombo, format 13 Aug 2026.

NAV BY ROLE (show only what that role can see)
Admin: Inquiries · Jobs · Customers · Technicians · Taxonomy · Staff · Inbox · Reports · Audit · Settings
DH: Inquiries · Jobs · Customers · Technicians · Inbox · Reports · Audit
FD: Inquiries · Jobs · Customers · Technicians · Inbox
Coordinator: Inquiries · Jobs · Customers · Inbox
Technician link: NO sidebar, NO top staff nav. Minimal header “Assidua Ops” + job category only.

COPY RULES
English, plain, operational. No marketing headlines (“Welcome to the future of field service”). No SSO claims. Labels from real fields: Name, Phone, Email (optional), Primary address, Site, Issue, Category, Priority, Default SLA days, Inquiry number.
Deactivate confirm: state the operational consequence only (e.g. technician leaves assignment pools). Do not invent policy essays.

HARD DO-NOTS
Do not add: search-as-a-product on every list (customer search is the exception), dark mode toggle, charts-for-decoration, maps, avatars of random people as product, kanban unless asked, extra screens (billing, inventory, chat, GPS, customer portal), Leaf/Group conversion, add-job-to-existing-inquiry, technician login, fake TTR averages (show “TTR pending decision” if a reports screen).
Do not put a device bezel, phone frame, or photorealistic desk around the UI. Full-bleed desktop web screenshot, 1440×900, light, sharp, production-quality.
Do not use serif type, sharp 90° form controls, or a tiny gray-bordered card on empty beige — that look is rejected.

OUTPUT
One screen per response: a single high-fidelity UI mockup matching the screen I name next. Realistic sample data:
- Customer: Nimal Perera, 077 123 4567, 12 Galle Road, Colombo 03
- Sites: “Home — Dehiwala”, “Office — Union Place”
- Inquiry 20260813-001 with two jobs: Rivon → Car (urgent, New) and Assidua → A/C (normal, Assigned to Kasun Fernando)
- Technicians: Kasun Fernando (Rivon), Fathima Rizwan (Assidua), Nuwan Silva (Rover)
- Staff: Amaya Jayasuriya (Front Desk), Ruwan Bandara (DH · Rivon), Admin user Priya Fernando
Wait for me to name the screen.
```

---

## Part B — Screen prompts (one per Run, on an **image** model)

Start each prompt with “Generate one image. Do not output JSON, tool calls, or search.”

### 1. Sign in

```text
Generate one image. Do not output JSON, tool calls, code, or search suggestions. Output the picture only.

UI mockup screenshot of a staff sign-in web page, 1440×900, 16:9, full-bleed, no laptop frame. Linear / Stripe / Clerk 2026 SaaS. Inter font only, no serif. 10px rounded corners on every control. No sharp 90° boxes.

CRITICAL: If it looks like Times New Roman on a beige government form, you failed.

Split layout:
LEFT 42% #312E81. Huge Work Sans semibold wordmark “Assidua Ops” in #FAFAFA. Subline in #C7D2FE: “Staff operations for Rivon, Rover, and Assidua.” Three small pill labels: Rivon · Rover · Assidua. No photos, no icons collage, no serif.

RIGHT 58% #FAFAFA. A 380px form column, vertically centered, no tiny bordered card:
- “Sign in” 28px Work Sans semibold, tracking-tight, #09090B
- “Use your staff email.” 14px #71717A
- Label Email. Input 44px, 10px radius, white, placeholder name@assidua.lk
- Label Password. Input 44px, 10px radius, white, masked
- Button “Sign in” 44px, 10px radius, full 380px, red #EF4444, Work Sans medium, white text
- Under button, 13px muted: “Technicians: use the link sent on WhatsApp.”

NO serif. NO sharp corners. NO SSO. NO Google button. NO Sign up. NO Forgot password. NO laptop bezel.
Clean empty form (no validation error).
```

### 2. Access denied

```text
SCREEN: Staff access denied. Authenticated Coordinator who opened /taxonomy.
Staff shell with Coordinator nav only (Inquiries, Jobs, Customers, Inbox).
Main: simple page. Title “Access denied”. One sentence: “You don’t have access to this page.” Text button “Back to inquiries”.
No illustration. 1440×900.
```

### 3. Inquiries list — Front Desk

```text
SCREEN: /inquiries — Front Desk.
FD nav. Page title “Inquiries”. Primary button “New inquiry”.
Table columns: Inquiry number (mono), Customer, Jobs (count + department chips), Created, Latest status.
Sample rows including 20260813-001 Nimal Perera, 2 jobs, Rivon + Assidua chips.
No filters beyond what’s needed; no search box.
Empty-state is NOT shown — show a populated list.
1440×900.
```

### 4. New inquiry — Front Desk (hero screen)

```text
SCREEN: /inquiries/new — Front Desk. This is the most important staff screen. Make it exceptionally clear.
Page title “New inquiry”. Purpose line: “One customer call. One or more jobs. Saved together.”
Layout:
LEFT/TOP: Customer. Search by name or phone (show results dropdown with TWO duplicate-looking Nimal Perera rows so staff must choose). Selected customer card: name, phone, primary address. Link “Edit customer”. Button “New customer”.
THEN: Jobs. A stack of job cards. Each job card: Category (leaf picker showing Assidua → Home Appliances → Tv nested, only leaves selectable), Site select (Home — Dehiwala / Office — Union Place / “Add site”), Issue textarea, Priority select default Normal (Low, Normal, High, Urgent). Quiet “Remove job” on card 2.
Button “Add another job”.
Sticky footer: “Create inquiry” teal primary. Helper: “If any job is invalid, nothing is saved.”
Show two jobs being composed: Rivon → Car, Urgent, issue “Engine warning light after highway drive”; Assidua → A/C, Normal, issue “Indoor unit not cooling”.
Department is derived — show a small read-only “Department: Rivon” on each card after leaf is chosen. DH-only restriction does not apply (this is FD).
1440×900.
```

### 5. Inquiry created success — Front Desk

```text
SCREEN: Inquiry detail just after create. FD.
Title: inquiry number 20260813-001 in mono, large. Customer Nimal Perera.
Banner success, quiet: “Inquiry 20260813-001 created.” Optional small warning alert: “Customer SMS could not be sent. The inquiry is saved.”
Two job cards fully visible (Car New Urgent; A/C Assigned). Each shows site, issue, priority, deadline 23 Aug 2026, status pill.
Primary page action none extra — jobs are the content.
1440×900.
```

### 6. Inquiry detail — Department Head (sibling indicator)

```text
SCREEN: Same inquiry 20260813-001 opened by Ruwan Bandara, DH · Rivon.
DH nav (no Taxonomy, Staff, Settings).
He MUST see only the Rivon → Car job in full. The Assidua A/C job details are hidden.
Show a non-detailed sibling banner: “This inquiry has 1 job in other departments.” No foreign job fields, no other-dept technician names.
Car job is New, unassigned, Urgent, at-risk chip if deadline is close.
Actions on the Rivon job: Edit fields, Assign technician (visible). No Close yet (not Resolved).
1440×900.
```

### 7. Jobs board — Admin

```text
SCREEN: /jobs — Admin. Cross-department work list.
Admin nav. Title “Jobs”.
Columns: Inquiry #, Customer, Department chip, Category, Technician, Status, Priority, Deadline (Colombo date), At-risk chip on one row.
Mix of Rivon/Rover/Assidua. One On Hold, one Resolved, one New unassigned.
Quiet, scannable. No kanban. No charts.
1440×900.
```

### 8. Job detail — DH (assignment + lifecycle + notes)

```text
SCREEN: /jobs/[id] — Rivon DH. Open job In Progress.
Header: category Car, inquiry 20260813-001, customer Nimal Perera, status In Progress, deadline 23 Aug 2026.
Sections:
1) Job fields: issue, site, priority, category (editable while open).
2) Assignment: current technician Kasun Fernando, phone. Buttons: “Change technician”, “Resend link”.
3) Lifecycle: status control offering In Progress / On Hold / Resolved only (not New/Assigned/Closed as free jumps). Buttons: Close (disabled with hint “Close requires Resolved”), Cancel, Reopen hidden because not Closed/Cancelled.
4) SLA: deadline date, control “Override deadline” (date).
5) Notes: chronological add-only thread. Two notes (Kasun technician, Ruwan DH). Composer at bottom “Add note” — no edit/delete on existing notes.
6) Timeline meta, quiet: Created, Assigned, In Progress.
1440×900, well composed, not a wall of equal-weight boxes.
```

### 9. Assign technician dialog

```text
SCREEN: Dialog over the job detail. DH assigning.
Title “Assign technician”.
Select list of active Rivon technicians only (Kasun Fernando, plus one more). No Assidua techs.
Primary “Assign and send WhatsApp”. Cancel ghost.
Helper: “The technician gets a job link. They do not need an account.”
1440×900 showing the dimmed job page behind a 520px dialog.
```

### 10. WhatsApp failed — copyable fallback

```text
SCREEN: After assign, WhatsApp failed. Stay on job detail.
Alert: “WhatsApp could not be sent. Copy the message and share it yourself.”
A read-only message box containing: link https://ops.example/t/ab12… , customer name Nimal Perera, site Home — Dehiwala, issue (may be truncated), priority Urgent. MUST NOT show customer phone, email, or primary address in this message.
Button “Copy message”. Assignment is clearly already saved (status Assigned, technician Kasun).
1440×900.
```

### 11. Cancel job dialog

```text
SCREEN: Cancel dialog on job detail. DH.
Title “Cancel job”. Required textarea “Reason”. Primary destructive “Cancel job”. Ghost “Keep job”.
Helper: notes remain; the technician link will stop working.
1440×900 with dialog.
```

### 12. Reopen job dialog

```text
SCREEN: Reopen dialog. Job is Cancelled.
Title “Reopen job”.
Radio: Keep current deadline / Restart from today using department SLA / Set a custom date.
Custom date field enabled only on third option. Date cannot be in the past (Colombo).
Primary “Reopen”.
1440×900 with dialog.
```

### 13. Customers list + search — Front Desk

```text
SCREEN: /customers — FD.
Title “Customers”. Primary “New customer”.
Search field (the one allowed search): “Search name or phone”.
Results list showing two similar Nimal Perera rows (duplicates allowed — staff must pick). Columns: Name, Phone, Address, Sites count.
1440×900.
```

### 14. Customer detail + sites

```text
SCREEN: /customers/[id] — FD/Admin.
Customer: Nimal Perera. Fields: Name, Phone, Email (optional, empty), Primary contact address. Save.
Sites section: list of two sites (label + address). Add site. Edit. Admin-only Delete on an unreferenced site — show Delete on “Warehouse — Kelaniya” as a quiet destructive text, not on Home which is in use.
No “Delete customer”.
1440×900.
```

### 15. Technicians list — DH

```text
SCREEN: /technicians — Rivon DH.
Title “Technicians”. Filter default Active (segmented Active / Inactive). Primary “New technician”.
List is Rivon-only. Columns: Name, Phone, Email, Department (Rivon, locked), Status.
Kasun Fernando active. No Rover/Assidua rows.
1440×900.
```

### 16. Technician form — Admin

```text
SCREEN: /technicians/new — Admin.
Title “New technician”. Fields: Name, Phone, Email (optional), Primary department (select Rivon/Rover/Assidua). Save. Cancel returns to list.
No phone-format hint theatre.
1440×900.
```

### 17. Taxonomy — Admin

```text
SCREEN: /taxonomy — Admin. Nested tree, not a third-party tree widget.
Title “Taxonomy”. Purpose: “Departments own the categories used at intake. Only leaves can be selected; groups nest them.”
Primary “Add department”.
Three department sections:
Rivon — Default SLA 10 days — leaf Car
Rover — Default SLA 10 days — leaf Bike
Assidua — Default SLA 10 days — leaves A/C, UPS, Smart Board; group Home Appliances with leaves Tv, Washing Machine, Fridge
Departments are section headers. Row actions are quiet ghost: Edit, Add category (on dept/group only, NOT on leaves), Deactivate.
Label Group on Home Appliances. Label Inactive only when inactive — do not stamp Active/Leaf on every row.
One inactive leaf somewhere labeled Inactive, with Reactivate.
1440×900.
```

### 18. Staff users — Admin (DH replacement)

```text
SCREEN: /staff — Admin.
Title “Staff”. Primary “New staff”.
Table: Name, Email, Role, Department (DH only), Active.
Roles: Front Desk, Coordinator, Department Head, Admin. Exactly one role per user.
Show a row for Ruwan Bandara, DH, Rivon.
Also show an edit dialog or side panel for one-step DH replacement: “Replace Rivon department head” — outgoing Ruwan, incoming another user, single Save. Helper: “A department must have exactly one department head.”
No dual-role checkboxes.
1440×900.
```

### 19. Notification settings — Admin

```text
SCREEN: /settings/notifications — Admin.
Title “Notifications”.
Section 1: Staff events. Three rows: Job created · Job department changed · Job at risk. Each row: In-app toggle, Email toggle (both on). No recipient picker. Note: “Who receives these is fixed by role.”
Section 2: Customer SMS. Toggle off by default. English template textarea containing {INQUIRY_NUMBER} and {JOB_COUNT}. Helper: one SMS per inquiry, even with multiple jobs. No resend control. No WhatsApp toggle. No report-email toggle.
Save.
1440×900.
```

### 20. Inbox — any staff

```text
SCREEN: /inbox — DH Ruwan.
Title “Inbox”. List of in-app notifications: “New job in Rivon — Car — Nimal Perera”, “Job at risk — deadline 13 Aug 2026”. Unread vs read quiet. No mark-all theatre required; keep it simple.
1440×900.
```

### 21. Performance report — Admin

```text
SCREEN: /reports — Admin.
Title “Reports”. Date range start/end (Colombo). Helper: “Up to 90 days, not after today.” Button “Generate report”.
Results (latest artifact): metric cards — Created, Closed, Cancelled, Reopened, Open past deadline, Unassigned New, Currently On Hold. Workload table: technicians including one with 0 open jobs. Quality: On Hold rate, Reopen rate, On Hold duration.
TTR section: explicit placeholder “Time to resolve — pending decision” plus a small raw cycles table (job, assigned → resolved). Do NOT show fake average TTR.
Quiet note: “A copy is emailed to you. Weekly report email is sent every Monday.”
1440×900.
```

### 22. Audit log — Admin

```text
SCREEN: /audit — Admin.
Title “Audit”. Append-only list. Columns: Time (Colombo), Actor, Action, Entity, Department.
Rows: inquiry created, technician assigned, job cancelled, staff role changed, site deleted.
No edit/delete. Filters: date, action, department — keep light.
1440×900.
```

### 23. Technician link — valid

```text
SCREEN: /t/[token] — technician phone-width is OK but design as a clean mobile web page 390×844 AND also say if you can only do 16:9, do a mobile column centered on paper.
NO staff sidebar. Minimal header Assidua Ops.
Show ONLY allow-list: customer name Nimal Perera, customer phone 077 123 4567, site label + address, category Car, issue full text, priority Urgent, status In Progress, deadline 23 Aug 2026, notes thread.
MUST NOT show: customer email, primary contact address, cancel reason, audit, staff names beyond note authors if present, inquiry internals.
Actions: status buttons In Progress / On Hold / Resolved (Resolved allowed because already been In Progress). Add note composer.
Primary feel: large type, thumb-friendly, one column, teal primary.
```

### 24. Technician link — invalid

```text
SCREEN: Invalid/expired technician link. No job data at all.
Centered message exactly: “This job link is no longer valid. Contact your department head.”
No job fields, no login form, no staff nav.
Mobile web, calm, 390×844 or 16:9 centered card.
```

### 25. SLA default change — DH (bulk prompt)

```text
SCREEN: Dialog when Rivon DH changes Default SLA days from 10 to 7.
Title “Update default SLA”. Field Default SLA days = 7.
Required choice: “Also update open jobs that do not have a per-job deadline override?” Yes / No — must be explicit, not a hidden checkbox default.
Primary Save.
1440×900 with dialog over a simple department SLA snippet (not the full Admin taxonomy tree).
```

---

## Part C — Optional: HTML prototype instead of images

If you want clickable HTML rather than pictures, paste Part A, then:

```text
Now generate a single self-contained HTML file (Tailwind CDN) that implements screens 1, 4, 6, 8, 17, 23 as separate sections with a top tab switcher. Use the exact palette as CSS variables. No React. No placeholder lorem. Use the sample data from the master prompt. Do not add screens I did not list.
```

---

## What this prompt must not change

Business rules stay in `docs/specs/`. These mockups are look-and-feel + layout only. If a generated screen invents a control (Forgot password, TTR average, add job to existing inquiry, DH taxonomy, Coordinator assign), discard that control — do not implement it.
