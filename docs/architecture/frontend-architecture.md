# AI CLUB — Frontend Architecture

## 1. Structure Overview

The frontend is built using **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**. It follows a feature-oriented, component-driven modular structure designed to scale cleanly across the 10 platform milestones.

```
frontend/
├── public/                # Static public assets (favicons, manifest)
└── src/
    ├── assets/            # Brand SVGs, imagery, illustrations
    ├── components/
    │   ├── ui/            # Pure primitive design tokens (Button, Card, Input, Modal, Badge, Spinner, Skeleton, EmptyState)
    │   ├── layout/        # Macro layouts (Navbar, Footer, PublicLayout, ApplicantLayout, MemberLayout, AdminLayout)
    │   └── shared/        # Cross-cutting UI components (ErrorBoundary, MilestonePlaceholder)
    ├── features/          # Domain feature slices (auth, profile, applications, assessment, courses, events, projects, etc.)
    ├── pages/             # Page route endpoints organized by portal (public, applicant, member, admin)
    ├── routes/            # Route table definitions, lazy routing, and RouteGuard
    ├── hooks/             # Custom reusable React hooks
    ├── lib/               # Foundational abstractions (design tokens, env, supabase client)
    ├── services/          # API client and backend HTTP service wrappers
    ├── types/             # TypeScript interfaces and contracts
    ├── utils/             # Helper utilities (cn, formatting)
    ├── App.tsx            # Root component with providers
    └── main.tsx           # React DOM bootstrapping
```

---

## 2. Design System & Tokens

The design direction is **warm, editorial, minimal, and high-contrast**:
- **Background / Canvas**: Warm ivory (`#FAF9F5`, `#F4F3ED`).
- **Surfaces**: Crisp white surfaces (`#FFFFFF`) with subtle neutral borders (`#E8E6DF`) and soft, non-intrusive shadows.
- **Buttons**: High-contrast, primarily deep black (`#141413`) with full pill curvature (`rounded-pill`).
- **Accents**: Restrained emerald/green, muted lavender, and warm soft orange.
- **Typography**: Clean, readable sans-serif hierarchy with editorial heading proportions.
- **Tokens**: Centralized in `src/lib/tokens.ts` and mapped directly into `tailwind.config.ts`.

---

## 3. Layout Architecture

Layouts provide persistent framing and semantic grouping for the four primary user experiences:

1. **`PublicLayout`**: Top sticky header with brand identity and primary links, central viewport slot (`<Outlet />`), and editorial footer.
2. **`ApplicantLayout`**: Focused admissions navigation header with progress indicators and structured container.
3. **`MemberLayout`**: Full responsive sidebar with member navigation (Dashboard, Courses, Events, Projects, Community, Achievements, AI), top utility bar, and workspace container.
4. **`AdminLayout`**: Privileged administration sidebar with oversight modules (Applications, Members, Events, Courses, Analytics, Audit Logs).

---

## 4. Routing & Protection Strategy

- **Routing Engine**: React Router DOM (`v6`).
- **`RouteGuard`**: Evaluates authentication and role states. Prevents unauthorized rendering of protected routes and handles redirects.
- **Lazy Loading**: Route pages can be loaded on-demand using React `Suspense` and `React.lazy` to keep initial bundle sizes low.
- **Fallback**: Global 404 route redirect and `ErrorBoundary` catches unexpected UI exceptions gracefully.

---

## 5. API Client Abstraction

- `src/services/apiClient.ts` provides a typed abstraction over the native browser `fetch` API.
- Automatically retrieves and binds the Supabase user JWT bearer token to the `Authorization` header.
- Unifies response parsing into standard `{ success: true, data: T }` or `{ success: false, error: ApiError }` format.

---

## 6. Authentication State & Identity Architecture (Milestone 2)

- **Centralized Store**: Implemented via `AuthProvider` and `useAuth()` in `src/features/auth/AuthContext.tsx`.
- **State Properties**: Exposes `user`, `session`, `profile`, `isAuthenticated`, `isLoading`, and action methods (`signIn`, `signUp`, `signOut`, `resetPassword`, `updatePassword`, `refreshProfile`, `updateProfile`).
- **Reactive Subscription**: Subscribes to `supabase.auth.onAuthStateChange` to synchronize state automatically across tab focus, token expiration, sign-in, and sign-out.
- **Race Condition Prevention**: Holds `isLoading = true` until initial session check and linked profile fetch complete, preventing flashing of protected views.
- **Error Sanitization**: Formats provider responses via `mapAuthError()`, insulating users from raw infrastructure errors.
