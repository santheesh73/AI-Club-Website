# AI CLUB — Database Architecture & Schema Strategy

## 1. Database Principles

1. **PostgreSQL is Authoritative**: Client state is untrusted. Relational integrity, triggers, and constraints reside directly in the database.
2. **Foreign Keys Enforce Relationships**: Orphaned records are prohibited. Referential cascades (`ON DELETE CASCADE` or `RESTRICT`) are explicit.
3. **Constraints Enforce Valid States**: Enums and domain constraints ensure only valid lifecycle transitions occur.
4. **Row-Level Security (RLS) is Non-Negotiable**: Every table in the `public` schema has RLS enabled with explicit policies.
5. **No Schema Changes Without Migrations**: Direct changes in production or staging without version-controlled SQL migrations are strictly prohibited.

---

## 2. Directory Layout

```
database/supabase/
├── config.toml               # Local Supabase CLI configuration
├── migrations/               # Sequential timestamped SQL migration scripts
│   └── 20261006000001_initial_foundation.sql
├── seed/                     # Development seed fixtures
│   └── seed.sql
└── functions/                # Edge functions (Deno / TypeScript)
```

---

## 3. Naming Conventions

- **Tables**: Plural snake_case (`profiles`, `applications`, `events`, `courses`).
- **Columns**: Lowercase snake_case (`created_at`, `full_name`, `github_username`).
- **Foreign Keys**: Suffix with `_id` (`user_id`, `application_id`, `course_id`).
- **Indexes**: `idx_{table}_{column}` (e.g. `idx_profiles_role`).
- **Triggers**: `set_{table}_{action}` or `on_{table}_{event}`.
- **Enums**: Lowercase snake_case (`user_role`, `application_status`, `membership_status`).

---

## 4. Milestone 1 Baseline Schema

### 4.1 Extensions
- `uuid-ossp`: UUID generation.
- `pgcrypto`: Cryptographic hashing and key generation.

### 4.2 Enums
- `user_role`: `'applicant' | 'member' | 'admin'`
- `application_status`: `'draft' | 'submitted' | 'under_review' | 'assessment_pending' | 'approved' | 'rejected'`
- `membership_status`: `'active' | 'alumni' | 'suspended'`

### 4.3 Table: `public.profiles`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE` | 1-to-1 link to Supabase Auth User |
| `email` | `TEXT` | `NOT NULL, UNIQUE` | User's verified email address |
| `full_name` | `TEXT` | `NOT NULL, DEFAULT '', CHECK (length <= 100)` | Display and legal name |
| `role` | `user_role` | `NOT NULL, DEFAULT 'applicant'` | System authorization role |
| `register_number` | `TEXT` | `NULLABLE, UNIQUE` | Academic roll / registration number |
| `department` | `TEXT` | `NULLABLE` | Student academic department |
| `year` | `SMALLINT` | `NULLABLE, CHECK (year >= 1 AND year <= 5)` | Academic year of study |
| `section` | `TEXT` | `NULLABLE` | Academic cohort section |
| `phone` | `TEXT` | `NULLABLE` | Phone contact number |
| `avatar_url` | `TEXT` | `NULLABLE` | Profile photo storage URI or link |
| `bio` | `TEXT` | `NULLABLE, CHECK (length <= 1000)` | Academic / engineering summary |
| `skills` | `TEXT[]` | `NOT NULL, DEFAULT '{}'` | Technical competencies list |
| `interests` | `TEXT[]` | `NOT NULL, DEFAULT '{}'` | AI and research focus areas |
| `github_url` | `TEXT` | `NULLABLE` | Verified GitHub profile URL |
| `linkedin_url` | `TEXT` | `NULLABLE` | LinkedIn profile URL |
| `portfolio_url` | `TEXT` | `NULLABLE` | Personal website URL |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Entity creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Automatically maintained timestamp |

### 4.4 Automated Triggers & Security
- `update_updated_at_column()`: Automatically modifies `updated_at` upon any row update.
- `handle_new_user()`: Automatically provisions a row in `public.profiles` whenever an entity is created in `auth.users`.
- `protect_profile_security_fields()`: Enforces that `id`, `email`, and `role` cannot be modified by non-admin users, preventing self-promotion to admin.

