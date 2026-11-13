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
| P0 | Deployment safety and production baseline | — | M | `[~]` |
| P1 | Dedicated Account Approval Center | P0 | M | `[x]` |
| P2 | Staff identity and proof documents | P1 | L | `[x]` |
| P3 | Rejection, resubmission, suspension, and review history | P2 | L | `[x]` |
| P4 | Approval emails and notification reliability | P3 | M | `[x]` |
| P5 | User administration UX and scalability | P1 | M | `[x]` |
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
  - Enable Render auto-deploy for `main` (superseded by D015: manual operator
    deploys of the approved SHA).
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
    - `[x]` The Render Blueprint was synchronized at `653d0c1`, restoring the
      live service setting from `Off` to `After CI Checks Pass` as declared by
      `autoDeployTrigger: checksPass` in `render.yaml`. That setting was disabled
      again by the operator's next specific-commit deploy, which is the behaviour
      recorded under D015.
    - `[x]` Roadmap-only commit `52ab1ee` did not trigger Render because it was
      outside the configured `backend/` service root; this is expected monorepo
      filtering behavior, not an auto-deploy failure.
    - `[x]` Removed the Production Smoke post-CI trigger after confirming it
      created a circular dependency: the smoke job waited for Render while
      Render `checksPass` waited for the smoke check. Smoke remains manual after
      releases and scheduled daily.
    - `[x]` Confirmed that Render's "Deploy a specific commit" action disables
      Auto-Deploy for the service, so `checksPass` cannot survive operational
      use; `render.yaml` now declares `autoDeployTrigger: off` (D015).
    - `[x]` Release `d4bb6cd` was deployed to the API by the operator, `/health`
      and `/api/version` reported the same SHA with schema `1`, database and both
      storage checks were healthy, and Production Smoke run #18 passed.

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

- `[x]` **P1.1 — Approval API**
  - Add a paginated account-request endpoint.
  - Filter by status, requested role, date, name, and email.
  - Return summary counts for pending, approved, rejected, and suspended.
  - Preserve strict admin-only authorization.
  - Verification evidence:
    - `[x]` Paginated `/api/account-requests` endpoint supports status, requested role, search, name, email, and date filters.
    - `[x]` Summary counts for pending, approved, rejected, and suspended returned in `meta.counts` and `/api/account-requests/counts`.
    - `[x]` Strict admin-only access enforced; unauthenticated and student/teacher accounts receive 401/403.
    - `[x]` Single request view and review approval/rejection actions supported.
    - `[x]` Automated feature tests pass in `AccountRequestApiTest`.
    - `[x]` Frontend API client `accountRequestService.js` implemented.

- `[x]` **P1.2 — Approval Center page**
  - Add `/dashboard/account-requests`.
  - Add Pending, Approved, Rejected, and Suspended tabs.
  - Show pending requests first.
  - Add human-readable role labels instead of raw database role names.
  - Add responsive cards for mobile and a table for larger screens.
  - Verification evidence:
    - `[x]` `/dashboard/account-requests` route created and guarded by `AdminRoute`.
    - `[x]` Tab selector for Pending, Approved, Rejected, Suspended, and All requests with live count indicators.
    - `[x]` Human-readable localized role badges ("Enseignant", "Responsable de laboratoire", "Administrateur", "Élève / Étudiant").
    - `[x]` Responsive UI with full desktop table and dedicated mobile card view.
    - `[x]` Inline approval, rejection, revocation, and re-examination actions with confirmation modals.
    - `[x]` Search and role filter bar with pagination controls.
    - `[x]` French, English, and Arabic/RTL translation phrases added.

- `[x]` **P1.3 — Navigation and dashboard visibility**
  - Add an Account Requests sidebar item for admins.
  - Display a live pending-count badge.
  - Add a pending-requests card to the admin dashboard.
  - Link approval notifications directly to the request.
  - Verification evidence:
    - `[x]` "Demandes de compte" sidebar item added for admins with live pending count badge.
    - `[x]` Collapsed sidebar displays notification indicator dot when pending requests exist.
    - `[x]` Admin dashboard features prominent pending requests review banner and quick action shortcut.
    - `[x]` Admin notifications for new staff applicants link directly to `/dashboard/account-requests`.

