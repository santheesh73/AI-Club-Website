import { z } from 'zod';

const eventCategoryEnum = z.enum([
  'workshop',
  'hackathon',
  'tech_talk',
  'webinar',
  'competition',
  'meetup',
  'bootcamp',
  'other',
]);

const eventModeEnum = z.enum(['physical', 'online', 'hybrid']);
const eventEligibilityEnum = z.enum(['public', 'members_only', 'admin_only']);
const eventStatusEnum = z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled']);

export const createEventSchema = {
  body: z
    .object({
      title: z.string().trim().min(3, 'Title must be at least 3 characters'),
      shortDescription: z.string().trim().min(5, 'Short description must be at least 5 characters'),
      description: z.string().trim().min(10, 'Description must be at least 10 characters'),
      category: eventCategoryEnum,
      eventMode: eventModeEnum,
      location: z.string().trim().optional().nullable(),
      isOnline: z.boolean().optional().default(false),
      meetingUrl: z.string().url('Invalid meeting URL format').optional().nullable(),
      coverImageUrl: z.string().url('Invalid cover image URL format').optional().nullable(),
      startAt: z.string().datetime({ message: 'startAt must be a valid ISO 8601 timestamp' }),
      endAt: z.string().datetime({ message: 'endAt must be a valid ISO 8601 timestamp' }),
      registrationOpenAt: z.string().datetime({ message: 'registrationOpenAt must be valid ISO 8601 timestamp' }),
      registrationCloseAt: z.string().datetime({ message: 'registrationCloseAt must be valid ISO 8601 timestamp' }),
      capacity: z.number().int().positive('Capacity must be greater than zero').optional().nullable(),
      eligibility: eventEligibilityEnum.optional().default('members_only'),
      speaker: z.string().trim().optional().nullable(),
      organizer: z.string().trim().optional().nullable(),
      requirements: z.string().trim().optional().nullable(),
      tags: z.array(z.string().trim()).optional().default([]),
    })
    .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
      message: 'End time must be strictly after start time',
      path: ['endAt'],
    })
    .refine((data) => new Date(data.registrationCloseAt) > new Date(data.registrationOpenAt), {
      message: 'Registration closing time must be after opening time',
      path: ['registrationCloseAt'],
    })
    .refine((data) => new Date(data.registrationCloseAt) <= new Date(data.startAt), {
      message: 'Registration closing time must be on or before event start time',
      path: ['registrationCloseAt'],
    })
    .refine(
      (data) => {
        if (data.eventMode === 'physical' || data.eventMode === 'hybrid') {
          return !!data.location && data.location.trim().length > 0;
        }
        return true;
      },
      {
        message: 'Location is required for physical and hybrid events',
        path: ['location'],
      }
    )
    .refine(
      (data) => {
        if (data.eventMode === 'online' || data.eventMode === 'hybrid') {
          return !!data.meetingUrl && data.meetingUrl.trim().length > 0;
        }
        return true;
      },
      {
        message: 'Meeting URL is required for online and hybrid events',
        path: ['meetingUrl'],
      }
    ),
};

export const updateEventSchema = {
  body: z.object({
    title: z.string().trim().min(3).optional(),
    shortDescription: z.string().trim().min(5).optional(),
    description: z.string().trim().min(10).optional(),
    category: eventCategoryEnum.optional(),
    eventMode: eventModeEnum.optional(),
    location: z.string().trim().optional().nullable(),
    isOnline: z.boolean().optional(),
    meetingUrl: z.string().url().optional().nullable(),
    coverImageUrl: z.string().url().optional().nullable(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    registrationOpenAt: z.string().datetime().optional(),
    registrationCloseAt: z.string().datetime().optional(),
    capacity: z.number().int().positive().optional().nullable(),
    eligibility: eventEligibilityEnum.optional(),
    speaker: z.string().trim().optional().nullable(),
    organizer: z.string().trim().optional().nullable(),
    requirements: z.string().trim().optional().nullable(),
    tags: z.array(z.string().trim()).optional(),
  }),
};

export const cancelEventSchema = {
  body: z.object({
    cancellationReason: z.string().trim().min(3, 'Cancellation reason must be at least 3 characters'),
  }),
};

export const eventQuerySchema = {
  query: z.object({
    search: z.string().trim().optional(),
    category: eventCategoryEnum.optional(),
    status: eventStatusEnum.optional(),
    timeline: z.enum(['upcoming', 'past', 'all']).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
    sortBy: z.enum(['startAt', 'title', 'createdAt', 'capacity']).optional().default('startAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
};
