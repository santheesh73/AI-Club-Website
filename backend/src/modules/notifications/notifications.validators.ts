import { z } from 'zod';

export const notificationQuerySchema = z.object({
  unreadOnly: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const updateNotificationPreferencesSchema = z.object({
  applicationUpdates: z.boolean().optional(),
  membershipUpdates: z.boolean().optional(),
  eventUpdates: z.boolean().optional(),
  courseUpdates: z.boolean().optional(),
  communityUpdates: z.boolean().optional(),
  systemNotifications: z.boolean().optional(),
});
