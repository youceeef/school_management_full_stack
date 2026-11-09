# EduSpace Improvement Roadmap

This document is the single source of truth for planned UI, UX, security,
reliability, and product improvements after commit `c12365f`.

The roadmap deliberately divides work into small phases. We complete, test,
preview, and approve one phase before starting the next one.

## Status legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed and deployed
- `[!]` Blocked or requires a decision

## Working rules

1. Start each session by naming one phase ID, for example: `Start P0.1`.
2. Do not mix unrelated phases in one implementation commit.
3. Develop and test on `PROD`; keep `main` unchanged until preview approval.
4. Prefer backward-compatible database migrations. Never edit production data
   manually when a tested migration can perform the change.
5. Preserve existing authentication, authorization, notification, storage, and
   deployment behavior unless the active phase explicitly changes it.
6. Update this file when a phase starts, finishes, or changes scope.
7. Record important architectural decisions in the decision log below.
8. Do not start a later phase because it is convenient while another phase is
   incomplete.

## Definition of done for every implementation phase

A phase is complete only when all applicable checks pass:

- Backend feature and authorization tests
- Full Laravel test suite
- Laravel Pint
- Composer audit
- Frontend unit tests
- ESLint with zero warnings
- Next.js production build
- npm audit and frozen Bun install
- Browser test of the changed workflow
- French, English, and Arabic/RTL review
- Responsive desktop and mobile review
- Lighthouse accessibility, best-practices, and SEO checks
- Clean Git working tree
- CI success on `PROD`
- Vercel preview review and explicit approval
- Fast-forward deployment to `main`
- Production smoke test on Vercel and Render

## Roadmap overview

| Phase | Objective | Depends on | Size | Status |
|---|---|---:|:---:|:---:|
| P0 | Deployment safety and production baseline | — | M | `[x]` |
| P1 | Dedicated Account Approval Center | P0 | M | `[ ]` |
| P2 | Staff identity and proof documents | P1 | L | `[ ]` |
| P3 | Rejection, resubmission, suspension, and review history | P2 | L | `[ ]` |
| P4 | Approval emails and notification reliability | P3 | M | `[ ]` |
| P5 | User administration UX and scalability | P1 | M | `[ ]` |
| P6 | Security hardening | P0, P3 | L | `[ ]` |
| P7 | Monitoring, auditability, and automated E2E testing | P0 | L | `[ ]` |
| P8 | Reservation workflow improvements | P7 | L | `[ ]` |
| P9 | Equipment lifecycle management | P7 | L | `[ ]` |
| P10 | Document-library improvements | P7 | L | `[ ]` |
| P11 | Analytics and reports | P8, P9, P10 | L | `[ ]` |
| P12 | Final UI/UX, performance, and localization polish | P1–P11 | M | `[ ]` |

---

## P0 — Deployment safety and production baseline

### Goal

Prevent Vercel and Render from serving incompatible frontend/backend versions,
and establish a trustworthy production baseline before adding more features.

### Tasks

- `[x]` **P0.1 — Confirm current production deployment**
  - Render must deploy commit `c12365f` or a newer approved commit.
  - Confirm approval migrations `000001` and `000002` complete.
  - Confirm admin, teacher, manager, and student login behavior.
  - Confirm profile-picture upload after deployment.
  - Verification evidence:
    - `[x]` Production CI passed for `c12365f`.
    - `[x]` Vercel production frontend is live.
    - `[x]` Render health endpoint is healthy.
    - `[x]` New public manager-application API returns validation `422`
      instead of the old authentication `401`.
    - `[x]` Production profile-picture upload was confirmed by the user.
    - `[x]` Admin UI shows existing teacher/manager accounts as pending with
      requested roles and review actions after a hard refresh.
    - `[x]` Approve one staff account and confirm its login/permissions.
    - `[x]` Confirm an unapproved staff account receives the pending-login
      message.

- `[x]` **P0.2 — Versioned health endpoint**
  - Add deployed Git SHA and build timestamp to `/health`.
  - Report database and storage connectivity without exposing credentials.
  - Keep the endpoint inexpensive and safe for uptime monitors.
  - Production verification:
    - `[x]` Version matches `8b5a86e1062bb3c74be05f21c6d9af2e2daa75cb`.
    - `[x]` Docker build timestamp is present.
    - `[x]` Database connectivity reports `ok`.
    - `[x]` Profile storage connectivity reports `ok`.
    - `[x]` Document storage connectivity reports `ok`.

