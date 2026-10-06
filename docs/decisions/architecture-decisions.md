# AI CLUB — Architecture Decision Records (ADRs)

## ADR-001: Workspace Monorepo Structure

### Context
AI CLUB requires frontend user interfaces (Public, Applicant, Member, Admin), an authoritative backend service, Supabase/PostgreSQL migrations, and extensive documentation. We needed to choose between multiple detached repositories or a unified workspace monorepo.

### Decision
Adopt a lightweight npm workspace repository containing:
- `frontend/`
- `backend/`
- `database/`
- `docs/`

### Consequences
- **Positive**: Single version-controlled repository, atomic commits, shared CI/CD pipelines, clear dependency isolation.
- **Negative**: Requires discipline to prevent cross-importing backend modules into frontend bundles. Enforced via independent `tsconfig.json` files and separate package manifests.

---

## ADR-002: Authoritative Backend & Database vs Frontend-Driven State

### Context
Modern web apps often put extensive business logic in the client. However, applicant assessments, club admissions, member roles, and course credentials require strict integrity and auditability.

### Decision
Establish PostgreSQL as the single source of authoritative truth and the Node.js backend as the authoritative execution engine.
- Frontend state is strictly presentation state.
- Sensitive state changes (e.g., scoring assessments, changing applicant status, elevating roles) must execute through the backend or database triggers.
- Database enforces Row-Level Security (RLS) on all public tables.

### Consequences
- **Positive**: Immune to client tampering, spoofed roles, or bypass of client validation rules.
- **Negative**: Slightly higher latency for authenticated operations compared to optimistic client-only updates.

---

## ADR-003: Visual Identity & Design System Direction

### Context
Many AI projects adopt generic tropes: dark mode cyberpunk themes, neon glow gradients, or generic SaaS templates. AI CLUB is a prestigious academic and engineering innovation community.

### Decision
Adopt a **warm editorial design aesthetic**:
- Warm ivory / off-white canvas (`#FAF9F5`).
- Crisp white surfaces with subtle neutral borders (`#E8E6DF`) and soft ambient shadows.
- High-contrast typography and deep black pill buttons (`rounded-pill`).
- Restrained, intentional accents (emerald green, muted lavender, warm soft orange).
- No neon glows, no generic 3D robots, no unnecessary glassmorphism.

### Consequences
- **Positive**: Distinctive, timeless, professional brand identity suited for elite developers and researchers.
- **Negative**: Custom components required rather than generic off-the-shelf component libraries.

---

## ADR-004: Type Validation with Zod

### Context
TypeScript types exist only at compile time and disappear at runtime. Runtime boundaries (HTTP requests, environment variables) require schema validation.

### Decision
Standardize on **Zod** across both backend runtime validation and environment configuration parsing.

### Consequences
- **Positive**: Fail-fast environment loading, zero runtime type mismatch errors, automated API validation responses.
- **Negative**: Small dependency footprint (~15kB gzipped).

---

## ADR-005: API Envelope & Error Standardization

### Context
Different developers often design divergent response shapes, leading to fragmented client-side parsing and brittle UI code.

### Decision
All REST endpoints adhere to a standardized response envelope:
- Success: `{ "success": true, "data": T, "meta"?: { ... } }`
- Error: `{ "success": false, "error": { "code": string, "message": string, "details"?: ..., "requestId"?: string } }`

### Consequences
- **Positive**: Predictable frontend consuming patterns, automatic request tracing, and standardized error toasts/banners.
- **Negative**: Requires strict adherence across all backend controller modules.
