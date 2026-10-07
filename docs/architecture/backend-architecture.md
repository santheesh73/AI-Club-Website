# AI CLUB — Backend Architecture

## 1. Structure Overview

The backend service is structured as a modular, type-safe REST API server using **Node.js**, **Express**, **TypeScript**, and **Zod**.

```
backend/
├── src/
│   ├── config/          # Environment parsing and validation (Zod)
│   ├── middleware/      # Security (Helmet, CORS), Auth, Validation, Request Logger, Error Handler
│   ├── modules/         # Domain-driven feature modules
│   │   ├── health/      # Health check and telemetry endpoints
│   │   ├── auth/        # Authentication callbacks and session verifications
│   │   ├── profile/     # User profile data operations
│   │   ├── applications/# Application lifecycle and submissions
│   │   ├── assessment/  # Assessment questions, submissions, scoring
│   │   ├── membership/  # Membership roster and status management
│   │   ├── events/      # Event creation, RSVPs, attendance
│   │   ├── courses/     # Course syllabus and progress tracking
│   │   ├── projects/    # Team project repositories and approvals
│   │   ├── teams/       # Team formation and member assignment
│   │   ├── achievements/# Achievement definitions and awards
│   │   ├── announcements/# Broadcast notices
│   │   ├── notifications/# Multi-channel notification delivery
│   │   ├── admin/       # Elevated administrative operations
│   │   └── ai/          # Orchestrated LLM guidance and recommendations
│   ├── services/        # External services (Supabase Authoritative Client)
│   ├── utils/           # Shared response builders, structured logger, AppError
│   ├── validators/      # Cross-cutting validation schemas
│   └── server.ts        # Express bootstrapping and route mounting
└── tests/               # Smoke and integration tests (Vitest + Supertest)
```

---

## 2. Request Lifecycle Pipeline

```
Incoming HTTP Request
   │
   ▼
[1. securityHeaders (Helmet)]
   │
   ▼
[2. corsMiddleware (Origin validation)]
   │
   ▼
[3. requestLogger (Request ID injection, duration tracking, JSON log)]
   │
   ▼
[4. URL Parsing & Body Parsing (JSON limit 1MB)]
   │
   ▼
[5. Route Matching (/api/v1/:module)]
   │
   ├── (Optional) validate(schema)  -> Zod payload validation
   ├── (Optional) authenticate      -> Supabase JWT verification
   ├── (Optional) requireRole       -> Role-based access control
   │
   ▼
[6. Controller Execution]
   │
   ├── Success -> sendSuccess(res, data)
   └── Failure -> next(new AppError(...))
   │
   ▼
[7. Centralized errorHandler]
   ├── Maps AppError / ZodError / Native Error
   ├── Injects requestId
   └── Sanitizes stack trace in production
```

---

## 3. Configuration & Validation

Environment variables are validated on startup using Zod in `src/config/env.ts`. If required variables are malformed or missing, the process fails fast with descriptive diagnostics before listening on any port.

---

## 4. Error Handling & Response Contracts

- **Unified envelopes**: All API responses use either `{ success: true, data: ... }` or `{ success: false, error: ... }`.
- **Status Codes**:
  - `200 OK`: Successful retrieval / update
  - `201 Created`: Successful entity creation
  - `400 Bad Request`: Validation failure (Zod details attached)
  - `401 Unauthorized`: Missing or invalid Bearer token
  - `403 Forbidden`: Authenticated user lacks required role
  - `404 Not Found`: Endpoint or resource does not exist
  - `500 Internal Server Error`: Uncaught exceptions (stack redacted in production)

---

## 5. Profile & Identity Endpoints (Milestone 2)

- **Identity Derivation**: `req.user.id` is extracted strictly from the verified Supabase Auth JWT in `authenticate` middleware. No endpoints accept user ID as an input parameter for self operations.
- **Endpoints**:
  - `GET /api/v1/profile`: Returns the authenticated user's profile entity.
  - `PATCH /api/v1/profile`: Updates permitted academic, contact, and bio fields. Enforces `updateProfileSchema.body.strict()`, rejecting payloads that attempt to modify `role`, `id`, or `email`.

---

## 6. Applications & Assessment Engine (Milestone 3)

- **Application Lifecycle**: Managed through `/api/v1/applications` (`POST /`, `GET /me`, `GET /me/status`).
- **Profile Prerequisite**: `verifyProfileCompletion()` enforces valid academic credentials before an application can be created.
- **Timed 25-MCQ Assessment**: Managed through `/api/v1/assessment`. Generates server-authoritative attempt windows with secure answer masking and atomic autosave.

---

## 7. Admin Control Center & Decision Engine (Milestone 4)

- **Administrative Authorization**:
  - All endpoints under `/api/v1/admin/*` are guarded by `authenticate` and `requireRole(['admin'])`.
  - Admin role is authoritatively verified from the database `profiles` table to prevent client-side JWT spoofing or tampering.
  - Non-admins attempting access receive `403 FORBIDDEN` (`ADMIN_ROLE_REQUIRED`).

- **Application Review Endpoints**:
  - `GET /api/v1/admin/dashboard/summary`: High-level metrics (total applications, approved, waitlisted, rejected, pending review, average score, pass rate).
  - `GET /api/v1/admin/applications`: Searchable, filterable, sortable, paginated query of applicant dossiers.
    - Search: multi-field against full name, email, register number, and application number.
    - Filters: `status`, `department`.
    - Sorting: Allowlist (`createdAt`, `submittedAt`, `assessmentScore`, `applicationNumber`, `fullName`) with `asc`/`desc`.
    - Pagination: `page`, `pageSize` with boundary limits.
  - `GET /api/v1/admin/applications/:id`: Detailed applicant dossier aggregating profile details, 25-MCQ assessment breakdown, current application status, and full audit trail.

