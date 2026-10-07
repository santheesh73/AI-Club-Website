# AI CLUB - Assessment & Examination Security Model

## Threat Model & Security Controls (Milestone 3)

The examination engine is a high-stakes component of the AI CLUB admission process. The platform implements multi-layer defense-in-depth across the database, backend application layer, and frontend client.

---

### 1. Protection Against Answer Key Leakage
- **Threat:** Malicious applicants inspect network payloads or browser state to retrieve the correct answers to MCQ questions.
- **Defense:**
  - Database schema isolates `assessment_questions.correct_option` behind restrictive RLS policies.
  - The backend query explicitly selects only `id`, `category`, `difficulty`, `question_text`, `option_a`, `option_b`, `option_c`, `option_d`.
  - The client DTO (`SafeQuestionDto` / `SafeQuestion`) completely omits `correct_option`.
  - The server only loads `correct_option` inside a secure server-side transaction during final evaluation on `/submit`.

---

### 2. Server-Authoritative Timer Enforcement
- **Threat:** Tampering with client JavaScript timers or delaying network calls to gain extra examination time.
- **Defense:**
  - Start time (`started_at`) and expiry time (`expires_at = started_at + 1800s`) are recorded on the server in UTC.
  - Every answer autosave request (`PUT /answers/:questionId`) checks `now() <= expires_at + 5 seconds` (5s network latency grace period). Any answer received after expiry is rejected with `400 ASSESSMENT_EXPIRED`.
  - Timer displayed on client is synchronized with server `remainingSeconds`. If the client runs down or disconnects, the server authoritative expiration remains intact.

---

### 3. One Attempt Per Application Enforcement
- **Threat:** Retaking tests repeatedly until a passing score is achieved.
- **Defense:**
  - Unique database index `idx_assessment_attempts_app_id` on `assessment_attempts(application_id)` enforces strict 1:1 attempt-to-application relation.
  - Application endpoint `/assessment/start` checks existing attempts and returns the active attempt rather than creating a new one.

---

### 4. Anti-Tampering Database Triggers
- **Threat:** Direct mutation of application state, application number, or assessment scores via compromised tokens or SQL injection.
- **Defense:**
  - Trigger `trg_protect_application_security_fields`:
    - Prevents non-service roles from updating `application_number`, `user_id`, or `created_at`.
    - Prevents students from manually updating `status`, `assessment_score`, `assessment_passed`, `reviewed_at`, or `reviewer_notes`.
    - Enforces that score and review changes must originate from backend service-role operations.

---

### 5. Architectural Separation: Passing $\ne$ Member
- **Critical Policy:**
  - Passing score ($\ge 60\%$) moves application to `UNDER_REVIEW`.
  - It does **NOT** approve the application.
  - It does **NOT** assign the `member` role.
  - It does **NOT** grant access to Member Portal (`/member/*`).
  - Final membership admission requires explicit administrative review in Milestone 4.
