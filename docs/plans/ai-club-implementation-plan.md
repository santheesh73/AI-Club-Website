# AI Club implementation plan

Status: implemented locally on 2026-10-08; deployment and staging database verification remain outstanding.

## Outcome and scope

Make the existing site immediately understandable, credible, navigable on phones, and reliable from discovery through signup and RSVP. Preserve the warm ivory palette and current React/Vite, Express, and Supabase architecture.

Confirmed policy: an authenticated account holder may RSVP to an event marked public without passing the membership assessment. Members-only events continue to require active membership. Admin-only events remain private. Club admission retains assessment and administrative review.

Recommended editorial direction: a welcoming student community with clearly stated admission standards. Validate factual copy before publishing it.

## Phase 1: repair contracts and eligibility

Primary files: backend/src/modules/events/events.routes.ts, events.controller.ts, events.service.ts, events.types.ts; backend/src/server.ts; frontend/src/services/eventsApi.ts and frontend/src/types/events.ts; database/supabase/migrations/.

- Add read-only public list and detail endpoints. Return an explicit public DTO containing approved discovery fields, registration dates, and eligibility. Exclude drafts, admin-only events, attendee records, meeting links, and internal metadata. Members-only previews may be public only when intentionally discoverable and clearly labeled.
- Use startAt, endAt, and eligibility consistently. Eliminate the public page's independent startDate/isMemberOnly interface and any casts.
- Add authenticated RSVP/status/cancellation endpoints usable by applicant and member accounts. Enforce eligibility after loading the event: public accepts an account; members_only requires active membership; admin_only requires admin authorization. Preserve existing administrative protections.
- Keep event-state, registration-window, duplicate-registration, ownership, and capacity checks. Make seat allocation atomic and verify concurrent requests cannot exceed capacity. Production registration must not report success if persistence fails.
- Add a forward database migration to align registration policies with public-event eligibility. Registrations already reference auth.users, so a new guest identity model is not inherently necessary. Verify deployed schema before changing constraints.
- Point confirmation notifications to a detail page accessible to public-event attendees, rather than always linking to the member portal.

Acceptance: anonymous visitors can read only approved event information; an applicant can RSVP to a public event but cannot RSVP to a members-only event; unauthorized clients cannot bypass the policy; registration/cancellation persist across refresh.

## Phase 2: connect discovery, authentication, and RSVP

Primary files: frontend/src/pages/public/EventsPage.tsx, RegisterPage.tsx, LoginPage.tsx; frontend/src/routes/index.tsx; frontend/src/features/auth/AuthContext.tsx; shared event components.

- Add /events/:slug with event facts, eligibility, registration availability, and account-specific RSVP state.
- Separate loading, successful empty data, request failure, and invalid data. Handle success:false explicitly, provide retry, and remove fabricated event fallbacks.
- For anonymous public-event visitors, present Sign in to RSVP. Carry a validated internal event destination through login/signup, including any email-verification step. Return to the event for an explicit RSVP action; do not automatically reserve a seat.
- Keep Apply to join as the membership journey. Signup for event attendance must not redirect to assessment. Membership applicants should receive a preparation/next-step screen before choosing to start the timed assessment.
- Provide clear already-registered, full, not-yet-open, closed, cancelled, failed, and successful RSVP states. Allow attendees to view and cancel their own registration without requiring access to member-only layouts.

Acceptance: a new visitor can discover an event, create an account, return to that event, RSVP, refresh, and cancel without taking the membership assessment. Membership admission remains a separate coherent journey.

## Phase 3: repair the first screen and mobile navigation

Primary files: frontend/src/pages/public/LandingPage.tsx; frontend/src/components/layout/Navbar.tsx and Footer.tsx; frontend/src/components/ui/Button.tsx; frontend/src/index.css.

- Replace the 220vh intro with a normal hero. Keep SIET as a supporting institutional identifier. Show the purpose and the two existing actions, Join Club and Explore, immediately. Provide sign-in or contextual portal access in the header.
- Add mobile navigation with About, Learn, Events, and account access. Support keyboard operation, Escape, focus return, and an announced expanded state.
- Use semantic links styled as buttons for navigation rather than nested interactive elements.
- Make reduced-motion behavior static and complete. No invisible controls should receive focus. Resolve undefined tokens, wrapping, focus indicators, and touch targets.
- Remove implementation milestone copy and the unconditional Platform Online status label unless backed by an actual relevant check.

Acceptance: at 360px and 1440px widths, visitors understand the club and reach the primary actions in the first viewport. Navigation works with keyboard alone and at 200% zoom; reduced motion preserves full usability.

## Phase 4: replace prestige claims with evidence

Primary files: public LandingPage, AboutPage, LearnPage, RegisterPage; reuse the existing approved project catalogue where appropriate.

