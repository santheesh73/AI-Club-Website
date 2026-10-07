import { supabaseAdmin } from '../../services/supabase';
import { AppError } from '../../utils/response';
import { auditService } from '../admin/audit.service';

export interface AnnouncementDto {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  audience: 'all' | 'applicants' | 'members' | 'admins';
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  expiresAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export class AnnouncementsService {
  /**
   * Get announcements visible to a given audience role
   */
  async getAnnouncementsForAudience(role: 'anon' | 'applicant' | 'member' | 'admin'): Promise<AnnouncementDto[]> {
    if (!supabaseAdmin) {
      return [];
    }

    let query = supabaseAdmin
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .order('priority', { ascending: false })
      .order('published_at', { ascending: false });

    if (role === 'anon') {
      query = query.eq('audience', 'all');
    } else if (role === 'applicant') {
      query = query.in('audience', ['all', 'applicants']);
    } else if (role === 'member') {
      query = query.in('audience', ['all', 'members']);
    }
    // Admins see all published announcements

    const { data, error } = await query;
    if (error) {
      throw new AppError(`Failed to fetch announcements: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      priority: row.priority,
      audience: row.audience,
      status: row.status,
      publishedAt: row.published_at,
      expiresAt: row.expires_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Admin: List all announcements including drafts
   */
  async getAllAnnouncements(): Promise<AnnouncementDto[]> {
    if (!supabaseAdmin) {
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Failed to fetch announcements: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      priority: row.priority,
      audience: row.audience,
      status: row.status,
      publishedAt: row.published_at,
      expiresAt: row.expires_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Admin: Create announcement
   */
  async createAnnouncement(
    params: {
      title: string;
      content: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      audience?: 'all' | 'applicants' | 'members' | 'admins';
      status?: 'draft' | 'published' | 'archived';
      expiresAt?: string;
    },
    actorId: string,
    requestId?: string
  ): Promise<AnnouncementDto> {
    if (!supabaseAdmin) {
      throw new AppError('Database not initialized', 500, 'DATABASE_ERROR');
    }

    const status = params.status || 'published';
    const publishedAt = status === 'published' ? new Date().toISOString() : null;

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        title: params.title.trim(),
        content: params.content.trim(),
        priority: params.priority || 'normal',
        audience: params.audience || 'all',
        status,
        published_at: publishedAt,
        expires_at: params.expiresAt || null,
        created_by: actorId,
      })
      .select()
      .single();

    if (error || !data) {
      throw new AppError(`Failed to create announcement: ${error?.message}`, 500, 'DATABASE_ERROR');
    }

    await auditService.createLog({
      actorId,
      action: 'ANNOUNCEMENT_CREATED',
      entityType: 'ANNOUNCEMENT',
      entityId: data.id,
      metadata: { title: data.title, audience: data.audience, priority: data.priority },
      requestId,
    });

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      priority: data.priority,
      audience: data.audience,
      status: data.status,
      publishedAt: data.published_at,
      expiresAt: data.expires_at,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Admin: Update announcement
   */
  async updateAnnouncement(
    id: string,
    params: Partial<{
      title: string;
      content: string;
      priority: 'low' | 'normal' | 'high' | 'urgent';
      audience: 'all' | 'applicants' | 'members' | 'admins';
      status: 'draft' | 'published' | 'archived';
      expiresAt: string;
    }>,
    actorId: string,
    requestId?: string
  ): Promise<AnnouncementDto> {
    if (!supabaseAdmin) {
      throw new AppError('Database not initialized', 500, 'DATABASE_ERROR');
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (params.title) updates.title = params.title.trim();
    if (params.content) updates.content = params.content.trim();
    if (params.priority) updates.priority = params.priority;
    if (params.audience) updates.audience = params.audience;
    if (params.status) {
      updates.status = params.status;
      if (params.status === 'published') {
        updates.published_at = new Date().toISOString();
      }
    }
    if (params.expiresAt !== undefined) updates.expires_at = params.expiresAt;

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(`Failed to update announcement: ${error?.message}`, 500, 'DATABASE_ERROR');
    }

    await auditService.createLog({
      actorId,
      action: 'ANNOUNCEMENT_UPDATED',
      entityType: 'ANNOUNCEMENT',
      entityId: id,
      metadata: updates,
      requestId,
    });

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      priority: data.priority,
      audience: data.audience,
      status: data.status,
      publishedAt: data.published_at,
      expiresAt: data.expires_at,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Admin: Archive announcement
   */
  async archiveAnnouncement(id: string, actorId: string, requestId?: string): Promise<{ success: boolean }> {
    if (!supabaseAdmin) {
      throw new AppError('Database not initialized', 500, 'DATABASE_ERROR');
    }

    const { error } = await supabaseAdmin
      .from('announcements')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new AppError(`Failed to archive announcement: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    await auditService.createLog({
      actorId,
      action: 'ANNOUNCEMENT_ARCHIVED',
      entityType: 'ANNOUNCEMENT',
      entityId: id,
      requestId,
    });

    return { success: true };
  }
}

export const announcementsService = new AnnouncementsService();
