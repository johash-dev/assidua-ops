# Assidua Ops — MVP Project Proposal

**Prepared for:** Assidua Ops  
**Prepared by:** [Your name / company]  
**Date:** 12 August 2026 (amended 13 August 2026 — RC-001 customer inquiry SMS)  
**Version:** 1.2  

---

## 1. Project Overview

Assidua Ops needs a simple, shared system to manage customer inquiries and jobs across **Rivon**, **Rover**, and **Assidua**.

Today, work can be hard to track because information is spread across people and tools. This project will deliver a first working version of the system (the MVP) so your team can:

- Record customer inquiries and create jobs
- Send an optional SMS acknowledgement to the customer when an inquiry is recorded (one SMS per inquiry, even if it contains multiple jobs)
- Assign work to the right department and technician
- Share secure job links with technicians through WhatsApp (technicians do not need to log in)
- Track progress, notes, and deadlines
- Receive useful notifications and reports

This proposal covers a **fixed-scope**, **fixed-price** project delivered over **3 weeks**.

---

## 2. What the System Will Provide

At the end of the project, authorised staff will be able to use the system as described below.

### Customer Management

- Maintain customer information
- Store multiple locations for a customer
- Select the correct location when creating a job

### User Access and Organisation Setup

- Sign in with role-based access (Front Desk, Department Head, Coordinator, Admin)
- Manage departments and job categories (Admin)
- Manage staff users and roles (Admin)

### Job Management

- Create an inquiry with one or more jobs in a single step, including jobs for different departments
- Assign each inquiry a short reference number for staff and customer communication
- Assign jobs to departments and technicians
- Track job progress
- Add notes (notes can be added, not edited)
- Close, cancel, or reopen jobs

### Technician Communication

- Maintain a technician directory (name, phone, and optional email)
- Share secure technician links through WhatsApp
- Provide a copyable link if WhatsApp delivery is unavailable

### Deadlines and Notifications

- Set department-specific deadlines, with the option to adjust a deadline for an individual job
- Identify jobs that are approaching their deadline
- Send in-app and email notifications (Admin can control which events trigger notifications)
- Optionally send a customer SMS when an inquiry is created (Admin can turn this on/off and edit the English message template; off by default)
- Run a daily reminder for jobs approaching their deadline
- Send a weekly performance report email every Monday

### Reporting and Activity History

- View performance information
- Generate reports manually
- Receive scheduled weekly reports
- View an activity history of important actions (Admin can see all activity; Department Heads can see activity for their department)

### Business Benefit in Short

The system gives your team one place to manage inquiries and jobs, clearer ownership of work, faster technician communication, and better visibility of deadlines and performance.

---

## 3. What Is Included

The project fee covers:

- Building the MVP described in this proposal
- Testing support during the final week
- Help fixing critical problems found during client testing, before acceptance
- Handover materials needed to run the system
- Post-launch maintenance for the first **3 months after go-live**

### What You Will Receive at Handover

- Access to the source code repository
- Deployed environments as agreed (for example, staging and production)
- Initial setup for departments, categories, and an Admin user
- A short operating guide covering environment settings, database updates, time-zone settings, and how to update email/WhatsApp/SMS credentials
- A testing checklist aligned to the approved project scope

---

## 4. What Is Not Included

The following are **not** included in the LKR 650,000 project fee:

- Technician staff accounts or a technician mobile app
- Invoicing, payments, or inventory
- A customer self-service portal
- GPS or live tracking
- In-app staff chat
- Photo attachments
- A public or partner API as a deliverable
- High-availability redesign for multiple server instances
- Long-term audit retention tools
- Hosting, domain, database, email, WhatsApp, or SMS service fees
- Any functionality outside the approved project scope

If you need something outside this scope, it can be handled as a **change request**. We will provide an estimate and proceed only after written approval.

---

## 5. Project Cost & Payment

### Development Fee

**LKR 650,000** (one-time fixed project fee)

This fee covers the software build described in this proposal. It does **not** include ongoing third-party service costs such as hosting or messaging.

VAT treatment will be confirmed before signing.

### Payment Schedule

| Payment | Amount |
| --- | ---: |
| Advance payment — due at project kickoff | LKR 195,000 (30%) |
| Final payment — due before go-live | LKR 455,000 (70%) |
| **Total project fee** | **LKR 650,000** |

- The **advance payment** is due at kickoff, before development starts.
- The **final payment** is due **before the system goes live**.

### Ongoing Operating Costs (Separate from the Development Fee)

In addition to the development fee, the system will require some ongoing third-party services. These costs are paid by the client directly to the relevant service providers. They are **not** included in the LKR 650,000 development fee.

Based on a lean production setup, these costs are estimated at approximately **LKR 15,000–28,000 per month** (higher if customer SMS is enabled at volume — see upper band in the recurring-cost sheet).

| Service | Purpose |
| --- | --- |
| Application and database hosting | Runs the system and stores its data |
| Email service | Sends system notifications and reports |
| WhatsApp messaging | Sends technician assignment links |
| SMS messaging | Optional customer inquiry acknowledgement (Admin-controlled) |
| Domain | Provides the web address for the system |
| Backups and basic monitoring | Helps protect and monitor the system |