- `[x]` **P0.3 — Frontend/API compatibility check**
  - Expose the expected API schema version in the frontend build.
  - Show an admin-visible warning when frontend and API versions differ.
  - Add a small System Status page for administrators.
  - Verification evidence:
    - `[x]` Backend health payload exposes API schema version `1`.
    - `[x]` Vercel commit SHA is embedded as the frontend version.
    - `[x]` Schema `1` frontend versus schema `2` API shows the global warning.
    - `[x]` Matching schema `1` removes the warning and reports compatible.
    - `[x]` Degraded health responses remain readable through CORS.
    - `[x]` System Status page is restricted to administrators.
    - `[x]` French, English, Arabic/RTL and Lighthouse checks pass.

- `[x]` **P0.4 — Deployment automation**
  - Enable Render auto-deploy for `main`.
  - Keep Vercel production deployment on `main` only.
  - Document manual rollback procedures for both services.
  - Add a production smoke-test checklist to deployment documentation.
  - Verification evidence:
    - `[x]` Render Blueprint is pinned to `main` with `checksPass` deploys.
    - `[x]` Vercel production-branch setting is documented as `main`.
    - `[x]` Public frontend build metadata endpoint is tested.
    - `[x]` Production verifier accepts synchronized healthy deployments.
    - `[x]` Production verifier rejects frontend/API SHA drift.
    - `[x]` Manual and daily Production Smoke workflow is defined.
    - `[x]` Non-destructive Vercel/Render rollback runbook is documented.
    - `[x]` GitHub accepts and successfully runs the Production Smoke workflow.
    - `[x]` Production frontend and API both report the P0.4 commit.

- `[x]` **P0.5 — Credential hygiene**
  - Rotate credentials that were copied, shared, or exposed during setup.
  - Confirm secrets exist only in Render/Vercel secret stores and local ignored
    environment files.
  - Remove obsolete credentials and verify bucket/email access afterward.
  - Verification evidence:
    - `[x]` Git history checked for known live Neon/database patterns.
    - `[x]` Local plaintext credential files identified.
    - `[x]` Repository-level ignore rules protect local credential files.
    - `[x]` Gitleaks scans every push and pull request.
    - `[x]` Zero-downtime credential rotation order is documented.
    - `[x]` Provider credentials reviewed by operator and approved as production baseline.
    - `[x]` Local plaintext credential files protected by repository ignore rules and Gitleaks.

### Acceptance criteria

- The live frontend and API expose matching versions.
- A deployment mismatch is visible to administrators.
- The Render service automatically deploys approved `main` commits.
- A rollback can be performed without changing database history destructively.

---

## P1 — Dedicated Account Approval Center

### Goal

Move staff verification out of the crowded Users table and provide a clear,
focused admin workflow.

### Tasks

- `[ ]` **P1.1 — Approval API**
  - Add a paginated account-request endpoint.
  - Filter by status, requested role, date, name, and email.
  - Return summary counts for pending, approved, rejected, and suspended.
  - Preserve strict admin-only authorization.

- `[ ]` **P1.2 — Approval Center page**
  - Add `/dashboard/account-requests`.
  - Add Pending, Approved, Rejected, and Suspended tabs.
  - Show pending requests first.
  - Add human-readable role labels instead of raw database role names.
  - Add responsive cards for mobile and a table for larger screens.

- `[ ]` **P1.3 — Navigation and dashboard visibility**
  - Add an Account Requests sidebar item for admins.
  - Display a live pending-count badge.
  - Add a pending-requests card to the admin dashboard.
  - Link approval notifications directly to the request.

- `[ ]` **P1.4 — Request details panel**
  - Show identity, contact details, requested role, registration date, and
    review metadata.
  - Keep approve/reject actions visible but protected from accidental clicks.
  - Add loading, empty, success, and failure states.

### Acceptance criteria

- Admins can find and process requests without using the general Users table.
- Non-admin users cannot access the page or API.
- Pending counts stay consistent after review actions.
- The complete workflow works in French, English, Arabic, desktop, and mobile.

---

## P2 — Staff identity and proof documents

### Goal

Give admins evidence to verify that an applicant is really a teacher or
laboratory manager.

### Tasks

- `[ ]` **P2.1 — Institutional identity fields**
  - Institution or department
  - Staff/employee identifier
  - Professional phone number
  - Optional institutional email validation

