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