---

## 5. RLS (Row-Level Security) Policies

1. **`Users can view their own profile`**:
   `auth.uid() = id` (SELECT)
2. **`Members can view member profiles`**:
   `role = 'member' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('member', 'admin'))` (SELECT)
3. **`Users can update their own profile`**:
   `auth.uid() = id` (UPDATE personal fields)
4. **`Admins have full access to profiles`**:
   `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')` (ALL)

---

## 6. Migration Execution Workflow

- **Local Development**:
  ```bash
  supabase start
  supabase db reset
  ```
- **New Migration**:
  ```bash
  supabase migration new <migration_name>
  ```
- **Push to Remote**:
  ```bash
  supabase db push
  ```

---

## 7. Milestone 3 Schema (Applications & Assessment Engine)

### 7.1 Sequence: `public.application_number_seq`
Generates sequential integers starting at 1 used by `generate_application_number()` to produce unique human-readable identifiers formatted as `AIC-YYYY-XXXXXX` (e.g. `AIC-2026-000001`).

### 7.2 Table: `public.applications`
Stores student club applications.
- `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id`: `UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE`
- `application_number`: `TEXT NOT NULL UNIQUE`
- `status`: `application_status NOT NULL DEFAULT 'draft'`
- `academic_year`: `INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)`
- `submitted_at`: `TIMESTAMPTZ NULL`
- `reviewed_at`: `TIMESTAMPTZ NULL`
- `reviewer_notes`: `TEXT NULL`
- `assessment_score`: `NUMERIC(4, 1) NULL CHECK (assessment_score >= 0 AND assessment_score <= 25)`
- `assessment_passed`: `BOOLEAN NULL`
- `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 7.3 Table: `public.assessment_questions`
Question bank for algorithmic, AI, and math entrance evaluation.
- `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `category`: `TEXT NOT NULL` (e.g., Python, Machine Learning, Deep Learning, Mathematics)
- `difficulty`: `TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard'))`
- `question_text`: `TEXT NOT NULL`
- `option_a`, `option_b`, `option_c`, `option_d`: `TEXT NOT NULL`
- `correct_option`: `TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D'))`
- `marks`: `NUMERIC(3, 1) NOT NULL DEFAULT 1.0`
- `is_active`: `BOOLEAN NOT NULL DEFAULT true`
- `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 7.4 Table: `public.assessment_attempts`
Manages the timed 25-question exam instance.
- `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `application_id`: `UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE`
- `user_id`: `UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`
- `question_ids`: `UUID[] NOT NULL CHECK (array_length(question_ids, 1) = 25)`
- `started_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `expires_at`: `TIMESTAMPTZ NOT NULL`
- `submitted_at`: `TIMESTAMPTZ NULL`
- `score`: `NUMERIC(4, 1) NULL`
- `percentage`: `NUMERIC(5, 2) NULL`
- `passed`: `BOOLEAN NULL`
- `total_questions`: `INTEGER NOT NULL DEFAULT 25`
- `status`: `TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'expired'))`

### 7.5 Table: `public.assessment_answers`
Stores autosaved student answers.
- `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `attempt_id`: `UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE`
- `question_id`: `UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE`
- `selected_option`: `TEXT NOT NULL CHECK (selected_option IN ('A', 'B', 'C', 'D'))`
- `is_correct`: `BOOLEAN NULL`
- `saved_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `UNIQUE(attempt_id, question_id)`

### 7.6 Security & Anti-Privilege Escalation Triggers
- `trg_protect_application_security_fields`: Prevents non-service roles from updating application ownership, application number, or manually modifying score, passed status, or review fields.

---

## 8. Milestone 4 Schema (Admin Control Center, Review & Audit Engine)

### 8.1 Enum Expansion & Constraints
- `application_status`: Expanded to include `'waitlisted'` (in addition to `'draft'`, `'submitted'`, `'under_review'`, `'approved'`, `'rejected'`).
- Check constraint `chk_applications_rejection_reason`:
  ```sql
  CHECK ((status != 'rejected') OR (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) >= 3))
  ```
  Guarantees at the database level that no candidate can be placed into `rejected` state without an explicit explanation of at least 3 characters.

### 8.2 Application Review Fields & Performance Indexes
Added to `public.applications`:
- `reviewed_by`: `UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL`
- `admin_notes`: `TEXT NULL`
- `rejection_reason`: `TEXT NULL`
- New indexes for admin search, filtering, and sorting:
  - `idx_applications_reviewed_by`: For admin reviewer auditing.
  - `idx_applications_submitted_at`: For descending/ascending submission ordering.
  - `idx_applications_assessment_score`: For score-based candidate rankings.

### 8.3 Table: `public.audit_logs`
Immutable, append-only operational audit log recording all administrative actions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique log entry identifier |
| `actor_id` | `UUID` | `NOT NULL, REFERENCES public.profiles(id)` | ID of the administrator executing the action |
| `action` | `TEXT` | `NOT NULL` | Semantic event name (`APPLICATION_APPROVED`, etc.) |
| `entity_type` | `TEXT` | `NOT NULL` | Entity category (`APPLICATION`, `PROFILE`, etc.) |
| `entity_id` | `TEXT` | `NOT NULL` | ID of the target resource modified |
| `metadata` | `JSONB` | `NOT NULL DEFAULT '{}'::jsonb` | Structured event context (e.g. notes, reason) |
| `ip_address` | `TEXT` | `NULLABLE` | Client IP address if provided |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Immutable log creation timestamp |

### 8.4 Audit Log Immutability Protection
An immutable database trigger `trg_prevent_audit_log_mutation` prevents any `UPDATE` or `DELETE` operations on `public.audit_logs`:
```sql
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs entries are immutable and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;
```

### 8.5 Row-Level Security for Audit Logs
- Admins can read all audit logs:
  `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')` (SELECT)
