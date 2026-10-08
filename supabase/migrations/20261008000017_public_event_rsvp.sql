-- Public discovery is served through the API's safe DTO, not raw event rows.
-- Account RSVPs and cancellations use service-only RPCs with authoritative checks.
BEGIN;
REVOKE SELECT ON public.events FROM anon, authenticated;
DROP POLICY IF EXISTS "Active members can register for events" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can cancel own registration" ON public.event_registrations;
REVOKE INSERT, UPDATE, DELETE ON public.event_registrations FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.guard_event_seat_allocation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE ev public.events; active_count bigint; authorized_admin boolean;
BEGIN
  -- Cancellation does not consume capacity. Both first registrations and reactivation
  -- serialize on the same event row, including writes outside the RPC.
  IF NEW.status <> 'registered' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'registered' AND OLD.event_id = NEW.event_id AND OLD.user_id = NEW.user_id THEN RETURN NEW; END IF;
  SELECT * INTO ev FROM public.events WHERE id = NEW.event_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'EVENT_NOT_FOUND'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.profiles p JOIN auth.users u ON u.id = p.id
    WHERE p.id = NEW.user_id AND p.role = 'admin' AND lower(trim(u.email)) = 'santheesh651@gmail.com') INTO authorized_admin;
  IF ev.eligibility = 'admin_only' AND NOT authorized_admin THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF ev.eligibility = 'members_only' AND NOT authorized_admin AND NOT EXISTS
    (SELECT 1 FROM public.memberships WHERE user_id = NEW.user_id AND status = 'active') THEN
    RAISE EXCEPTION 'MEMBERSHIP_REQUIRED';
  END IF;
  IF ev.status = 'draft' THEN RAISE EXCEPTION 'EVENT_NOT_PUBLISHED'; END IF;
  IF ev.status = 'cancelled' THEN RAISE EXCEPTION 'EVENT_CANCELLED'; END IF;
  IF ev.status = 'completed' THEN RAISE EXCEPTION 'EVENT_COMPLETED'; END IF;
  IF clock_timestamp() < ev.registration_open_at THEN RAISE EXCEPTION 'REGISTRATION_NOT_OPEN'; END IF;
  IF clock_timestamp() > ev.registration_close_at THEN RAISE EXCEPTION 'REGISTRATION_CLOSED'; END IF;
  IF clock_timestamp() >= ev.start_at THEN RAISE EXCEPTION 'EVENT_ALREADY_STARTED'; END IF;
  IF EXISTS (SELECT 1 FROM public.event_registrations WHERE event_id = NEW.event_id AND user_id = NEW.user_id
      AND status = 'registered' AND id <> NEW.id) THEN RAISE EXCEPTION 'ALREADY_REGISTERED'; END IF;
  SELECT count(*) INTO active_count FROM public.event_registrations WHERE event_id = NEW.event_id AND status = 'registered' AND id <> NEW.id;
  IF ev.capacity IS NOT NULL AND active_count >= ev.capacity THEN RAISE EXCEPTION 'EVENT_FULL'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS guard_event_seat_allocation ON public.event_registrations;
CREATE TRIGGER guard_event_seat_allocation BEFORE INSERT OR UPDATE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.guard_event_seat_allocation();

CREATE OR REPLACE FUNCTION public.register_event_atomic(p_event_id uuid, p_user_id uuid)
RETURNS public.event_registrations LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE result public.event_registrations;
BEGIN
  -- Serialize allocation and reactivation across every API process.
  PERFORM 1 FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'EVENT_NOT_FOUND'; END IF;
  IF EXISTS (SELECT 1 FROM public.event_registrations WHERE event_id = p_event_id AND user_id = p_user_id AND status = 'registered') THEN
    RAISE EXCEPTION 'ALREADY_REGISTERED';
  END IF;
  SELECT * INTO result FROM public.event_registrations WHERE event_id = p_event_id AND user_id = p_user_id AND status = 'cancelled'
    ORDER BY registered_at DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    UPDATE public.event_registrations SET status = 'registered', registered_at = clock_timestamp(), cancelled_at = NULL
      WHERE id = result.id RETURNING * INTO result;
  ELSE
    INSERT INTO public.event_registrations(event_id, user_id) VALUES (p_event_id, p_user_id) RETURNING * INTO result;
  END IF;
  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_event_registration_atomic(p_event_id uuid, p_user_id uuid)
RETURNS public.event_registrations LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE ev public.events; result public.event_registrations;
BEGIN
  SELECT * INTO ev FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'EVENT_NOT_FOUND'; END IF;
  IF clock_timestamp() >= ev.start_at THEN RAISE EXCEPTION 'CANCELLATION_WINDOW_CLOSED'; END IF;
  IF ev.status = 'completed' THEN RAISE EXCEPTION 'EVENT_COMPLETED'; END IF;
  UPDATE public.event_registrations SET status = 'cancelled', cancelled_at = clock_timestamp()
    WHERE event_id = p_event_id AND user_id = p_user_id AND status = 'registered' RETURNING * INTO result;
  IF NOT FOUND THEN RAISE EXCEPTION 'REGISTRATION_NOT_FOUND'; END IF;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.register_event_atomic(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_event_registration_atomic(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_event_seat_allocation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_event_atomic(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_event_registration_atomic(uuid, uuid) TO service_role;
COMMIT;