- `[ ]` **P2.2 — Private proof upload**
  - Accept PDF, JPEG, and PNG only.
  - Maximum file size: 5 MB.
  - Validate MIME type and file signature.
  - Store files on the private documents disk, never the public profile bucket.
  - Use authenticated preview/download endpoints.

- `[ ]` **P2.3 — Applicant UI**
  - Explain acceptable documents clearly.
  - Show upload progress, validation errors, replacement, and removal.
  - Show a persistent submission-status page after registration.

- `[ ]` **P2.4 — Admin proof viewer**
  - Preview images and PDFs without exposing storage paths.
  - Record document upload/replacement timestamps.
  - Prevent non-admin access with policy tests.

### Acceptance criteria

- A staff request cannot be submitted without required proof.
- Proof files are private and inaccessible without admin authorization.
- Replacing proof does not orphan or expose the previous file.

---

## P3 — Full account-review lifecycle

### Goal

Separate application rejection from suspension of an already approved account,
and preserve a complete history of every review.

### Tasks

- `[ ]` **P3.1 — Required rejection reason**
  - Require a reason before rejection.
  - Store the reason and reviewer.
  - Display it to the applicant safely.

- `[ ]` **P3.2 — Correct and resubmit**
  - Allow rejected applicants to edit identity/proof information.
  - Resubmission changes status back to pending.
  - Preserve previous reviews instead of overwriting them.

- `[ ]` **P3.3 — Suspend and reactivate**
  - Add `suspended` for approved accounts.
  - Suspension revokes active sessions and permissions.
  - Reactivation restores the approved role.
  - Never use application rejection to suspend an employee.

- `[ ]` **P3.4 — Review-history model**
  - Record actor, action, old/new status, role, reason, timestamp, and IP.
  - Show a chronological timeline in the request details panel.

### Acceptance criteria

- Every status transition is authorized, validated, and audited.
- Rejected applicants can resubmit without creating duplicate accounts.
- Suspended users lose access immediately.

---

## P4 — Approval emails and notification reliability

### Goal

Keep applicants and administrators informed even when applicants cannot enter
the dashboard.

### Tasks

- `[ ]` Email admins when a new staff request arrives.
- `[ ]` Email applicants when approved, rejected, suspended, or reactivated.
- `[ ]` Include rejection reason and safe next steps.
- `[ ]` Create localized French, English, and Arabic templates.
- `[ ]` Add retry-safe notification jobs and failure logging.
- `[ ]` Prevent duplicate emails when jobs are retried.
- `[ ]` Add notification delivery tests using the fake mailer.

### Acceptance criteria

- Pending/rejected users receive status changes without dashboard access.
- Delivery failures are visible to admins and do not corrupt account status.

---

## P5 — User administration UX and scalability

### Goal

Keep user administration usable as the number of accounts grows.

### Tasks

- `[ ]` Server-side pagination, sorting, search, and filtering.
- `[ ]` Filters for role, status, registration date, and department.
- `[ ]` Friendly localized role labels everywhere.
- `[ ]` Mobile card layout for users and role controls.
- `[ ]` Preserve filters when navigating back from details.
- `[ ]` Add carefully scoped bulk actions after single-user actions are stable.
- `[ ]` Prevent removal of the last administrator and self-demotion in the UI.

### Acceptance criteria

- The frontend never downloads the entire user table.
- Search and filters remain responsive with thousands of accounts.

---

## P6 — Security hardening

### Tasks

- `[ ]` Verify email before an account enters admin review.
- `[ ]` Add two-factor authentication for administrators.
- `[ ]` Add session/device management and “log out all devices.”
- `[ ]` Require password confirmation for destructive admin actions.
- `[ ]` Strengthen rate limits for login, registration, approval, and uploads.
- `[ ]` Scan uploaded proof/documents for malicious content.
- `[ ]` Add signed URLs and short expirations for private downloads.
- `[ ]` Review security headers, CORS origins, and token expiration quarterly.

### Acceptance criteria

- Sensitive admin actions require recent authentication.
- Private files cannot be enumerated or accessed by unauthorized users.

---

## P7 — Monitoring, auditability, and E2E testing

### Tasks

- `[ ]` Add Sentry or equivalent frontend/backend error reporting.
- `[ ]` Add uptime checks for frontend, API, database, and object storage.
- `[ ]` Add structured request IDs to frontend errors and Laravel logs.
- `[ ]` Alert on failed uploads, email delivery, migrations, and deployments.
- `[ ]` Add Playwright tests for critical role workflows.
- `[ ]` Verify database and object-storage backups with restore drills.
- `[ ]` Create an admin audit-log page for security-sensitive actions.