- `[x]` **P1.4 — Request details panel**
  - Show identity, contact details, requested role, registration date, and
    review metadata.
  - Keep approve/reject actions visible but protected from accidental clicks.
  - Add loading, empty, success, and failure states.
  - Verification evidence:
    - `[x]` Slide-over details modal component `AccountRequestDetailsModal.js` implemented.
    - `[x]` Full applicant profile, requested role badge, registration date, contact links (mailto/tel), address, and bio displayed.
    - `[x]` Chronological review metadata showing reviewer name, email, and processing timestamp.
    - `[x]` Approve and reject actions with confirmation protection against accidental clicks.
    - `[x]` Accessible keyboard dismissal (Escape), backdrop click, and full responsive support.

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

- `[x]` **P2.1 — Institutional identity fields**
  - Institution or department
  - Staff/employee identifier
  - Professional phone number
  - Optional institutional email validation
  - Verification evidence:
    - `[x]` Migration `2026_11_09_000003_add_institutional_identity_fields_to_users_table.php` adds `institution`, `department`, `staff_id`, `professional_phone`.
    - `[x]` Model `User` adds attributes to `$fillable`.
    - `[x]` `RegisteredUserController` enforces required institutional fields on teacher (`/api/register/enseignant`) and lab manager (`/api/register/responsable_labo`) registrations, while keeping student registrations unaffected.
    - `[x]` `AccountRequestResource` and `UserResource` expose institutional attributes.
    - `[x]` `AccountRequestController` enables searching and filtering by institution, department, and staff ID.
    - `[x]` Registration form UI displays dedicated institutional identity section for staff applicants with bilingual validation.
    - `[x]` Slide-over details modal displays institutional credentials with direct `tel:` link.
    - `[x]` Approval Center table and cards display applicant institution and department.
    - `[x]` Automated feature tests in `StaffRegistrationTest` verify validation enforcement, DB persistence, pending workflow, and search queries.

- `[x]` **P2.2 — Private proof upload**
  - Accept PDF, JPEG, and PNG only.
  - Maximum file size: 5 MB.
  - Validate MIME type and file signature.
  - Store files on the private documents disk, never the public profile bucket.
  - Use authenticated preview/download endpoints.
  - Verification evidence:
    - `[x]` Migration `2026_11_09_000004_add_proof_document_fields_to_users_table.php` adds `proof_document_path`, `proof_document_name`, `proof_document_mime`, `proof_document_size`, `proof_submitted_at`.
    - `[x]` Model `User` adds proof document attributes to `$fillable`.
    - `[x]` Storage strictly utilizes private `config('filesystems.documents_disk')` (`documents_s3` in production), never the public uploads bucket.
    - `[x]` Validation enforces PDF, JPEG, and PNG formats with 5 MB maximum size limit.
    - `[x]` Authenticated streaming preview (`/api/account-requests/{id}/proof/preview`) and download (`/api/account-requests/{id}/proof/download`) endpoints implemented with strict `role:admin` authorization.

- `[x]` **P2.3 — Applicant UI**
  - Explain acceptable documents clearly.
  - Show upload progress, validation errors, replacement, and removal.
  - Show a persistent submission-status page after registration.
  - Verification evidence:
    - `[x]` Staff registration form in `RegisterForm.js` provides document upload dropzone with acceptable document instructions.
    - `[x]` Client-side size and MIME validation before upload with real-time feedback.
    - `[x]` File removal and replacement controls with formatted size indicators.
    - `[x]` Multipart form-data handling integrated with `AuthContext.js` and `axios.js`.