- Insertion is restricted to service roles and authenticated administrators.
- Modifications and deletions are strictly rejected.

---

## 9. Milestone 5 Membership Activation & Lifecycle Schema

### 9.1 Membership Status Enum Expansion
The `membership_status` enum is expanded to accommodate full member lifecycles:
```sql
ALTER TYPE membership_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE membership_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE membership_status ADD VALUE IF NOT EXISTS 'revoked';
```
Permitted values: `'pending'`, `'active'`, `'alumni'`, `'suspended'`, `'expired'`, `'revoked'`.

### 9.2 Member Number Sequence & Generator
Member numbers follow the immutable format `AIC-YYYY-XXXX`:
```sql
CREATE SEQUENCE IF NOT EXISTS member_number_seq
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1
  NO MAXVALUE
  CACHE 1;

CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS TEXT AS $$
DECLARE
  current_yr TEXT := to_char(CURRENT_DATE, 'YYYY');
  seq_val BIGINT := nextval('member_number_seq');
BEGIN
  RETURN 'AIC-' || current_yr || '-' || lpad(seq_val::text, 4, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;
```
- Guarantees sequential, collision-free numbers across concurrent activations.
- Year-namespaced and zero-padded to 4 digits.

### 9.3 Table: `public.memberships`
Authoritative membership records linking students to active club induction.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique membership record identifier |
| `user_id` | `UUID` | `NOT NULL, REFERENCES public.profiles(id) ON DELETE RESTRICT` | Target member user ID |
| `application_id` | `UUID` | `NOT NULL, UNIQUE, REFERENCES public.applications(id) ON DELETE RESTRICT` | Linked approved application (1-to-1) |
| `member_number` | `TEXT` | `NOT NULL, UNIQUE, DEFAULT generate_member_number()` | Authoritative member number (`AIC-YYYY-XXXX`) |
| `status` | `membership_status` | `NOT NULL DEFAULT 'active'` | Current membership status |
| `joined_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Date of initial induction |
| `activated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Date of activation |
| `activated_by` | `UUID` | `NULLABLE, REFERENCES public.profiles(id) ON DELETE SET NULL` | Administrator who activated the membership |
| `suspended_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp of suspension if applicable |
| `revoked_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp of revocation if applicable |
| `expires_at` | `TIMESTAMPTZ` | `NULLABLE` | Expiration date if term-limited |
| `metadata` | `JSONB` | `NOT NULL DEFAULT '{}'::jsonb` | Extensible metadata (induction notes, cohort) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record last updated timestamp |

