# Public events and account RSVP rollout

The code and forward migration are ready for review. **The migration has not been run against a live database.** Combined production builds, 124 frontend tests, 277 backend tests, and desktop/mobile browser fixture checks passed. Passing local tests does not establish Supabase persistence or PostgreSQL concurrency behavior.

## Release sequence

1. Back up the target database and inspect its applied migration history. Confirm that the existing events, registrations, profiles, and memberships schemas match the migration assumptions. Test against a staging Supabase project first.
2. Apply `database/supabase/migrations/20261008000017_public_event_rsvp.sql` through the normal migration process. The root `supabase` directory is a junction to `database/supabase`, so these paths refer to the same migration. Do not apply it twice.
3. Deploy the matching backend and frontend changes as one release. The backend must have its existing service-role client configured securely. The service role stays on the server; never put it in browser configuration or logs.
4. Complete the staging checks below, including a backend restart between persistence checks, before promoting the release. Confirm that production reports storage errors rather than falling back to synthetic local registrations when the database is unavailable.

The migration installs service-only `register_event_atomic(uuid, uuid)` and `cancel_event_registration_atomic(uuid, uuid)` RPCs. Seat allocation and reactivation serialize on an event row; a registration trigger enforces eligibility, event state, registration windows, duplicates, and capacity. Own cancellation also runs atomically. Anonymous and authenticated database clients cannot execute these RPCs directly; authenticated API endpoints supply the verified account identity.

The migration removes raw `events` SELECT access for anonymous/authenticated clients because event rows contain private meeting URLs and administrative fields. Public discovery must use the API's explicit safe DTO. It also removes direct client registration writes so clients cannot bypass API ownership checks and registration rules. Server service-role operations remain available. Inventory any direct Supabase consumers before applying these restrictions.

## API contract

| Endpoint | Access and result |
| --- | --- |
| `GET /api/v1/events` | Anonymous safe discovery list; standard response envelope and pagination metadata. |
| `GET /api/v1/events/:slug` | Anonymous safe event detail; draft and admin-only events return 404. |
| `GET /api/v1/events/:eventId/registration` | Authenticated own status: `isRegistered`, `registration`, and eligible attendee `meetingUrl` or null. |
| `POST /api/v1/events/:eventId/register` | Authenticated RSVP; returns own registration with HTTP 201. |
| `DELETE /api/v1/events/:eventId/registration` | Authenticated own cancellation; returns cancelled registration. |

Discovery uses `startAt`, `endAt`, and `eligibility`. It includes labeled members-only previews but excludes meeting links, attendee records, drafts, admin-only events, and internal audit fields. Existing `/api/v1/member/events` and administrative routes retain their protected boundaries.

## Staging acceptance checks

Use actual staging accounts and intentionally created staging events; avoid copying private production records. Keep credentials out of shared output.

- An anonymous visitor can load a public event and a members-only preview. Known draft/admin-only slugs remain unavailable. Inspect public JSON for private fields; none should appear. Raw table reads and direct registration writes from ordinary clients should fail.
- An applicant account can RSVP to a public event without an assessment, refresh or sign in again, and still see the reservation. After a backend restart the reservation remains. The eligible registered attendee can access the meeting link through own status; anonymous and unregistered accounts cannot.
- A second account cannot see or cancel the first account's reservation. Cancellation survives refresh/restart, hides the meeting link, frees a seat, and allows re-registration while the registration window remains open.
- An applicant and a suspended/revoked member cannot RSVP to members-only events. An active member can. Suspended/revoked account holders can still RSVP to public events. Member dashboards and flashcards reject inactive memberships. Admin-only discovery and administration remain private.
- For an event with one available seat, send simultaneous RSVP requests from several distinct staging accounts, ideally through two backend instances. Exactly one should succeed; others should receive `EVENT_FULL`. Query persisted registered rows to confirm capacity was not exceeded. Repeat simultaneous requests from one account and confirm one active reservation and duplicate rejection.
- Verify closed, not-yet-open, started, cancelled, and completed event responses. Simulate unavailable persistence in staging and confirm an error, no success response, and no synthetic reservation/cancellation. Restore storage and verify the prior persisted state.
- Complete the browser journey: discover event, create/sign into an account, return to the selected event, explicitly RSVP, refresh, and cancel. Event attendance signup must not force the membership assessment. Membership application remains a separate journey.

## Rollback

Preserve all registration rows, account identities, and event records. Do not drop/recreate tables or delete reservations to undo this release. The old backend treats `/api/v1/events` as a member-only alias and lacks the new RSVP contract, so rolling back only the frontend or backend can break discovery and attendance flows. Prefer a forward fix or temporarily disable new RSVP actions while diagnosing an issue. Any database rollback needs a reviewed compatibility plan; do not restore broad raw-event access or direct registration writes merely to recover the old UI.
