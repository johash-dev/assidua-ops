# Glossary

| Term | Meaning |
|---|---|
| Company | Assidua Technologies (Pvt) Ltd, the client and system owner |
| Department | One of **Rivon**, **Rover**, **Assidua**. Owns jobs and has exactly one active Department Head |
| Job category | Admin-managed classification of jobs within a department |
| Customer | An organisation or person requesting work. Has one or more **sites** |
| Site | A physical location of a customer. A job targets one site |
| Inquiry | A customer request captured by staff. Has a customer-facing **reference number** and contains one or more jobs |
| Reference number | Asia/Colombo date + daily sequence (e.g. `241026-007`; the exact format is fixed in the story) |
| Job | A unit of work owned by one department, optionally assigned to a technician, with a deadline and a status |
| Reclassification | Changing a job's department/category after creation (audited) |
| Technician | A field worker in the directory (name, phone, optional email). Has no staff account |
| Job link / share link | Unique access-controlled URL giving one technician access to one job, sent via WhatsApp or copied |
| Note | Add-only text on a job. Never edited or deleted |
| Activity history | Append-only audit log (see scope §3.8) |
| Approved Scope | See [approved-scope.md](../scope/approved-scope.md) |
| CR | Change Request: out-of-scope work, LKR 18,000/developer-day, needs written approval |
| UAT | Client User Acceptance Testing, 20 business days |
| Critical Defect | A defect blocking login, inquiry/job creation, assignment, technician link access or job closure |
