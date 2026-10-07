# AI CLUB — Membership Security, Authorization & Integrity Model (Milestone 5)

## 1. Threat Model & Security Objectives

Milestone 5 establishes the transition from an approved applicant into an inducted club member. The primary threats addressed in Milestone 5 include:

1. **Premature or Self-Service Member Induction**: An applicant attempting to activate their own membership or elevate their profile role to `'member'` without administrative induction.
2. **Double Induction / Duplicate Membership**: Concurrently or repeatedly activating membership for the same student, spawning colliding member numbers or multiple active credentials.
3. **Identifier Spoofing or Tampering**: Modifying the assigned member number (`AIC-YYYY-XXXX`) or altering the linked application or user ID.
4. **Non-Member Access to Member Portals**: An applicant or unauthenticated user attempting to access `/member/*` portals or call `/api/v1/membership/*` endpoints.
5. **State Inconsistency**: Disconnecting membership status from PostgreSQL profiles or database records through stale client-side caches or cookies.

---

## 2. Multi-Layer Defense-in-Depth Architecture

```
User Action / API Call
       │
       ▼
[Layer 1: Frontend RouteGuard]
  ├── Evaluates authenticated session and verified profile role
  └── Blocks non-members from /member/* routes (redirects to /applicant or /login)
       │
       ▼
[Layer 2: Backend JWT Authentication]
  ├── Cryptographically validates Supabase Bearer JWT token
  └── Extracts authoritative subject UUID (auth.uid())
       │
       ▼
[Layer 3: Authoritative Database Role Enforcement]
  ├── Verifies user's current role directly against PostgreSQL public.profiles
  ├── requireRole(['member', 'admin']) for /api/v1/membership/*
  └── requireRole(['admin']) for /api/v1/admin/memberships/activate
       │
       ▼
[Layer 4: Transactional Activation Engine & Duplicate Protection]
  ├── Validates target application exists and has status = 'approved' (409 if not)
  ├── Verifies candidate does not already possess an active membership record (409 duplicate guard)
  ├── Draws sequential, collision-free member number from PostgreSQL sequence member_number_seq
  ├── Atomically updates public.profiles.role = 'member'
  └── Commits immutable audit entry MEMBERSHIP_ACTIVATED to public.audit_logs
       │
       ▼
[Layer 5: PostgreSQL Database Constraints & Row Level Security]
  ├── Unique partial index idx_one_active_membership_per_user ON memberships(user_id) WHERE (status = 'active')
  ├── Foreign key ON DELETE RESTRICT on user_id and application_id
  ├── Database trigger trg_protect_membership_security_fields prevents mutation of user_id, application_id, member_number
  └── Row Level Security (RLS) ensures users can ONLY select their own membership record
```

---

## 3. The One Active Membership Rule

A student cannot hold multiple active memberships simultaneously. This rule is enforced across two complementary layers:

1. **Application Layer (Fast Rejection)**:
   The activation service checks `public.memberships` for any existing row where `user_id = target_user_id` and `status = 'active'`. If found, the activation request immediately fails with HTTP `409 Conflict` (`MEMBERSHIP_ALREADY_EXISTS`).
2. **Database Layer (Hardware Concurrency Safety)**:
   A unique partial index guarantees physical database serialization:
   ```sql
   CREATE UNIQUE INDEX idx_one_active_membership_per_user
     ON public.memberships(user_id)
     WHERE (status = 'active');
   ```
   Even if two administrative requests arrive concurrently in exact milliseconds, the database engine guarantees that only one transaction can commit, while the duplicate transaction rolls back with a unique violation.

---

## 4. Immutability of Security Identifiers

Once a membership record is created, its identity anchors must remain immutable:
- `user_id`: Cannot be reassigned to another student.
- `application_id`: Cannot be reassigned to another application.
- `member_number`: Cannot be altered or reassigned.

This is enforced by PostgreSQL trigger `trg_protect_membership_security_fields`:
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
```

---

## 5. Row-Level Security Policies

`public.memberships` has RLS enabled with strict least-privilege policies:

```sql
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- 1. Members can only inspect their own membership record
CREATE POLICY "Users can view own membership"
  ON public.memberships
  FOR SELECT
  USING (user_id = auth.uid());

-- 2. Administrators can inspect all memberships
CREATE POLICY "Admins can view all memberships"
  ON public.memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Only administrators can insert memberships
CREATE POLICY "Admins can insert memberships"
  ON public.memberships
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Only administrators can update memberships
CREATE POLICY "Admins can update memberships"
  ON public.memberships
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 6. Audit Trail Compliance

Every membership activation records an immutable event to `public.audit_logs`:
- `action`: `'MEMBERSHIP_ACTIVATED'`
- `entity_type`: `'MEMBERSHIP'`
- `entity_id`: Membership record ID
- `actor_id`: Administrator UUID who initiated activation
- `metadata`: Contains `applicationId`, `memberNumber`, and optional induction notes
- `created_at`: Authoritative database timestamp

Audit entries cannot be updated or deleted, guaranteeing verifiable chain-of-custody for all club inductions.
