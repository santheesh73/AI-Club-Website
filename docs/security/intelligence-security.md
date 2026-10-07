# AI CLUB Security & Privacy Model — Milestone 9: Notifications, Analytics & AI Intelligence

## 1. Overview
Milestone 9 adheres to strict security, privacy, and non-mutation principles:
- **Zero AI Mutations**: AI recommendations are strictly advisory and read-only.
- **PII Scrubbing**: Machine learning inference and analytical models receive solely anonymized aggregate numbers, counts, and rates. No names, student IDs, phone numbers, or emails are supplied.
- **Row-Level Security (RLS)**: Enforced directly on Supabase PostgreSQL for all notification and preference tables.

---

## 2. Row Level Security Policies

### 2.1 Table: `public.notifications`
- **Isolation Principle**: Users can only see notifications addressed directly to them (`user_id = auth.uid()`).
- **Admin Visibility**: Admins can query system-level intake queues (`NEW_APPLICATION`, `NEW_REPORT`, `SYSTEM_ALERT`).
- **Mutation Guard**: Only the recipient can mark their notifications as read (`UPDATE ... SET read_at = ... WHERE user_id = auth.uid()`).

### 2.2 Table: `public.notification_preferences`
- **Isolation Principle**: Users can only read and mutate their own preferences (`user_id = auth.uid()`).
- **Admin Visibility**: Admins can inspect preferences for operational troubleshooting.

### 2.3 Table: `public.ai_insights`
- **Read & Write Restriction**: Only authenticated administrators (`auth.jwt() ->> 'role' = 'admin'`) can view and generate cached AI insights.

---

## 3. Event-Driven Dispatch & Preference Gating
Notifications are dispatched synchronously from domain services upon validated state transitions:
1. `adminService`: Dispatches `APPLICATION_STATUS_CHANGED` upon approval, waitlisting, or rejection.
2. `membershipService`: Dispatches `MEMBERSHIP_ACTIVATED` upon credential issuance.
3. `eventsService`: Dispatches `EVENT_REGISTRATION_CONFIRMED` and `EVENT_CANCELLED`.
4. `coursesService`: Dispatches `COURSE_ENROLLMENT_CONFIRMED` and `COURSE_COMPLETED`.
5. `projectsService`: Dispatches `PROJECT_FEATURED` and `PROJECT_MODERATION` notices to owner; dispatches `NEW_REPORT` to admin moderation queue.
6. `achievementsService`: Dispatches `ACHIEVEMENT_UNLOCKED`.
7. `assessmentService`: Dispatches `NEW_APPLICATION` to admin intake queue.

**Preference Gating**: Before any user notification is written to disk/database, `notificationsService` checks the target user's `notification_preferences`. If the relevant category toggle is `false`, the notification is suppressed, preserving user inbox sovereignty.

---

## 4. AI Advisory Guardrails & Graceful Degradation
- **Prompt Injection Defense**: All user-authored content (project titles, student notes, etc.) is sanitized and strictly aggregated into statistical buckets prior to LLM analysis.
- **Cache & Throttling**: Insights are cached in `public.ai_insights` with a 1-hour validity window.
- **Deterministic Rule-Based Fallback**: If Gemini or external inference endpoints encounter network timeouts, quota limits, or invalid keys, the system executes a deterministic advisory synthesis module. Under no circumstance does an AI failure trigger a 500 error or disrupt platform operations.
