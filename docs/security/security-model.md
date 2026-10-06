# AI CLUB — Security Architecture & Threat Model

## 1. Security Philosophy

Security in AI CLUB is built upon defense-in-depth and zero implicit trust:
1. **The browser is inherently untrusted**: Client-side storage (localStorage, memory), client UI flags, and network calls from the browser can be manipulated by malicious actors.
2. **Authorization is never client-side**: While the frontend controls user experience (hiding/showing buttons, routing to appropriate layouts), the backend API and database RLS enforce hard authorization boundaries.
3. **Least Privilege**: The frontend only receives public anon keys. The backend service-role key is guarded server-side and never bundled in browser output.

---

## 2. Authentication Flow

```
1. Client submits credentials to Supabase Auth.
2. Supabase issues JWT access token + refresh token.
3. Client stores session in secure browser storage (managed by Supabase JS SDK).
4. For all backend API requests:
   Header: Authorization: Bearer <access_token>
5. Backend verifies JWT signature and extracts user ID and role.
6. Database queries from backend or direct PostgREST execute under RLS contexts.
```

---

## 3. Authorization Model

AI CLUB defines three core user roles:

| Role | Permissions & Scope |
|---|---|
| `applicant` | Can create/edit personal application, take assigned MCQ assessment once, view personal status. Cannot view member resources, internal courses, or admin consoles. |
| `member` | Verified club members. Access to member dashboard, learning curriculum, events, projects, community directory, achievements, and AI assistant. |
| `admin` | Full administrative control. Review applicants, manage cohorts, publish curriculum, view analytics, inspect immutable audit logs. |

### Rule Enforcement
- **Backend API**: `requireRole(['member', 'admin'])` middleware rejects unauthorized calls with HTTP 403.
- **Database (PostgreSQL)**: RLS policies inspect `auth.uid()` and user roles directly on the database row level.

---

## 4. Secret & Configuration Boundaries

| Variable Category | Scope | Example | Leak Prevention |
|---|---|---|---|
| Public Client Config | Browser & Frontend | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL` | Safe to bundle in client JS. Prefixed with `VITE_`. |
| Private Server Secrets | Backend Only | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, database passwords | Strictly server-side `.env`. Injected via container/cloud secret manager. |

### Redaction Rules
- The backend structured logger automatically redacts authorization headers, passwords, secrets, cookies, and sensitive tokens.

---

## 5. Network & HTTP Security

- **Secure Headers (Helmet)**:
  - Disables `X-Powered-By`.
  - Sets `X-Content-Type-Options: nosniff`.
  - Sets `X-Frame-Options: SAMEORIGIN` / Frameguard.
  - Strict Content-Security-Policy (CSP) in production.
- **CORS Protection**:
  - Whitelists explicit origin domains (`http://localhost:5173`, `http://localhost:3000`, production domain).
  - Explicitly filters disallowed origins.
- **Request Tracing**:
  - Each request is tagged with an `X-Request-Id` UUID, propagated through response headers and server logs.
- **Input Validation**:
  - All input payloads are validated against strict Zod schemas before reaching business logic controllers.
