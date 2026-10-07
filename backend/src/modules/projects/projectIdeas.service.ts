import { supabaseAdmin } from '../../services/supabase';
import { AppError } from '../../utils/response';
import { auditService } from '../admin/audit.service';

export interface ProjectIdeaDto {
  id: string;
  title: string;
  description: string;
  problemStatement?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  technologies: string[];
  skills: string[];
  expectedOutcome?: string;
  referenceLinks: Array<{ label: string; url: string }>;
  mediaUrl?: string;
  status: 'draft' | 'published' | 'archived';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export class ProjectIdeasService {
  /**
   * Get all published project ideas for members
   */
  async getPublishedIdeas(params?: { category?: string; difficulty?: string }): Promise<ProjectIdeaDto[]> {
    if (!supabaseAdmin) {
      return [];
    }

    let query = supabaseAdmin
      .from('project_ideas')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (params?.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }
    if (params?.difficulty && params.difficulty !== 'all') {
      query = query.eq('difficulty', params.difficulty);
    }

    const { data, error } = await query;
    if (error) {
      throw new AppError(`Failed to fetch project ideas: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      problemStatement: row.problem_statement || undefined,
      difficulty: row.difficulty,
      category: row.category,
      technologies: Array.isArray(row.technologies) ? row.technologies : [],
      skills: Array.isArray(row.skills) ? row.skills : [],
      expectedOutcome: row.expected_outcome || undefined,
      referenceLinks: Array.isArray(row.reference_links) ? row.reference_links : [],
      mediaUrl: row.media_url || undefined,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Admin: List all project ideas
   */
  async getAllIdeas(): Promise<ProjectIdeaDto[]> {
    if (!supabaseAdmin) {
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from('project_ideas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Failed to fetch project ideas: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      problemStatement: row.problem_statement || undefined,
      difficulty: row.difficulty,
      category: row.category,
      technologies: Array.isArray(row.technologies) ? row.technologies : [],
      skills: Array.isArray(row.skills) ? row.skills : [],
      expectedOutcome: row.expected_outcome || undefined,
      referenceLinks: Array.isArray(row.reference_links) ? row.reference_links : [],
      mediaUrl: row.media_url || undefined,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Admin: Create project idea
   */
  async createIdea(
    params: {
      title: string;
      description: string;
      problemStatement?: string;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      category: string;
      technologies?: string[];
      skills?: string[];
      expectedOutcome?: string;
      referenceLinks?: Array<{ label: string; url: string }>;
      mediaUrl?: string;
      status?: 'draft' | 'published' | 'archived';
    },
    actorId: string,
    requestId?: string
  ): Promise<ProjectIdeaDto> {
    if (!supabaseAdmin) {
      throw new AppError('Database not initialized', 500, 'DATABASE_ERROR');
    }

    const { data, error } = await supabaseAdmin
      .from('project_ideas')
      .insert({
        title: params.title.trim(),
        description: params.description.trim(),
        problem_statement: params.problemStatement?.trim() || null,
        difficulty: params.difficulty || 'intermediate',
        category: params.category.trim(),
        technologies: params.technologies || [],
        skills: params.skills || [],
        expected_outcome: params.expectedOutcome?.trim() || null,
        reference_links: params.referenceLinks || [],
        media_url: params.mediaUrl?.trim() || null,
        status: params.status || 'published',
        created_by: actorId,
      })
      .select()
      .single();

    if (error || !data) {
      throw new AppError(`Failed to create project idea: ${error?.message}`, 500, 'DATABASE_ERROR');
    }

    await auditService.createLog({
      actorId,
      action: 'PROJECT_IDEA_CREATED',
      entityType: 'PROJECT_IDEA',
      entityId: data.id,
      metadata: { title: data.title, category: data.category, difficulty: data.difficulty },
      requestId,
    });

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      problemStatement: data.problem_statement,
      difficulty: data.difficulty,
      category: data.category,
      technologies: data.technologies || [],
      skills: data.skills || [],
      expectedOutcome: data.expected_outcome,
      referenceLinks: data.reference_links || [],
      mediaUrl: data.media_url,
      status: data.status,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Admin: Update project idea
   */
  async updateIdea(
    id: string,
    params: Partial<{
      title: string;
      description: string;
      problemStatement: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      category: string;
      technologies: string[];
      skills: string[];
      expectedOutcome: string;
      referenceLinks: Array<{ label: string; url: string }>;
      mediaUrl: string;
      status: 'draft' | 'published' | 'archived';
    }>,
    actorId: string,
    requestId?: string
  ): Promise<ProjectIdeaDto> {
    if (!supabaseAdmin) {
      throw new AppError('Database not initialized', 500, 'DATABASE_ERROR');
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (params.title) updates.title = params.title.trim();
    if (params.description) updates.description = params.description.trim();
    if (params.problemStatement !== undefined) updates.problem_statement = params.problemStatement?.trim() || null;
    if (params.difficulty) updates.difficulty = params.difficulty;
    if (params.category) updates.category = params.category.trim();
    if (params.technologies) updates.technologies = params.technologies;
    if (params.skills) updates.skills = params.skills;
    if (params.expectedOutcome !== undefined) updates.expected_outcome = params.expectedOutcome?.trim() || null;
    if (params.referenceLinks) updates.reference_links = params.referenceLinks;
    if (params.mediaUrl !== undefined) updates.media_url = params.mediaUrl?.trim() || null;
    if (params.status) updates.status = params.status;

    const { data, error } = await supabaseAdmin
      .from('project_ideas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(`Failed to update project idea: ${error?.message}`, 500, 'DATABASE_ERROR');
    }

    await auditService.createLog({
      actorId,
      action: 'PROJECT_IDEA_UPDATED',
      entityType: 'PROJECT_IDEA',
      entityId: id,
      metadata: updates,
      requestId,
    });

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      problemStatement: data.problem_statement,
      difficulty: data.difficulty,
      category: data.category,
      technologies: data.technologies || [],
      skills: data.skills || [],
      expectedOutcome: data.expected_outcome,
      referenceLinks: data.reference_links || [],
      mediaUrl: data.media_url,
      status: data.status,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Admin: Archive project idea
   */
  async archiveIdea(id: string, actorId: string, requestId?: string): Promise<{ success: boolean }> {
    if (!supabaseAdmin) {
      throw new AppError('Database not initialized', 500, 'DATABASE_ERROR');
    }

    const { error } = await supabaseAdmin
      .from('project_ideas')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new AppError(`Failed to archive project idea: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    await auditService.createLog({
      actorId,
      action: 'PROJECT_IDEA_ARCHIVED',
      entityType: 'PROJECT_IDEA',
      entityId: id,
      requestId,
    });

    return { success: true };
  }
}

export const projectIdeasService = new ProjectIdeasService();
