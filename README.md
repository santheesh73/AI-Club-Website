# AI CLUB — Premium AI Innovation Platform

> **Milestone 10 — Production Hardening, Security, Testing, Deployment & Launch Readiness**  
> A production-grade, full-stack community, education, and research ecosystem for artificial intelligence engineers, innovators, and academic scholars.

---

## 1. Executive Overview

**AI CLUB** is an enterprise-grade digital platform engineered for artificial intelligence builders, students, researchers, and campus innovators. The platform unifies the full membership lifecycle:
- **Public Innovation Showcase**: Discover campus initiatives, published research projects, active curriculum, upcoming workshops, and verified member achievements.
- **Applicant Intake & Assessment**: Multi-stage application workflow, candidate academic profiles, and an automated timed 25-MCQ assessment engine.
- **Administrative Control Center**: Cohort application review queues, decision engine (approve/reject/waitlist), content management, member roster governance, system telemetry, and immutable audit logging.
- **Member Workspace & Credentials**: Digital membership card with unique member IDs, interactive courses with syllabus progress tracking, event registration with capacity management, and personal project showcases.
- **Intelligence & Analytics**: AI-powered personalized learning insights powered by Google Gemini, real-time in-app notification dispatch, and comprehensive club analytics.
- **Production Hardened**: Zero-Trust security, PostgreSQL Row Level Security (RLS) on all tables, sliding-window rate limiting, Helmet CSP/HSTS headers, resilient Error Boundaries, and automated health telemetry.

---

## 2. Platform Architecture

```
                                  AI CLUB PLATFORM
                                         │
                  ┌──────────────────────┴──────────────────────┐
                  │                                             │
           FRONTEND CLIENT                               ADMIN PORTAL
       (React 18 + Vite + TS)                       (React 18 + Vite + TS)
                  │                                             │
                  └──────────────────────┬──────────────────────┘
                                         │ HTTPS / JSON REST
                                         ▼
                                API & SERVICE LAYER
                                         │
                                         ▼
                                  BACKEND SERVICE
                             (Node.js + Express + TS)
                                         │
                        ┌────────────────┴────────────────┐
                        │                                 │
                BUSINESS LOGIC                     AI SERVICES
                & AUTHORIZATION               (Google Gemini API)
                        │
                        ▼ (Privileged Service-Role)
                   SUPABASE / POSTGRESQL 15
                        │
                 ┌──────┴───────┐
                 │              │
             PostgreSQL      Storage
                 │          (Avatars &
                RLS       Project Media)
                 │
                 ▼
             AUTHORITATIVE PERSISTENCE
```

### Architectural Guarantees
- **Authoritative Database**: PostgreSQL 15 is the single source of truth. Check constraints, relational foreign keys, and Row-Level Security (RLS) enforce data validity.
- **Zero-Trust Security**: Presentation never dictates authorization. Every backend route verifies identity, role (`applicant`, `member`, `admin`), and membership status.
- **Rate-Limited Resiliency**: In-memory token bucket sliding window shields auth, assessment, AI, and reporting endpoints from abuse.
- **Type Safety**: End-to-end strict TypeScript across frontend and backend, with runtime validation powered by Zod.
- **Zero Secret Leaks**: Client bundles never contain backend service-role credentials.

---

## 3. Technology Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Router v6 |
| **Backend** | Node.js, Express, TypeScript, Zod, Helmet, CORS, Winston Logger |
| **Database & Auth** | Supabase, PostgreSQL 15, Row-Level Security (RLS), Supabase Auth |
| **Object Storage** | Supabase Storage (`avatars`, `project-media` with RLS) |
| **AI Intelligence** | Google Gemini API via official `@google/genai` SDK |
| **Design System** | Warm editorial aesthetic (Ivory canvas `#FAF9F5`, high-contrast pill buttons, soft shadows) |
| **Testing** | Vitest, React Testing Library, Supertest (204 automated tests passing) |
| **Tooling & Ops** | npm workspaces, tsx, ESLint, PM2, Docker, Supabase CLI |

---

## 4. Repository Structure