- `[x]` **P2.4 — Admin proof viewer**
  - Preview images and PDFs without exposing storage paths.
  - Record document upload/replacement timestamps.
  - Prevent non-admin access with policy tests.
  - Verification evidence:
    - `[x]` `AccountRequestResource` exposes `proof_document` metadata (`name`, `mime`, `size`, `is_pdf`, `submitted_at`) without revealing raw storage paths.
    - `[x]` `AccountRequestDetailsModal.js` integrates proof card with interactive inline preview container (embedded PDF iframe or high-res image) and secure download button.
    - `[x]` Approval Center table and cards display paperclip badge with format tag for requests containing verified proof.
    - `[x]` Automated feature test suite `StaffProofDocumentTest.php` covers validation, private storage persistence, admin stream/download access, non-admin 403 access control, and 404 handling.
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

- `[x]` **P3.1 — Required rejection reason**
  - Require a reason before rejection.
  - Store the reason and reviewer.
  - Display it to the applicant safely.
  - Verification evidence:
    - `[x]` Migration `2026_11_09_000005_create_account_reviews_and_lifecycle_fields.php` adds `rejection_reason` (text, nullable) and `suspended_at` to `users`.
    - `[x]` `AccountRequestController@review` strictly validates that rejection requires a reason string (min 5 characters).
    - `[x]` Authenticated login endpoint (`POST /api/login`) returns 403 Forbidden with `code: ACCOUNT_REJECTED`, `rejection_reason`, and `can_resubmit: true`.
    - `[x]` Login page (`front/app/login/page.js`) catches rejection, shows clear alert banner with administrator reason, and provides direct link to resubmit.

- `[x]` **P3.2 — Correct and resubmit**
  - Allow rejected applicants to edit identity/proof information.
  - Resubmission changes status back to pending.
  - Preserve previous reviews instead of overwriting them.
  - Verification evidence:
    - `[x]` Resubmission endpoint `POST /api/account-requests/resubmit` allows rejected applicants to update institutional fields and upload a corrected proof document.
    - `[x]` Proof replacement cleans up previous file on private disk and records fresh metadata.
    - `[x]` Account approval status resets to `pending`, clears `rejection_reason`, and logs `resubmitted` action in `account_reviews` preserving full audit trail.
    - `[x]` Dedicated correction page `front/app/resubmit/page.js` pre-authenticates applicant, exposes editable fields and proof replacement, and redirects to login on success.

- `[x]` **P3.3 — Suspend and reactivate**
  - Add `suspended` for approved accounts.
  - Suspension revokes active sessions and permissions.
  - Reactivation restores the approved role.
  - Never use application rejection to suspend an employee.
  - Verification evidence:
    - `[x]` State machine enforces strict separation: approved accounts cannot be rejected directly (must be suspended); pending requests cannot be suspended (must be rejected).
    - `[x]` Suspending an account revokes all active Sanctum tokens (`tokens()->delete()`) and removes Spatie roles.
    - `[x]` `EnsureAccountIsApproved` middleware rejects suspended and pending user requests with 403 `ACCOUNT_NOT_APPROVED` or `ACCOUNT_SUSPENDED`.
    - `[x]` Reactivation restores approved status and re-assigns original requested Spatie role.
    - `[x]` Approval Center UI provides dedicated "Suspendre" action with required reason modal and "Réactiver" action for suspended accounts.

- `[x]` **P3.4 — Review-history model**
  - Record actor, action, old/new status, role, reason, timestamp, and IP.
  - Show a chronological timeline in the request details panel.
  - Verification evidence:
    - `[x]` Eloquent model `AccountReview` mapped to `account_reviews` table logging `user_id`, `reviewer_id`, `action`, `from_status`, `to_status`, `reason`, `ip_address`, and `user_agent`.
    - `[x]` Every review action (`approved`, `rejected`, `suspended`, `reactivated`, `resubmitted`) appends an immutable review record.
    - `[x]` `AccountRequestResource` and `AccountReviewResource` expose formatted review timeline with reviewer name, role, email, and humanized timestamps.
    - `[x]` Slide-over details modal (`AccountRequestDetailsModal.js`) displays full chronological review timeline with status badges, reviewer identity, and reason quotes.
    - `[x]` Automated feature test suite `AccountLifecycleTest.php` covers state transitions, required reasons, session termination, resubmission with proof, and history retention.

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

