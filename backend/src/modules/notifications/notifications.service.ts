import { supabaseAdmin } from '../../services/supabase';
import { AppError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { auditService } from '../admin/audit.service';
import {
  NotificationRecord,
  NotificationPreferencesRecord,
  CreateNotificationDto,
  NotificationQueryDto,
  NotificationListResponseDto,
  NotificationType,
} from './notifications.types';

// In-memory fallback stores for test and local dev
export const localNotifications: NotificationRecord[] = [];
export const localPreferences = new Map<string, NotificationPreferencesRecord>();

export class NotificationsService {
  /**
   * Reset local in-memory state (test isolation helper)
   */
  public resetLocalState(): void {
    localNotifications.length = 0;
    localPreferences.clear();
  }

  /**
   * Check if a specific notification type is allowed by user preferences
   */
  private async isTypeAllowed(userId: string, type: NotificationType): Promise<boolean> {
    // Critical system, account status, and moderation alerts cannot be muted
    const criticalTypes: NotificationType[] = [
      'APPLICATION_STATUS_CHANGED',
      'MEMBERSHIP_ACTIVATED',
      'PROJECT_MODERATION',
      'SYSTEM_ALERT',
      'NEW_APPLICATION',
      'NEW_REPORT',
    ];
    if (criticalTypes.includes(type)) {
      return true;
    }

    const prefs = await this.getPreferences(userId);

    if (['EVENT_PUBLISHED', 'EVENT_REGISTRATION_CONFIRMED', 'EVENT_CANCELLED', 'EVENT_REMINDER'].includes(type)) {
      return prefs.eventUpdates;
    }
    if (['COURSE_PUBLISHED', 'COURSE_ENROLLMENT_CONFIRMED', 'COURSE_COMPLETED'].includes(type)) {
      return prefs.courseUpdates;
    }
    if (['PROJECT_FEATURED', 'ACHIEVEMENT_UNLOCKED'].includes(type)) {
      return prefs.communityUpdates;
    }
    if (type === 'ADMIN_ANNOUNCEMENT') {
      return prefs.systemNotifications;
    }

    return true;
  }

  /**
   * Create a new notification for a specific user
   */
  async createNotification(params: CreateNotificationDto): Promise<NotificationRecord | null> {
    const { userId, type, title, message, actionUrl, metadata = {} } = params;

    const allowed = await this.isTypeAllowed(userId, type);
    if (!allowed) {
      logger.info(`Notification of type ${type} skipped for user ${userId} due to preferences`);
      return null;
    }

    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record: NotificationRecord = {
      id,
      userId,
      type,
      title,
      message,
      actionUrl: actionUrl || null,
      metadata,
      readAt: null,
      createdAt: now,
    };

    localNotifications.unshift(record);

    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('notifications').insert({
          id,
          user_id: userId,
          type,
          title,
          message,
          action_url: actionUrl,
          metadata,
          read_at: null,
          created_at: now,
        });
        if (error) {
          logger.warn('Failed to insert notification into Supabase, kept in local state:', { error: error.message });
        }
      } catch (err) {
        logger.warn('Supabase notification insert error:', { error: String(err) });
      }
    }

    // Log audit event for important notification dispatches
    await auditService.createLog({
      actorId: userId,
      action: 'NOTIFICATION_CREATED',
      entityType: 'NOTIFICATION',
      entityId: id,
      metadata: { type, title },
    });

    return record;
  }

  /**
   * Retrieve notifications for authenticated user
   */
  async getNotifications(
    userId: string,
    query: NotificationQueryDto
  ): Promise<NotificationListResponseDto> {
    const { unreadOnly = false, limit = 20, offset = 0 } = query;

    if (supabaseAdmin) {
      try {
        let builder = supabaseAdmin
          .from('notifications')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (unreadOnly) {
          builder = builder.is('read_at', null);
        }

        const { data, count, error } = await builder.range(offset, offset + limit - 1);

        if (!error && data) {
          const { count: unreadCount } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .is('read_at', null);

          return {
            notifications: data.map(r => ({
              id: r.id,
              userId: r.user_id,
              type: r.type,
              title: r.title,
              message: r.message,
              actionUrl: r.action_url,
              metadata: r.metadata || {},
              readAt: r.read_at,
              createdAt: r.created_at,
            })),
            total: count || 0,
            unreadCount: unreadCount || 0,
          };
        }
      } catch {
        // Fall back to memory
      }
    }

    // Fallback in-memory
    let userNotifs = localNotifications.filter(n => n.userId === userId);
    const unreadCount = userNotifs.filter(n => n.readAt === null).length;

    if (unreadOnly) {
      userNotifs = userNotifs.filter(n => n.readAt === null);
    }

    const total = userNotifs.length;
    const paginated = userNotifs.slice(offset, offset + limit);

    return {
      notifications: paginated,
      total,
      unreadCount,
    };
  }

  /**
   * Get unread notifications count for lightweight polling / bell badge
   */
  async getUnreadCount(userId: string): Promise<number> {
    if (supabaseAdmin) {
      try {
        const { count, error } = await supabaseAdmin
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .is('read_at', null);

        if (!error && typeof count === 'number') {
          return count;
        }
      } catch {
        // Fall back to memory
      }
    }

    return localNotifications.filter(n => n.userId === userId && n.readAt === null).length;
  }

  /**
   * Mark a single notification as read (with strict ownership check)
   */
  async markAsRead(userId: string, notificationId: string): Promise<NotificationRecord> {
    const existing = localNotifications.find(n => n.id === notificationId);
    if (existing && existing.userId !== userId) {
      throw new AppError('Forbidden: Cannot modify another user notification', 403, 'FORBIDDEN');
    }

    const now = new Date().toISOString();

    if (supabaseAdmin) {
      try {
        const { data: dbItem, error: fetchErr } = await supabaseAdmin
          .from('notifications')
          .select('*')
          .eq('id', notificationId)
          .single();

        if (!fetchErr && dbItem) {
          if (dbItem.user_id !== userId) {
            throw new AppError('Forbidden: Cannot modify another user notification', 403, 'FORBIDDEN');
          }
          const { data: updated, error: updateErr } = await supabaseAdmin
            .from('notifications')
            .update({ read_at: now })
            .eq('id', notificationId)
            .select()
            .single();

          if (!updateErr && updated) {
            if (existing) existing.readAt = now;
            await auditService.createLog({
              actorId: userId,
              action: 'NOTIFICATION_READ',
              entityType: 'NOTIFICATION',
              entityId: notificationId,
            });
            return {
              id: updated.id,
              userId: updated.user_id,
              type: updated.type,
              title: updated.title,
              message: updated.message,
              actionUrl: updated.action_url,
              metadata: updated.metadata || {},
              readAt: updated.read_at,
              createdAt: updated.created_at,
            };
          }
        }
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
      }
    }

    if (!existing) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    existing.readAt = now;

    await auditService.createLog({
      actorId: userId,
      action: 'NOTIFICATION_READ',
      entityType: 'NOTIFICATION',
      entityId: notificationId,
    });

    return existing;
  }

  /**
   * Mark all unread notifications as read for the user
   */
  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const now = new Date().toISOString();
    let updatedCount = 0;

    localNotifications.forEach(n => {
      if (n.userId === userId && n.readAt === null) {
        n.readAt = now;
        updatedCount++;
      }
    });

    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('notifications')
          .update({ read_at: now })
          .eq('user_id', userId)
          .is('read_at', null);

        if (error) {
          logger.warn('Failed to mark all notifications as read in Supabase:', { error: error.message });
        }
      } catch {
        // Fall back to memory count
      }
    }

    if (updatedCount > 0) {
      await auditService.createLog({
        actorId: userId,
        action: 'NOTIFICATION_READ_ALL',
        entityType: 'NOTIFICATION_BATCH',
        entityId: userId,
        metadata: { updatedCount },
      });
    }

    return { updatedCount };
  }

  /**
   * Retrieve notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferencesRecord> {
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            userId: data.user_id,
            applicationUpdates: data.application_updates,
            membershipUpdates: data.membership_updates,
            eventUpdates: data.event_updates,
            courseUpdates: data.course_updates,
            communityUpdates: data.community_updates,
            systemNotifications: data.system_notifications,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch {
        // Fall back to memory
      }
    }

    const cached = localPreferences.get(userId);
    if (cached) {
      return cached;
    }

    const defaultPrefs: NotificationPreferencesRecord = {
      id: `pref-${userId}`,
      userId,
      applicationUpdates: true,
      membershipUpdates: true,
      eventUpdates: true,
      courseUpdates: true,
      communityUpdates: true,
      systemNotifications: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localPreferences.set(userId, defaultPrefs);
    return defaultPrefs;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<{
      applicationUpdates: boolean;
      membershipUpdates: boolean;
      eventUpdates: boolean;
      courseUpdates: boolean;
      communityUpdates: boolean;
      systemNotifications: boolean;
    }>
  ): Promise<NotificationPreferencesRecord> {
    const current = await this.getPreferences(userId);
    const updated: NotificationPreferencesRecord = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localPreferences.set(userId, updated);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('notification_preferences').upsert({
          user_id: userId,
          application_updates: updated.applicationUpdates,
          membership_updates: updated.membershipUpdates,
          event_updates: updated.eventUpdates,
          course_updates: updated.courseUpdates,
          community_updates: updated.communityUpdates,
          system_notifications: updated.systemNotifications,
          updated_at: updated.updatedAt,
        });
      } catch (err) {
        logger.warn('Failed to upsert notification preferences in Supabase:', { error: String(err) });
      }
    }

    await auditService.createLog({
      actorId: userId,
      action: 'NOTIFICATION_PREFERENCES_UPDATED',
      entityType: 'NOTIFICATION_PREFERENCES',
      entityId: userId,
      metadata: updates as Record<string, unknown>,
    });

    return updated;
  }

  /**
   * Retrieve administrative alert notifications
   */
  async getAdminNotifications(query: NotificationQueryDto): Promise<NotificationListResponseDto> {
    const adminTypes: NotificationType[] = [
      'NEW_APPLICATION',
      'NEW_REPORT',
      'COURSE_ACTIVITY_ALERT',
      'EVENT_ACTIVITY_ALERT',
      'SYSTEM_ALERT',
    ];

    const { unreadOnly = false, limit = 20, offset = 0 } = query;

    if (supabaseAdmin) {
      try {
        let builder = supabaseAdmin
          .from('notifications')
          .select('*', { count: 'exact' })
          .in('type', adminTypes)
          .order('created_at', { ascending: false });

        if (unreadOnly) {
          builder = builder.is('read_at', null);
        }

        const { data, count, error } = await builder.range(offset, offset + limit - 1);
        if (!error && data) {
          const { count: unreadCount } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .in('type', adminTypes)
            .is('read_at', null);

          return {
            notifications: data.map(r => ({
              id: r.id,
              userId: r.user_id,
              type: r.type,
              title: r.title,
              message: r.message,
              actionUrl: r.action_url,
              metadata: r.metadata || {},
              readAt: r.read_at,
              createdAt: r.created_at,
            })),
            total: count || 0,
            unreadCount: unreadCount || 0,
          };
        }
      } catch {
        // Fall back to memory
      }
    }

    let adminNotifs = localNotifications.filter(n => adminTypes.includes(n.type));
    const unreadCount = adminNotifs.filter(n => n.readAt === null).length;

    if (unreadOnly) {
      adminNotifs = adminNotifs.filter(n => n.readAt === null);
    }

    const total = adminNotifs.length;
    const paginated = adminNotifs.slice(offset, offset + limit);

    return {
      notifications: paginated,
      total,
      unreadCount,
    };
  }
}

export const notificationsService = new NotificationsService();
