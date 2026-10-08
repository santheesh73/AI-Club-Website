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

export interface CreateEventDto {
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

export interface UpdateEventDto {
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

export interface EventQueryDto {
  search?: string;
  category?: EventCategory;
  status?: EventStatus;
  timeline?: 'upcoming' | 'past' | 'all';
  page?: number;
  pageSize?: number;
  sortBy?: 'startAt' | 'title' | 'createdAt' | 'capacity';
  sortOrder?: 'asc' | 'desc';
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

// Explicit discovery projection: never serialize an EventRecord directly publicly.
export type PublicEventDto = Pick<EventRecord,
  'id' | 'slug' | 'title' | 'shortDescription' | 'description' | 'category' |
  'eventMode' | 'location' | 'isOnline' | 'coverImageUrl' | 'startAt' | 'endAt' |
  'registrationOpenAt' | 'registrationCloseAt' | 'capacity' | 'eligibility' |
  'status' | 'speaker' | 'organizer' | 'requirements' | 'tags'
> & { availableSeats: number | null; isFull: boolean };
