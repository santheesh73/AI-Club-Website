# AI CLUB — Premium AI Innovation Platform

> **Milestone 1 — Foundation & Architecture**  
> A production-grade, full-stack community and learning ecosystem for artificial intelligence engineers, researchers, and innovators.

---

## 1. Executive Overview

**AI CLUB** is an elite digital platform built for artificial intelligence students, builders, and research teams. The platform manages the entire lifecycle of members:
- **Public Engagement**: Discover community initiatives, curriculum, projects, and events.
- **Applicant Intake**: Multi-stage application workflow, candidate portfolios, and automated 25-question MCQ assessments.
- **Member Workspace**: Personalized dashboard, interactive curriculum, project sprints, team formation, verifiable achievements, and AI learning guidance.
- **Administrative Center**: Cohort admissions review, content management, event organization, member governance, system telemetry, and immutable audit logging.

The system is designed with strict architectural separation between presentation (Frontend), business logic & verification (Backend), authoritative persistence (Supabase / PostgreSQL), and future AI agent workflows.

---

## 2. Platform Architecture

```
                    AI CLUB PLATFORM
                           │
          ┌────────────────┴────────────────┐
          │                                 │
   FRONTEND CLIENT                    ADMIN PORTAL
   (React 18 + Vite + TS)            (React 18 + Vite + TS)
          │                                 │
          └────────────────┬────────────────┘
                           │ HTTPS / JSON REST
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
      & AUTHORIZATION          (Guidance & Insights)
              │
              ▼ (Privileged Service-Role)
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

### Architectural Guarantees
- **Authoritative Database**: PostgreSQL is the single source of truth. Relational constraints and Row-Level Security (RLS) enforce data validity.
- **Separation of Concerns**: The frontend controls user experience; the backend and database enforce authorization.
- **Type Safety**: Strict TypeScript across frontend and backend, with runtime validation powered by Zod.
- **Zero Secret Leaks**: Client bundles never contain backend service-role credentials.

---

## 3. Technology Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Router v6 |
| **Backend** | Node.js, Express, TypeScript, Zod, Helmet, CORS, Structured Logger |
| **Database & Auth** | Supabase, PostgreSQL 15, Row-Level Security (RLS), Supabase Auth |
| **Design System** | Warm editorial aesthetic (Ivory canvas `#FAF9F5`, high-contrast pill buttons, soft shadows) |
| **Testing** | Vitest, Testing Library, Supertest |
| **Tooling** | npm workspaces, tsx, ESLint |

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
│       │   └── shared/           # Cross-cutting components (ErrorBoundary, MilestonePlaceholder)
│       ├── features/             # Domain modules (auth, profile, applications, courses, events, etc.)
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
│   │   ├── middleware/           # Security (Helmet, CORS), Auth, Validation, Request Logger, Error Handler
│   │   ├── modules/              # Modular feature domains (auth, profile, applications, events, etc.)
│   │   ├── services/             # Authoritative Supabase client (service-role)
│   │   ├── utils/                # Response formatters, AppError, structured logger
│   │   ├── validators/           # Zod request validators
│   │   └── server.ts             # Express server entry point
│   └── tests/                    # Integration and smoke tests
│
├── database/                     # PostgreSQL schema and Supabase configuration
│   └── supabase/
│       ├── config.toml           # Supabase CLI configuration
│       ├── migrations/           # Version-controlled SQL migration scripts
│       ├── functions/            # Edge functions
│       └── seed/                 # Development seed data
│
├── docs/                         # Comprehensive engineering documentation
│   ├── architecture/             # System, frontend, and backend architecture specs
│   ├── api/                      # API conventions, envelopes, and status codes
│   ├── database/                 # Schema strategy, enums, tables, and RLS policies
│   ├── security/                 # Security model, threat boundaries, and token handling
│   └── decisions/                # Architecture Decision Records (ADRs)
│
├── .env.example                  # Template for all environment variables
├── .gitignore                    # Comprehensive repository hygiene ignore list
├── README.md                     # Project blueprint and onboarding guide
└── package.json                  # Root monorepo workspace configuration
```

---

## 5. Getting Started & Development Setup

### 5.1 Prerequisites
- **Node.js**: `v20.x` or `v24.x` (LTS recommended)
- **npm**: `v10.x` or `v11.x`
- **Git**
- Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) for local database emulation

### 5.2 Installation
Clone the repository and install all workspace dependencies from the root:

```bash
git clone https://github.com/santheesh73/AI-Club-Website.git
cd AIClub
npm install
```

---

## 6. Environment Configuration

Copy the template file to set up environment configurations:

```bash
cp .env.example .env
```

### Environment Variable Guide

#### Frontend Variables (Exposed to browser via `VITE_` prefix)
```ini
VITE_APP_NAME="AI CLUB"
VITE_APP_ENV="development"
VITE_API_BASE_URL="http://localhost:5000/api/v1"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-public-anon-key"
```

#### Backend Variables (Server-side ONLY, never expose to browser)
```ini
NODE_ENV="development"
PORT=5000
HOST="0.0.0.0"
API_VERSION="v1"
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-backend-service-role-key"
SUPABASE_JWT_SECRET="your-supabase-jwt-secret"
LOG_LEVEL="info"
```

---

## 7. Running the Platform

### Running Both Services Concurrently
From the root directory:
```bash
# Terminal 1: Start Backend API
npm run dev:backend

