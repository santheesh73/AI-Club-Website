# AI CLUB — Courses & Learning Platform Security & Governance Model

## 1. Overview
The Courses & Learning Management Platform implements defense-in-depth security covering authorization, content gating, structural referential integrity, progress calculation tamper resistance, and immutable audit logging.

---

## 2. Authentication & Role Boundaries

### 2.1 Active Membership Requirement
1. **Rule**: Access to member learning endpoints (`/api/v1/member/courses/*`) strictly requires:
   - Authenticated JWT token.
   - Verified active membership record in `public.memberships` (`status = 'active'`).
2. **Enforcement**:
   - `requireRole(['member', 'admin'])` middleware verifies role in token.
   - `isUserActiveMember(userId)` service-level guard performs authoritative database lookup.
   - Applicants or unverified users attempting to access member course routes receive `403 FORBIDDEN` (`MEMBERSHIP_REQUIRED`).

---

## 3. Content Gating & Preview Protection

### 3.1 Content Gating Invariant
1. **Rule**: Complete instructional lesson content (`content`, `videoUrl`) for non-preview lessons is protected.
2. **Enforcement**:
   - If `lesson.is_preview === true`, content is delivered directly to active members.
   - If `lesson.is_preview === false`, the API verifies the requesting member holds an active enrollment record in `public.course_enrollments`.
   - If unenrolled, the API returns `403 FORBIDDEN` with code `ENROLLMENT_REQUIRED` and redacts protected content.

---

## 4. Referential & Structural Integrity

### 4.1 Module Deletion Guard
1. **Rule**: An administrator cannot delete a curriculum module that contains lessons without explicitly reassigning or deleting those lessons first.
2. **Enforcement**:
   - `coursesService.deleteModule` queries `course_lessons` for the target `moduleId`.
   - If `lessons.length > 0`, the operation aborts with `409 CONFLICT` (`MODULE_NOT_EMPTY`).

### 4.2 Unique Enrollment Constraint
1. **Rule**: A member cannot possess multiple active or duplicate enrollments for the same course.
2. **Enforcement**:
   - Database constraint: `CONSTRAINT uq_course_user_enrollment UNIQUE (course_id, user_id)`.
   - API guard: returns `409 CONFLICT` (`ALREADY_ENROLLED`).

---

## 5. Tamper-Resistant Progress Engine

### 5.1 Server-Authoritative Progress Calculation
1. **Rule**: Clients cannot send arbitrary progress percentages or completion counts.
2. **Enforcement**:
   - The client only dispatches boolean completion updates for specific lessons: `POST /api/v1/member/courses/:slug/lessons/:lessonSlug/progress { completed: true }`.
   - The backend counts distinct completed lessons in `public.lesson_progress` where `completed = true` and `enrollment_id = targetEnrollment.id`.
   - The backend computes:
     $$\text{percentage} = \operatorname{round}\left(\frac{\text{completedLessons}}{\text{totalLessons}} \times 100\right)$$
   - When $\text{completedLessons} = \text{totalLessons}$ and $\text{totalLessons} > 0$, the server automatically transitions enrollment status to `'completed'` and writes `completed_at = NOW()`.

---

## 6. Audit Logging

All administrative mutations and significant learning milestones emit audit events into `public.audit_logs`:
- `COURSE_CREATED`: When a course is initially registered.
- `COURSE_PUBLISHED`: When status changes from `draft` to `published`.
- `COURSE_UNPUBLISHED`: When status returns to `draft`.
- `COURSE_ARCHIVED`: When status transitions to `archived`.
- `COURSE_ENROLLED`: When a member enrolls in a course.
- `COURSE_COMPLETED`: When a member completes all lessons in a course.

---

## 7. PostgreSQL Row-Level Security (RLS)

All 6 tables in Milestone 7 have RLS enabled:
- `course_categories`: Public/authenticated select, admin write.
- `courses`: Authenticated select for published/archived, admin write.
- `course_modules`: Authenticated select for published courses, admin write.
- `course_lessons`: Authenticated select for published courses, admin write.
- `course_enrollments`: Learner select/insert for own records, admin select all.
- `lesson_progress`: Learner select/insert/update for own enrollments, admin select all.