### 9.4 Database-Enforced Integrity Rules
1. **One Active Membership Rule**:
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_membership_per_user
     ON public.memberships(user_id)
     WHERE (status = 'active');
   ```
   Ensures no student can ever have multiple concurrent active memberships.
2. **Immutable Security Fields Trigger**:
   ```sql
   CREATE OR REPLACE FUNCTION protect_membership_security_fields()
   RETURNS TRIGGER AS $$
   BEGIN
     IF (OLD.user_id <> NEW.user_id) THEN
       RAISE EXCEPTION 'Membership user_id is immutable';
     END IF;
     IF (OLD.application_id <> NEW.application_id) THEN
       RAISE EXCEPTION 'Membership application_id is immutable';
     END IF;
     IF (OLD.member_number <> NEW.member_number) THEN
       RAISE EXCEPTION 'Membership member_number is immutable and cannot be changed';
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER trg_protect_membership_security_fields
     BEFORE UPDATE ON public.memberships
     FOR EACH ROW
     EXECUTE FUNCTION protect_membership_security_fields();
   ```

### 9.5 Row-Level Security for Memberships
- **Self-Inspection**: Active members can view their own membership:
  `user_id = auth.uid()` (SELECT)
- **Administrative Access**: Administrators can view and manage all memberships:
  `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')` (ALL)
- **Mutation Guard**: Direct client `INSERT`, `UPDATE`, `DELETE` are disallowed for regular members.

---

## 10. Milestone 6 Events & Activities Schema

### 10.1 Enums
```sql
CREATE TYPE event_category AS ENUM (
  'workshop',
  'hackathon',
  'tech_talk',
  'webinar',
  'competition',
  'meetup',
  'bootcamp',
  'other'
);

CREATE TYPE event_status AS ENUM (
  'draft',
  'published',
  'ongoing',
  'completed',
  'cancelled'
);

CREATE TYPE event_mode AS ENUM (
  'physical',
  'online',
  'hybrid'
);

CREATE TYPE event_eligibility AS ENUM (
  'public',
  'members_only',
  'admin_only'
);

CREATE TYPE registration_status AS ENUM (
  'registered',
  'cancelled',
  'attended',
  'no_show'
);
```

### 10.2 Table: `public.events`
Authoritative master store for all club gatherings, hackathons, and technical bootcamps.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique event ID |
| `title` | `TEXT` | `NOT NULL, CHECK (char_length(trim(title)) >= 3 AND char_length(title) <= 255)` | Event title |
| `slug` | `TEXT` | `NOT NULL UNIQUE` | URL-safe slug |
| `short_description`| `TEXT` | `NOT NULL, CHECK (char_length(trim(short_description)) >= 5 AND char_length(short_description) <= 300)` | Card summary |
| `description` | `TEXT` | `NOT NULL, CHECK (char_length(trim(description)) >= 10)` | Markdown long description |
| `category` | `event_category` | `NOT NULL DEFAULT 'workshop'` | Category classification |
| `event_mode` | `event_mode` | `NOT NULL DEFAULT 'physical'` | Physical, online, or hybrid |
| `location` | `TEXT` | `NULLABLE` | Physical venue or hall |
| `is_online` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Flag for online availability |
| `meeting_url` | `TEXT` | `NULLABLE` | Private URL (unlocked only upon verified registration) |
| `cover_image_url` | `TEXT` | `NULLABLE` | Optional event banner image URL |
| `start_at` | `TIMESTAMPTZ` | `NOT NULL` | Event start time |
| `end_at` | `TIMESTAMPTZ` | `NOT NULL` | Event conclusion time |
| `registration_open_at` | `TIMESTAMPTZ` | `NOT NULL` | Opening of the registration window |
| `registration_close_at`| `TIMESTAMPTZ` | `NOT NULL` | Closing of the registration window |
| `capacity` | `INTEGER` | `NULLABLE, CHECK (capacity IS NULL OR capacity > 0)` | Maximum attendee seat limit |
| `eligibility` | `event_eligibility` | `NOT NULL DEFAULT 'members_only'` | Eligibility restriction |
| `status` | `event_status` | `NOT NULL DEFAULT 'draft'` | Current lifecycle state |
| `speaker` | `TEXT` | `NULLABLE` | Speaker name or affiliation |
| `organizer` | `TEXT` | `NULLABLE` | Organizing club division |
| `requirements` | `TEXT` | `NULLABLE` | Prerequisites / hardware requirements |
| `tags` | `TEXT[]` | `NOT NULL DEFAULT '{}'` | Taxonomy and indexing tags |
| `created_by` | `UUID` | `NULLABLE REFERENCES public.profiles(id) ON DELETE SET NULL` | Author admin ID |
| `published_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp when published |
| `cancelled_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp when cancelled |
| `cancellation_reason` | `TEXT` | `NULLABLE` | Mandatory explanation for cancellation |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record last updated timestamp |

