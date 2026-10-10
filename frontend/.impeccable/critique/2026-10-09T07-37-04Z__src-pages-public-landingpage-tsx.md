---
target: Current AI Club website
total_score: 23
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 2
target_identity: "file:D:\\Projects\\AIClub\\frontend\\src\\pages\\public\\LandingPage.tsx"
target_fingerprint: "sha256:2b5ac338f8983496687d85f3402a97ef76be94299a80bdb442ab4965b7faaaf1"
target_path: "D:\\Projects\\AIClub\\frontend\\src\\pages\\public\\LandingPage.tsx"
timestamp: 2026-10-09T07-37-04Z
slug: src-pages-public-landingpage-tsx
---
Method: dual-agent (A: /root/current_design · B: /root/current_evidence)

Your AI Club website now looks like a beautifully typeset constitution. I can read what the club believes; I still cannot see what makes it worth joining.

**Design specificity:** coherent, but interchangeable. The ivory background, black typography, dividers, and pill buttons look composed. Replace “AI” with “robotics” and most of the design still works unchanged. The students have been designed out of the student club.

**Design health: 23/36 — Acceptable.** This score covers the inspected public and account-entry pages, not the entire member/admin product.

| Heuristic | Score | Main finding |
|---|---:|---|
| System status | 3 | Clear loading, empty states, and active navigation |
| Familiar language | 3 | Plain copy; advanced curriculum terms need examples |
| User control | 3 | Navigation and mobile Escape work |
| Consistency | 2 | “MEMBER” means demo rather than account sign-in |
| Error prevention | 3 | Labelled, validated forms; mostly submit-time feedback |
| Recognition | 3 | Visible actions; admission facts require hunting |
| Efficiency | n/a | Expert shortcuts unnecessary for this public scope |
| Minimalist design | 3 | Readable, but repetitive and short on evidence |
| Error recovery | 2 | Retry controls work; registration focus stays on submit |
| Help | 1 | Missing practical admission guidance and contact route |

**What works:** the hero and actions are immediately readable; the mobile menu announces its state and returns focus on Escape; honest empty states avoid fabricated popularity. Preserve those improvements.

**The roast, ordered by impact:**

1. **[P1] Your login has three doorbells, and “MEMBER” rings a showroom.** A real member naturally chooses MEMBER. The source fills demo credentials and launches a demo in that mode instead of authenticating their account. Add two more Quick Demo cards and this becomes a role-selection exam before the actual entrance exam. **Fix:** one credential sign-in, route by the authenticated profile, and one clearly separate preview action. Location: LoginPage.tsx. Suggested command: `$impeccable clarify`.

2. **[P1] The strongest sales sections advertise empty shelves.** “See what members are building” currently resolves to no published public projects. “Next public event” resolves to none. The events page does contain two upcoming members-only listings; activity exists, but newcomers cannot see a public invitation. **Fix:** publish approved real work/activity; until available, use a compact, truthful early-stage presentation with a useful next step. Do not invent testimonials or statistics. Location: LandingPage.tsx. Suggested command: `$impeccable shape`.

3. **[P2] “How joining works” explains that a process exists.** Visitors learn about an assessment and administrative review without enough facts to decide whether they belong or can commit. **Fix:** put verified eligibility, beginner expectations, assessment time/preparation, review expectations, and a contact route beside Apply to join, before account creation. Locations: LandingPage.tsx, AboutPage.tsx, RegisterPage.tsx. Suggested command: `$impeccable onboard`.

4. **[P2] Learn is a syllabus wearing a Learn button.** Four topic inventories provide no public sample, concrete exercise, or track-specific next action. The bottom primary action sends visitors to the currently empty project catalogue. **Fix:** offer one useful beginner exercise or public sample, label its prerequisites, and give authenticated members a direct workspace link. Location: LearnPage.tsx. Suggested command: `$impeccable onboard`.

5. **[P2] The visual identity is “tasteful website about a topic.”** There is no real student, campus scene, experiment, or result to make this SIET community memorable. Another animation will not supply that evidence. **Fix:** retain the calm palette and feature one genuine club photograph, notebook excerpt, or project result with a meaningful caption. Locations: homepage and About. Suggested command: `$impeccable bolder`.

**Cognitive and emotional cost:** navigation and the two hero actions are manageable. Login introduces six competing entry choices. The visitor starts with a welcoming promise, encounters empty public proof, and ends at assessment/review. The lasting impression is more admissions office than collaboration.

**Persona checks:** Jordan, a beginner, cannot try a lesson or confidently judge eligibility. Riley, a returning member, encounters the misleading MEMBER mode and application prompts even with an existing session. Casey, on mobile, gets a layout that fits, but retains the login decision maze and 16px-high recovery/account links.

**Smaller misses:** Login and Register use an H3 as their only page heading. Registration errors are associated with fields, but a blank submission leaves focus on Create account without an announced summary. Mobile Forgot password/Create Account links measured 16px high. Public document titles remain identical.

**Detector versus judgment:** the CLI returned 0 findings across eight public/layout files. Manual browser review found the heading, validation-focus, and small-target issues above. A clean pattern detector does not establish usability or a complete accessibility pass. No detector false positives occurred.

**Questions to consider:**

1. Which should lead the next pass: member sign-in clarity, real club proof, or a public beginner lesson?
2. How broad should the next pass be: the top three issues or all five?
