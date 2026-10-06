# AI CLUB — Authentication & Identity Architecture (Milestone 2)

## 1. Executive Summary

Milestone 2 establishes the identity foundation of AI CLUB:
- **Canonical Identity**: The authoritative user identity is anchored to `auth.users.id` issued by Supabase Auth.
- **Identity Hierarchy**:
  ```
                 USER
                  │
          Authentication
                  │
                  ▼
          AUTHENTICATED USER
                  │
          ┌───────┴────────┐
          │                │
       APPLICANT         ADMIN
          │
          ▼
       REVIEWED
          │
          ▼
        MEMBER
  ```
- **Rule of Separation**: Authenticated User $\neq$ Club Member. A newly registered user is granted the default role `applicant`. Membership activation is reserved strictly for Milestone 5.

---

## 2. Authentication Flow

### 2.1 Registration (`/register`)
1. User enters Full Name, Email, Password, and optional department/register number.
2. Client invokes `supabase.auth.signUp()`.
3. Supabase Auth inserts record into `auth.users`.
4. Automated trigger `handle_new_user()` provisions a linked row in `public.profiles` (`id = auth.users.id, role = 'applicant'`).
5. Client redirects user to `/profile`.

### 2.2 Login & Session Restoration (`/login`)
1. User enters Email and Password.
2. Client invokes `supabase.auth.signInWithPassword()`.
3. Supabase issues a cryptographically signed JWT access token and refresh token.
4. `AuthProvider` listens via `supabase.auth.onAuthStateChange` and restores the user session and linked profile record upon initial load or page refresh.
5. Technical errors are sanitized via `mapAuthError()` preventing leaking backend implementation details.

### 2.3 Logout
1. Invokes `supabase.auth.signOut()`.
2. Clears client authentication context, user record, and cached profile.
3. Redirects to `/`.

---

## 3. Profile Security & Anti-Privilege Escalation

### 3.1 Defense in Depth Layers
1. **Frontend Validation (`ProfileEditForm.tsx`)**:
   - `id`, `email`, `role`, and `createdAt` are omitted from the update payload.
   - Client validates name lengths, URLs, and numeric bounds.
2. **Backend API Validation (`backend/src/validators/profile.validator.ts`)**:
   - Strict Zod schema rejects unknown keys.
   - Any payload containing `role`, `id`, `email`, or `user_id` returns HTTP 400 `VALIDATION_ERROR`.
   - The user ID is strictly extracted from `req.user.id` derived from the verified Bearer token.
3. **Database Trigger (`protect_profile_security_fields`)**:
   - Raises PostgreSQL exception `42501` if an update mutates `id` or `email`.
   - Strictly verifies that `role` can only be changed if the caller already possesses `role = 'admin'`.
4. **Row-Level Security (RLS)**:
   - Users can only read (`auth.uid() = id`), insert (`auth.uid() = id`), or update (`auth.uid() = id`) their own profile.

---

## 4. Scenario Verification Matrix

| Scenario | Attack Vector | Mitigation | Test Verification |
|---|---|---|---|
| 1. Cross-profile read | User A queries User B's profile | User ID derived from Bearer token; RLS isolates table rows | `tests/profile.test.ts` passed |
| 2. ID manipulation | User A injects `id: "user-b-id"` in body | Rejected by strict Zod schema; DB trigger raises error | `tests/profile.test.ts` passed |
| 3. Self-promotion | User A sends `role: "admin"` in PATCH | Rejected by Zod schema and PostgreSQL security trigger | `tests/profile.test.ts` passed |
| 4. Unauthenticated read | Guest sends `GET /api/v1/profile` | Auth middleware rejects with 401 UNAUTHORIZED | `tests/profile.test.ts` passed |
| 5. Session refresh | User refreshes browser | Session restored via `supabase.auth.onAuthStateChange` | Verified in Vitest / App test |
| 6. Session expiration | Token expired | Auth middleware rejects; RouteGuard redirects to `/login` | Verified in RouteGuard |
