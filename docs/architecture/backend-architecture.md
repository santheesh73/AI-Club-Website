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

---

## 10. Courses & Learning Management Platform (Milestone 7)

- **Architectural Principles**:
  - **Active Membership Guard**: All member learning endpoints enforce active membership verification via `public.memberships`. Non-members or applicants are rejected with `403 FORBIDDEN`.
  - **Content Gating Invariant**: Non-preview lesson content is protected and delivered exclusively to users with an active enrollment. Preview lessons (`is_preview = true`) are accessible without enrollment to allow members to inspect course suitability.
  - **Explicit Positioning & Reordering**: Both modules and lessons maintain deterministic sequence ordering via integer `position` fields. Reordering is performed via dedicated transactional batch endpoints.
  - **Server-Derived Progress Calculation**: Learning completion percentage is derived authoritatively as `(completedLessonsCount / totalLessonsCount) * 100`.
  - **Automatic Course Completion**: When all lessons in a course are marked completed, the enrollment status automatically transitions from `'active'` to `'completed'`, `completedAt` timestamp is set, and a `COURSE_COMPLETED` audit log is emitted.
  - **Resume Learning Pointer**: Resolves to the earliest incomplete lesson by `(module.position, lesson.position)`, enabling 1-click continuation.

- **Endpoints**:
  - **Public / Shared Catalog Endpoints**:
    - `GET /api/v1/courses/categories`: Lists all available curriculum domain categories.
  - **Member Learning Endpoints**:
    - `GET /api/v1/member/courses`: Discovery catalog of published courses with category, difficulty, search, and pagination.
    - `GET /api/v1/member/courses/enrolled`: Returns active member's enrolled courses with progress metrics.
    - `GET /api/v1/member/courses/dashboard`: Personal learning telemetry (enrolled count, in progress, completed, total lessons completed, and resume learning spotlight).
    - `GET /api/v1/member/courses/:slug`: Retrieves course details, full syllabus tree, and user enrollment status.
    - `POST /api/v1/member/courses/:id/enroll`: Enrolls member in course (rejects duplicates with `409 CONFLICT`).
    - `GET /api/v1/member/courses/:courseSlug/lessons/:lessonSlug`: Delivers lesson content and previous/next navigation pointers (gated by enrollment unless `isPreview`).
    - `POST /api/v1/member/courses/:courseSlug/lessons/:lessonSlug/progress`: Records completion state and returns updated course progress.
  - **Admin Course Management Endpoints**:
    - `GET /api/v1/admin/courses`: Admin course listing with filters by category, difficulty, and status (including drafts).
    - `POST /api/v1/admin/courses`: Creates course in `draft` or `published` status with slug generation.
    - `GET /api/v1/admin/courses/:id`: Retrieves full course syllabus with modules and lessons for editing.
    - `PUT /api/v1/admin/courses/:id`: Updates course metadata.
    - `DELETE /api/v1/admin/courses/:id`: Deletes course.
    - `POST /api/v1/admin/courses/:id/publish`: Transitions `draft` $\to$ `published`.
    - `POST /api/v1/admin/courses/:id/unpublish`: Transitions `published` $\to$ `draft`.
    - `POST /api/v1/admin/courses/:id/archive`: Transitions `published` $\to$ `archived`.
    - `POST /api/v1/admin/courses/:id/modules`: Creates module in course.
    - `PUT /api/v1/admin/courses/:courseId/modules/:moduleId`: Updates module.
    - `DELETE /api/v1/admin/courses/:courseId/modules/:moduleId`: Deletes module (enforces `409 CONFLICT` if module contains lessons).
    - `POST /api/v1/admin/courses/:id/modules/reorder`: Updates sequential positions of modules.
    - `POST /api/v1/admin/courses/:courseId/modules/:moduleId/lessons`: Creates lesson in module.
    - `PUT /api/v1/admin/courses/:courseId/modules/:moduleId/lessons/:lessonId`: Updates lesson content and preview flag.
    - `DELETE /api/v1/admin/courses/:courseId/modules/:moduleId/lessons/:lessonId`: Deletes lesson.
    - `POST /api/v1/admin/courses/:courseId/modules/:moduleId/lessons/reorder`: Updates lesson sequence.
    - `GET /api/v1/admin/courses/:id/enrollments`: Inspects enrolled learner roster and progress telemetry.

---

## 11. Projects, Achievements & Community Showcase Platform (Milestone 8)

