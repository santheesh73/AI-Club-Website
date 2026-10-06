# AI CLUB — System Architecture

## 1. High-Level Overview

AI CLUB is a production-grade full-stack web platform designed as an elite artificial intelligence innovation community. The platform follows a decoupled, multi-tier architectural topology where responsibilities are strictly separated between presentation, business logic, authoritative data persistence, and future intelligent services.

```
                    AI CLUB PLATFORM
                           │
          ┌────────────────┴────────────────┐
          │                                 │
   FRONTEND CLIENT                    ADMIN CONSOLE
   (React + Vite + TS)              (React + Vite + TS)
          │                                 │
          └────────────────┬────────────────┘
                           │ HTTPS / JSON REST API
                           ▼
                 API & SERVICE LAYER
                           │
                           ▼
                    BACKEND SERVICE
               (Node.js + Express + TS)
                           │
              ┌────────────┴────────────┐
              │                         │
      BUSINESS LOGIC               AI SERVICES
      & AUTHORIZATION            (Guidance & Recs)
              │
              ▼ (Service-Role / Privileged)
         SUPABASE / POSTGRESQL
              │
       ┌──────┴───────┐
       │              │
   PostgreSQL       Storage
       │ (Tables & Buckets)
      RLS
       │
       ▼
   AUTHORITATIVE PERSISTENCE
```

---

## 2. Core Architectural Tiers

### 2.1 Frontend Client
- **Technology**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **Role**: Presentation, user interaction, client-side routing, and responsive state rendering.
- **Trust Boundary**: The browser client is an untrusted environment. It never executes business validation as an authoritative check and never stores service-role credentials.

### 2.2 Backend API Service
- **Technology**: Node.js, Express, TypeScript, Zod, Helmet.
- **Role**: Server-side business logic execution, identity and role verification, API rate-limiting, audit logging, request validation, and authoritative interaction with the database.
- **Trust Boundary**: Semi-trusted application server operating behind firewall / reverse proxy. Communicates authoritatively with PostgreSQL/Supabase.

### 2.3 Database & Storage (Authoritative Source of Truth)
- **Technology**: PostgreSQL (managed via Supabase).
- **Role**: Authoritative data storage, relational integrity, row-level security (RLS), ACID transactions, and binary storage.
- **Rule**: PostgreSQL is always authoritative. If client-side state disagrees with PostgreSQL, PostgreSQL prevails.

### 2.4 Future AI Integration Boundary
- **Role**: Architectural isolation for LLM and agentic workloads (course recommendations, portfolio reviews, AI assistance).
- **Isolation**: AI services interact via backend orchestration modules (`/api/v1/ai`), preventing direct untrusted client prompt injection or unmonitored model calls.

---

## 3. Data Flow & Security Boundaries

```
[Browser Client] 
   │
   ├── 1. Auth via Supabase Auth SDK (Anon key, Public Session)
   │      └── Obtains JWT Bearer Token
   │
   └── 2. API Request: Authorization: Bearer <JWT>
          │
          ▼
   [Express Backend]
          │
          ├── Verify JWT & Extract Role Authoritatively
          ├── Validate Request Payload (Zod)
          ├── Execute Business Invariants
          │
          ▼ (Authoritative Service Connection)
   [PostgreSQL Database]
          ├── Row-Level Security (RLS) Evaluation
          └── Foreign Key / Unique / Domain Constraint Checks
```

---

## 4. Key Architectural Guarantees

1. **Authoritative Backend & Database**: Frontend state is strictly treated as optimistic presentation.
2. **No Secret Leaks**: Only `VITE_` prefixed public configuration is accessible to client bundles.
3. **Reproducible Migrations**: All database schema changes are managed via version-controlled SQL migrations.
4. **Resilient Routing**: Hierarchical routes with layout isolation for Public, Applicant, Member, and Admin surfaces.
5. **Canonical User Identity**: Immutable link between `auth.users.id` and `public.profiles.id`. Normal users cannot modify their authorization role or impersonate other accounts.

---

## 5. Milestone 2 Identity Lifecycle

```
[Register: /register] 
       │
       ▼
[Supabase auth.users created] 
       │
       ▼ (Database Trigger: handle_new_user)
[public.profiles provisioned: role = 'applicant']
       │
       ▼
[Session Restored in AuthProvider]
       │
       ▼
[Protected /profile Route: View & Edit Permitted Fields]
       │
       ▼
[PATCH /api/v1/profile: Validated & Protected against Role Escalation]
```