```
AI-CLUB/
│
├── frontend/                     # React 18 + Vite client application
│   ├── public/                   # Static public assets and favicons
│   └── src/
│       ├── assets/               # Brand illustrations and assets
│       ├── components/           # Component library
│       │   ├── ui/               # Primitives (Button, Card, Input, Modal, Badge, Spinner, Skeleton, EmptyState)
│       │   ├── layout/           # App layouts (PublicLayout, ApplicantLayout, MemberLayout, AdminLayout)
│       │   └── shared/           # Cross-cutting components (ErrorBoundary, RouteGuard)
│       ├── features/             # Domain modules (auth, profile, applications, courses, events, projects, etc.)
│       ├── pages/                # Route targets (public, applicant, member, admin)
│       ├── routes/               # Route declarations and RouteGuard
│       ├── hooks/                # Reusable React hooks
│       ├── lib/                  # Tokens, environment parser, Supabase client
│       ├── services/             # Typed API client
│       ├── types/                # TypeScript interfaces and contracts
│       └── utils/                # Utilities (cn, helpers)
│
├── backend/                      # Authoritative Node.js REST API service
│   ├── src/
│   │   ├── config/               # Environment loading and Zod validation
│   │   ├── middleware/           # Security (Helmet, CORS, RateLimit), Auth, RBAC, Validation, Error Handler
│   │   ├── modules/              # Modular feature domains (auth, profile, applications, events, courses, etc.)
│   │   ├── services/             # Authoritative Supabase client (service-role)
│   │   ├── utils/                # Response formatters, AppError, structured logger
│   │   ├── validators/           # Zod request validators
│   │   └── server.ts             # Express server entry point
│   └── tests/                    # 148 automated unit and integration tests
│
├── database/                     # PostgreSQL schema and Supabase configuration
│   └── supabase/
│       ├── config.toml           # Supabase CLI configuration
│       ├── migrations/           # 10 Version-controlled SQL migration scripts (M1 through M10)
│       └── seed/                 # Development seed data
│
├── docs/                         # Comprehensive engineering documentation
│   ├── architecture/             # System, frontend, and backend architecture specs
│   ├── api/                      # API conventions, endpoints, status codes
│   ├── database/                 # Schema strategy, enums, tables, and RLS policies
│   ├── security/                 # Security model, threat boundaries, and production security audit
│   ├── deployment/               # Production deployment runbook
│   ├── operations/               # Backup, disaster recovery, and incident response
│   └── decisions/                # Architecture Decision Records (ADRs)
│
├── .env.example                  # Template for all environment variables
├── package.json                  # Root monorepo workspace configuration
└── README.md                     # Project blueprint and onboarding guide
```

---

## 5. Developer Onboarding & Local Setup Runbook

Follow these 9 steps to run the complete AI CLUB stack locally.

### Step 1: Prerequisites Check
Ensure your environment meets these version requirements:
- **Node.js**: `v20.x` or higher (LTS recommended)
- **npm**: `v10.x` or higher
- **Git**
- Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) for local database emulation

### Step 2: Clone the Repository
```bash
git clone https://github.com/santheesh73/AI-Club-Website.git
cd AI-Club-Website
```

### Step 3: Install All Workspace Dependencies
Install dependencies across root, frontend, and backend with one command:
```bash
npm install
```

