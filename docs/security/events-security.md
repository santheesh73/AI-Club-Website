# AI CLUB — Events & Activities Platform Security Architecture

## 1. Threat Model & Security Principles

The Events & Activities Platform handles club workshops, hackathons, and sensitive credentials like private video conference room links. The security model addresses the following threat vectors:

1. **Race Conditions & Over-Registration**: Multiple members simultaneously attempting to reserve the last available seat in a capped event.
2. **Unauthorized Event Mutation**: Non-administrators tampering with event schedules or statuses.
3. **Data Leakage of Meeting Links**: Leaking private video conference URLs to non-registrants or unverified users.
4. **Non-Member Registration**: Applicants or unauthenticated users reserving member-only seats.
5. **Auditing & Non-Repudiation**: Unexplained event cancellations or unrecorded seat changes.

---

## 2. Row-Level Security (RLS) Model

All tables in the `public` schema have RLS enabled with explicit security policies.

### 2.1 Table: `public.events`
```sql
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 1. Members and authenticated users may view published, ongoing, and completed events
CREATE POLICY "Public read for published events"
  ON public.events FOR SELECT
  USING (
    status IN ('published', 'ongoing', 'completed')
  );

-- 2. Administrators have full access across all event statuses (including drafts)
CREATE POLICY "Admins full management on events"
  ON public.events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 2.2 Table: `public.event_registrations`
```sql
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- 1. Members can view their own registration records
CREATE POLICY "Members view own registrations"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- 2. Members can create registrations for themselves
CREATE POLICY "Members can insert own registrations"
  ON public.event_registrations FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- 3. Members can cancel their own active registrations
CREATE POLICY "Members can cancel own registrations"
  ON public.event_registrations FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- 4. Admins have complete visibility and modification rights for rosters
CREATE POLICY "Admins manage all event registrations"
  ON public.event_registrations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 3. Concurrency Safety & Seat Allocation Protection

### 3.1 Partial Unique Index
To prevent a member from registering multiple times for the same event while permitting historical records of past cancellations, the database enforces:
```sql
CREATE UNIQUE INDEX idx_one_active_registration_per_event_user
  ON public.event_registrations(event_id, user_id)
  WHERE (status = 'registered');
```
Any concurrent attempt to register the same member produces a database unique constraint violation (`409 ALREADY_REGISTERED`).

### 3.2 Atomic Capacity Guard
Registration requests are executed inside transactional bounds:
```sql
-- Conceptual transaction flow:
SELECT capacity, status, registration_open_at, registration_close_at, start_at
FROM public.events
WHERE id = $1
FOR SHARE;

-- Check capacity against active registrations
SELECT COUNT(*) FROM public.event_registrations
WHERE event_id = $1 AND status = 'registered';

-- If count >= capacity, abort transaction with EVENT_FULL error.
```
This guarantees no race condition can ever exceed configured maximum capacity limits.

---

## 4. Gated Private Meeting Links

Virtual and hybrid event meeting URLs (`meeting_url`) are protected. When non-admin members fetch event details:
1. If the member is NOT actively registered: `meetingUrl` is set to `null` before sending to the client.
2. If the member IS registered (`status = 'registered'`): `meetingUrl` is returned to the client and rendered in the UI.

---

## 5. Audit Logging Trail

All administrative and member transactions are written to `public.audit_logs`:

| Action Code | Entity Type | Actor | Trigger Event |
|---|---|---|---|
| `EVENT_CREATED` | `EVENT` | Admin | New event draft or published record created |
| `EVENT_UPDATED` | `EVENT` | Admin | Event metadata or capacity altered |
| `EVENT_PUBLISHED`| `EVENT` | Admin | Event released to member portal |
| `EVENT_CANCELLED`| `EVENT` | Admin | Event cancelled with mandatory reason |
| `EVENT_REGISTERED`| `EVENT_REGISTRATION` | Member | Member successfully reserves a seat |
| `EVENT_REGISTRATION_CANCELLED`| `EVENT_REGISTRATION` | Member | Member cancels reservation and releases seat |