- **Architectural Principles**:
  - **Active Membership Guard**: Creation of projects (`/api/v1/member/projects`) and claiming achievements (`/api/v1/member/achievements/claim`) strictly requires an authenticated user with an active membership record in `public.memberships` (`status = 'active'`). Approved applicants who have not yet activated membership are rejected with `403 FORBIDDEN`.
  - **Dual-Mode Discovery Gating**: Public discovery (`GET /api/v1/projects`) exposes published projects with `visibility = 'public'` to unauthenticated visitors. Authenticated members can also view projects marked `visibility = 'members_only'`. Hidden projects (`status = 'hidden'`) are strictly filtered out from public and member discovery.
  - **Ownership Mutation Invariant**: All mutation endpoints for projects (`PUT /api/v1/member/projects/:id`, `DELETE /api/v1/member/projects/:id`, `POST /api/v1/member/projects/:id/publish`, contributor/link/media management) strictly enforce that `project.owner_id === req.user.id`. Non-owner members attempting to modify another member's project receive `403 FORBIDDEN`.
  - **Collision-Resistant Slugs**: Project slugs are generated server-authoritatively from the title (`slugify(title)`) with automatic incremental collision handling (`title-2`, `title-3`) if conflicts exist.
  - **Report Spam & Duplicate Prevention**: Reports table enforces a partial unique index `(reporter_id, target_type, target_id) WHERE (status IN ('open', 'under_review'))`. Members cannot submit duplicate reports against the same target while an existing report is active (`409 CONFLICT`).
  - **Admin Moderation & Audit Logging**: Admins can hide any project (`POST /api/v1/admin/projects/:id/hide`), restore hidden projects (`POST /api/v1/admin/projects/:id/restore`), feature/unfeature projects, and resolve moderation reports (`POST /api/v1/admin/community/reports/:id/resolve`). Every moderation action writes an immutable audit record to `public.audit_logs`.

- **Endpoints**:
  - **Public / Shared Showcase Endpoints**:
    - `GET /api/v1/projects/categories`: Returns project taxonomy categories.
    - `GET /api/v1/projects/technologies`: Returns technology tags/stacks.
    - `GET /api/v1/projects/featured`: Returns spotlight featured projects.
    - `GET /api/v1/projects`: Public & member discovery catalog with search, category, technology, and pagination.
    - `GET /api/v1/projects/:slug`: Detailed project dossier with contributors, links, media, and technologies.
  - **Member Project Workspace Endpoints**:
    - `GET /api/v1/member/projects`: Returns authenticated member's own projects (all statuses: `draft`, `published`, `archived`, `hidden`).
    - `POST /api/v1/member/projects`: Creates a new project in `draft` status (requires active membership).
    - `GET /api/v1/member/projects/:id`: Retrieves member's project for editing.
    - `PUT /api/v1/member/projects/:id`: Updates project metadata (enforces ownership).
    - `DELETE /api/v1/member/projects/:id`: Soft-deletes/archives member's project (enforces ownership).
    - `POST /api/v1/member/projects/:id/publish`: Transitions `draft` $\to$ `published` (enforces ownership).
    - `POST /api/v1/member/projects/:id/archive`: Transitions `published` $\to$ `archived` (enforces ownership).
    - `POST /api/v1/member/projects/:id/contributors`: Adds or invites contributor (enforces ownership).
    - `DELETE /api/v1/member/projects/:id/contributors/:contributorId`: Removes contributor (enforces ownership).
    - `POST /api/v1/member/projects/:id/links`: Adds external project link (GitHub, live demo, paper).
    - `DELETE /api/v1/member/projects/:id/links/:linkId`: Removes external project link.
    - `POST /api/v1/member/projects/:id/media`: Adds media item (screenshot, demo embed).
    - `DELETE /api/v1/member/projects/:id/media/:mediaId`: Removes media item.
    - `POST /api/v1/member/projects/:id/report`: Reports project for moderation review (rate/duplicate-limited).
  - **Achievements Endpoints**:
    - `GET /api/v1/achievements/categories`: Returns achievement categories.
    - `GET /api/v1/achievements`: Returns achievement catalog.
    - `GET /api/v1/member/achievements`: Returns member's earned and available achievements with unlock metrics.
    - `POST /api/v1/member/achievements/claim`: Claims an open achievement or requests verification.
  - **Admin Moderation & Community Endpoints**:
    - `GET /api/v1/admin/community/stats`: Platform-wide showcase telemetry (projects, reports, featured count).
    - `GET /api/v1/admin/community/reports`: Listing of moderation reports with status filtering.
    - `POST /api/v1/admin/community/reports/:id/resolve`: Resolves or dismisses a moderation report.
    - `POST /api/v1/admin/projects/:id/hide`: Moderates a project by setting status to `hidden` with reason.
    - `POST /api/v1/admin/projects/:id/restore`: Restores a hidden project back to `published`.
    - `POST /api/v1/admin/projects/:id/feature`: Spotlights a project into the featured showcase.
    - `DELETE /api/v1/admin/projects/:id/feature`: Removes project from featured showcase.