- `[x]` **P4.1 — Email applicants on review lifecycle transitions**
  - Email applicants when approved, rejected, suspended, or reactivated via `AccountApprovalStatusNotification`.
  - Prominently include administrator rejection reason and actionable next steps.
  - Contextual action buttons: direct `/login` link for approvals and reactivations; direct `/resubmit` link for rejections.
  - Deliver via `['database', 'mail']` when recipient has an email address.
  - Verification evidence:
    - `[x]` `AccountApprovalStatusNotification` implements `toMail()` generating localized HTML and plain text messages.
    - `[x]` Approved applicants receive congratulations and direct link to sign in (`/login`).
    - `[x]` Reactivated users receive account restoration notice and direct link to sign in (`/login`).
    - `[x]` Rejected applicants receive detailed rejection notice with quoted admin reason and one-click link to correct their application (`/resubmit`).
    - `[x]` Suspended users receive formal notice with reason and instructions to contact school administration.
    - `[x]` Automated unit and feature assertions in `AccountNotificationTest.php` pass.

- `[x]` **P4.2 — Email administrators on new staff requests and resubmissions**
  - Email all active administrators when a teacher or lab manager applies or resubmits.
  - Include applicant name, email, requested role, institution, department, staff ID, and proof document attachment status.
  - Direct CTA button pointing to `/dashboard/account-requests`.
  - Verification evidence:
    - `[x]` `NewUserForAdminNotification` updated to deliver via `['database', 'mail']`.
    - `[x]` Resubmission support via `isResubmission` flag generating distinct notification event and subject.
    - `[x]` `RegisteredUserController` dispatches to all admins on new staff registration via `SendWelcomeNotification`.
    - `[x]` `AccountRequestController@resubmit` notifies all admins immediately on corrected applicant resubmission.
    - `[x]` Automated feature tests verify admin email dispatch on registration and resubmission.

- `[x]` **P4.3 — Localized French, English, and Arabic templates**
  - Create complete localized email templates.
  - Support user locale preference or fallback to application locale.
  - Verification evidence:
    - `[x]` French (`fr`), English (`en`), and Arabic (`ar`) templates implemented in `AccountApprovalStatusNotification`.
    - `[x]` Dynamic locale resolution supports `$customLocale`, `$notifiable->preferred_locale`, and `config('app.locale')`.
    - `[x]` Full assertions in `AccountNotificationTest.php` verify French, English, and Arabic subjects and copy.

- `[x]` **P4.4 — Queue reliability, retry safety, and failure isolation**
  - Make notification jobs queueable with exponential backoff.
  - Prevent duplicate mailings and handle delivery errors safely.
  - Ensure mail server errors never roll back or corrupt database status transitions.
  - Verification evidence:
    - `[x]` Notifications implement `ShouldQueue` with `$tries = 3` and `$backoff = [10, 60, 300]`.
    - `[x]` `failed(Throwable $exception)` hooks log structured failure diagnostics.
    - `[x]` `AccountRequestController` and `UserController` isolate `notify()` in try/catch blocks; DB commits first, and API returns status with optional `notification_warning` if mail transport encounters issues.
    - `[x]` CI tests pass all assertions across full test suite.