- Organize homepage content as purpose and actions, real projects, Learn/Build/Research activities, a real upcoming event, and how joining works.
- Publish project outcomes, contributors, and working demos or repository links. Use approved photographs and member/mentor facts when available.
- Explain eligibility, assessment duration, preparation, retakes, review timing, time commitment, any costs, and a contact route using verified club policy. Reconcile portfolio review versus administrative-review descriptions.
- Translate curriculum summaries into prerequisites, practical outcomes, realistic duration, and a sample when available.
- Use honest empty states when evidence is unavailable; do not invent club activity, people, testimonials, attendance, or achievements.

Acceptance: every factual claim is supported by club-provided information or an approved record; visitors can explain what they will do, how to join, and whom to contact.

## Phase 5: focus the member workspace and verify release

Primary files: frontend/src/components/layout/MemberLayout.tsx; frontend/src/pages/member/MemberDashboard.tsx; existing frontend and backend tests.

- Group navigation around Dashboard, Learn, Projects, Events, and Community/account needs. Keep application, assessment history, membership card, and analytics accessible in secondary groups.
- Fix My Courses and other destination mismatches; resolve contradictory Soon labels for live routes.
- Emphasize one next useful action on the dashboard instead of presenting every module equally.
- Add meaningful tests for public-field exclusions, role/event-eligibility combinations, registration ownership, date contracts, error versus empty states, auth return intent, duplicates, capacity races, and failed persistence. Update existing membership-only tests to reflect public RSVP policy without weakening private-event expectations.
- Run relevant existing frontend/backend suites and production builds. Inspect desktop/mobile, keyboard, reduced motion, zoom, and real Supabase-backed persistence in one batched visual pass, repair findings together, then confirm once.

Acceptance: both public RSVP and membership admission work end to end; no incorrect routes or sample data are presented as real activity; affected tests and builds pass; private data and admin operations remain protected.

## Delivery order and dependencies

Implement phases 1 and 2 as the first coherent vertical slice. Phase 3 can proceed alongside the backend work; phases 4 and 5 follow with verified content and stable flows. Use reviewable changesets for event access/contracts, authentication/RSVP, public UI, content, and member navigation.

Content dependencies: approved club identity and audience, admission rules, contact details, project evidence, media permission, and confirmed event records. Obtain these before publishing factual copy. Browser inspection was unavailable during analysis, so visual acceptance remains an implementation requirement.

Track successful RSVP, application progression, request failures, and participation. Establish baselines before setting numerical conversion targets; use these outcomes to assess whether the changes work.

## Implementation and verification

The public site now shows purpose and Join Club/Explore immediately, provides accessible mobile navigation, and uses honest project/event loading, empty, and failure states. About and Learn describe practical activities without unsupported prestige claims. The homepage reads published public project records and real event records through the existing APIs.

Public event discovery and `/events/:slug` use a shared validated date/eligibility contract. Applicant accounts can explicitly RSVP, view their own reservation, access an eligible registered attendee meeting link, and cancel without taking the membership assessment. Login/signup preserve a validated event destination, including email verification. Private event fields and administrative events remain excluded from anonymous discovery. Production storage failures return errors; a forward migration provides atomic allocation/cancellation and prevents ordinary clients from bypassing the API.

Membership signup leads to an applicant preparation screen with verified assessment rules and an explicit readiness choice. Member navigation groups daily work separately from account/admission history. The dashboard prioritizes the next lesson, event, or course and corrects My courses destinations. Stored suspended/revoked membership state now denies member access, and synthetic member grants are limited to development. Pages load on demand; the initial JavaScript bundle decreased from approximately 1,942 kB to 776 kB before gzip (354.6 kB to 209.4 kB compressed). Vite still reports its standard warning for the shared entry chunk.

Validation completed after integration:

- Frontend: 19 test files, **124 tests passed**, including the actual protected member event route and slug contract.
- Backend: 16 test files, **277 tests passed**.
- Combined production frontend/backend builds passed; frontend TypeScript checks and `git diff --check` passed. A final review corrected the member event route parameter from `:id` to `:slug`, matching the detail page without changing URLs.
- Chromium checks passed at 1440px and 360px, with reduced motion, public navigation Escape/focus return, member navigation Escape/focus return, 200% homepage CSS zoom, and no document overflow or nested navigation controls on inspected surfaces.
- Browser fixtures exercised public discovery failure/retry, anonymous event return links, applicant explicit RSVP, refresh and cancellation, attendee meeting-link removal, preparation readiness, and the correct next-lesson link. They produced no uncaught browser errors. Screenshots were inspected in two bounded batches. These were isolated browser fixtures, not live database tests.

Release work remaining: apply the forward migration once, deploy matching backend/frontend versions, and verify actual Supabase persistence plus capacity races in staging following [the rollout guide](../deployment/public-events-rollout.md). No live migration or deployment has been performed. Publish approved club/project/event records and contact/policy details when available; the interface currently uses truthful empty states for missing evidence. Establish analytics baselines before setting conversion targets.
