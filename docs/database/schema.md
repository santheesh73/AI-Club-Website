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
| `full_name` | `TEXT` | `NOT NULL, DEFAULT ''` | Display and legal name |
| `role` | `user_role` | `NOT NULL, DEFAULT 'applicant'` | System authorization role |
| `avatar_url` | `TEXT` | `NULLABLE` | Profile photo storage URI |
| `bio` | `TEXT` | `NULLABLE` | Short personal/academic summary |
| `github_username` | `TEXT` | `NULLABLE` | Verified GitHub handle |
| `linkedin_url` | `TEXT` | `NULLABLE` | LinkedIn profile URL |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Entity creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Automatically maintained timestamp |

### 4.4 Automated Triggers
- `update_updated_at_column()`: Automatically modifies `updated_at` upon any row update.
- `handle_new_user()`: Automatically provisions a row in `public.profiles` whenever an entity is created in `auth.users`.

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
