# Business Rules

These rules are numbered so stories, tests and reviews can cite them (`BR-n`). Add rules only from approved scope or recorded decisions.

| ID | Rule | Scope |
|---|---|---|
| BR-1 | Inquiry reference = Asia/Colombo calendar date + per-day sequence. The sequence resets at local midnight and is unique under concurrency | §3.3 |
| BR-2 | An inquiry is created together with ≥ 1 job in a single atomic operation. Its jobs may belong to different departments | §3.3 |
| BR-3 | Job notes are add-only. There is no edit or delete endpoint | §3.3 |
| BR-4 | Jobs can be closed, cancelled or reopened. Each transition is audited, with a reason where captured | §3.3, §3.8 |
| BR-5 | Job deadline defaults come from the department, and can be overridden per job. Both are audited | §3.5, §3.8 |
| BR-6 | A daily approaching-deadline reminder goes out at 08:00 Asia/Colombo | §3.5 |
| BR-7 | Customer SMS on inquiry creation: off by default, Admin toggle, English template, at most one per inquiry | §3.5 |
| BR-8 | Weekly report every Monday, covering the previous Mon–Sun (Asia/Colombo) | §3.5, §3.7 |
| BR-9 | Attachments: ≤ 5 per job, ≤ 10 MB each, JPEG/PNG/WebP/PDF only. The type is validated by content, not just the extension | §3.6 |
| BR-10 | A technician link grants access to exactly one job. It is unguessable, revocable when the technician is reassigned, and needs no login | §3.4 |
| BR-11 | Manual report range ≤ 90 days | §3.7 |
| BR-12 | Audit entries are append-only (no update/delete path) | §3.8 |
| BR-13 | Passwords ≥ 8 characters, stored as a one-way hash. Only Admin resets them | §3.2 |
| BR-14 | Reject any change that leaves zero active Admins | §3.2 |
| BR-15 | Exactly one active Department Head per department. Admin and Department Head are mutually exclusive | §3.2 |