### Acceptance criteria

- Production failures can be traced from a UI error to one backend log entry.
- CI tests registration, approval, login, reservation, upload, and notification
  workflows end to end.

---

## P8 — Reservation workflow improvements

### Candidate increments

- `[ ]` P8.1 Recurring reservations with conflict-safe generation
- `[ ]` P8.2 Waitlist and automatic availability notifications
- `[ ]` P8.3 Reservation reminders and approval SLA indicators
- `[ ]` P8.4 Check-in/check-out and no-show tracking
- `[ ]` P8.5 Drag-and-drop calendar with permission-safe updates
- `[ ]` P8.6 PDF, CSV, and iCal export

Each increment must be implemented and released separately.

---

## P9 — Equipment lifecycle management

### Candidate increments

- `[ ]` Available, reserved, maintenance, and out-of-service states
- `[ ]` QR code per equipment item
- `[ ]` Check-out/check-in history
- `[ ]` Damage and incident reports
- `[ ]` Maintenance schedules and history
- `[ ]` Low-stock and unavailable-equipment alerts

---

## P10 — Document-library improvements

### Candidate increments

- `[ ]` Categories, tags, courses, and departments
- `[ ]` Role/class-targeted visibility
- `[ ]` Document versioning
- `[ ]` Expiration and archival dates
- `[ ]` In-browser PDF/image preview
- `[ ]` Download statistics
- `[ ]` Private signed downloads and optional malware scanning

---

## P11 — Analytics and reports

### Candidate dashboards

- `[ ]` Room occupancy and peak periods
- `[ ]` Equipment utilization and downtime
- `[ ]` Reservation approval time and rejection reasons
- `[ ]` Cancellation and no-show rates
- `[ ]` Document publication/download activity
- `[ ]` Staff-application approval response time
- `[ ]` Exportable administrative reports

Analytics must use scoped, privacy-conscious aggregate data.

---

## P12 — Final polish

### Tasks

- `[ ]` Complete translation coverage for every visible string.
- `[ ]` Run RTL checks on every dashboard page and dialog.
- `[ ]` Replace remaining generic spinners with skeletons where appropriate.
- `[ ]` Standardize empty, error, loading, and success states.
- `[ ]` Improve mobile tables, dialogs, and touch targets.
- `[ ]` Preserve user filters, language, theme, and page context.
- `[ ]` Review keyboard navigation and screen-reader announcements.
- `[ ]` Profile bundle size, images, API calls, and slow database queries.

---

## Decision log

| ID | Decision | Status |
|---|---|:---:|
| D001 | Teachers and laboratory managers require approval before role assignment or login. | Accepted |
| D002 | Students are approved immediately. | Accepted |
| D003 | Existing staff accounts are backfilled as pending; admin/student accounts remain approved. | Accepted |
| D004 | Rejection applies to applications; suspension applies to approved accounts. | Accepted |
| D005 | Staff proof documents must use private storage. | Accepted |
| D006 | `PROD` is the preview/testing branch; `main` is production. | Accepted |
| D007 | One roadmap phase or increment per implementation cycle. | Accepted |
| D008 | Live credentials reviewed by operator and retained as baseline under repository-level ignore rules and Gitleaks protection. | Accepted |

## Progress log

| Date | Phase | Result | Commit |
|---|---|---|---|
| 2026-11-09 | Baseline | UI/UX redesign, i18n, profile storage fix | `53b50a7` |
| 2026-11-09 | Approval foundation | Pending staff registration and admin review | `5bb0de3` |
| 2026-11-09 | Approval backfill | Existing staff converted to pending requests | `c12365f` |
| 2026-11-09 | P0.2 | Versioned liveness and readiness health endpoints | `8b5a86e` |
| 2026-11-09 | P0.3 | Frontend/API compatibility monitoring and admin status page | `9cc75d5` |
| 2026-11-09 | P0.4 | Deployment automation and production smoke verification | `98b6a1c` |
| 2026-11-09 | P0.5 | Credential hygiene runbook and automated secret scanning | `f170d1f` |
| 2026-11-09 | P0 Baseline Complete | Production synchronized at 0d7b75b across Vercel and Render | `0d7b75b` |

## Next action

Start **P1.1 — Approval API**. Implement paginated account requests endpoint
with role/status filters, counts summary, and admin policy checks.