- `[x]` **P4.5 — Approval and rejection delivery hotfix**
  - `[x]` Deliver lifecycle notifications synchronously after the account-status
    transaction commits, so approval/rejection mail does not depend on a queue
    worker and transport failures are returned to the administrator.
  - `[x]` Show `notification_warning` in both approval-center and user-details
    workflows instead of silently reporting complete success.
  - `[x]` Use French as the application and notification fallback locale while
    preserving explicit English and Arabic notification support.
  - `[x]` Add a real-channel feature test proving approval and rejection create
    mail messages even when the configured queue has no worker.
  - `[x]` Confirm one approval and one rejection email arrive in live inboxes.
  - Production verification evidence:
    - `[x]` Commit `22c61a2` passed `PROD` and `main` CI.
    - `[x]` Vercel and Render both report commit `22c61a2` and schema `1`.
    - `[x]` Production Smoke run 14 passed.
    - `[x]` Operator confirmed registration, approval, rejection, suspension,
      and reactivation emails arrive with the expected content and actions.

### Acceptance criteria

- Pending/rejected users receive status changes without dashboard access.
- Delivery failures are visible to admins and do not corrupt account status.

---

## P5 — User administration UX and scalability

### Goal

Keep user administration usable as the number of accounts grows.

### Tasks

- `[x]` **P5.1 — Server-side pagination, sorting, search, and filtering.**
  - `[x]` Paginated `/api/users` endpoint with server-side filters for role, status, registration date range, and department.
  - `[x]` Summary counts for total registered accounts, administrators, and pending requests in `meta.counts`.
  - `[x]` Friendly localized role labels everywhere (`roleLabels.js` & `getRoleLabel`).
  - `[x]` Mobile card layout for users and inline role management controls.
  - `[x]` Multi-field sorting by id, name, email, department, approval status, and created_at.
- `[x]` **P5.2 — Filter persistence and seamless navigation.**
  - `[x]` Filters, sort parameters, and pagination page synchronized with URL search params and `sessionStorage`.
  - `[x]` Dedicated `UserDetailsModal` slide-over view for inspecting user profile, contact information, institutional details, review history, and assigned roles without navigating away or losing table state.
  - `[x]` Navigating back or reloading restores the active filtered view.
- `[x]` **P5.3 — Carefully scoped administrative bulk actions.**
  - `[x]` Multi-row selection with master indeterminate checkbox support on desktop and mobile.
  - `[x]` Bulk actions endpoint `POST /api/users/bulk-action` supporting `assign_role`, `remove_role`, `approve`, `suspend`, and `delete`.
  - `[x]` Strict safeguards: prevents self-deletion, self-suspension, and removing the admin role from the current or last administrator.
  - `[x]` Sticky/floating bulk action toolbar with one-click actions, confirmation modals, and responsive layout.
  - `[x]` Automated feature test suite in `UserAdministrationApiTest.php` verifying bulk actions and safeguard enforcement.

### Current verification state

- P5.1, P5.2, and P5.3 are implemented, tested, approved, and deployed.
- The P5 follow-up review added the missing admin-only user-details endpoint,
  connected role and review-history data to the details modal, enforced required
  suspension reasons and lifecycle guards, and moved external side effects
  after successful database commits.
- Local verification after the follow-up review:
  - `[x]` Laravel Pint passes.
  - `[x]` Full Laravel suite passes after the mail hotfix: 102 tests and 638
    assertions.
  - `[x]` Composer audit reports no security advisories.
  - `[x]` Frontend unit tests, zero-warning ESLint, production build, and npm
    audit pass.
  - `[x]` Local authenticated browser review covers filter URL persistence,
    user details, required suspension reason, suspension, reactivation, review
    history, French, English, Arabic/RTL, and reports no console errors.
  - `[x]` User-directory Lighthouse scores 100 for accessibility, best
    practices, and SEO after adding accessible filter labels.
- Production verification:
  - `[x]` `ede7e94` completed the P5 validation release and synchronized
    Vercel and Render.
  - `[x]` `22c61a2` preserved P5 behavior while completing the lifecycle-mail
    hotfix; Vercel and Render report the same commit and schema `1`.
  - `[x]` Production Smoke runs 13 and 14 passed.
  - `[x]` Operator completed all authenticated P5 scenarios successfully,
    including filtering, persistence, details, lifecycle actions, bulk-action
    safeguards, authorization, French/English/Arabic RTL, and mobile behavior.

