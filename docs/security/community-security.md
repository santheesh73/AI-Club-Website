# AI CLUB — Projects, Achievements & Community Security Model

## 1. Overview
The Projects, Achievements & Community Showcase Platform implements defense-in-depth security covering active membership gating, dual-mode visibility gating, strict ownership invariants, report deduplication, moderation authority, and Row-Level Security.

---

## 2. Authentication & Role Boundaries

### 2.1 Active Membership Guard
1. **Rule**: Creating projects (`/api/v1/member/projects`), managing project resources, and claiming achievements (`/api/v1/member/achievements/claim`) strictly requires an authenticated user with an active membership record in `public.memberships` (`status = 'active'`).
2. **Distinction**: Approved applicants or users who have not finalized membership activation are NOT permitted to create projects or claim achievements.
3. **Enforcement**:
   - `requireRole(['member', 'admin'])` middleware verifies role.
   - `isUserActiveMember(userId)` service-level guard performs authoritative database lookup.
   - Unverified users receive `403 FORBIDDEN` (`MEMBERSHIP_REQUIRED`).

---

## 3. Ownership & Mutation Invariants

### 3.1 Project Ownership Guard
1. **Rule**: Only the creator/owner of a project can edit metadata, publish, archive, add/remove contributors, manage links, or manage media assets.
2. **Enforcement**:
   - Every mutation controller verifies `project.owner_id === req.user.id`.
   - Administrators possess elevated oversight privileges to moderate, hide, or feature projects, but routine editing remains restricted to the project author.
   - Unauthorized members receive `403 FORBIDDEN` (`NOT_PROJECT_OWNER`).

### 3.2 Contributor Invariants
1. **Rule**: The owner of the project cannot be removed from the contributors roster.
2. **Rule**: Duplicate contributor additions are prevented with `409 CONFLICT` (`CONTRIBUTOR_ALREADY_EXISTS`) via `CONSTRAINT uq_project_user_contributor UNIQUE (project_id, user_id)`.

---

## 4. Visibility Gating & Discovery Protection

### 4.1 Dual-Mode Showcase Gating
1. **Public Showcase**: Unauthenticated visitors or guests can only access published projects where `visibility = 'public'` and `status = 'published'`.
2. **Members-Only Showcase**: Projects flagged with `visibility = 'members_only'` are accessible exclusively when authenticated with an active membership.
3. **Hidden / Draft State Isolation**:
   - Projects in `status = 'draft'` are visible only to the author in their private workspace (`/api/v1/member/projects`).
   - Projects in `status = 'hidden'` are removed from all public and member discovery queries immediately upon moderation.

---

## 5. Report Abuse Prevention & Moderation Security

### 5.1 Deduplication & Spam Prevention
1. **Rule**: A member cannot spam reports against the same project while a previous report is currently under review or open.
2. **Enforcement**:
   - Database partial unique index:
     ```sql
     CREATE UNIQUE INDEX idx_reports_unique_active_target
       ON public.reports (reporter_id, target_type, target_id)
       WHERE (status IN ('open', 'under_review'));
     ```
   - If an active report already exists, the API rejects subsequent submissions with `409 CONFLICT` (`REPORT_ALREADY_EXISTS`).

### 5.2 Content Moderation State Machine
1. **Transitions**:
   - Admins can transition any project from `published` to `hidden` with a mandatory reason: `POST /api/v1/admin/projects/:id/hide`.
   - Admins can restore a `hidden` project back to `published`: `POST /api/v1/admin/projects/:id/restore`.
2. **Audit Logging**: Every hide, restore, feature, or report resolution generates an immutable record in `public.audit_logs` storing the admin ID, target ID, action type, and operational notes.

---

## 6. PostgreSQL Row-Level Security (RLS)

All 11 tables introduced in Milestone 8 have RLS enabled:
- `project_categories`: Public/authenticated select, admin write.
- `technologies`: Public/authenticated select, admin write.
- `projects`:
  - Select: Public can view published+public projects; active members can view published+members_only projects; owners can view all their own projects; admins can view all.
  - Insert: Active members can insert projects with their own `owner_id`.
  - Update: Owners can update their own projects; admins can update any project.
  - Delete: Owners can delete their own projects; admins can delete any project.
- `project_technologies`: Public select for visible projects, project owners/admins write.
- `project_contributors`: Public select for visible projects, project owners/admins write.
- `project_links`: Public select for visible projects, project owners/admins write.
- `project_media`: Public select for visible projects, project owners/admins write.
- `achievement_categories`: Public/authenticated select, admin write.
- `achievements`: Public/authenticated select, admin write.
- `user_achievements`: Authenticated select for all, members insert own claims, admins verify/update.
- `featured_projects`: Public select for published projects, admin write.
- `reports`: Members insert own reports, reporters select own reports, admins view/update all.
