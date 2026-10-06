# AI CLUB — Backend Architecture

## 1. Structure Overview

The backend service is structured as a modular, type-safe REST API server using **Node.js**, **Express**, **TypeScript**, and **Zod**.

```
backend/
├── src/
│   ├── config/          # Environment parsing and validation (Zod)
│   ├── middleware/      # Security (Helmet, CORS), Auth, Validation, Request Logger, Error Handler
│   ├── modules/         # Domain-driven feature modules
│   │   ├── health/      # Health check and telemetry endpoints
│   │   ├── auth/        # Authentication callbacks and session verifications
│   │   ├── profile/     # User profile data operations
│   │   ├── applications/# Application lifecycle and submissions
│   │   ├── assessment/  # Assessment questions, submissions, scoring
│   │   ├── membership/  # Membership roster and status management
│   │   ├── events/      # Event creation, RSVPs, attendance
│   │   ├── courses/     # Course syllabus and progress tracking
│   │   ├── projects/    # Team project repositories and approvals
│   │   ├── teams/       # Team formation and member assignment
│   │   ├── achievements/# Achievement definitions and awards
│   │   ├── announcements/# Broadcast notices
│   │   ├── notifications/# Multi-channel notification delivery
│   │   ├── admin/       # Elevated administrative operations
│   │   └── ai/          # Orchestrated LLM guidance and recommendations
│   ├── services/        # External services (Supabase Authoritative Client)
│   ├── utils/           # Shared response builders, structured logger, AppError
│   ├── validators/      # Cross-cutting validation schemas
│   └── server.ts        # Express bootstrapping and route mounting
└── tests/               # Smoke and integration tests (Vitest + Supertest)
```

---

## 2. Request Lifecycle Pipeline

```
Incoming HTTP Request
   │
   ▼
[1. securityHeaders (Helmet)]
   │
   ▼
[2. corsMiddleware (Origin validation)]
   │
   ▼
[3. requestLogger (Request ID injection, duration tracking, JSON log)]
   │
   ▼
[4. URL Parsing & Body Parsing (JSON limit 1MB)]
   │
   ▼
[5. Route Matching (/api/v1/:module)]
   │
   ├── (Optional) validate(schema)  -> Zod payload validation
   ├── (Optional) authenticate      -> Supabase JWT verification
   ├── (Optional) requireRole       -> Role-based access control
   │
   ▼
[6. Controller Execution]
   │
   ├── Success -> sendSuccess(res, data)
   └── Failure -> next(new AppError(...))
   │
   ▼
[7. Centralized errorHandler]
   ├── Maps AppError / ZodError / Native Error
   ├── Injects requestId
   └── Sanitizes stack trace in production
```

---

## 3. Configuration & Validation

Environment variables are validated on startup using Zod in `src/config/env.ts`. If required variables are malformed or missing, the process fails fast with descriptive diagnostics before listening on any port.

---

## 4. Error Handling & Response Contracts

- **Unified envelopes**: All API responses use either `{ success: true, data: ... }` or `{ success: false, error: ... }`.
- **Status Codes**:
  - `200 OK`: Successful retrieval / update
  - `201 Created`: Successful entity creation
  - `400 Bad Request`: Validation failure (Zod details attached)
  - `401 Unauthorized`: Missing or invalid Bearer token
  - `403 Forbidden`: Authenticated user lacks required role
  - `404 Not Found`: Endpoint or resource does not exist
  - `500 Internal Server Error`: Uncaught exceptions (stack redacted in production)

---

## 5. Profile & Identity Endpoints (Milestone 2)

- **Identity Derivation**: `req.user.id` is extracted strictly from the verified Supabase Auth JWT in `authenticate` middleware. No endpoints accept user ID as an input parameter for self operations.
- **Endpoints**:
  - `GET /api/v1/profile`: Returns the authenticated user's profile entity.
  - `PATCH /api/v1/profile`: Updates permitted academic, contact, and bio fields. Enforces `updateProfileSchema.body.strict()`, rejecting payloads that attempt to modify `role`, `id`, or `email`.