### Step 4: Configure Environment Variables
Copy the template file to set up environment configurations:
```bash
cp .env.example .env
```
Fill in your Supabase credentials:
- `SUPABASE_URL`: Your Supabase project URL (`https://<project-ref>.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY`: Service-role key for backend operations
- `SUPABASE_JWT_SECRET`: JWT secret for token verification
- `VITE_SUPABASE_URL`: Supabase project URL for frontend client
- `VITE_SUPABASE_ANON_KEY`: Public anon key for frontend auth
- `GEMINI_API_KEY`: Google Gemini API key for AI intelligence features

### Step 5: Database Setup & Migrations
Apply all 10 migrations to your Supabase instance:
```bash
# Using Supabase CLI (linked project)
supabase link --project-ref <your-project-ref>
supabase db push

# Or apply manually via Supabase SQL Editor:
# Execute database/supabase/migrations/20261006000001_foundation_schema.sql through 20261006000010_production_hardening_m10.sql in sequence.
```

### Step 6: Seed Development Data
Optionally seed initial development questions and sample records:
```bash
# Execute in Supabase SQL Editor:
database/supabase/seed/seed.sql
```

### Step 7: Run Automated Test Suites
Run the entire test suite across frontend and backend:
```bash
# Run all tests across the monorepo (204 tests)
npm test

# Run frontend tests (56 tests)
npm run test:frontend

# Run backend tests (148 tests)
npm run test:backend
```

### Step 8: Start Development Servers
Run both backend and frontend concurrently:
```bash
# Start backend API (runs on http://localhost:5000)
npm run dev:backend

# Start frontend application (runs on http://localhost:5173)
npm run dev:frontend
```

### Step 9: Verify System Health
Open your browser or run curl to test backend telemetry:
```bash
curl http://localhost:5000/health
```
Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "uptimeSeconds": 42.15,
  "memory": { "heapUsedMB": 38.4, "rssMB": 72.1 },
  "version": "v1"
}
```

---

## 6. Production Build & Deployment

### Compile Both Workspaces
```bash
# Build frontend and backend simultaneously
npm run build
```
- **Frontend Build**: Outputs optimized assets to `frontend/dist/`.
- **Backend Build**: Compiles TypeScript to `backend/dist/`.

For complete production server deployment, Nginx configurations, PM2 process management, and Docker instructions, see [Production Deployment Guide](file:///d:/Projects/AIClub/docs/deployment/production-deployment-guide.md).

For backup policies, point-in-time recovery, and disaster response, see [Backup & Disaster Recovery Runbook](file:///d:/Projects/AIClub/docs/operations/backup-and-disaster-recovery.md).

For full OWASP Top 10 evaluation and Row Level Security audits, see [Production Security Audit](file:///d:/Projects/AIClub/docs/security/production-security-audit.md).

---

## 7. Platform Milestone Roadmap

- [x] **Milestone 1 — Foundation & Architecture**: Monorepo layout, warm editorial design system tokens, routing foundation, modular backend, health telemetry, Supabase schema baseline, and zero-trust security model.
- [x] **Milestone 2 — Identity, Authentication & Profiles**: Supabase Auth integration, centralized AuthContext, session restoration, registration, login, logout, password recovery, protected routes, user profile schema with academic & portfolio attributes, Row-Level Security, backend verification, and anti-privilege escalation triggers.
- [x] **Milestone 3 — Application & 25-MCQ Assessment Engine**: Multi-step club application forms, academic profile enrichment, timed 25-MCQ assessment engine, automated scoring, answer history, and candidate status tracking.
- [x] **Milestone 4 — Admin Control Center & Decision Engine**: Comprehensive administrative dashboard, applicant scoring queue, review modal workflow, decision engine (approve/reject/waitlist), and immutable audit logs.
- [x] **Milestone 5 — Membership Activation & Member Experience**: Approved applicant activation, secure membership records, unique member number generation (`AIC-YYYY-XXXX`), digital credential card, and member workspace.
- [x] **Milestone 6 — Events & Activities Platform**: Full event lifecycle management, category filtering, capacity enforcement, waitlists, RSVP registration, attendance check-ins, and admin rosters.
- [x] **Milestone 7 — Courses & Learning Management Platform**: Comprehensive course catalog, multi-module curriculum, rich lesson viewer, enrollment tracking, lesson completion progress, and certificate readiness.
- [x] **Milestone 8 — Projects, Achievements & Community Showcase**: Cross-disciplinary AI project showcase, team member rosters, media galleries, verifiable member achievements, and admin moderation.
- [x] **Milestone 9 — Notifications, AI Intelligence, Analytics & Engagement**: In-app notifications system, Google Gemini AI learning insights and project recommendations, user activity streak tracking, and platform-wide engagement telemetry.
- [x] **Milestone 10 — Production Hardening, Security, Testing, Deployment & Launch Readiness**: Rate limiting, security headers, storage RLS policies, index optimizations, comprehensive error boundaries, zero-trust verification, automated testing (204 tests passing), disaster recovery runbooks, and launch clearance.

---

## 8. License & Governance

Proprietary platform built for the **AI CLUB** student community and university research initiative. All rights reserved.
