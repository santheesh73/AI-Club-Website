export type EventCategory =
  | 'workshop'
  | 'hackathon'
  | 'tech_talk'
  | 'webinar'
  | 'competition'
  | 'meetup'
  | 'bootcamp'
  | 'other';

export type EventStatus =
  | 'draft'
  | 'published'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export type EventMode = 'physical' | 'online' | 'hybrid';

export type EventEligibility = 'public' | 'members_only' | 'admin_only';

export type RegistrationStatus = 'registered' | 'cancelled' | 'attended' | 'no_show';

/** Discovery fields only. Keep account and meeting details out of this contract. */
export interface PublicEventDto {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: EventCategory;
  eventMode: EventMode;
  location?: string | null;
  isOnline: boolean;
  coverImageUrl?: string | null;
  startAt: string;
  endAt: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  capacity?: number | null;
  eligibility: 'public' | 'members_only';
  status: Exclude<EventStatus, 'draft'>;
  speaker?: string | null;
  organizer?: string | null;
  requirements?: string | null;
  tags: string[];
  availableSeats: number | null;
  isFull: boolean;
}

export interface EventRegistrationRecord {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  registeredAt: string;
  cancelledAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EventRegistrationStatusDto {
  isRegistered: boolean;
  registration: EventRegistrationRecord | null;
  meetingUrl: string | null;
}

export function isPublicEventDto(value: unknown): value is PublicEventDto {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;
  const strings = ['id', 'slug', 'title', 'shortDescription', 'description'];
  const dates = ['startAt', 'endAt', 'registrationOpenAt', 'registrationCloseAt'];
  const optionalStrings = ['location', 'coverImageUrl', 'speaker', 'organizer', 'requirements'];
  return strings.every((key) => typeof event[key] === 'string')
    && Boolean(event.id && event.title)
    && typeof event.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(event.slug)
    && dates.every((key) => typeof event[key] === 'string' && Number.isFinite(Date.parse(event[key] as string)))
    && Date.parse(event.endAt as string) > Date.parse(event.startAt as string)
    && Date.parse(event.registrationCloseAt as string) >= Date.parse(event.registrationOpenAt as string)
    && ['workshop', 'hackathon', 'tech_talk', 'webinar', 'competition', 'meetup', 'bootcamp', 'other'].includes(String(event.category))
    && ['physical', 'online', 'hybrid'].includes(String(event.eventMode))
    && ['public', 'members_only'].includes(String(event.eligibility))
    && ['published', 'ongoing', 'completed', 'cancelled'].includes(String(event.status))
    && typeof event.isOnline === 'boolean' && typeof event.isFull === 'boolean'
    && (event.availableSeats === null || (typeof event.availableSeats === 'number' && Number.isInteger(event.availableSeats) && event.availableSeats >= 0))
    && (event.capacity == null || (typeof event.capacity === 'number' && Number.isInteger(event.capacity) && event.capacity > 0))
    && optionalStrings.every((key) => event[key] == null || typeof event[key] === 'string')
    && Array.isArray(event.tags) && event.tags.every((tag) => typeof tag === 'string');
}

export function isEventRegistrationRecord(value: unknown): value is EventRegistrationRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return ['id', 'eventId', 'userId'].every((key) => typeof record[key] === 'string' && Boolean(record[key]))
    && ['registered', 'cancelled', 'attended', 'no_show'].includes(String(record.status))
    && ['registeredAt', 'createdAt', 'updatedAt'].every((key) => typeof record[key] === 'string' && Number.isFinite(Date.parse(record[key] as string)));
}

export function isEventRegistrationStatusDto(value: unknown): value is EventRegistrationStatusDto {
  if (!value || typeof value !== 'object') return false;
  const status = value as Record<string, unknown>;
  return typeof status.isRegistered === 'boolean'
    && (status.registration === null || isEventRegistrationRecord(status.registration))
    && status.isRegistered === (status.registration !== null && (status.registration as EventRegistrationRecord).status === 'registered')
    && (status.meetingUrl === null || typeof status.meetingUrl === 'string')
    && (status.isRegistered || status.meetingUrl === null);
}

export interface EventRecord {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: EventCategory;
  eventMode: EventMode;
  location?: string | null;
  isOnline: boolean;
  meetingUrl?: string | null;
  coverImageUrl?: string | null;
  startAt: string;
  endAt: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  capacity?: number | null;
  eligibility: EventEligibility;
  status: EventStatus;
  speaker?: string | null;
  organizer?: string | null;
  requirements?: string | null;
  tags: string[];
  createdBy?: string | null;
  publishedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberEventCardDto extends EventRecord {
  registeredCount: number;
  availableSeats: number | null;
  isFull: boolean;
  isRegistered: boolean;
  userRegistrationStatus?: RegistrationStatus | null;
}

export interface EventDetailDto extends MemberEventCardDto {
  registrationId?: string | null;
}

export interface AdminEventSummaryDto extends EventRecord {
  registeredCount: number;
  availableSeats: number | null;
  registrationRate: number;
}

export interface RegistrationAttendeeDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  memberNumber?: string | null;
  department?: string | null;
  status: RegistrationStatus;
  registeredAt: string;
}

export interface CreateEventInput {
  title: string;
  shortDescription: string;
  description: string;
  category: EventCategory;
  eventMode: EventMode;
  location?: string | null;
  isOnline?: boolean;
  meetingUrl?: string | null;
  coverImageUrl?: string | null;
  startAt: string;
  endAt: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  capacity?: number | null;
  eligibility?: EventEligibility;
  speaker?: string | null;
  organizer?: string | null;
  requirements?: string | null;
  tags?: string[];
}

export interface UpdateEventInput {
  title?: string;
  shortDescription?: string;
  description?: string;
  category?: EventCategory;
  eventMode?: EventMode;
  location?: string | null;
  isOnline?: boolean;
  meetingUrl?: string | null;
  coverImageUrl?: string | null;
  startAt?: string;
  endAt?: string;
  registrationOpenAt?: string;
  registrationCloseAt?: string;
  capacity?: number | null;
  eligibility?: EventEligibility;
  speaker?: string | null;
  organizer?: string | null;
  requirements?: string | null;
  tags?: string[];
}