# Terminal 2: Start Frontend Application
npm run dev:frontend
```

### Local URLs:
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api/v1`
- **Backend Health Check**: `http://localhost:5000/health`

---

## 8. Database Migrations & Supabase Setup

Database migrations reside in `database/supabase/migrations/` and must be applied sequentially.

### Using Local Supabase CLI
```bash
# Start local Postgres, Auth, and Storage emulation
supabase start

# Apply all migrations to local database
supabase db reset
```

### Applying Migrations to Remote Supabase Project
```bash
# Link project
supabase link --project-ref <your-project-ref>

# Push pending migrations
supabase db push
```

---

## 9. Testing & Quality Verification

Run all test suites across frontend and backend:

```bash
# Run all tests across the monorepo
npm run test

# Run frontend unit & component tests
npm run test:frontend

# Run backend API smoke tests
npm run test:backend

# Build both applications for production
npm run build
```

---

## 10. Platform Milestone Roadmap

- [x] **Milestone 1 — Foundation & Architecture**: Monorepo layout, design system tokens, routing foundation, modular backend, health telemetry, Supabase schema baseline, and security model.
- [x] **Milestone 2 — Identity, Authentication & Profiles**: Supabase Auth integration, centralized AuthContext, session restoration, registration, login, logout, password recovery, protected routes, user profile schema with academic & portfolio attributes, Row-Level Security, backend verification, and anti-privilege escalation triggers.
- [ ] **Milestone 3 — Applicant Experience & Intake**: Multi-step club application forms, academic profile enrichment, submission validation, and applicant status tracker.
- [ ] **Milestone 4 — Assessment Engine**: 25-question MCQ timed assessment, automated grading algorithm, percentile calculation, result dashboard.
- [ ] **Milestone 5 — Member Dashboard & Activation**: Member onboarding, verified membership status, sprint boards, and community workspace.
- [ ] **Milestone 6 — Courses & Events**: Interactive curriculum modules, code exercises, event calendar, RSVPs, attendance tracking.
- [ ] **Milestone 7 — Projects & Teams**: Cross-disciplinary AI project teams, sprint boards, repository links, submission reviews.
- [ ] **Milestone 8 — Achievements & Notifications**: Verifiable badges, activity streaks, real-time alerts, multi-channel email dispatch.
- [ ] **Milestone 9 — AI Experience**: Interactive AI learning assistant, automated code explainers, skill-gap analysis, personalized course recommendations.
- [ ] **Milestone 10 — Admin Platform & Governance**: Administrative dashboard, applicant scoring queue, member roster management, event administration, audit logs.

