# AI Club public experience implementation

Implemented on the `frontend` branch on 2026-10-09, with a performance and production-build correction on 2026-10-10. Deployment and staging database verification remain outstanding.

## Delivered

- **A useful first screen.** The homepage states the club's purpose and offers an interactive flower classifier alongside the introductory copy. Visitors can move a decision boundary, compare training and held-out scores, reset it, and open the full lesson. The examples are clearly illustrative, with an intentional counterexample; they are not presented as club research or real biological measurements.
- **Learning before signup.** `/learn/first-model` is a public, self-paced lesson with definitions, an adjustable model, prediction table, explanation of evaluation limits, and a knowledge check. `/learn` starts with that exercise and explains prerequisites for the next learning directions. Active members can search the actual course catalogue by topic; clearing its filters clears the initial search.
- **Joining information before account creation.** `/join` offers public learning, events, and membership as distinct next steps. The guide explains the verified assessment format: 25 questions, 30 minutes, 60% passing score, and one attempt per application. It distinguishes passing, administrative review, and membership activation. Account creation does not start the timer. Public-event RSVP remains separate from membership admission.
- **One real sign-in flow.** Applicants, members, and authorized admins use credentials on the same sign-in screen. Role selectors and automatic demo sign-in were removed. Account holders visiting login/signup return to an appropriate workspace or a validated event destination. Admin navigation uses authorized-admin status rather than trusting the profile role alone. Registration errors identify the affected fields and focus the first invalid input.
- **Honest evidence.** The homepage reads published public projects and upcoming published events through the existing safe APIs. Empty records and request failures are distinct. A public event is preferred when available; a members-only preview explicitly states that active membership is required. Missing projects use a compact explanation linked to the public lesson.
- **Navigation and accessibility.** The header calls the account destination “My workspace,” joining links open the guide, and Learn remains current on the lesson route. Pages have descriptive titles, one primary heading, a keyboard skip link, labelled controls, and appropriate touch targets. Public route changes reset scroll immediately while fragment destinations retain their target. The existing warm ivory visual direction remains.

## Key implementation files

- Homepage: `frontend/src/pages/public/LandingPage.tsx`
- Interactive model: `frontend/src/features/publicLearning/TinyClassifier.tsx`
- Public lesson: `frontend/src/pages/public/StarterLessonPage.tsx`
- Joining page and shared guidance: `frontend/src/pages/public/JoinPage.tsx`, `frontend/src/components/public/MembershipGuide.tsx`
- Auth: `frontend/src/pages/public/LoginPage.tsx`, `frontend/src/pages/public/RegisterPage.tsx`
- Routes and public shell: `frontend/src/routes/index.tsx`, `frontend/src/components/layout/PublicLayout.tsx`
- Member topic search: `frontend/src/pages/member/MemberCoursesPage.tsx`, `frontend/src/features/courses/useCourses.ts`

## Verification

- Final frontend suite: **24 files, 160 tests passed**, including credential sign-in, safe auth returns, membership destinations, classifier behaviour, topic-search destinations, and homepage loading/error/eligibility states.
- Frontend and backend production builds passed. The frontend build also passed after the browser review fixes. The later production-build correction described below reduced the initial entry and removed the chunk-size warning.
- Impeccable deterministic checks on 14 changed interface files reported no findings. This is a markup check, not a claim that every design or accessibility requirement is automatically verified.
- Browser review covered homepage, full lesson, joining guide, Learn, About, login, and registration at desktop or mobile widths. The homepage was confirmed at 1280 px and 390 px; inspected mobile pages had no document overflow. Keyboard adjustment, reset, lesson feedback, mobile navigation, FAQ disclosure, validation focus, and public navigation scroll recovery worked. No browser console errors were observed.
- Review findings were repaired together: desktop hero alignment, the admin guide destination, and retained scroll on public page transitions. Final confirmation used the saved source after a preview reload. No live accounts, RSVPs, or database records were created during verification.

## 2026-10-10 performance and production-build correction

The shared root `.env` sets `NODE_ENV=development` for local backend work. Inspection of the emitted frontend bundle showed that this was also selecting development React and enabling development-only frontend branches in release builds. Vite's production mode and `NODE_ENV` are separate settings; see [the official environment documentation](https://vite.dev/guide/env-and-mode#node-env-and-modes).

The frontend build now uses `scripts/build.mjs` to set `NODE_ENV=production` before Vite reads configuration and environment files. The backend and local dev-server settings are preserved. Applicant, member, and admin layouts now load on demand through the existing guarded routes. Public homepage code remains available immediately.

| Initial entry | Before | After |
| --- | ---: | ---: |
| Emitted JavaScript | approximately 797 kB | 497.93 kB |
| Gzip | approximately 213 kB | 143.50 kB |

This reduces initial JavaScript by approximately 38% and gzip transfer size by approximately 33%. These are emitted bundle measurements, not real-device load-time or Core Web Vitals claims. The final build emitted no chunk-size warning.

Run `npm --workspace=frontend run analyze:bundle` to reproduce the measurement. The command inspects final emitted output, including static shared imports, and fails if development React is present or a private workspace layout enters the initial public bundle. It reports the largest contributing modules for future investigation.

Verification: all 160 frontend tests passed, including the actual protected member-event route; the frontend release build and bundle checks passed. The production preview was inspected at 1280 px and 390 px. Model keyboard interaction, lesson feedback, mobile navigation, empty sign-in validation, and anonymous `/member` redirection to login worked. No console errors were observed. No real credentials, accounts, or registrations were used. The temporary preview and API servers were stopped afterward.

## Remaining content and release work

The interface is implemented, but real club evidence still requires approved material: a project with supporting links and results, permitted club photographs, and a public event when one is actually scheduled. A publishable contact route, eligibility rules, fees, time commitment, and review turnaround were not supplied, so those facts have not been invented. Add verified details to the joining guide when available.

The prior public-RSVP database migration remains unapplied. Apply it once and verify actual persistence and capacity handling in staging before deployment, following [the rollout guide](../deployment/public-events-rollout.md). This pass changes the frontend only and does not establish live database readiness. The previous backend test run passed 277 tests; those tests were not repeated for this frontend-only pass.

After release, establish baselines for lesson starts, guide visits, completed sign-ins, successful eligible RSVPs, and application progression before setting numerical improvement targets.