#### Temporal Constraints
```sql
CONSTRAINT chk_event_end_after_start
  CHECK (end_at > start_at),
CONSTRAINT chk_event_reg_close_after_open
  CHECK (registration_close_at > registration_open_at),
CONSTRAINT chk_event_reg_close_before_start
  CHECK (registration_close_at <= start_at)
```

### 10.3 Table: `public.event_registrations`
Authoritative join model linking verified members with event seat allocations.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique registration ID |
| `event_id` | `UUID` | `NOT NULL REFERENCES public.events(id) ON DELETE CASCADE` | Registered event reference |
| `user_id` | `UUID` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` | Registered member profile reference |
| `status` | `registration_status`| `NOT NULL DEFAULT 'registered'` | Current registration status |
| `registered_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Timestamp of seat reservation |
| `cancelled_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp of cancellation if cancelled |
| `metadata` | `JSONB` | `NOT NULL DEFAULT '{}'::jsonb` | Extensible audit & check-in data |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Record last updated timestamp |

#### Partial Unique Index
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_registration_per_event_user
  ON public.event_registrations(event_id, user_id)
  WHERE (status = 'registered');
```
*Guarantees a member can hold at most ONE active registration at a time for any given event, while permitting audit retention of previously cancelled reservations and subsequent re-registrations.*

### 10.4 Concurrency & Capacity Invariant
Seat capacity enforcement is strictly server-authoritative. When registering, transactions check:
1. Event exists and is in `published` or `ongoing` status.
2. Registration window is active (`NOW() >= registration_open_at AND NOW() <= registration_close_at AND NOW() < start_at`).
3. Active registrations count `< capacity` (if capacity is non-null).
4. Cancellation releases the seat immediately for waiting members.

### 10.5 Row-Level Security Policies
1. **`public.events`**:
   - `SELECT`: Anyone authenticated can read `published`, `ongoing`, or `completed` events (`status IN ('published', 'ongoing', 'completed')`).
   - `ALL`: Admins have full access to drafts and can mutate records (`EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')`).
2. **`public.event_registrations`**:
   - `SELECT`: Members can read their own registrations (`user_id = auth.uid()`).
   - `INSERT`: Active members can register for published events (`user_id = auth.uid()`).
   - `UPDATE`: Members can cancel their own active registrations (`user_id = auth.uid()`).
   - `ALL`: Admins have full access to inspect rosters and update attendance statuses.

---

## 11. Milestone 7: Courses & Learning Management Platform

### 11.1 Enums
```sql
CREATE TYPE public.course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.course_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.lesson_content_type AS ENUM ('text', 'video', 'document', 'external_resource');
CREATE TYPE public.enrollment_status AS ENUM ('active', 'completed', 'cancelled');
```

### 11.2 Table: `public.course_categories`
Taxonomy categorization for curriculum streams (e.g. Generative AI, Machine Learning Systems, Deep Learning, AI Ethics).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique category ID |
| `name` | `TEXT` | `NOT NULL UNIQUE` | Category display title |
| `slug` | `TEXT` | `NOT NULL UNIQUE` | URL-safe slug identifier |
| `description` | `TEXT` | `NULLABLE` | Short overview of the domain |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

