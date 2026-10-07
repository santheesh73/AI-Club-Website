# AI CLUB — Admin Security, Authorization & Audit Model (Milestone 4)

## 1. Threat Model & Security Objectives

The AI CLUB administrative control center controls critical admission decisions. The primary threat vectors addressed in Milestone 4 include:

1. **Privilege Escalation**: An applicant or regular student attempting to access administrative endpoints or spoof admin claims.
2. **Unauthorized State Transition**: Bypassing assessment or exam results to force approval on incomplete or draft applications.
3. **Audit Log Tampering**: Modifying or deleting audit records to conceal administrative actions or decisions.
4. **Arbitrary Rejection**: Disqualifying applicants without providing justifiable rationale.
5. **Accidental Premature Induction**: Granting membership perks or member roles before Milestone 5 induction is formally initiated.

---

## 2. Multi-Layer Defense-in-Depth Architecture

```
User Request
     │
     ▼
[Layer 1: Frontend RouteGuard]
  ├── Evaluates client auth context
  └── Blocks non-admin users from rendering /admin/* (redirects to /applicant/dashboard or /login)
     │
     ▼
[Layer 2: Backend Authentication Middleware]
  ├── Cryptographically verifies Supabase Auth JWT Bearer token
  └── Derives verified user ID
     │
     ▼
[Layer 3: Authoritative Database Role Verification]
  ├── Queries PostgreSQL `public.profiles` for `role`
  └── Enforces `requireRole(['admin'])` -> Rejects non-admins with 403 FORBIDDEN (ADMIN_ROLE_REQUIRED)
     │
     ▼
[Layer 4: State Machine Invariance & Controller Logic]
  ├── Enforces valid application states (e.g. rejects transitions from 'draft')
  ├── Mandates rejection reasons (min 3 chars)
  └── Guarantees idempotency (rejects duplicate approvals)
     │
     ▼
[Layer 5: PostgreSQL Row-Level Security (RLS) & Triggers]
  ├── RLS policies restrict table updates to users with verified admin profiles
  ├── Check constraint `chk_applications_rejection_reason` rejects invalid statuses
  └── Trigger `trg_prevent_audit_log_mutation` guarantees append-only audit trail
```

---

## 3. Strict Milestone Boundary Enforcement

A critical architectural mandate for AI CLUB:

> **Approval in Milestone 4 does NOT grant membership.**

- When an administrator approves an applicant in Milestone 4, the application status transitions to `'approved'` and an immutable audit log is generated.
- The user's role remains `'applicant'` throughout Milestone 4.
- Membership record generation, membership number allocation, and role promotion to `'member'` are **strictly deferred to Milestone 5 (Membership Management & Induction)**.
- Any attempt to create member records or promote roles during Milestone 4 review is architecturally blocked.

---

## 4. State Machine Transition Rules

The application decision engine enforces deterministic, unidirectional lifecycle transitions:

| Current Status | Action | Allowed? | Resulting Status | Notes |
|---|---|---|---|---|
| `draft` | Approve | ❌ Blocked (`409`) | `draft` | Candidate must complete assessment |
| `draft` | Reject | ❌ Blocked (`409`) | `draft` | Candidate must submit application |
| `under_review` | Approve | ✅ Allowed | `approved` | Records reviewer ID & timestamp |
| `under_review` | Waitlist | ✅ Allowed | `waitlisted`| Candidate reserved for future cohort |
| `under_review` | Reject | ✅ Allowed | `rejected`  | Requires non-empty `rejectionReason` |
| `approved` | Approve | ❌ Blocked (`409`) | `approved` | Already reviewed (idempotent protection) |
| `approved` | Reject | ❌ Blocked (`409`) | `approved` | State invariance violation |
| `rejected` | Reject | ❌ Blocked (`409`) | `rejected` | Already reviewed |

---

## 5. Immutable Audit Logging Specification

### 5.1 Storage Architecture
Administrative decisions are logged to `public.audit_logs`:
- `actor_id`: Foreign key referencing the administrator in `public.profiles`.
- `action`: Semantic action constant (`APPLICATION_APPROVED`, `APPLICATION_WAITLISTED`, `APPLICATION_REJECTED`).
- `entity_type`: Target entity domain (`APPLICATION`).
- `entity_id`: Application ID.
- `metadata`: JSON payload containing reviewer notes, score, or rejection reason.
- `created_at`: Server timestamp (`NOW()`).

### 5.2 Anti-Tampering Enforcement
Audit integrity is enforced at the PostgreSQL engine level via an immutable trigger:
```sql
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs entries are immutable and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_log_mutation
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();
```

Even an administrator or privileged user executing a direct `UPDATE` or `DELETE` query in PostgreSQL will have their operation terminated with an exception.

---

## 6. Verification & Automated Test Coverage

The security guarantees are continuously validated across 19 integration tests in `backend/tests/admin.test.ts`:
- **Unauthenticated access**: `GET /api/v1/admin/dashboard/summary` without a Bearer token returns `401 UNAUTHORIZED`.
- **Applicant access rejection**: An authenticated user with role `applicant` calling any administrative endpoint receives `403 FORBIDDEN` (`ADMIN_ROLE_REQUIRED`).
- **Rejection reason mandate**: Rejection requests lacking a reason or having whitespace-only reasons are rejected with `400 REJECTION_REASON_REQUIRED`.
- **Invalid draft approval**: Approval on an application in `draft` state returns `409 INVALID_APPLICATION_STATE`.
- **Repeated approval protection**: Repeated approval on an approved application returns `409 APPLICATION_ALREADY_REVIEWED`.
- **Cross-state corruption prevention**: Rejection of an approved candidate returns `409 INVALID_APPLICATION_STATE`.
