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

---

## 7. Applicant Portal & Assessment Engine (Milestone 3)

- **Application Hub (`/applicant/dashboard`)**: Displays real-time application timeline, current status pill, and next required steps.
- **25-MCQ Assessment Interface (`/applicant/assessment/:attemptId`)**:
  - Full-screen distraction-free testing environment.
  - Question grid navigator with color-coded answered/unanswered states.
  - Server-synchronized countdown timer with automatic force-submission on expiration.
  - Immediate local selection feedback combined with atomic background autosave.

---

## 8. Admin Control Center & Review Portal (Milestone 4)

- **Admin Layout (`AdminLayout.tsx`)**:
  - Elevated visual identity ("AI CLUB CONTROL") with quick navigation to Overview, Applications, Members (M5 placeholder), Events, Settings, and direct Admin Sign Out.
  - Responsive mobile drawer and desktop fixed sidebar.
- **Admin Dashboard (`AdminDashboard.tsx` - `/admin`)**:
  - High-level metric telemetry: Total Applications, Under Review, Approved, Waitlisted, Rejected.
  - Academic performance indicators: Average 25-MCQ score and entrance pass percentage.
  - Real-time recent applications feed with one-click navigation to candidate review dossiers.
- **Applications Oversight Center (`AdminApplicationsPage.tsx` - `/admin/applications`)**:
  - Instant multi-field search (debounced at 300ms) matching name, email, register number, and application number.
  - Department and status filtering pills.
  - Server-side sorting allowlist (Submission Date, Score, Application #, Name).
  - Responsive layout (tabular view on desktop, detailed card layout on mobile).
  - Clean pagination with page indicators and boundary disabling.
- **Candidate Review Dossier (`AdminApplicationDetailPage.tsx` - `/admin/applications/:id`)**:
  - Student Profile inspection: Contact, department, year, roll number, GitHub/LinkedIn/Portfolio links, skills, interests.
  - Assessment performance breakdown: Score / 25, percentage, pass/fail status, duration, questions answered.
  - Decision action bar:
    - **Approve Candidate**: Launches `ApproveConfirmModal` with optional reviewer notes.
    - **Waitlist Candidate**: Launches `WaitlistConfirmModal` with optional rationale.
    - **Reject Candidate**: Launches `RejectReasonModal` with mandatory reason validation (disabled until $\ge 3$ characters typed).
  - Immutable Audit History Trail: Chronological event timeline displaying decision timestamps, actor IDs, and reviewer comments.

---

## 9. Member Portal & Membership Experience (Milestone 5)

- **Member Layout (`MemberLayout.tsx`)**:
  - Distinctive member branding with persistent Member Number pill and active induction indicator.
  - Primary navigation links: Dashboard, Digital Card, Member Profile, Application History, Assessment Scorecard.
  - Forward-compatible placeholder navigation for future milestones: Courses, Events, Projects, Community, Achievements, AI Assistant.
  - Mobile drawer navigation with responsive collapsing and active route highlighting.

- **Member Workspace Pages (`src/pages/member/`)**:
  - **Member Dashboard (`/member`)**: Editorial greeting banner, induction date, official member ID cardlet, admissions journey progression track (Profile $\rightarrow$ Application $\rightarrow$ Examination $\rightarrow$ Review $\rightarrow$ Active Member), and summary scorecard.
  - **Official Membership Card (`/member/membership`)**: High-contrast, dark editorial card with metallic accenting, active induction beacon, student identity, official member number (`AIC-YYYY-XXXX`), and a browser print action (`window.print()`).
  - **Member Profile (`/member/profile`)**: Integrated student profile editor with disabled/immutable security credential badges (Member Number, Role, Induction Date).
  - **Admissions Record (`/member/application`)**: Read-only historical record of the student's approved application, admission cycle, and committee determination.
  - **Examination Scorecard (`/member/assessment`)**: Transparent breakdown of 25-MCQ entrance examination performance (score, percentage, correct/wrong/unanswered tally, and duration).

- **Route Protection & Guards (`RouteGuard.tsx`)**:
  - Validates that routes under `/member/*` require both an authenticated session and verified member status (`role === 'member' || role === 'admin'`).
  - Non-members are safely redirected to `/applicant` or `/login`.

---

## 10. Events & Activities Experience (Milestone 6)

- **Member Experience**:
  - **Events Catalog (`/member/events` - `MemberEventsPage.tsx`)**:
    - Timeline toggling: `Upcoming Events` vs `Past Activities`.
    - Category filtering chips (`All`, `Workshops`, `Hackathons`, `Tech Talks`, `Bootcamps`, `Webinars`).
    - Real-time event search matching title, description, and keywords.
    - Responsive grid of `EventCard` components detailing date, time, location/online status, speaker, capacity progress, and registration badges.
  - **Event Dossier & Action Page (`/member/events/:slug` - `MemberEventDetailPage.tsx`)**:
    - Detailed event breakdown: Full agenda, prerequisites, equipment requirements, and speaker credentials.
    - Dynamic Capacity Tracker: Visual progress bar displaying registered headcount vs maximum venue capacity.
    - Real-time Registration Action: Instant seat allocation backed by membership validation.
    - Seat Release / Cancellation: Allows members to cancel reservations with immediate seat return to the available pool.
    - Unlocked Online Conference Access: Displays `meetingUrl` video room links exclusively to confirmed attendees.
  - **Member Dashboard Integration (`/member` - `MemberDashboard.tsx`)**:
    - Dedicated "Upcoming Club Activities & Registered Events" module embedded directly into the member home portal.

- **Admin Control Experience**:
  - **Events Oversight Center (`/admin/events` - `AdminEventsPage.tsx`)**:
    - Comprehensive table and card views of club programming across all lifecycles (`draft`, `published`, `ongoing`, `completed`, `cancelled`).
    - Status filtering, search, and direct actions (`Publish`, `Cancel with Reason`, `Edit`, `View Attendees`).
    - Publication Confirmation Modal (`EventPublishModal.tsx`).
    - Cancellation Modal requiring mandatory reason entry (`EventCancelModal.tsx`).
  - **Event Creator Studio (`/admin/events/new` - `AdminEventCreatePage.tsx`)**:
    - Structured editor for schedules, capacity, mode (physical, online, hybrid), venue, meeting links, prerequisites, and taxonomy tags.
    - Client-side pre-validation verifying chronologically valid date ranges before API dispatch.
  - **Event Editor (`/admin/events/:id/edit` - `AdminEventEditPage.tsx`)**:
    - Safe modification of event descriptions, venues, and capacity limits (read-only for completed/cancelled events).
  - **Attendee Roster Management (`/admin/events/:id/registrations` - `AdminEventRegistrationsPage.tsx`)**:
    - Live seat roster detailing member names, student IDs, registration timestamps, and attendance verification status.

---

## 11. Courses & Learning Management Experience (Milestone 7)

- **Member Experience**:
  - **Courses Discovery Catalog (`/member/courses` - `MemberCoursesPage.tsx`)**:
    - Category filtering dropdown (Generative AI, Machine Learning Systems, Deep Learning, AI Ethics).
    - Difficulty level filtering chips (All Levels, Beginner, Intermediate, Advanced).
    - Real-time search query matching course titles and topics.
    - Responsive grid of `CourseCard` components showing estimated durations, module/lesson totals, progress indicators, and status badges.
    - Empty state with filter reset actions.
  - **Course Detail & Syllabus Dossier (`/member/courses/:slug` - `MemberCourseDetailPage.tsx`)**:
    - Course metadata overview, estimated hours, difficulty rating, and comprehensive overview.
    - Interactive syllabus tree with `ModuleAccordion` components detailing each module's lessons, duration, and completion indicators.
    - Free Preview lessons accessible directly to unenrolled members.
    - One-click Enrollment CTA for active members with immediate status updates.
    - "Continue Learning" and "Resume Lesson" triggers resolving to first incomplete lesson.
  - **Personal Learning Hub (`/member/courses/my` - `MemberMyCoursesPage.tsx`)**:
    - Metric summary tiles: Enrolled Courses, In Progress, Completed, Total Lessons Completed.
    - Spotlight "Resume Learning" card directly linking to the last accessed lesson.
    - Tab navigation: All Courses, In Progress, and Completed courses.
  - **Distraction-Free Learning Workspace (`/member/learn/:courseSlug` - `MemberLearningPage.tsx`)**:
    - Streamlined header with course title, back navigation to syllabus, and compact progress bar.
    - Collapsible left curriculum sidebar with active lesson highlights and completion checkboxes.
    - Video player container supporting YouTube embeds and direct video streams.
    - Rich text/markdown technical instructional viewer.
    - Bottom action bar with "Previous Lesson", "Mark as Completed", and "Next Lesson" navigation.
  - **Member Dashboard Integration (`/member` - `MemberDashboard.tsx`)**:
    - Embedded "Learning Academy & Coursework" progression block featuring the resume learning card and real-time completion telemetry.
    - Courses & Labs card promoted to core quick navigation.

- **Admin Experience**:
  - **Curriculum Management Center (`/admin/courses` - `AdminCoursesPage.tsx`)**:
    - Comprehensive table of courses with category, difficulty, module/lesson counts, learner enrollment counts, and lifecycle badges (`draft`, `published`, `archived`).
    - Status and domain filters.
    - Direct actions for Edit, View Learners, Publish, Archive, and Delete.
    - Modals: `CoursePublishModal.tsx` and `CourseArchiveModal.tsx`.
  - **Course Creator Studio (`/admin/courses/new` - `AdminCourseCreatePage.tsx`)**:
    - Structured form for course title, optional custom slug, category, difficulty, duration, short summary, and complete curriculum description.
  - **Curriculum Syllabus & Content Editor (`/admin/courses/:id` - `AdminCourseEditPage.tsx`)**:
    - In-place editing of course metadata.
    - Module management: Add module, edit module, reorder modules (up/down), and safe deletion (enforces non-empty check).
    - Lesson management: Add lesson, edit lesson title/duration/type/videoUrl/content, reorder lessons, toggle free preview, and delete lesson.
  - **Learner Enrollment Roster (`/admin/courses/:id/enrollments` - `AdminCourseEnrollmentsPage.tsx`)**:
    - Real-time roster of enrolled members with member number, department, enrollment status (`active` / `completed`), completed lesson count, progress percentage, and last activity timestamps.