### 11.3 Table: `public.courses`
Top-level syllabus entities defining structured technical curriculum paths.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique course ID |
| `title` | `TEXT` | `NOT NULL` | Course title |
| `slug` | `TEXT` | `NOT NULL UNIQUE` | URL-safe slug |
| `short_description` | `TEXT` | `NOT NULL` | Summary for catalog cards |
| `description` | `TEXT` | `NOT NULL` | Comprehensive curriculum overview |
| `thumbnail_url` | `TEXT` | `NULLABLE` | Visual card thumbnail |
| `category_id` | `UUID` | `NOT NULL REFERENCES public.course_categories(id) ON DELETE RESTRICT` | Domain classification |
| `difficulty` | `course_difficulty` | `NOT NULL DEFAULT 'intermediate'` | Difficulty level |
| `estimated_duration` | `INTEGER` | `NOT NULL DEFAULT 60, CHECK (estimated_duration > 0)` | Duration in minutes |
| `status` | `course_status` | `NOT NULL DEFAULT 'draft'` | Publication lifecycle |
| `created_by` | `UUID` | `NULLABLE REFERENCES public.profiles(id) ON DELETE SET NULL` | Author admin profile |
| `published_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp when published |
| `archived_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp when archived |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

### 11.4 Table: `public.course_modules`
Curriculum subdivisions grouping related lessons in explicit order.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique module ID |
| `course_id` | `UUID` | `NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE` | Parent course |
| `title` | `TEXT` | `NOT NULL` | Module title |
| `description` | `TEXT` | `NULLABLE` | Module learning objectives |
| `position` | `INTEGER` | `NOT NULL DEFAULT 0, CHECK (position >= 0)` | Explicit sequence index |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

### 11.5 Table: `public.course_lessons`
Atomic learning units containing technical instructional materials.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique lesson ID |
| `module_id` | `UUID` | `NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE` | Parent module |
| `title` | `TEXT` | `NOT NULL` | Lesson title |
| `slug` | `TEXT` | `NOT NULL` | Module-scoped slug |
| `description` | `TEXT` | `NULLABLE` | Lesson summary |
| `content` | `TEXT` | `NOT NULL DEFAULT ''` | Markdown instructional content |
| `content_type` | `lesson_content_type` | `NOT NULL DEFAULT 'text'` | Media type |
| `video_url` | `TEXT` | `NULLABLE` | Video embed URL |
| `duration` | `INTEGER` | `NOT NULL DEFAULT 15, CHECK (duration > 0)` | Expected duration (mins) |
| `position` | `INTEGER` | `NOT NULL DEFAULT 0, CHECK (position >= 0)` | Sequence position |
| `is_preview` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Free preview unlock flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

### 11.6 Table: `public.course_enrollments`
Authoritative enrollment records linking active members to courses.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique enrollment ID |
| `course_id` | `UUID` | `NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE` | Enrolled course |
| `user_id` | `UUID` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` | Enrolled member |
| `status` | `enrollment_status` | `NOT NULL DEFAULT 'active'` | active / completed / cancelled |
| `enrolled_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Initial enrollment timestamp |
| `completed_at` | `TIMESTAMPTZ` | `NULLABLE` | Course completion timestamp |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

#### Unique Constraint
```sql
CONSTRAINT uq_course_user_enrollment UNIQUE (course_id, user_id)
```

