# Roles and Permissions

The roles come from scope §3.2. Rows marked *TBD* must be decided in the relevant story's `/refine` and recorded here. Never infer them silently.

| Capability | Admin | Department Head | Coordinator | Front Desk | Technician (link) |
|---|---|---|---|---|---|
| Sign in | ✓ | ✓ | ✓ | ✓ | ✗ (link only) |
| Manage departments, categories, staff, roles | ✓ | ✗ | ✗ | ✗ | ✗ |
| Set/reset staff passwords | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create inquiry + jobs | TBD | TBD | ✓ | ✓ | ✗ |
| Assign/reassign technician | TBD | ✓ (own dept) | TBD | TBD | ✗ |
| Add note | ✓ | ✓ | ✓ | TBD | TBD |
| Close/cancel/reopen job | TBD | ✓ (own dept) | TBD | ✗ | ✗ |
| Upload attachment | roles that manage the job | ✓ (own dept) | TBD | TBD | ✓ (own job, within caps) |
| View reports | ✓ all | ✓ own dept | TBD | ✗ | ✗ |
| Export report CSV | ✓ | ✓ own dept | ✗ | ✗ | ✗ |
| View activity history | ✓ all | ✓ own dept jobs | ✗ | ✗ | ✗ |
| Notification settings, SMS toggle | ✓ | ✗ | ✗ | ✗ | ✗ |

**Invariants**
- At least one active Admin always exists.
- Each department has exactly one active Department Head.
- Admin and Department Head roles are mutually exclusive.
- Deactivated users cannot authenticate, and their existing sessions are invalidated.
- Every permission check runs server-side. Each one has a negative test.