**Estimated ongoing operating cost: LKR 15,000–28,000 per month** (lean); comfortable production with SMS typically **LKR 75,000–135,000 per month**

These figures are estimates, not fixed charges. Actual costs can vary depending on usage and vendor pricing. Vendor choices will be confirmed during the project.

### One-Time or Annual External Costs

Separate from the monthly operating costs, you may also have occasional external costs such as:

- Domain registration or renewal (usually yearly)
- WhatsApp Business account / template setup effort (usually one-time)

Exact amounts depend on the providers you choose and will be confirmed during setup.

### Clear Distinction

| Cost type | Amount | Who pays |
| --- | --- | --- |
| Development fee | LKR 650,000 (one-time) | Paid to the developer under this proposal |
| Operating costs | Approx. LKR 15,000–28,000 per month (lean) | Paid separately to the relevant service providers |

These two categories are separate and should not be combined into one total.

---

## 6. Timeline

Development is planned for **3 weeks** from kickoff, provided the advance payment and required access are received.

### Week 1 — Foundation

- User access
- Departments and categories
- Customers
- Technicians

### Week 2 — Job Management

- Inquiry and job creation
- Technician assignment
- WhatsApp links
- Job status and notes
- Deadlines

### Week 3 — Notifications, Reports & Launch

- Notifications
- Scheduled reports
- Performance reports
- Activity history
- Testing
- Final fixes
- Go-live preparation

Weekly demos will be held so you can review progress.

**Important:** Delays in providing access, information, decisions, or feedback can affect the three-week schedule.

**Go-live readiness:** Before go-live, three Department Heads should be in place (one for each department).

---

## 7. Testing and Approval

Acceptance is based on the **approved project scope** and agreed requirements, through client testing (UAT).

- You will test the system using an agreed checklist.
- You will have **3 business days** after the UAT build is provided to raise written issues against the agreed requirements.
- If no written defect list is raised within that window, the system will be treated as accepted.
- Critical problems that prevent main system functions from working (login, creating inquiries/jobs, assigning technicians and sharing links, or closing jobs) will be fixed under this fee before acceptance.
- Preference changes, visual redesign requests, and new business rules are handled as change requests.

---

## 8. After Go-Live

For the first three months after go-live, warranty support will be provided to fix critical system defects and bugs against the approved project scope.

This warranty does **not** cover:

- Cosmetic tweaks
- Usability preference changes
- New features
- Changes to business rules

Those items require a formal, paid change request.

Any ongoing maintenance or support arrangement after this three-month period will be discussed separately.

---

## 9. Client Responsibilities

To keep the project on schedule, the client will need to:

1. Nominate one decision-maker who can answer questions within **1 business day**.
2. Provide access to the hosting environment and required third-party services such as email, WhatsApp, and SMS (if customer SMS will be used), including the needed credentials and domain/DNS access.
3. Pay the invoices from those service providers (these costs are outside the development fee).
4. Provide the initial staff list and confirm organisation setup expectations.
5. Attend the Week 1, Week 2, and Week 3 demos and complete testing using the agreed checklist.
6. Confirm the go-live window and who will create the three Department Head accounts.

---

## 10. Risks and Dependencies

### Third-party service setup

Email and WhatsApp integrations require accounts and credentials controlled by the client. Providing these during the first week will help keep the project on schedule. If WhatsApp delivery fails, the system still provides a copyable link.

Delays in external vendor approvals — such as WhatsApp Business account verification or message template approvals — are outside the developer's control. Such third-party delays will not be accepted as a reason to delay User Acceptance Testing (UAT), project acceptance, or the final payment milestone, provided the system's core features and the copyable link fallback are fully functional.

### Timely feedback

The project schedule depends on receiving feedback and decisions within the agreed timeframe. Late feedback or delayed access can move the timeline day for day.

### Fixed scope

The three-week timeline is based on the approved project scope. New features or rule changes during the build will be handled as change requests and may affect timing and cost.

---

## 11. Technology (Brief)

For transparency, the system will be built using modern web technologies commonly used for business applications:

- A web application for staff and for technician links
- A secure application programming interface (API)
- A PostgreSQL database
- Business dates and schedules based on Asia/Colombo time

You are purchasing a working business system. The exact frameworks are an implementation detail and do not change the commercial terms in this proposal.

---

## 12. Change Requests

If you need changes after the project scope is agreed:

1. Send a written request describing the change.
2. We will provide an impact estimate for cost and/or timeline.
3. Work starts only after written approval.

Small rule changes can often be estimated quickly. Larger additions (new modules, new roles, or new integrations) usually need a separate estimate and may extend the timeline.

---

## 13. Next Steps

1. Confirm this proposal and the fixed project fee of **LKR 650,000**.
2. Confirm VAT treatment and payment account details.
3. Sign a short agreement or statement of work based on this proposal.
4. Complete kickoff: provide the required access and pay the **30% advance (LKR 195,000)**.
5. Development begins in Week 1.

---

*This proposal describes the fixed project scope and commercial terms for the Assidua Ops MVP. Detailed technical behaviour follows the agreed project requirements already approved for this build.*