### 11.7 Table: `public.lesson_progress`
Granular lesson completion telemetry per enrollment.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique progress ID |
| `enrollment_id` | `UUID` | `NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE` | Parent enrollment |
| `lesson_id` | `UUID` | `NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE` | Completed lesson |
| `completed` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Completion flag |
| `completed_at` | `TIMESTAMPTZ` | `NULLABLE` | Completion timestamp |
| `last_accessed_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last access timestamp |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

#### Unique Constraint
```sql
CONSTRAINT uq_enrollment_lesson_progress UNIQUE (enrollment_id, lesson_id)
```

### 11.8 Row-Level Security Policies
1. **`course_categories` & `courses`**:
   - `SELECT`: Published and archived courses visible to authenticated members. Admins can view all (including drafts).
   - `INSERT / UPDATE / DELETE`: Admins only.
2. **`course_modules` & `course_lessons`**:
   - `SELECT`: Published course contents readable by authenticated members.
   - `ALL`: Admins only.
3. **`course_enrollments`**:
   - `SELECT`: Members can view their own enrollments (`user_id = auth.uid()`). Admins can inspect all.
   - `INSERT`: Active members can enroll (`user_id = auth.uid()`).
   - `UPDATE`: System and members can update enrollment state.
4. **`lesson_progress`**:
   - `SELECT`: Members can view their own progress through enrollment ownership. Admins can inspect all.
   - `INSERT / UPDATE`: Members can record progress for their active enrollments.

---

## 12. Milestone 8 Schema (Projects, Achievements & Community Showcase)

Established in migration `20261006000008_projects_achievements_m8.sql`.

### 12.1 Enums
- `project_status`: `'draft' | 'published' | 'archived' | 'hidden'`
- `project_visibility`: `'public' | 'members_only'`
- `project_link_type`: `'github' | 'demo' | 'docs' | 'paper' | 'dataset' | 'video' | 'other'`
- `project_media_type`: `'image' | 'video' | 'document'`
- `achievement_status`: `'published' | 'hidden' | 'archived'`
- `report_target_type`: `'project' | 'achievement'`
- `report_reason`: `'inappropriate' | 'spam' | 'copyright' | 'misleading' | 'abuse' | 'other'`
- `report_status`: `'open' | 'under_review' | 'resolved' | 'dismissed'`

### 12.2 Table: `public.project_categories`
Classification taxonomy for projects (AI/ML, Web Systems, Robotics, etc.).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Category ID |
| `name` | `TEXT` | `NOT NULL UNIQUE` | Category display title |
| `slug` | `TEXT` | `NOT NULL UNIQUE` | URL-safe slug |
| `description` | `TEXT` | `NULLABLE` | Description of domain |
| `icon` | `TEXT` | `NULLABLE` | Visual icon identifier |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

### 12.3 Table: `public.technologies`
Curated index of programming languages, libraries, and infrastructure tools.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Technology ID |
| `name` | `TEXT` | `NOT NULL UNIQUE` | Tech name |
| `slug` | `TEXT` | `NOT NULL UNIQUE` | URL-safe slug |
| `category` | `TEXT` | `NOT NULL DEFAULT 'other'` | Language, framework, tool |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |

### 12.4 Table: `public.projects`
Core repository record representing student innovations, architectures, and prototypes.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique project ID |
| `owner_id` | `UUID` | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | Creator/Owner identity |
| `title` | `TEXT` | `NOT NULL` | Project title |
| `slug` | `TEXT` | `NOT NULL UNIQUE` | Collision-resistant URL slug |
| `short_description` | `TEXT` | `NOT NULL` | Teaser description |
| `description` | `TEXT` | `NOT NULL` | Full architectural overview |
| `category_id` | `UUID` | `NOT NULL REFERENCES public.project_categories(id) ON DELETE RESTRICT` | Domain category |
| `status` | `project_status` | `NOT NULL DEFAULT 'draft'` | draft / published / archived / hidden |
| `visibility` | `project_visibility` | `NOT NULL DEFAULT 'public'` | public / members_only |
| `cover_image_url` | `TEXT` | `NULLABLE` | Header banner image |
| `published_at` | `TIMESTAMPTZ` | `NULLABLE` | Publish timestamp |
| `archived_at` | `TIMESTAMPTZ` | `NULLABLE` | Archive timestamp |
| `hidden_at` | `TIMESTAMPTZ` | `NULLABLE` | Moderation hide timestamp |
| `hidden_reason` | `TEXT` | `NULLABLE` | Moderation hide rationale |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

### 12.5 Relational Mappings & Sub-tables
- **`public.project_technologies`**: Many-to-many junction (`project_id`, `technology_id`) with `UNIQUE(project_id, technology_id)`.
- **`public.project_contributors`**: Project team roster (`project_id`, `user_id`, `role`) with `UNIQUE(project_id, user_id)`.
- **`public.project_links`**: External repository and demo URLs (`project_id`, `label`, `url`, `link_type`, `position`) with `CHECK (url ~* '^https?://')`.
- **`public.project_media`**: Screenshots and diagrams (`project_id`, `media_url`, `media_type`, `alt_text`, `position`).

### 12.6 Table: `public.achievements`
Verified credentials, hackathon awards, and research milestones claimed by active members.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique achievement ID |
| `user_id` | `UUID` | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | Member identity |
| `category_id` | `UUID` | `NOT NULL REFERENCES public.achievement_categories(id) ON DELETE RESTRICT` | Category |
| `title` | `TEXT` | `NOT NULL` | Award/credential title |
| `description` | `TEXT` | `NOT NULL` | Summary of achievement |
| `issuer` | `TEXT` | `NOT NULL` | Issuing organization |
| `issued_at` | `DATE` | `NOT NULL DEFAULT CURRENT_DATE` | Date achieved |
| `credential_url` | `TEXT` | `NULLABLE` | Verification hyperlink |
| `credential_id` | `TEXT` | `NULLABLE` | Serial/Credential ID |
| `status` | `achievement_status` | `NOT NULL DEFAULT 'published'` | published / hidden / archived |
| `hidden_at` | `TIMESTAMPTZ` | `NULLABLE` | Moderation timestamp |
| `hidden_reason` | `TEXT` | `NULLABLE` | Moderation rationale |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

### 12.7 Table: `public.featured_projects`
Curated showcase spotlights managed by club administrators.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Feature entry ID |
| `project_id` | `UUID` | `NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE` | Featured project |
| `position` | `INTEGER` | `NOT NULL DEFAULT 1` | Display order rank |
| `featured_from` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Feature start date |
| `featured_until` | `TIMESTAMPTZ` | `NULLABLE` | Optional feature expiration |
| `created_by` | `UUID` | `NULLABLE REFERENCES auth.users(id)` | Admin actor |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Timestamp |

### 12.8 Table: `public.reports`
Community misconduct and copyright claim reports.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Report ticket ID |
| `reporter_id` | `UUID` | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | Reporter identity |
| `target_type` | `report_target_type` | `NOT NULL` | project / achievement |
| `target_id` | `TEXT` | `NOT NULL` | Target entity identifier |
| `reason` | `report_reason` | `NOT NULL` | Violation categorization |
| `description` | `TEXT` | `NOT NULL` | Reporter explanation |
| `status` | `report_status` | `NOT NULL DEFAULT 'open'` | open / under_review / resolved / dismissed |
| `resolved_at` | `TIMESTAMPTZ` | `NULLABLE` | Resolution timestamp |
| `resolved_by` | `UUID` | `NULLABLE REFERENCES auth.users(id)` | Resolving admin actor |
| `admin_notes` | `TEXT` | `NULLABLE` | Resolution rationale |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Filing timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

#### Spam-Prevention Partial Index
```sql
CREATE UNIQUE INDEX idx_one_open_report_per_target_user 
ON public.reports(reporter_id, target_type, target_id) 
WHERE (status IN ('open', 'under_review'));
```

### 12.9 Row-Level Security Policies
1. **Public Discovery (`projects`, `project_technologies`, `project_links`, `project_media`)**:
   - `SELECT`: Published projects with `visibility = 'public'` visible to all. Active members can additionally inspect `visibility = 'members_only'`. Owners and contributors can inspect their own projects. Admins can inspect all.
2. **Project Authoring & Mutation**:
   - `INSERT`: Strictly active members (`public.is_active_member() = true`).
   - `UPDATE / DELETE`: Owner of the project (`owner_id = auth.uid()`) or admin.
3. **Contributors & Links**:
   - `INSERT / UPDATE / DELETE`: Project owner or admin.
4. **Achievements**:
   - `SELECT`: Published achievements visible to all. Owners and admins can view hidden/archived items.
   - `INSERT`: Active members only.
   - `UPDATE / DELETE`: Owner or admin.
5. **Reports**:
   - `INSERT`: Authenticated users.
   - `SELECT`: Reporter can view own filed reports. Admins can view all reports.
   - `UPDATE`: Admins only.