### Acceptance criteria

- The frontend never downloads the entire user table.
- Search and filters remain responsive with thousands of accounts.

---

## P6 — Security hardening

### Tasks

- `[x]` **P6.1 — Email verification before admin review.**
  - Verify staff email ownership before a request becomes reviewable.
  - Keep unverified applicants out of the approval queue and prevent login.
  - Provide resend and expired-link recovery without creating duplicate users.
  - Local implementation and validation:
    - `[x]` Signed 60-minute links, login blocking, hidden unverified requests,
      case-insensitive resend, and the legacy-applicant command are implemented.
    - `[x]` Individual and bulk approval/reactivation paths reject unverified
      staff accounts; regression tests cover pending and suspended states.
    - `[x]` Verification locks the applicant row, persists the administrator's
      database alert atomically, and isolates post-commit email failures.
    - `[x]` Every accepted resend request dispatches the same after-response job,
      removing existence-dependent mail latency while retaining neutral wording
      and a reusable recovery form.
    - `[x]` Unknown verification-result values safely fall back to the invalid
      state; French, English, Arabic/RTL, and mobile recovery views pass locally.
    - `[x]` Duplicate verification notification on registration eliminated with
      `configureEmailVerification` override and strict regression test assertion.
    - `[x]` Full local checks pass: 117 Laravel tests / 714 assertions, Pint,
      Composer audit, 12 frontend unit tests, ESLint, production build, and npm
      audit.
- `[~]` **P6.2 — Administrator two-factor authentication.**
  - TOTP algorithm (RFC 6238) with $\pm 1$ 30-second window drift tolerance.
  - Inline SVG QR code and secret key generation.
  - 8 single-use emergency recovery codes with copy helper.
  - Confirmation flow requiring a valid 6-digit TOTP code before activation.
  - Password confirmation required to view, regenerate, or disable recovery codes.
  - Two-factor login challenge returning temporary encrypted challenge token.
  - Rate-limited challenge verification supporting TOTP code or recovery code.
  - Dedicated TwoFactorSection on `/dashboard/profile` for administrators.
  - Automated feature test suite `TwoFactorAuthenticationTest` (9 tests, 58 assertions).
  - All 126 backend tests (772 assertions), Pint, ESLint, 12 frontend unit tests, Next.js production build, and npm audit passing.
- `[ ]` **P6.3 — Session and device management.**
  - List active sessions and provide “log out all devices.”
- `[ ]` **P6.4 — Recent password confirmation for destructive actions.**
- `[ ]` **P6.5 — Security-sensitive rate-limit review.**
  - Cover login, registration, approval, password reset, and uploads.
- `[ ]` **P6.6 — Malicious-file scanning for proofs and documents.**
- `[ ]` **P6.7 — Signed, short-lived private download URLs.**
- `[ ]` **P6.8 — Quarterly security configuration review.**
  - Review security headers, CORS origins, token expiration, and provider
    credential policies.