- **Decision Engine Actions**:
  - `POST /api/v1/admin/applications/:id/approve`: Transitions candidate from `under_review` (or `test_completed`) to `approved`. Optional reviewer notes.
  - `POST /api/v1/admin/applications/:id/waitlist`: Transitions candidate to `waitlisted`. Optional reviewer notes.
  - `POST /api/v1/admin/applications/:id/reject`: Transitions candidate to `rejected`. **Mandates** a non-empty `rejectionReason` (validated via Zod and DB check constraint).

- **State Transition Invariance & Anti-Tampering**:
  - Applications in `draft` state cannot be reviewed or decided (`409 INVALID_APPLICATION_STATE`).
  - Idempotency protection: Once an application has been decided, repeated decisions or conflicts return `409 APPLICATION_ALREADY_REVIEWED` or `409 INVALID_APPLICATION_STATE`.
  - Strict Boundary: Approval in Milestone 4 transitions application status to `approved` and records an audit log. It does **NOT** create membership records or membership numbers (deferred strictly to Milestone 5).

- **Operational Audit Service**:
  - Every decision automatically logs an immutable event to `public.audit_logs` (`APPLICATION_APPROVED`, `APPLICATION_WAITLISTED`, `APPLICATION_REJECTED`) with actor ID, timestamp, and metadata.

---

## 8. Membership Activation & Member Experience (Milestone 5)

- **Architectural Principle**: `APPROVED` application $\ne$ `MEMBER`.
  An approved candidate is only admitted as a member when an authoritative record is committed to `public.memberships`.

- **Endpoints**:
  - `POST /api/v1/admin/memberships/activate`: Admin-only transactional induction.
    - Input: `{ applicationId: string, notes?: string }`
    - Checks: Validates target application exists and has `status = 'approved'` (returns `409` otherwise).
    - Duplicate Guard: Verifies no existing active membership exists for the user (returns `409` duplicate protection).
    - Sequential ID: Issues next `AIC-YYYY-XXXX` member number via PostgreSQL sequence `member_number_seq`.
    - Profile Sync: Elevates `profiles.role` to `'member'`.
    - Audit Trail: Commits `MEMBERSHIP_ACTIVATED` log to `public.audit_logs`.
  - `GET /api/v1/admin/members`: Admin roster listing with status, student identity, and member number.
  - `GET /api/v1/membership/me`: Retrieves authenticated member's active membership record. Returns `404` if not a member.
  - `GET /api/v1/membership/me/dashboard`: Consolidated telemetry returning member profile, membership card details, approved application history, and entrance assessment scorecard.
  - `GET /api/v1/membership/me/application`: Member's own approved entrance application record.
  - `GET /api/v1/membership/me/assessment`: Member's own completed 25-MCQ entrance evaluation scorecard.

- **Role Verification & Database-Backed Authority**:
  - Handled by `authenticate` and `requireRole(['member', 'admin'])`.
  - Guarantees non-members cannot read member telemetry even if authenticated as applicants.

---

## 9. Events & Activities Platform (Milestone 6)

- **Architectural Principles**:
  - **Identity Boundary**: Strictly consumes Milestone 5 active memberships (`public.memberships`). Applicants receive `403 FORBIDDEN`.
  - **Server-Authoritative Capacity**: Race-condition protected seat reservations. Over-registration is prevented at the database layer through serializable transactions and count verification.
  - **Strict State Lifecycle**: Events originate as `DRAFT`, transition to `PUBLISHED` upon admin action, progress to `ONGOING` during runtime, and terminate as `COMPLETED` or `CANCELLED`.
  - **Cancellation Integrity**: Administrative cancellations mandate an audited `cancellationReason`. Cancelled events instantly freeze further registrations.
  - **Private Meeting Links**: Unlocked and served exclusively to members holding an active verified registration pass.

- **Endpoints**:
  - **Admin Management Endpoints**:
    - `POST /api/v1/admin/events`: Creates an event record (default `draft`, or direct `published`). Validates that `endAt > startAt`, `registrationCloseAt > registrationOpenAt`, and `registrationCloseAt <= startAt`.
    - `GET /api/v1/admin/events`: Filterable, searchable, paginated list of all events including draft states.
    - `GET /api/v1/admin/events/:id`: Detailed event inspection with full audit information.
    - `PATCH /api/v1/admin/events/:id`: Edits event attributes (forbidden once completed or cancelled).
    - `POST /api/v1/admin/events/:id/publish`: Transitions `draft` $\to$ `published`.
    - `POST /api/v1/admin/events/:id/cancel`: Transitions to `cancelled` with required explanation.
    - `GET /api/v1/admin/events/:id/registrations`: Returns the full attendee roster with student details, member numbers, registration times, and attendance statuses.

  - **Member Event Endpoints**:
    - `GET /api/v1/member/events`: Discovery catalog displaying published events, occupancy percentages, remaining seats, and registration status of the authenticated member.
    - `GET /api/v1/member/events/registered`: Retrieves member's personal registrations partitioned into upcoming and past events.
    - `GET /api/v1/member/events/:slug`: Resolves event by human-friendly URL slug, dynamically unveiling `meetingUrl` for confirmed registrants.
    - `POST /api/v1/member/events/:eventId/register`: Reserves a seat. Atomically verifies open registration window, capacity availability, and prevents duplicate active reservations (`409 CONFLICT`).
    - `DELETE /api/v1/member/events/:eventId/registration`: Cancels reservation, transitions record status to `cancelled`, and frees up the seat immediately.



