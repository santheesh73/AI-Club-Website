---
target: AI Club website
total_score: 14
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 4
target_identity: "file:D:\\Projects\\AIClub\\frontend\\src\\pages\\public\\LandingPage.tsx"
target_fingerprint: "sha256:7f193e3b12687b33a0dda54a92901934c2a162c93fe9ab824663f7872ccde32d"
target_path: "D:\\Projects\\AIClub\\frontend\\src\\pages\\public\\LandingPage.tsx"
timestamp: 2026-10-08T10-22-42Z
slug: src-pages-public-landingpage-tsx
---
Method: dual-agent (A: /root/design_review · B: /root/evidence_review). Source-based; browser inspection failed because the Windows sandbox could not initialize.

**AI CLUB has built a university administration portal and dressed it as a frontier research institute.** There is substantial engineering here, but the public website spends more effort announcing prestige than showing why a student should join.

**The roast, with receipts**

1. **[P1] Your homepage has an entrance exam before the entrance exam.** The 220vh intro opens with giant “SIET” lettering while the actual pitch and buttons start invisible. Pointer access to the buttons is gated by scroll progress. The homepage header also hides account actions. Visitors must earn the privilege of discovering what the club does.
   Fix: show the purpose, Join, and Sign In on the first screen. Keep the institutional animation secondary. Suggested command: impeccable distill.

2. **[P1] “Code Over Claims” is surrounded by claims.** “Elite builders,” “frontier discovery,” and “industry-scale” systems appear without a homepage project demo, student story, research result, or real club photograph. The warm ivory, rounded cards, badges, and pill buttons provide a consistent foundation, but little identity beyond generic platform polish.
   Fix: replace one prestige block with a real project, its builders, a working link, and a concrete outcome. Explain eligibility, time commitment, and assessment preparation. Suggested command: impeccable clarify.

3. **[P1] The mobile menu uses advanced invisibility technology.** Public navigation is hidden below md with no mobile replacement. On the homepage, account actions disappear too. Footer links are the workaround.
   Fix: provide an accessible mobile menu with the same destinations. Suggested command: impeccable adapt.

4. **[P1] Your public calendar is a members-only secret.** EventsPage calls an endpoint protected by authentication and member/admin authorization. Ordinary failures resolve as success:false, which the page turns into “No upcoming events currently scheduled.” It also expects startDate while the API supplies startAt. Every attendance button leads to generic signup and then assessment without preserving the selected event.
   Fix: expose only safe published event information publicly, share the API types, distinguish unavailable from empty, and preserve event intent through signup. Suggested command: impeccable harden.

5. **[P2] Accessibility got a stylesheet, but the hero did not read it.** Reduced-motion CSS suppresses CSS animation but leaves the JavaScript scroll transforms, blur, and opacity running. Invisible hero links remain keyboard-focusable because pointer-events:none does not remove keyboard focus.
   Fix: render a static, immediately usable hero for reduced motion and prevent focus on hidden controls. Suggested command: impeccable audit.

**Project analysis**

The React/Vite/TypeScript frontend, Express backend, Supabase migrations, feature modules, shared UI primitives, and test suites constitute a substantial application. The problem is product focus: membership administration is prominent while tangible student value is weakly demonstrated on the public pages.

The member sidebar presents twelve primary destinations. It also labels the linked AI Assistant “Soon.” The footer says “Architectural Milestone 1,” while the README announces Milestone 10. These are signs that the interface is exposing the development roadmap rather than speaking consistently to members.

**What works**

- Shared components and consistent neutral colors give the site a coherent base.
- Learn / Build / Research is an understandable structure, with two clear hero actions once visible.
- Signup has labels, autocomplete, validation, and a submitting state.

**Provisional UX score: 14/36**

| Heuristic | Score | Main observation |
|---|---:|---|
| System status | 2/4 | Loading exists; “Platform Online” is hard-coded. |
| Real-world language | 1/4 | Prestige jargon outweighs practical student information. |
| Control and freedom | 1/4 | Scroll gate and absent mobile header navigation. |
| Consistency | 2/4 | Shared styling; inconsistent action expectations. |
| Error prevention | 2/4 | Signup validation; event access contract mismatch. |
| Recognition | 2/4 | Named tracks; mobile routes are hard to discover. |
| Efficiency | n/a | Public persuasion surface; advanced workflows not assessed. |
| Minimalism | 2/4 | Restrained colors; intro adds friction without evidence. |
| Error recovery | 1/4 | Events failure appears as an empty calendar. |
| Help | 1/4 | Little practical admission preparation or reassurance. |

These are source-derived judgments, not browser-verified accessibility or usability measurements.

**Who struggles**

A first-time student gets “elite” messaging and an assessment before enough reassurance. A mobile visitor loses header navigation. A skeptical visitor finds “Code Over Claims” without accompanying proof. The public page’s two CTAs are manageable; the cognitive burden comes from jargon and discovering the process across pages.

**Smaller issues**

The hero references undefined accent-blue and bare lavender colors. The member dashboard’s My Courses link uses /member/courses/my, while the intended route is /member/my-courses. The detector found one animate-bounce warning at LandingPage.tsx:83, with zero errors; that aesthetic warning is less important than the functional issues above.

**Fix first:** expose a useful first screen, repair public navigation and events, then replace prestige copy with real club evidence.

Which direction should lead: welcoming student community or selective research collective? Which scope should come first: homepage and mobile navigation, or public events and signup?