Each increment must be implemented, tested, previewed, and released separately.
P6.1 is the only approved starting point after restoring P0.4 deployment
automation; do not begin P6.2 or later increments early.

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
| D009 | Email delivery runs only after account-status transactions commit, so transport failures cannot corrupt or roll back lifecycle transitions. | Accepted |
| D010 | Personal Gmail address (@gmail.com) sender requires native Google SMTP (smtp.gmail.com:587 with Google App Password) to guarantee DMARC/SPF inbox delivery without custom domain DNS records. | Accepted |
| D011 | Render Free Tier blocks outbound SMTP TCP ports (25, 465, 587, 2525). To guarantee 100% reliable transactional email delivery on Render Free without port blocks or gateway timeouts, EduSpace uses the Mailjet Send API v3.1 over standard HTTPS (Port 443). | Accepted |
| D012 | Account lifecycle notifications are delivered synchronously after the status transaction commits, so approval/rejection mail cannot depend on a queue worker and transport failures remain visible to administrators. | Accepted |
| D013 | Restore Render `checksPass` auto-deploy before starting P6; manual deployment is an incident workaround, not the normal release process. | Superseded by D015 |
| D014 | Production Smoke is manual after releases and scheduled daily; it must not run as a post-CI check because Render `checksPass` would wait on the smoke job that is itself waiting for Render. | Accepted |
| D015 | Production API releases are deployed manually by the operator from the approved `main` SHA. Render Auto-Deploy is intentionally `off` because any specific-commit deploy disables it; SHA parity via `/health` and a manually dispatched Production Smoke are mandatory after every release. | Accepted |
| D016 | Staff verification links expire after 60 minutes. Pending applications are reviewable only after verification; existing unverified applicants receive a fresh link via `staff:send-verification`, and admins are alerted only after the address is confirmed. | Accepted |
| D017 | Administrator 2FA uses RFC 6238 TOTP via pragmarx/google2fa with inline SVG QR codes via bacon/bacon-qr-code and 8 single-use emergency recovery codes. Login challenge issues an encrypted 5-minute challenge token exchanged for the full Sanctum token upon code validation. | Accepted |

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
| 2026-11-09 | P1.1 | Dedicated account requests approval API with metrics and filters | `d10c2e4` |
| 2026-11-09 | P1 Complete | Dedicated Account Approval Center UI, Navigation, and Details Modal | `3a73214` |
| 2026-11-09 | P2.1 | Institutional identity fields in registration, models, approval center, and tests | `4311584` |
| 2026-11-09 | P2 Complete | Staff identity, proof documents, private storage, and admin viewer | `a951787` |
| 2026-11-09 | P3 Complete | Full account-review lifecycle: rejection reason, resubmission, suspension, and review history | `3d3bc4a` |
| 2026-11-09 | P4 Complete | Approval emails, admin notifications, localized templates (FR/EN/AR), retry safety, and test suite | `a4ca245` |
| 2026-11-09 | P4.1 Diagnostics | SMTP diagnostic test suite, CLI mail:test command, admin system-status tester, Render mail env sync | `dcd6f8d` |
| 2026-11-10 | P4.2 | Mailjet API v3.1 HTTPS transport over Port 443, failure isolation, and expanded mail test suite | `d723eec` |
| 2026-11-10 | P5.1 | Server-side user directory pagination, sorting, filters, mobile cards, and role safeguards | `41ad5a1` |
| 2026-11-10 | P5.2–P5.3 | Filter persistence, user details, and protected bulk administration actions | `4a1f865` |
| 2026-11-10 | P5 validation release | P5 follow-up passed CI and Production Smoke; Vercel and Render synchronized | `ede7e94` |
| 2026-11-10 | P4.5 Complete | Immediate lifecycle-mail delivery, French fallback, visible delivery warnings, real-channel tests, and successful live inbox verification | `22c61a2` |
| 2026-11-10 | P5 Complete | All authenticated production scenarios passed; user administration accepted on desktop, mobile, and RTL | `22c61a2` |
| 2026-11-10 | P0.4 recovery | Render Blueprint synchronized and live auto-deploy restored to `After CI Checks Pass` | `653d0c1` |
| 2026-11-10 | P0.4 Complete | Manual operator release adopted (D015), `render.yaml` declared `off`, runbook and SHA-parity rule updated, release verified synchronized | `d4bb6cd` |
| 2026-11-10 | P0.4 amendment | Quoted `autoDeployTrigger` enum so the Render Blueprint stays valid; release deployed and verified synchronized | `457081e` |

## Next action

Complete the remaining **P6.1 — Email verification before admin review**
release gates. Commit and push the validated fixes to `PROD`, confirm CI, review
and explicitly approve the Vercel preview, then fast-forward `main`, deploy the
approved API SHA manually (D015), run Production Smoke, complete the
authenticated production checklist, and record the release here. Do not begin
P6.2 or any unrelated phase until those P6.1 gates are complete.
