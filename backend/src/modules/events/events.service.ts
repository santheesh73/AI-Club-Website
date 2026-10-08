import { env } from '../../config/env';
import { supabaseAdmin } from '../../services/supabase';
import { AppError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { auditService } from '../admin/audit.service';
import { notificationsService } from '../notifications/notifications.service';
import {
  PublicEventDto,
  EventRecord,
  EventRegistrationRecord,
  CreateEventDto,
  UpdateEventDto,
  EventQueryDto,
  MemberEventCardDto,
  EventDetailDto,
  AdminEventSummaryDto,
  RegistrationAttendeeDto,
} from './events.types';
import { membershipService } from '../membership/membership.service';
import { localMemoryProfiles } from '../profile/profile.controller';

// In-memory fallback stores for local testing / isolated unit tests
export const localMemoryEvents = new Map<string, EventRecord>();
export const localMemoryRegistrations = new Map<string, EventRegistrationRecord>();

const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export class EventsService {
  private readonly eventLocks = new Map<string, Promise<void>>();
  private get useDatabase(): boolean { return !!supabaseAdmin && env.NODE_ENV !== 'test'; }
  private assertStorage(): void {
    if (env.NODE_ENV === 'production' && !supabaseAdmin) throw new AppError('Event storage unavailable', 503, 'SERVICE_UNAVAILABLE');
  }
  private async withEventLock<T>(id: string, task: () => Promise<T>): Promise<T> {
    const previous = this.eventLocks.get(id) || Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => { release = resolve; });
    this.eventLocks.set(id, current);
    await previous;
    try { return await task(); }
    finally { release(); if (this.eventLocks.get(id) === current) this.eventLocks.delete(id); }
  }
  private storageFailure(err: unknown): never {
    logger.error('Event persistence failed', { err });
    throw new AppError('Event storage unavailable. Please retry.', 503, 'EVENT_STORAGE_FAILED');
  }
  private mapRegistration(row: any): EventRegistrationRecord {
    return { id: row.id, eventId: row.event_id, userId: row.user_id, status: row.status,
      registeredAt: row.registered_at, cancelledAt: row.cancelled_at,
      createdAt: row.created_at, updatedAt: row.updated_at };
  }
  private rpcFailure(error: { message: string }): never {
    const codes: Record<string, number> = { EVENT_NOT_FOUND: 404, EVENT_NOT_PUBLISHED: 400,
      EVENT_CANCELLED: 400, EVENT_COMPLETED: 400, REGISTRATION_NOT_OPEN: 400,
      REGISTRATION_CLOSED: 400, EVENT_ALREADY_STARTED: 400, ALREADY_REGISTERED: 409,
      EVENT_FULL: 409, MEMBERSHIP_REQUIRED: 403, FORBIDDEN: 403,
      REGISTRATION_NOT_FOUND: 404, CANCELLATION_WINDOW_CLOSED: 400 };
    const code = Object.keys(codes).find((value) => error.message.includes(value));
    if (code) throw new AppError(code.replace(/_/g, ' ').toLowerCase(), codes[code], code);
    this.storageFailure(error);
  }

  private async publicProjection(event: EventRecord): Promise<PublicEventDto> {
    const { id, slug, title, shortDescription, description, category, eventMode, location,
      isOnline, coverImageUrl, startAt, endAt, registrationOpenAt, registrationCloseAt,
      capacity, eligibility, status, speaker, organizer, requirements, tags } = event;
    const count = await this.getEventRegistrationCount(id);
    const availableSeats = capacity == null ? null : Math.max(0, capacity - count);
    return { id, slug, title, shortDescription, description, category, eventMode, location,
      isOnline, coverImageUrl, startAt, endAt, registrationOpenAt, registrationCloseAt,
      capacity, eligibility, status, speaker, organizer, requirements, tags,
      availableSeats, isFull: availableSeats !== null && availableSeats === 0 };
  }
  async getPublicEvents(query: EventQueryDto): Promise<{ items: PublicEventDto[]; total: number }> {
    this.assertStorage();
    let events = Array.from(localMemoryEvents.values());
    if (this.useDatabase) {
      try {
        const { data, error } = await supabaseAdmin!.from('events').select('*')
          .neq('status', 'draft').in('eligibility', ['public', 'members_only']);
        if (error) this.storageFailure(error);
        events = (data || []).map((row) => this.mapDbRowToEvent(row));
      } catch (err) { this.storageFailure(err); }
    }
    events = events.filter((event) => event.status !== 'draft' && event.eligibility !== 'admin_only');
    if (query.category) events = events.filter((event) => event.category === query.category);
    if (query.status) events = events.filter((event) => event.status === query.status);
    if (query.search) { const search = query.search.toLowerCase(); events = events.filter((event) =>
      [event.title, event.shortDescription, event.speaker || ''].some((text) => text.toLowerCase().includes(search))); }
    const now = Date.now();
    if (query.timeline === 'upcoming') events = events.filter((event) => Date.parse(event.startAt) >= now && event.status !== 'completed' && event.status !== 'cancelled');
    if (query.timeline === 'past') events = events.filter((event) => Date.parse(event.startAt) < now || event.status === 'completed');
    events.sort((a, b) => (Date.parse(a.startAt) - Date.parse(b.startAt)) * (query.sortOrder === 'desc' ? -1 : 1));
    const total = events.length; const page = query.page || 1; const pageSize = query.pageSize || 20;
    return { items: await Promise.all(events.slice((page - 1) * pageSize, page * pageSize).map((event) => this.publicProjection(event))), total };
  }
  async getPublicEventBySlug(slug: string): Promise<PublicEventDto> {
    const event = await this.getEventBySlug(slug);
    if (!event || event.status === 'draft' || event.eligibility === 'admin_only') throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    return this.publicProjection(event);
  }
  async getRegistrationStatus(eventId: string, userId: string, isAdmin = false): Promise<{ isRegistered: boolean; registration: EventRegistrationRecord | null; meetingUrl: string | null }> {
    const event = await this.getEventById(eventId);
    if (!event || event.status === 'draft' || (event.eligibility === 'admin_only' && !isAdmin)) throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    const registration = await this.getUserEventRegistration(eventId, userId);
    const isRegistered = registration?.status === 'registered';
    const canAttend = isRegistered && event.status !== 'cancelled' &&
      (event.eligibility === 'public' || isAdmin || await this.isUserActiveMember(userId));
    return { isRegistered, registration, meetingUrl: canAttend ? event.meetingUrl || null : null };
  }

  /**
   * Reset local state for testing isolation
   */
  public resetLocalState(): void {
    localMemoryEvents.clear();
    localMemoryRegistrations.clear();
  }

  /**
   * Generate a unique slug from title
   */
  private async generateUniqueSlug(title: string, existingId?: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slugCandidate = baseSlug || 'event';
    let counter = 1;

    while (true) {
      let isTaken = false;

      if (this.useDatabase) {
        try {
          const query = supabaseAdmin!.from('events').select('id').eq('slug', slugCandidate);
          if (existingId) {
            query.neq('id', existingId);
          }
          const { data, error } = await query.maybeSingle();
          if (error) this.storageFailure(error);
          if (data) isTaken = true;
        } catch (err) { this.storageFailure(err); }
      } else {
        for (const ev of localMemoryEvents.values()) {
          if (ev.slug === slugCandidate && ev.id !== existingId) {
            isTaken = true;
            break;
          }
        }
      }

      if (!isTaken) return slugCandidate;

      counter += 1;
      slugCandidate = `${baseSlug}-${counter}`;
    }
  }

  /**
   * Helper: check if user has an active membership record
   */
  private async isUserActiveMember(userId: string): Promise<boolean> {
    this.assertStorage();
    if (this.useDatabase) {
      try {
        const { data, error } = await supabaseAdmin!.from('memberships').select('id')
          .eq('user_id', userId).eq('status', 'active').maybeSingle();
        if (error) this.storageFailure(error);
        return !!data;
      } catch (err) { this.storageFailure(err); }
    }
    // Local demo/test access must also honor stored suspension and revocation.
    return (await membershipService.getMembershipByUserId(userId))?.status === 'active';
  }

  // ============================================================================
  // ADMIN EVENT OPERATIONS
  // ============================================================================

  /**
   * Create a new event (Initial state: DRAFT)
   */
  async createEvent(
    dto: CreateEventDto,
    actorId: string,
    requestId?: string
  ): Promise<EventRecord> {
    this.assertStorage();
    const slug = await this.generateUniqueSlug(dto.title);
    const now = new Date().toISOString();

    const newEvent: EventRecord = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: dto.title.trim(),
      slug,
      shortDescription: dto.shortDescription.trim(),
      description: dto.description.trim(),
      category: dto.category,
      eventMode: dto.eventMode,
      location: dto.location || null,
      isOnline: dto.isOnline ?? (dto.eventMode === 'online' || dto.eventMode === 'hybrid'),
      meetingUrl: dto.meetingUrl || null,
      coverImageUrl: dto.coverImageUrl || null,
      startAt: dto.startAt,
      endAt: dto.endAt,
      registrationOpenAt: dto.registrationOpenAt,
      registrationCloseAt: dto.registrationCloseAt,
      capacity: dto.capacity ?? null,
      eligibility: dto.eligibility || 'members_only',
      status: 'draft',
      speaker: dto.speaker || null,
      organizer: dto.organizer || null,
      requirements: dto.requirements || null,
      tags: dto.tags || [],
      createdBy: actorId,
      publishedAt: null,
      cancelledAt: null,
      cancellationReason: null,
      createdAt: now,
      updatedAt: now,
    };

    const isActorUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actorId);
    if (this.useDatabase) {
      if (!isActorUuid) this.storageFailure('Invalid actor identity');
      try {
        const { data, error } = await supabaseAdmin!
          .from('events')
          .insert({
            title: newEvent.title,
            slug: newEvent.slug,
            short_description: newEvent.shortDescription,
            description: newEvent.description,
            category: newEvent.category,
            event_mode: newEvent.eventMode,
            location: newEvent.location,
            is_online: newEvent.isOnline,
            meeting_url: newEvent.meetingUrl,
            cover_image_url: newEvent.coverImageUrl,
            start_at: newEvent.startAt,
            end_at: newEvent.endAt,
            registration_open_at: newEvent.registrationOpenAt,
            registration_close_at: newEvent.registrationCloseAt,
            capacity: newEvent.capacity,
            eligibility: newEvent.eligibility,
            status: newEvent.status,
            speaker: newEvent.speaker,
            organizer: newEvent.organizer,
            requirements: newEvent.requirements,
            tags: newEvent.tags,
            created_by: actorId,
          })
          .select()
          .single();

        if (error) {
          logger.error('Failed to insert event into database', { error });
          throw new AppError(error.message, 500, 'EVENT_CREATION_FAILED');
        }

        newEvent.id = data.id;
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        this.storageFailure(err);
      }
    }

    localMemoryEvents.set(newEvent.id, newEvent);

    await auditService.createLog({
      actorId,
      action: 'EVENT_CREATED',
      entityType: 'EVENT',
      entityId: newEvent.id,
      metadata: { title: newEvent.title, category: newEvent.category },
      requestId,
    });

    return newEvent;
  }

  /**
   * Update an event (respecting status constraints)
   */
  async updateEvent(
    eventId: string,
    dto: UpdateEventDto,
    actorId: string,
    requestId?: string
  ): Promise<EventRecord> {
    const event = await this.getEventById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    if (event.status === 'completed' || event.status === 'cancelled') {
      throw new AppError(
        `Cannot update event with status '${event.status}'`,
        409,
        'INVALID_EVENT_STATE'
      );
    }

    // In PUBLISHED state, only safe updates are permitted (e.g. description, meeting URL, capacity)
    if (event.status === 'published' && dto.startAt && dto.startAt !== event.startAt) {
      // Validate that start time doesn't break existing registrations window
      const regCount = await this.getEventRegistrationCount(eventId);
      if (regCount > 0 && new Date(dto.startAt) <= new Date()) {
        throw new AppError('Cannot move event start time to the past', 400, 'INVALID_EVENT_TIME');
      }
    }

    const updated: EventRecord = {
      ...event,
      title: dto.title !== undefined ? dto.title.trim() : event.title,
      shortDescription: dto.shortDescription !== undefined ? dto.shortDescription.trim() : event.shortDescription,
      description: dto.description !== undefined ? dto.description.trim() : event.description,
      category: dto.category !== undefined ? dto.category : event.category,
      eventMode: dto.eventMode !== undefined ? dto.eventMode : event.eventMode,
      location: dto.location !== undefined ? dto.location : event.location,
      isOnline: dto.isOnline !== undefined ? dto.isOnline : event.isOnline,
      meetingUrl: dto.meetingUrl !== undefined ? dto.meetingUrl : event.meetingUrl,
      coverImageUrl: dto.coverImageUrl !== undefined ? dto.coverImageUrl : event.coverImageUrl,
      startAt: dto.startAt !== undefined ? dto.startAt : event.startAt,
      endAt: dto.endAt !== undefined ? dto.endAt : event.endAt,
      registrationOpenAt: dto.registrationOpenAt !== undefined ? dto.registrationOpenAt : event.registrationOpenAt,
      registrationCloseAt: dto.registrationCloseAt !== undefined ? dto.registrationCloseAt : event.registrationCloseAt,
      capacity: dto.capacity !== undefined ? dto.capacity : event.capacity,
      eligibility: dto.eligibility !== undefined ? dto.eligibility : event.eligibility,
      speaker: dto.speaker !== undefined ? dto.speaker : event.speaker,
      organizer: dto.organizer !== undefined ? dto.organizer : event.organizer,
      requirements: dto.requirements !== undefined ? dto.requirements : event.requirements,
      tags: dto.tags !== undefined ? dto.tags : event.tags,
      updatedAt: new Date().toISOString(),
    };

    if (this.useDatabase) {
      try {
        const { data, error } = await supabaseAdmin!
          .from('events')
          .update({
            title: updated.title,
            short_description: updated.shortDescription,
            description: updated.description,
            category: updated.category,
            event_mode: updated.eventMode,
            location: updated.location,
            is_online: updated.isOnline,
            meeting_url: updated.meetingUrl,
            cover_image_url: updated.coverImageUrl,
            start_at: updated.startAt,
            end_at: updated.endAt,
            registration_open_at: updated.registrationOpenAt,
            registration_close_at: updated.registrationCloseAt,
            capacity: updated.capacity,
            eligibility: updated.eligibility,
            speaker: updated.speaker,
            organizer: updated.organizer,
            requirements: updated.requirements,
            tags: updated.tags,
            updated_at: updated.updatedAt,
          })
          .eq('id', eventId).select('id').single();
        if (error || !data) this.storageFailure(error);
      } catch (err: unknown) {
        this.storageFailure(err);
      }
    }

    localMemoryEvents.set(eventId, updated);

    await auditService.createLog({
      actorId,
      action: 'EVENT_UPDATED',
      entityType: 'EVENT',
      entityId: eventId,
      metadata: { changes: Object.keys(dto) },
      requestId,
    });

    return updated;
  }

  /**
   * Publish an event (Transition: DRAFT -> PUBLISHED)
   */
  async publishEvent(eventId: string, actorId: string, requestId?: string): Promise<EventRecord> {
    const event = await this.getEventById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    if (event.status !== 'draft') {
      throw new AppError(
        `Cannot publish event with status '${event.status}'. Only DRAFT events can be published.`,
        409,
        'INVALID_EVENT_STATE'
      );
    }

    const now = new Date().toISOString();
    const updated: EventRecord = {
      ...event,
      status: 'published',
      publishedAt: now,
      updatedAt: now,
    };

    if (this.useDatabase) {
      try {
        const { data, error } = await supabaseAdmin!
          .from('events')
          .update({
            status: 'published',
            published_at: now,
            updated_at: now,
          })
          .eq('id', eventId).select('id').single();
        if (error || !data) this.storageFailure(error);
      } catch (err: unknown) {
        this.storageFailure(err);
      }
    }

    localMemoryEvents.set(eventId, updated);

    await auditService.createLog({
      actorId,
      action: 'EVENT_PUBLISHED',
      entityType: 'EVENT',
      entityId: eventId,
      metadata: { publishedAt: now },
      requestId,
    });

    return updated;
  }

  /**
   * Cancel an event (Transition: PUBLISHED or ONGOING -> CANCELLED)
   */
  async cancelEvent(
    eventId: string,
    reason: string,
    actorId: string,
    requestId?: string
  ): Promise<EventRecord> {
    const event = await this.getEventById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    if (event.status !== 'published' && event.status !== 'ongoing') {
      throw new AppError(
        `Cannot cancel event with status '${event.status}'. Only PUBLISHED or ONGOING events can be cancelled.`,
        409,
        'INVALID_EVENT_STATE'
      );
    }

    const now = new Date().toISOString();
    const updated: EventRecord = {
      ...event,
      status: 'cancelled',
      cancelledAt: now,
      cancellationReason: reason.trim(),
      updatedAt: now,
    };

    if (this.useDatabase) {
      try {
        const { data, error } = await supabaseAdmin!
          .from('events')
          .update({
            status: 'cancelled',
            cancelled_at: now,
            cancellation_reason: reason.trim(),
            updated_at: now,
          })
          .eq('id', eventId).select('id').single();
        if (error || !data) this.storageFailure(error);
      } catch (err: unknown) {
        this.storageFailure(err);
      }
    }

    localMemoryEvents.set(eventId, updated);

    await auditService.createLog({
      actorId,
      action: 'EVENT_CANCELLED',
      entityType: 'EVENT',
      entityId: eventId,
      metadata: { reason, cancelledAt: now },
      requestId,
    });

    return updated;
  }

  /**
   * List all events for admin oversight
   */
  async getAdminEvents(query: EventQueryDto): Promise<{ items: AdminEventSummaryDto[]; total: number }> {
    this.assertStorage();
    let allEvents = Array.from(localMemoryEvents.values());

    if (this.useDatabase) {
      try {
        const { data, error } = await supabaseAdmin!.from('events').select('*');
        if (error) this.storageFailure(error);
        if (data) {
          allEvents = data.map(this.mapDbRowToEvent);
          // Sync with local memory
          allEvents.forEach((ev) => localMemoryEvents.set(ev.id, ev));
        }
      } catch (err) { this.storageFailure(err); }
    }

    // Apply filtering
    let filtered = allEvents;
    if (query.status) {
      filtered = filtered.filter((ev) => ev.status === query.status);
    }
    if (query.category) {
      filtered = filtered.filter((ev) => ev.category === query.category);
    }
    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter(
        (ev) =>
          ev.title.toLowerCase().includes(s) ||
          ev.shortDescription.toLowerCase().includes(s) ||
          (ev.speaker && ev.speaker.toLowerCase().includes(s))
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      const order = query.sortOrder === 'desc' ? -1 : 1;
      if (query.sortBy === 'title') return a.title.localeCompare(b.title) * order;
      if (query.sortBy === 'createdAt') return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order;
      return (new Date(a.startAt).getTime() - new Date(b.startAt).getTime()) * order;
    });

    const total = filtered.length;
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    // Enrich with summary data
    const summaries: AdminEventSummaryDto[] = await Promise.all(
      paginated.map(async (ev) => {
        const regCount = await this.getEventRegistrationCount(ev.id);
        const availableSeats = ev.capacity !== null && ev.capacity !== undefined ? Math.max(0, ev.capacity - regCount) : null;
        const registrationRate = ev.capacity ? Math.min(100, Math.round((regCount / ev.capacity) * 100)) : 100;
        return {
          ...ev,
          registeredCount: regCount,
          availableSeats,
          registrationRate,
        };
      })
    );

    return { items: summaries, total };
  }

  /**
   * Get registrations list for an event (Admin View)
   */
  async getEventRegistrations(eventId: string): Promise<RegistrationAttendeeDto[]> {
    const event = await this.getEventById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    this.assertStorage();
    let registrations = Array.from(localMemoryRegistrations.values()).filter(
      (r) => r.eventId === eventId
    );

    if (this.useDatabase) {
      try {
        const { data, error } = await supabaseAdmin!
          .from('event_registrations')
          .select(`
            id,
            user_id,
            status,
            registered_at,
            profiles (
              full_name,
              email,
              department
            ),
            memberships:user_id (
              member_number
            )
          `)
          .eq('event_id', eventId);
        if (error) this.storageFailure(error);

        if (data) {
          return data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            fullName: row.profiles?.full_name || 'Member',
            email: row.profiles?.email || '',
            memberNumber: row.memberships?.[0]?.member_number || null,
            department: row.profiles?.department || null,
            status: row.status,
            registeredAt: row.registered_at,
          }));
        }
      } catch (err) { this.storageFailure(err); }
    }

    // In-memory mapping
    return registrations.map((r) => {
      const profile = localMemoryProfiles.get(r.userId) as Record<string, any> | undefined;
      return {
        id: r.id,
        userId: r.userId,
        fullName: (profile?.fullName as string) || (profile?.full_name as string) || 'Active Member',
        email: (profile?.email as string) || 'member@aiclub.internal',
        memberNumber: 'AIC-2026-0001',
        department: (profile?.department as string) || 'AI & Data Science',
        status: r.status,
        registeredAt: r.registeredAt,
      };
    });
  }

  // ============================================================================
  // MEMBER EVENT OPERATIONS
  // ============================================================================

  /**
   * List visible events for member discovery
   */
  async getMemberEvents(
    userId: string,
    query: EventQueryDto
  ): Promise<{ items: MemberEventCardDto[]; total: number }> {
    this.assertStorage();
    let allEvents = Array.from(localMemoryEvents.values());

    if (this.useDatabase) {
      try {
        const { data, error } = await supabaseAdmin!
          .from('events')
          .select('*')
          .in('status', ['published', 'ongoing', 'completed'])
          .in('eligibility', ['public', 'members_only']);
        if (error) this.storageFailure(error);

        if (data) {
          const dbEvents = data.map(this.mapDbRowToEvent);
          dbEvents.forEach((ev) => localMemoryEvents.set(ev.id, ev));
          allEvents = dbEvents;
        }
      } catch (err) { this.storageFailure(err); }
    }

    // Filter to visible events only (no draft, cancelled can be hidden or viewed in archive)
    let filtered = allEvents.filter(
      (ev) => ev.eligibility !== 'admin_only' && (ev.status === 'published' || ev.status === 'ongoing' || ev.status === 'completed')
    );

    if (query.category) {
      filtered = filtered.filter((ev) => ev.category === query.category);
    }

    const nowTime = new Date().getTime();
    if (query.timeline === 'upcoming') {
      filtered = filtered.filter((ev) => new Date(ev.startAt).getTime() >= nowTime && ev.status !== 'completed');
    } else if (query.timeline === 'past') {
      filtered = filtered.filter((ev) => new Date(ev.startAt).getTime() < nowTime || ev.status === 'completed');
    }

    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter(
        (ev) =>
          ev.title.toLowerCase().includes(s) ||
          ev.shortDescription.toLowerCase().includes(s) ||
          (ev.speaker && ev.speaker.toLowerCase().includes(s))
      );
    }

    // Default sort: nearest upcoming first
    filtered.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    const total = filtered.length;
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    const cards: MemberEventCardDto[] = await Promise.all(
      paginated.map(async (ev) => {
        const regCount = await this.getEventRegistrationCount(ev.id);
        const availableSeats = ev.capacity !== null && ev.capacity !== undefined ? Math.max(0, ev.capacity - regCount) : null;
        const isFull = availableSeats !== null && availableSeats <= 0;
        const userReg = await this.getUserEventRegistration(ev.id, userId);

        return {
          ...ev,
          registeredCount: regCount,
          availableSeats,
          isFull,
          isRegistered: !!userReg && userReg.status === 'registered',
          userRegistrationStatus: userReg ? userReg.status : null,
          // Mask meetingUrl if not registered or event is physical
          meetingUrl: userReg && userReg.status === 'registered' ? ev.meetingUrl : null,
        };
      })
    );

    return { items: cards, total };
  }

  /**
   * Get single event detail by slug for member
   */
  async getMemberEventBySlug(slug: string, userId: string): Promise<EventDetailDto> {
    const event = await this.getEventBySlug(slug);
    if (!event) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    if (event.status === 'draft' || event.eligibility === 'admin_only') {
      throw new AppError('Event not found or unpublished', 404, 'EVENT_NOT_FOUND');
    }

    const regCount = await this.getEventRegistrationCount(event.id);
    const availableSeats = event.capacity !== null && event.capacity !== undefined ? Math.max(0, event.capacity - regCount) : null;
    const isFull = availableSeats !== null && availableSeats <= 0;
    const userReg = await this.getUserEventRegistration(event.id, userId);

    return {
      ...event,
      registeredCount: regCount,
      availableSeats,
      isFull,
      isRegistered: !!userReg && userReg.status === 'registered',
      userRegistrationStatus: userReg ? userReg.status : null,
      registrationId: userReg ? userReg.id : null,
      meetingUrl: userReg && userReg.status === 'registered' ? event.meetingUrl : null,
    };
  }

  /**
   * Register an authenticated account using the selected event eligibility.
   */
  async registerForEvent(
    eventId: string,
    userId: string,
    actorRole: string,
    requestId?: string
  ): Promise<EventRegistrationRecord> {
    return this.withEventLock(eventId, async () => {
      this.assertStorage();
      const event = await this.getEventById(eventId);
      if (!event) throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
      if (event.eligibility === 'admin_only' && actorRole !== 'admin') throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
      if (event.eligibility === 'members_only' && actorRole !== 'admin' && !(await this.isUserActiveMember(userId))) {
        throw new AppError('Active club membership required', 403, 'MEMBERSHIP_REQUIRED');
      }
      // 3. Verify event state
      if (event.status === 'draft') {
        throw new AppError('Event is not yet published', 400, 'EVENT_NOT_PUBLISHED');
      }
      if (event.status === 'cancelled') {
        throw new AppError('This event has been cancelled', 400, 'EVENT_CANCELLED');
      }
      if (event.status === 'completed') {
        throw new AppError('This event has already completed', 400, 'EVENT_COMPLETED');
      }

      const now = new Date();
      // 4. Verify registration window
      if (now < new Date(event.registrationOpenAt)) {
        throw new AppError('Event registration is not open yet', 400, 'REGISTRATION_NOT_OPEN');
      }
      if (now > new Date(event.registrationCloseAt)) {
        throw new AppError('Event registration has closed', 400, 'REGISTRATION_CLOSED');
      }
      if (now >= new Date(event.startAt)) {
        throw new AppError('Event has already started', 400, 'EVENT_ALREADY_STARTED');
      }

      // 5. Check if already registered
      const existingReg = await this.getUserEventRegistration(eventId, userId);
      if (existingReg && existingReg.status === 'registered') {
        throw new AppError('You are already registered for this event', 409, 'ALREADY_REGISTERED');
      }

      // 6. Check Capacity (Transaction-Safe)
      const currentCount = await this.getEventRegistrationCount(eventId);
      if (event.capacity !== null && event.capacity !== undefined && currentCount >= event.capacity) {
        throw new AppError(
          'This event has reached full registration capacity',
          409,
          'EVENT_FULL'
        );
      }

      const regTimestamp = now.toISOString();
      let finalReg: EventRegistrationRecord;

      if (this.useDatabase) {
        try {
          const { data, error } = await supabaseAdmin!.rpc('register_event_atomic', { p_event_id: eventId, p_user_id: userId });
          if (error) this.rpcFailure(error);
          if (!data) this.storageFailure('Empty registration response');
          finalReg = this.mapRegistration(Array.isArray(data) ? data[0] : data);
        } catch (err) { if (err instanceof AppError) throw err; this.storageFailure(err); }
      } else {
        finalReg = existingReg && existingReg.status === 'cancelled'
          ? { ...existingReg, status: 'registered', registeredAt: regTimestamp, cancelledAt: null, updatedAt: regTimestamp }
          : { id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, eventId, userId,
              status: 'registered', registeredAt: regTimestamp, cancelledAt: null, createdAt: regTimestamp, updatedAt: regTimestamp };
      }

      localMemoryRegistrations.set(finalReg.id, finalReg);

      await auditService.createLog({
        actorId: userId,
        action: 'EVENT_REGISTERED',
        entityType: 'EVENT_REGISTRATION',
        entityId: finalReg.id,
        metadata: { eventId, eventTitle: event.title },
        requestId,
      });

      await notificationsService.createNotification({
        userId,
        type: 'EVENT_REGISTRATION_CONFIRMED',
        title: 'Seat Reserved',
        message: `Your registration for "${event.title}" has been confirmed.`,
        actionUrl: event.eligibility === 'public' ? `/events/${event.slug}` : `/member/events/${event.slug}`,
        metadata: { eventId, eventSlug: event.slug },
      });

      return finalReg;
    });
  }

  /**
   * Cancel the authenticated account's own registration
   */
  async cancelRegistration(
    eventId: string,
    userId: string,
    requestId?: string
  ): Promise<EventRegistrationRecord> {
    return this.withEventLock(eventId, async () => {
      this.assertStorage();
      const event = await this.getEventById(eventId);
      if (!event) {
        throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
      }

      const reg = await this.getUserEventRegistration(eventId, userId);
      if (!reg || reg.status !== 'registered') {
        throw new AppError('Active registration record not found', 404, 'REGISTRATION_NOT_FOUND');
      }

      // Cancellation Policy: Allowed until event start
      const now = new Date();
      if (now >= new Date(event.startAt)) {
        throw new AppError(
          'Cancellation is not permitted after the event has started',
          400,
          'CANCELLATION_WINDOW_CLOSED'
        );
      }
      if (event.status === 'completed') {
        throw new AppError(
          'Cannot cancel registration for a completed event',
          400,
          'EVENT_COMPLETED'
        );
      }

      const nowIso = now.toISOString();
      let updated: EventRegistrationRecord = {
        ...reg,
        status: 'cancelled',
        cancelledAt: nowIso,
        updatedAt: nowIso,
      };

      if (this.useDatabase) {
        try {
          const { data, error } = await supabaseAdmin!.rpc('cancel_event_registration_atomic', { p_event_id: eventId, p_user_id: userId });
          if (error) this.rpcFailure(error);
          if (!data) this.storageFailure('Empty cancellation response');
          updated = this.mapRegistration(Array.isArray(data) ? data[0] : data);
        } catch (err) { if (err instanceof AppError) throw err; this.storageFailure(err); }
      }

      localMemoryRegistrations.set(reg.id, updated);

      await auditService.createLog({
        actorId: userId,
        action: 'EVENT_REGISTRATION_CANCELLED',
        entityType: 'EVENT_REGISTRATION',
        entityId: reg.id,
        metadata: { eventId, eventTitle: event.title },
        requestId,
      });

      await notificationsService.createNotification({
        userId,
        type: 'EVENT_CANCELLED',
        title: 'Registration Cancelled',
        message: `Your registration for "${event.title}" has been cancelled.`,
        actionUrl: event.eligibility === 'public' ? `/events/${event.slug}` : `/member/events/${event.slug}`,
        metadata: { eventId, eventSlug: event.slug },
      });

      return updated;
    });
  }

  /**
   * Get all registered events for authenticated member
   */
  async getMemberRegisteredEvents(userId: string): Promise<{
    upcoming: MemberEventCardDto[];
    past: MemberEventCardDto[];
  }> {
    this.assertStorage();
    let registrations = Array.from(localMemoryRegistrations.values()).filter(
      (r) => r.userId === userId && r.status === 'registered'
    );

    if (this.useDatabase) {
      try {
        const { data, error } = await supabaseAdmin!
          .from('event_registrations')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'registered');
        if (error) this.storageFailure(error);

        if (data) {
          registrations = data.map((r: any) => ({
            id: r.id,
            eventId: r.event_id,
            userId: r.user_id,
            status: r.status,
            registeredAt: r.registered_at,
            cancelledAt: r.cancelled_at,
            metadata: r.metadata || {},
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));
        }
      } catch (err) { this.storageFailure(err); }
    }

    const eventIds = registrations.map((r) => r.eventId);
    const events: MemberEventCardDto[] = [];

    for (const eid of eventIds) {
      const ev = await this.getEventById(eid);
      if (ev) {
        const regCount = await this.getEventRegistrationCount(ev.id);
        const availableSeats = ev.capacity !== null && ev.capacity !== undefined ? Math.max(0, ev.capacity - regCount) : null;
        events.push({
          ...ev,
          registeredCount: regCount,
          availableSeats,
          isFull: availableSeats !== null && availableSeats <= 0,
          isRegistered: true,
          userRegistrationStatus: 'registered',
        });
      }
    }

    const now = new Date().getTime();
    const upcoming = events
      .filter((ev) => new Date(ev.startAt).getTime() >= now && ev.status !== 'completed')
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    const past = events
      .filter((ev) => new Date(ev.startAt).getTime() < now || ev.status === 'completed')
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    return { upcoming, past };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  async getEventById(id: string): Promise<EventRecord | null> {
    this.assertStorage();
    if (this.useDatabase) {
      if (!isUuid(id)) return null;
      try {
        const { data, error } = await supabaseAdmin!.from('events').select('*').eq('id', id).maybeSingle();
        if (error) this.storageFailure(error);
        return data ? this.mapDbRowToEvent(data) : null;
      } catch (err) { this.storageFailure(err); }
    }
    return localMemoryEvents.get(id) || null;
  }
  async getEventBySlug(slug: string): Promise<EventRecord | null> {
    this.assertStorage();
    if (this.useDatabase) {
      try {
        const { data, error } = await supabaseAdmin!.from('events').select('*').eq('slug', slug).maybeSingle();
        if (error) this.storageFailure(error);
        return data ? this.mapDbRowToEvent(data) : null;
      } catch (err) { this.storageFailure(err); }
    }
    return Array.from(localMemoryEvents.values()).find((event) => event.slug === slug) || null;
  }
  async getEventRegistrationCount(eventId: string): Promise<number> {
    this.assertStorage();
    if (this.useDatabase) {
      try {
        const { count, error } = await supabaseAdmin!.from('event_registrations').select('*', { count: 'exact', head: true })
          .eq('event_id', eventId).eq('status', 'registered');
        if (error || count === null) this.storageFailure(error);
        return count!;
      } catch (err) { this.storageFailure(err); }
    }
    return Array.from(localMemoryRegistrations.values()).filter((reg) => reg.eventId === eventId && reg.status === 'registered').length;
  }
  async getUserEventRegistration(eventId: string, userId: string): Promise<EventRegistrationRecord | null> {
    this.assertStorage();
    if (this.useDatabase) {
      try {
        const { data, error } = await supabaseAdmin!.from('event_registrations').select('*')
          .eq('event_id', eventId).eq('user_id', userId).order('registered_at', { ascending: false }).limit(1).maybeSingle();
        if (error) this.storageFailure(error);
        return data ? this.mapRegistration(data) : null;
      } catch (err) { this.storageFailure(err); }
    }
    return Array.from(localMemoryRegistrations.values()).find((reg) => reg.eventId === eventId && reg.userId === userId) || null;
  }

  private mapDbRowToEvent(row: any): EventRecord {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      shortDescription: row.short_description,
      description: row.description,
      category: row.category,
      eventMode: row.event_mode,
      location: row.location,
      isOnline: row.is_online,
      meetingUrl: row.meeting_url,
      coverImageUrl: row.cover_image_url,
      startAt: row.start_at,
      endAt: row.end_at,
      registrationOpenAt: row.registration_open_at,
      registrationCloseAt: row.registration_close_at,
      capacity: row.capacity,
      eligibility: row.eligibility,
      status: row.status,
      speaker: row.speaker,
      organizer: row.organizer,
      requirements: row.requirements,
      tags: row.tags || [],
      createdBy: row.created_by,
      publishedAt: row.published_at,
      cancelledAt: row.cancelled_at,
      cancellationReason: row.cancellation_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const eventsService = new EventsService();
