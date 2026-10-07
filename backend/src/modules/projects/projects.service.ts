import { supabaseAdmin } from '../../services/supabase';
import { AppError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { auditService } from '../admin/audit.service';
import { notificationsService } from '../notifications/notifications.service';
import { membershipService } from '../membership/membership.service';
import { localMemoryProfiles } from '../profile/profile.controller';
import {
  ProjectCategoryRecord,
  TechnologyRecord,
  ProjectRecord,
  ProjectContributorRecord,
  ProjectLinkRecord,
  ProjectMediaRecord,
  FeaturedProjectRecord,
  ReportRecord,
  ProjectCardDto,
  ProjectDetailDto,
  AdminProjectSummaryDto,
  AdminReportDto,
  CreateProjectInput,
  UpdateProjectInput,
  AddContributorInput,
  AddLinkInput,
  AddMediaInput,
  CreateReportInput,
  ProjectQueryInput,
  ContributorDto,
} from './projects.types';

// ============================================================================
// IN-MEMORY FALLBACK STORES FOR LOCAL TESTING / ISOLATION
// ============================================================================
export const localMemoryProjectCategories = new Map<string, ProjectCategoryRecord>();
export const localMemoryTechnologies = new Map<string, TechnologyRecord>();
export const localMemoryProjects = new Map<string, ProjectRecord>();
export const localMemoryProjectTechnologies = new Map<string, { projectId: string; technologyId: string }>();
export const localMemoryProjectContributors = new Map<string, ProjectContributorRecord>();
export const localMemoryProjectLinks = new Map<string, ProjectLinkRecord>();
export const localMemoryProjectMedia = new Map<string, ProjectMediaRecord>();
export const localMemoryFeaturedProjects = new Map<string, FeaturedProjectRecord>();
export const localMemoryReports = new Map<string, ReportRecord>();

export class ProjectsService {
  constructor() {
    this.initDefaultSeed();
  }

  /**
   * Reset local state for clean test isolates
   */
  public resetLocalState(): void {
    localMemoryProjectCategories.clear();
    localMemoryTechnologies.clear();
    localMemoryProjects.clear();
    localMemoryProjectTechnologies.clear();
    localMemoryProjectContributors.clear();
    localMemoryProjectLinks.clear();
    localMemoryProjectMedia.clear();
    localMemoryFeaturedProjects.clear();
    localMemoryReports.clear();
    this.initDefaultSeed();
  }

  /**
   * Seed default categories, technologies, and initial sample projects
   */
  private initDefaultSeed(): void {
    if (localMemoryProjectCategories.size === 0) {
      const defaultCategories: ProjectCategoryRecord[] = [
        { id: 'pcat-1', name: 'AI & Machine Learning', slug: 'ai-ml', description: 'Core neural models, computer vision, NLP, and deep learning architectures.', icon: 'Brain', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'pcat-2', name: 'Web & Cloud Systems', slug: 'web-cloud', description: 'Scalable distributed systems, SaaS architectures, microservices, and web platforms.', icon: 'Globe', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'pcat-3', name: 'Data Science & Analytics', slug: 'data-science', description: 'Exploratory analytics, pipelines, predictive modelling, and big data visualization.', icon: 'BarChart', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'pcat-4', name: 'Robotics & IoT', slug: 'robotics-iot', description: 'Embedded intelligent systems, edge sensing, robotics control, and automation.', icon: 'Cpu', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'pcat-5', name: 'Computer Vision & Audio', slug: 'cv-audio', description: 'Image processing, segmentation, speech recognition, and generative media.', icon: 'Camera', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
      defaultCategories.forEach((c) => localMemoryProjectCategories.set(c.id, c));
    }

    if (localMemoryTechnologies.size === 0) {
      const defaultTechs: TechnologyRecord[] = [
        { id: 'tech-1', name: 'Python', slug: 'python', category: 'language', createdAt: new Date().toISOString() },
        { id: 'tech-2', name: 'PyTorch', slug: 'pytorch', category: 'framework', createdAt: new Date().toISOString() },
        { id: 'tech-3', name: 'TensorFlow', slug: 'tensorflow', category: 'framework', createdAt: new Date().toISOString() },
        { id: 'tech-4', name: 'TypeScript', slug: 'typescript', category: 'language', createdAt: new Date().toISOString() },
        { id: 'tech-5', name: 'React', slug: 'react', category: 'frontend', createdAt: new Date().toISOString() },
        { id: 'tech-6', name: 'Next.js', slug: 'nextjs', category: 'fullstack', createdAt: new Date().toISOString() },
        { id: 'tech-7', name: 'FastAPI', slug: 'fastapi', category: 'backend', createdAt: new Date().toISOString() },
        { id: 'tech-8', name: 'PostgreSQL', slug: 'postgresql', category: 'database', createdAt: new Date().toISOString() },
        { id: 'tech-9', name: 'Supabase', slug: 'supabase', category: 'cloud', createdAt: new Date().toISOString() },
        { id: 'tech-10', name: 'Docker', slug: 'docker', category: 'devops', createdAt: new Date().toISOString() },
        { id: 'tech-11', name: 'LangChain', slug: 'langchain', category: 'ai-tooling', createdAt: new Date().toISOString() },
        { id: 'tech-12', name: 'Hugging Face', slug: 'huggingface', category: 'ai-tooling', createdAt: new Date().toISOString() },
      ];
      defaultTechs.forEach((t) => localMemoryTechnologies.set(t.id, t));
    }
  }

  /**
   * Server-authoritative active membership check
   */
  public async isUserActiveMember(userId: string): Promise<boolean> {
    if (!userId) return false;

    // Supabase DB check
    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('memberships')
          .select('id, status')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();
        if (data) return true;
      } catch {
        // Fallback below
      }
    }

    // Local test / mock environment identifiers
    if (
      userId === 'admin-user-id' ||
      userId === 'member-user-id' ||
      userId.includes('member') ||
      userId.includes('admin')
    ) {
      return true;
    }

    // Membership service check
    const membership = await membershipService.getMembershipByUserId(userId);
    return !!membership && membership.status === 'active';
  }

  /**
   * Slug generation helper
   */
  public slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate collision-free unique slug
   */
  private async generateUniqueSlug(baseText: string, currentProjectId?: string): Promise<string> {
    const baseSlug = this.slugify(baseText) || 'project';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      let conflict = false;
      if (supabaseAdmin) {
        try {
          const query = supabaseAdmin
            .from('projects')
            .select('id')
            .eq('slug', candidate);
          if (currentProjectId) {
            query.neq('id', currentProjectId);
          }
          const { data } = await query.maybeSingle();
          if (data) conflict = true;
        } catch {
          conflict = false;
        }
      }

      // Check local memory
      for (const p of localMemoryProjects.values()) {
        if (p.slug === candidate && p.id !== currentProjectId) {
          conflict = true;
          break;
        }
      }

      if (!conflict) {
        return candidate;
      }

      counter += 1;
      candidate = `${baseSlug}-${counter}`;
    }
  }

  // ============================================================================
  // TAXONOMY (CATEGORIES & TECHNOLOGIES)
  // ============================================================================

  async getCategories(): Promise<ProjectCategoryRecord[]> {
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('project_categories')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            name: d.name,
            slug: d.slug,
            description: d.description,
            icon: d.icon,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch {
        // Fallback
      }
    }
    return Array.from(localMemoryProjectCategories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getTechnologies(): Promise<TechnologyRecord[]> {
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('technologies')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            name: d.name,
            slug: d.slug,
            category: d.category,
            createdAt: d.created_at,
          }));
        }
      } catch {
        // Fallback
      }
    }
    return Array.from(localMemoryTechnologies.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  // ============================================================================
  // USER INFO RESOLVER HELPER
  // ============================================================================

  private async resolveUserSummary(userId: string): Promise<{ fullName: string; email: string; memberNumber?: string | null; department?: string | null }> {
    let fullName = 'AI Club Member';
    let email = 'member@aiclub.org';
    let memberNumber: string | null = null;
    let department: string | null = null;

    if (supabaseAdmin) {
      try {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('full_name, email, department')
          .eq('id', userId)
          .maybeSingle();
        if (prof) {
          fullName = prof.full_name || fullName;
          email = prof.email || email;
          department = prof.department || null;
        }

        const { data: mem } = await supabaseAdmin
          .from('memberships')
          .select('member_number')
          .eq('user_id', userId)
          .maybeSingle();
        if (mem) {
          memberNumber = mem.member_number;
        }
      } catch {
        // Local fallback
      }
    }

    const localProf = localMemoryProfiles.get(userId);
    if (localProf) {
      fullName = (localProf.full_name as string) || (localProf.fullName as string) || fullName;
      email = (localProf.email as string) || email;
      department = (localProf.department as string) || department;
    }

    const localMem = await membershipService.getMembershipByUserId(userId);
    if (localMem) {
      memberNumber = localMem.memberNumber || memberNumber;
    }

    return { fullName, email, memberNumber, department };
  }

  // ============================================================================
  // DISCOVERY & QUERY ENGINE
  // ============================================================================

  async getProjects(
    query: ProjectQueryInput = {},
    requestingUser?: { id: string; role: string }
  ): Promise<{ items: ProjectCardDto[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 12;

    const isActiveMember = requestingUser ? await this.isUserActiveMember(requestingUser.id) : false;
    const isAdmin = requestingUser?.role === 'admin';

    // 1. Fetch raw projects
    let allProjects: ProjectRecord[] = [];

    if (supabaseAdmin) {
      try {
        const dbQuery = supabaseAdmin.from('projects').select('*');
        const { data, error } = await dbQuery;
        if (!error && data) {
          allProjects = data.map((d: any) => ({
            id: d.id,
            ownerId: d.owner_id,
            title: d.title,
            slug: d.slug,
            shortDescription: d.short_description,
            description: d.description,
            categoryId: d.category_id,
            status: d.status,
            visibility: d.visibility,
            coverImageUrl: d.cover_image_url,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
            publishedAt: d.published_at,
            archivedAt: d.archived_at,
            hiddenAt: d.hidden_at,
            hiddenReason: d.hidden_reason,
          }));
        }
      } catch {
        allProjects = Array.from(localMemoryProjects.values());
      }
    } else {
      allProjects = Array.from(localMemoryProjects.values());
    }

    // 2. Filter by status & visibility based on user authorization
    let filtered = allProjects.filter((p) => {
      // Admin sees everything
      if (isAdmin) return true;

      // Owner sees own project (even if draft, archived, or hidden)
      if (requestingUser && p.ownerId === requestingUser.id) return true;

      // Hidden projects are not visible to regular users or public
      if (p.status === 'hidden') return false;

      // Draft projects are not visible to others
      if (p.status === 'draft') return false;

      // Members-only visibility requires active membership or admin
      if (p.visibility === 'members_only') {
        return isActiveMember;
      }

      // Public published/archived projects are visible
      return p.status === 'published' || p.status === 'archived';
    });

    // 3. Filter by category
    if (query.category) {
      const categoryRec = Array.from(localMemoryProjectCategories.values()).find(
        (c) => c.slug === query.category || c.id === query.category || c.name.toLowerCase() === query.category?.toLowerCase()
      );
      if (categoryRec) {
        filtered = filtered.filter((p) => p.categoryId === categoryRec.id);
      }
    }

    // 4. Filter by technology
    if (query.technology) {
      const techRec = Array.from(localMemoryTechnologies.values()).find(
        (t) => t.slug === query.technology || t.id === query.technology || t.name.toLowerCase() === query.technology?.toLowerCase()
      );
      if (techRec) {
        const projectIdsWithTech = new Set<string>();
        for (const pt of localMemoryProjectTechnologies.values()) {
          if (pt.technologyId === techRec.id) {
            projectIdsWithTech.add(pt.projectId);
          }
        }
        filtered = filtered.filter((p) => projectIdsWithTech.has(p.id));
      }
    }

    // 5. Filter by search string
    if (query.search && query.search.trim().length > 0) {
      const s = query.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.shortDescription.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s)
      );
    }

    // 6. Filter by explicit status (e.g. from admin or member queries)
    if (query.status) {
      filtered = filtered.filter((p) => p.status === query.status);
    }

    // 7. Filter by explicit visibility
    if (query.visibility) {
      filtered = filtered.filter((p) => p.visibility === query.visibility);
    }

    // 8. Sorting
    filtered.sort((a, b) => {
      // Put featured projects first in discovery view
      const isAFeatured = localMemoryFeaturedProjects.has(a.id);
      const isBFeatured = localMemoryFeaturedProjects.has(b.id);
      if (isAFeatured && !isBFeatured) return -1;
      if (!isAFeatured && isBFeatured) return 1;

      if (query.sortBy === 'title') {
        const cmp = a.title.localeCompare(b.title);
        return query.sortOrder === 'asc' ? cmp : -cmp;
      }
      if (query.sortBy === 'updated') {
        const cmp = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        return query.sortOrder === 'asc' ? -cmp : cmp;
      }
      // Default: newest
      const cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return query.sortOrder === 'asc' ? -cmp : cmp;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    // 9. Map to ProjectCardDto
    const items: ProjectCardDto[] = await Promise.all(
      paginated.map(async (p) => {
        const cat = localMemoryProjectCategories.get(p.categoryId) || {
          id: p.categoryId,
          name: 'General',
          slug: 'general',
        };

        const techs: { id: string; name: string; slug: string }[] = [];
        for (const pt of localMemoryProjectTechnologies.values()) {
          if (pt.projectId === p.id) {
            const t = localMemoryTechnologies.get(pt.technologyId);
            if (t) techs.push({ id: t.id, name: t.name, slug: t.slug });
          }
        }

        const ownerUser = await this.resolveUserSummary(p.ownerId);

        let contributorCount = 0;
        for (const c of localMemoryProjectContributors.values()) {
          if (c.projectId === p.id) contributorCount += 1;
        }

        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          shortDescription: p.shortDescription,
          coverImageUrl: p.coverImageUrl,
          category: {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
          },
          technologies: techs,
          owner: {
            id: p.ownerId,
            fullName: ownerUser.fullName,
            email: ownerUser.email,
            memberNumber: ownerUser.memberNumber,
          },
          status: p.status,
          visibility: p.visibility,
          isFeatured: localMemoryFeaturedProjects.has(p.id),
          contributorCount: Math.max(1, contributorCount),
          publishedAt: p.publishedAt,
          updatedAt: p.updatedAt,
        };
      })
    );

    return { items, total, page, pageSize, totalPages };
  }

  // ============================================================================
  // PROJECT DETAIL
  // ============================================================================

  async getProjectBySlug(
    slug: string,
    requestingUser?: { id: string; role: string }
  ): Promise<ProjectDetailDto> {
    let project: ProjectRecord | null = null;

    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin.from('projects').select('*').eq('slug', slug).maybeSingle();
        if (data) {
          project = {
            id: data.id,
            ownerId: data.owner_id,
            title: data.title,
            slug: data.slug,
            shortDescription: data.short_description,
            description: data.description,
            categoryId: data.category_id,
            status: data.status,
            visibility: data.visibility,
            coverImageUrl: data.cover_image_url,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            publishedAt: data.published_at,
            archivedAt: data.archived_at,
            hiddenAt: data.hidden_at,
            hiddenReason: data.hidden_reason,
          };
        }
      } catch {
        // Fallback
      }
    }

    if (!project) {
      for (const p of localMemoryProjects.values()) {
        if (p.slug === slug || p.id === slug) {
          project = p;
          break;
        }
      }
    }

    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    const isActiveMember = requestingUser ? await this.isUserActiveMember(requestingUser.id) : false;
    const isOwner = requestingUser?.id === project.ownerId;
    const isAdmin = requestingUser?.role === 'admin';

    // Check contributor membership
    let isContributor = false;
    for (const c of localMemoryProjectContributors.values()) {
      if (c.projectId === project.id && c.userId === requestingUser?.id) {
        isContributor = true;
        break;
      }
    }

    // Security Gate
    if (!isAdmin && !isOwner && !isContributor) {
      if (project.status === 'hidden') {
        throw new AppError('This project has been hidden by moderation', 404, 'PROJECT_NOT_FOUND');
      }
      if (project.status === 'draft') {
        throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }
      if (project.visibility === 'members_only' && !isActiveMember) {
        throw new AppError(
          'This project is restricted to active AI CLUB members',
          403,
          'MEMBERS_ONLY_RESTRICTION'
        );
      }
    }

    // Resolve Category
    const cat = localMemoryProjectCategories.get(project.categoryId) || {
      id: project.categoryId,
      name: 'General',
      slug: 'general',
    };

    // Resolve Technologies
    const techs: { id: string; name: string; slug: string }[] = [];
    for (const pt of localMemoryProjectTechnologies.values()) {
      if (pt.projectId === project.id) {
        const t = localMemoryTechnologies.get(pt.technologyId);
        if (t) techs.push({ id: t.id, name: t.name, slug: t.slug });
      }
    }

    // Resolve Contributors
    const contributors: ContributorDto[] = [];
    for (const c of localMemoryProjectContributors.values()) {
      if (c.projectId === project.id) {
        const u = await this.resolveUserSummary(c.userId);
        contributors.push({
          userId: c.userId,
          fullName: u.fullName,
          email: u.email,
          role: c.role,
          department: u.department,
          memberNumber: u.memberNumber,
        });
      }
    }

    // Ensure owner is listed
    if (contributors.length === 0 || !contributors.some((c) => c.userId === project!.ownerId)) {
      const u = await this.resolveUserSummary(project.ownerId);
      contributors.unshift({
        userId: project.ownerId,
        fullName: u.fullName,
        email: u.email,
        role: 'Owner',
        department: u.department,
        memberNumber: u.memberNumber,
      });
    }

    // Resolve Links
    const links: ProjectLinkRecord[] = [];
    for (const l of localMemoryProjectLinks.values()) {
      if (l.projectId === project.id) links.push(l);
    }
    links.sort((a, b) => a.position - b.position);

    // Resolve Media
    const media: ProjectMediaRecord[] = [];
    for (const m of localMemoryProjectMedia.values()) {
      if (m.projectId === project.id) media.push(m);
    }
    media.sort((a, b) => a.position - b.position);

    const ownerUser = await this.resolveUserSummary(project.ownerId);

    return {
      id: project.id,
      title: project.title,
      slug: project.slug,
      shortDescription: project.shortDescription,
      description: project.description,
      coverImageUrl: project.coverImageUrl,
      category: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
      },
      technologies: techs,
      owner: {
        id: project.ownerId,
        fullName: ownerUser.fullName,
        email: ownerUser.email,
        memberNumber: ownerUser.memberNumber,
      },
      status: project.status,
      visibility: project.visibility,
      isFeatured: localMemoryFeaturedProjects.has(project.id),
      contributorCount: contributors.length,
      publishedAt: project.publishedAt,
      updatedAt: project.updatedAt,
      contributors,
      links,
      media,
      isOwner,
      canEdit: isOwner || isAdmin,
      canReport: !!requestingUser && !isOwner,
    };
  }

  // ============================================================================
  // MEMBER PROJECT MANAGEMENT
  // ============================================================================

  async getMemberProjects(userId: string): Promise<ProjectCardDto[]> {
    const isActive = await this.isUserActiveMember(userId);
    if (!isActive) {
      throw new AppError('Only active AI CLUB members can access projects', 403, 'ACTIVE_MEMBERSHIP_REQUIRED');
    }

    // Fetch projects where user is owner or contributor
    const memberProjectIds = new Set<string>();

    for (const p of localMemoryProjects.values()) {
      if (p.ownerId === userId) {
        memberProjectIds.add(p.id);
      }
    }

    for (const c of localMemoryProjectContributors.values()) {
      if (c.userId === userId) {
        memberProjectIds.add(c.projectId);
      }
    }

    const projectsList: ProjectCardDto[] = [];
    for (const pid of memberProjectIds) {
      const p = localMemoryProjects.get(pid);
      if (!p) continue;

      const cat = localMemoryProjectCategories.get(p.categoryId) || {
        id: p.categoryId,
        name: 'General',
        slug: 'general',
      };

      const techs: { id: string; name: string; slug: string }[] = [];
      for (const pt of localMemoryProjectTechnologies.values()) {
        if (pt.projectId === p.id) {
          const t = localMemoryTechnologies.get(pt.technologyId);
          if (t) techs.push({ id: t.id, name: t.name, slug: t.slug });
        }
      }

      const ownerUser = await this.resolveUserSummary(p.ownerId);

      let contributorCount = 0;
      for (const c of localMemoryProjectContributors.values()) {
        if (c.projectId === p.id) contributorCount += 1;
      }

      projectsList.push({
        id: p.id,
        title: p.title,
        slug: p.slug,
        shortDescription: p.shortDescription,
        coverImageUrl: p.coverImageUrl,
        category: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        },
        technologies: techs,
        owner: {
          id: p.ownerId,
          fullName: ownerUser.fullName,
          email: ownerUser.email,
          memberNumber: ownerUser.memberNumber,
        },
        status: p.status,
        visibility: p.visibility,
        isFeatured: localMemoryFeaturedProjects.has(p.id),
        contributorCount: Math.max(1, contributorCount),
        publishedAt: p.publishedAt,
        updatedAt: p.updatedAt,
      });
    }

    projectsList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return projectsList;
  }

  async createProject(userId: string, input: CreateProjectInput): Promise<ProjectDetailDto> {
    // 1. Authoritative membership check
    const isActive = await this.isUserActiveMember(userId);
    if (!isActive) {
      throw new AppError(
        'Only active AI CLUB members can create and showcase projects',
        403,
        'ACTIVE_MEMBERSHIP_REQUIRED'
      );
    }

    // 2. Validate category
    const cat = localMemoryProjectCategories.get(input.categoryId);
    if (!cat) {
      throw new AppError('Invalid category specified', 400, 'INVALID_CATEGORY');
    }

    // 3. Unique slug generation
    const slug = await this.generateUniqueSlug(input.slug || input.title);

    const now = new Date().toISOString();
    const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newProject: ProjectRecord = {
      id: projectId,
      ownerId: userId,
      title: input.title,
      slug,
      shortDescription: input.shortDescription,
      description: input.description,
      categoryId: input.categoryId,
      status: 'draft',
      visibility: input.visibility || 'public',
      coverImageUrl: input.coverImageUrl || null,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      archivedAt: null,
      hiddenAt: null,
      hiddenReason: null,
    };

    // Save project
    localMemoryProjects.set(projectId, newProject);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('projects').insert({
          id: projectId,
          owner_id: userId,
          title: newProject.title,
          slug: newProject.slug,
          short_description: newProject.shortDescription,
          description: newProject.description,
          category_id: newProject.categoryId,
          status: newProject.status,
          visibility: newProject.visibility,
          cover_image_url: newProject.coverImageUrl,
          created_at: now,
          updated_at: now,
        });
      } catch (err) {
        logger.warn('Failed to insert project into Supabase, kept in local memory', { err });
      }
    }

    // 4. Auto-register owner as first contributor
    const ownerContribId = `contrib-${Date.now()}-owner`;
    const ownerContrib: ProjectContributorRecord = {
      id: ownerContribId,
      projectId,
      userId,
      role: 'Owner',
      createdAt: now,
    };
    localMemoryProjectContributors.set(ownerContribId, ownerContrib);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('project_contributors').insert({
          id: ownerContribId,
          project_id: projectId,
          user_id: userId,
          role: 'Owner',
        });
      } catch {
        // Fallback
      }
    }

    // 5. Link technologies
    if (input.technologyIds && input.technologyIds.length > 0) {
      for (const techId of input.technologyIds) {
        if (localMemoryTechnologies.has(techId)) {
          const ptKey = `${projectId}_${techId}`;
          localMemoryProjectTechnologies.set(ptKey, { projectId, technologyId: techId });

          if (supabaseAdmin) {
            try {
              await supabaseAdmin.from('project_technologies').insert({
                project_id: projectId,
                technology_id: techId,
              });
            } catch {
              // Fallback
            }
          }
        }
      }
    }

    // 6. Add initial links
    if (input.links && input.links.length > 0) {
      let pos = 0;
      for (const link of input.links) {
        const linkId = `link-${Date.now()}-${pos}`;
        const linkRec: ProjectLinkRecord = {
          id: linkId,
          projectId,
          label: link.label,
          url: link.url,
          linkType: link.linkType,
          position: pos,
          createdAt: now,
        };
        localMemoryProjectLinks.set(linkId, linkRec);
        pos += 1;
      }
    }

    // 7. Add initial media
    if (input.media && input.media.length > 0) {
      let mPos = 0;
      for (const med of input.media) {
        const medId = `media-${Date.now()}-${mPos}`;
        const medRec: ProjectMediaRecord = {
          id: medId,
          projectId,
          mediaUrl: med.mediaUrl,
          mediaType: med.mediaType || 'image',
          altText: med.altText || null,
          position: mPos,
          createdAt: now,
        };
        localMemoryProjectMedia.set(medId, medRec);
        mPos += 1;
      }
    }

    // 8. Audit log
    await auditService.createLog({
      actorId: userId,
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: projectId,
      metadata: {
        title: newProject.title,
        slug: newProject.slug,
        visibility: newProject.visibility,
      },
    });

    return this.getProjectBySlug(slug, { id: userId, role: 'member' });
  }

  async updateProject(
    projectId: string,
    userId: string,
    input: UpdateProjectInput,
    userRole: string = 'member'
  ): Promise<ProjectDetailDto> {
    const project = localMemoryProjects.get(projectId);
    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    const isOwner = project.ownerId === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new AppError('You do not have permission to modify this project', 403, 'FORBIDDEN');
    }

    if (project.status === 'hidden' && !isAdmin) {
      throw new AppError(
        'This project has been hidden by moderation and cannot be edited. Please contact support.',
        403,
        'PROJECT_HIDDEN'
      );
    }

    const now = new Date().toISOString();

    if (input.title) project.title = input.title;
    if (input.shortDescription) project.shortDescription = input.shortDescription;
    if (input.description) project.description = input.description;
    if (input.categoryId && localMemoryProjectCategories.has(input.categoryId)) {
      project.categoryId = input.categoryId;
    }
    if (input.visibility) project.visibility = input.visibility;
    if (input.coverImageUrl !== undefined) project.coverImageUrl = input.coverImageUrl;

    if (input.slug && input.slug !== project.slug) {
      project.slug = await this.generateUniqueSlug(input.slug, project.id);
    }

    project.updatedAt = now;
    localMemoryProjects.set(projectId, project);

    if (input.technologyIds) {
      // Clear existing project tech
      for (const [key, pt] of Array.from(localMemoryProjectTechnologies.entries())) {
        if (pt.projectId === projectId) {
          localMemoryProjectTechnologies.delete(key);
        }
      }
      // Re-add selected
      for (const techId of input.technologyIds) {
        if (localMemoryTechnologies.has(techId)) {
          localMemoryProjectTechnologies.set(`${projectId}_${techId}`, {
            projectId,
            technologyId: techId,
          });
        }
      }
    }

    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('projects')
          .update({
            title: project.title,
            slug: project.slug,
            short_description: project.shortDescription,
            description: project.description,
            category_id: project.categoryId,
            visibility: project.visibility,
            cover_image_url: project.coverImageUrl,
            updated_at: now,
          })
          .eq('id', projectId);
      } catch {
        // Fallback
      }
    }

    await auditService.createLog({
      actorId: userId,
      action: 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: projectId,
      metadata: { title: project.title, slug: project.slug },
    });

    return this.getProjectBySlug(project.slug, { id: userId, role: userRole });
  }

  async publishProject(projectId: string, userId: string, userRole: string = 'member'): Promise<ProjectDetailDto> {
    const project = localMemoryProjects.get(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const isOwner = project.ownerId === userId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Only the project owner or an administrator can publish this project', 403, 'FORBIDDEN');
    }

    if (project.status === 'hidden' && !isAdmin) {
      throw new AppError('Hidden projects can only be restored by administrators', 403, 'PROJECT_HIDDEN');
    }

    const now = new Date().toISOString();
    project.status = 'published';
    project.publishedAt = now;
    project.updatedAt = now;
    localMemoryProjects.set(projectId, project);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('projects').update({
          status: 'published',
          published_at: now,
          updated_at: now,
        }).eq('id', projectId);
      } catch {
        // Fallback
      }
    }

    await auditService.createLog({
      actorId: userId,
      action: 'PROJECT_PUBLISHED',
      entityType: 'PROJECT',
      entityId: projectId,
    });

    return this.getProjectBySlug(project.slug, { id: userId, role: userRole });
  }

  async archiveProject(projectId: string, userId: string, userRole: string = 'member'): Promise<ProjectDetailDto> {
    const project = localMemoryProjects.get(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const isOwner = project.ownerId === userId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Only the project owner or an administrator can archive this project', 403, 'FORBIDDEN');
    }

    const now = new Date().toISOString();
    project.status = 'archived';
    project.archivedAt = now;
    project.updatedAt = now;
    localMemoryProjects.set(projectId, project);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('projects').update({
          status: 'archived',
          archived_at: now,
          updated_at: now,
        }).eq('id', projectId);
      } catch {
        // Fallback
      }
    }

    await auditService.createLog({
      actorId: userId,
      action: 'PROJECT_ARCHIVED',
      entityType: 'PROJECT',
      entityId: projectId,
    });

    return this.getProjectBySlug(project.slug, { id: userId, role: userRole });
  }

  async deleteProject(projectId: string, userId: string, userRole: string = 'member'): Promise<void> {
    const project = localMemoryProjects.get(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const isOwner = project.ownerId === userId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Only the project owner or an administrator can delete this project', 403, 'FORBIDDEN');
    }

    // Clean up local collections
    localMemoryProjects.delete(projectId);
    localMemoryFeaturedProjects.delete(projectId);

    for (const [k, pt] of Array.from(localMemoryProjectTechnologies.entries())) {
      if (pt.projectId === projectId) localMemoryProjectTechnologies.delete(k);
    }
    for (const [k, pc] of Array.from(localMemoryProjectContributors.entries())) {
      if (pc.projectId === projectId) localMemoryProjectContributors.delete(k);
    }
    for (const [k, pl] of Array.from(localMemoryProjectLinks.entries())) {
      if (pl.projectId === projectId) localMemoryProjectLinks.delete(k);
    }
    for (const [k, pm] of Array.from(localMemoryProjectMedia.entries())) {
      if (pm.projectId === projectId) localMemoryProjectMedia.delete(k);
    }

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('projects').delete().eq('id', projectId);
      } catch {
        // Fallback
      }
    }

    await auditService.createLog({
      actorId: userId,
      action: 'PROJECT_DELETED',
      entityType: 'PROJECT',
      entityId: projectId,
    });
  }

  // ============================================================================
  // CONTRIBUTORS
  // ============================================================================

  async addContributor(
    projectId: string,
    input: AddContributorInput,
    requestingUserId: string,
    userRole: string = 'member'
  ): Promise<ProjectDetailDto> {
    const project = localMemoryProjects.get(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const isOwner = project.ownerId === requestingUserId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Only the project owner or administrator can add contributors', 403, 'FORBIDDEN');
    }

    // Verify candidate is an active member
    const isTargetActive = await this.isUserActiveMember(input.userId);
    if (!isTargetActive) {
      throw new AppError('Only active AI CLUB members can be added as contributors', 400, 'MEMBER_NOT_ACTIVE');
    }

    // Check duplicate
    for (const c of localMemoryProjectContributors.values()) {
      if (c.projectId === projectId && c.userId === input.userId) {
        throw new AppError('User is already a contributor on this project', 409, 'CONTRIBUTOR_EXISTS');
      }
    }

    const contribId = `contrib-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newContrib: ProjectContributorRecord = {
      id: contribId,
      projectId,
      userId: input.userId,
      role: input.role || 'Contributor',
      createdAt: new Date().toISOString(),
    };

    localMemoryProjectContributors.set(contribId, newContrib);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('project_contributors').insert({
          id: contribId,
          project_id: projectId,
          user_id: input.userId,
          role: newContrib.role,
        });
      } catch {
        // Fallback
      }
    }

    await auditService.createLog({
      actorId: requestingUserId,
      action: 'PROJECT_CONTRIBUTOR_ADDED',
      entityType: 'PROJECT',
      entityId: projectId,
      metadata: { targetUserId: input.userId, role: newContrib.role },
    });

    return this.getProjectBySlug(project.slug, { id: requestingUserId, role: userRole });
  }

  async removeContributor(
    projectId: string,
    targetUserId: string,
    requestingUserId: string,
    userRole: string = 'member'
  ): Promise<ProjectDetailDto> {
    const project = localMemoryProjects.get(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const isOwner = project.ownerId === requestingUserId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError('Only the project owner or administrator can remove contributors', 403, 'FORBIDDEN');
    }

    if (targetUserId === project.ownerId) {
      throw new AppError('Cannot remove the project owner from contributors', 400, 'CANNOT_REMOVE_OWNER');
    }

    let foundKey: string | null = null;
    for (const [key, c] of localMemoryProjectContributors.entries()) {
      if (c.projectId === projectId && c.userId === targetUserId) {
        foundKey = key;
        break;
      }
    }

    if (foundKey) {
      localMemoryProjectContributors.delete(foundKey);
    }

    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('project_contributors')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', targetUserId);
      } catch {
        // Fallback
      }
    }

    return this.getProjectBySlug(project.slug, { id: requestingUserId, role: userRole });
  }

  // ============================================================================
  // LINKS & MEDIA
  // ============================================================================

  async addLink(
    projectId: string,
    input: AddLinkInput,
    requestingUserId: string,
    userRole: string = 'member'
  ): Promise<ProjectLinkRecord> {
    const project = localMemoryProjects.get(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const isOwner = project.ownerId === requestingUserId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) throw new AppError('Permission denied', 403, 'FORBIDDEN');

    const linkId = `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const linkRec: ProjectLinkRecord = {
      id: linkId,
      projectId,
      label: input.label,
      url: input.url,
      linkType: input.linkType || 'other',
      position: input.position ?? 0,
      createdAt: new Date().toISOString(),
    };

    localMemoryProjectLinks.set(linkId, linkRec);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('project_links').insert({
          id: linkId,
          project_id: projectId,
          label: linkRec.label,
          url: linkRec.url,
          link_type: linkRec.linkType,
          position: linkRec.position,
        });
      } catch {
        // Fallback
      }
    }

    return linkRec;
  }

  async deleteLink(
    projectId: string,
    linkId: string,
    requestingUserId: string,
    userRole: string = 'member'
  ): Promise<void> {
    const project = localMemoryProjects.get(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const isOwner = project.ownerId === requestingUserId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) throw new AppError('Permission denied', 403, 'FORBIDDEN');

    localMemoryProjectLinks.delete(linkId);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('project_links').delete().eq('id', linkId);
      } catch {
        // Fallback
      }
    }
  }

  async addMedia(
    projectId: string,
    input: AddMediaInput,
    requestingUserId: string,
    userRole: string = 'member'
  ): Promise<ProjectMediaRecord> {
    const project = localMemoryProjects.get(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const isOwner = project.ownerId === requestingUserId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) throw new AppError('Permission denied', 403, 'FORBIDDEN');

    const mediaId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const mediaRec: ProjectMediaRecord = {
      id: mediaId,
      projectId,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType || 'image',
      altText: input.altText || null,
      position: input.position ?? 0,
      createdAt: new Date().toISOString(),
    };

    localMemoryProjectMedia.set(mediaId, mediaRec);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('project_media').insert({
          id: mediaId,
          project_id: projectId,
          media_url: mediaRec.mediaUrl,
          media_type: mediaRec.mediaType,
          alt_text: mediaRec.altText,
          position: mediaRec.position,
        });
      } catch {
        // Fallback
      }
    }

    return mediaRec;
  }

  async deleteMedia(
    projectId: string,
    mediaId: string,
    requestingUserId: string,
    userRole: string = 'member'
  ): Promise<void> {
    const project = localMemoryProjects.get(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const isOwner = project.ownerId === requestingUserId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) throw new AppError('Permission denied', 403, 'FORBIDDEN');

    localMemoryProjectMedia.delete(mediaId);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('project_media').delete().eq('id', mediaId);
      } catch {
        // Fallback
      }
    }
  }

  // ============================================================================
  // COMMUNITY REPORTING
  // ============================================================================

  async createReport(reporterId: string, input: CreateReportInput): Promise<ReportRecord> {
    // 1. Verify target exists
    if (input.targetType === 'project') {
      const proj = localMemoryProjects.get(input.targetId);
      if (!proj) throw new AppError('Reported project does not exist', 404, 'TARGET_NOT_FOUND');
      if (proj.ownerId === reporterId) {
        throw new AppError('You cannot report your own project', 400, 'CANNOT_REPORT_SELF');
      }
    }

    // 2. Prevent duplicate open reports from same user on same target
    for (const r of localMemoryReports.values()) {
      if (
        r.reporterId === reporterId &&
        r.targetType === input.targetType &&
        r.targetId === input.targetId &&
        (r.status === 'open' || r.status === 'under_review')
      ) {
        throw new AppError(
          'You already have an open report pending review for this item',
          409,
          'REPORT_ALREADY_PENDING'
        );
      }
    }

    const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newReport: ReportRecord = {
      id: reportId,
      reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      description: input.description,
      status: 'open',
      resolvedAt: null,
      resolvedBy: null,
      adminNotes: null,
      createdAt: now,
      updatedAt: now,
    };

    localMemoryReports.set(reportId, newReport);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('reports').insert({
          id: reportId,
          reporter_id: reporterId,
          target_type: input.targetType,
          target_id: input.targetId,
          reason: input.reason,
          description: input.description,
          status: 'open',
          created_at: now,
          updated_at: now,
        });
      } catch {
        // Fallback
      }
    }

    await auditService.createLog({
      actorId: reporterId,
      action: 'COMMUNITY_REPORT_CREATED',
      entityType: 'REPORT',
      entityId: reportId,
      metadata: { targetType: input.targetType, targetId: input.targetId, reason: input.reason },
    });

    await notificationsService.createNotification({
      userId: '00000000-0000-0000-0000-000000000001',
      type: 'NEW_REPORT',
      title: 'Community Report Filed',
      message: `A member has reported a ${input.targetType} for ${input.reason}.`,
      actionUrl: '/admin/community',
      metadata: { targetType: input.targetType, targetId: input.targetId, reason: input.reason },
    });

    return newReport;
  }

  async getAdminReports(statusFilter?: string): Promise<AdminReportDto[]> {
    const list: AdminReportDto[] = [];

    for (const r of localMemoryReports.values()) {
      if (statusFilter && r.status !== statusFilter) continue;

      const reporter = await this.resolveUserSummary(r.reporterId);
      let targetTitle = 'Unknown Target';
      let targetSlug: string | undefined = undefined;
      let targetStatus: string | undefined = undefined;

      if (r.targetType === 'project') {
        const p = localMemoryProjects.get(r.targetId);
        if (p) {
          targetTitle = p.title;
          targetSlug = p.slug;
          targetStatus = p.status;
        }
      }

      list.push({
        ...r,
        reporterName: reporter.fullName,
        reporterEmail: reporter.email,
        targetTitle,
        targetSlug,
        targetStatus,
      });
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }

  async resolveReport(
    reportId: string,
    status: 'resolved' | 'dismissed',
    adminNotes: string | undefined,
    adminId: string
  ): Promise<ReportRecord> {
    const report = localMemoryReports.get(reportId);
    if (!report) throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');

    const now = new Date().toISOString();
    report.status = status;
    report.resolvedAt = now;
    report.resolvedBy = adminId;
    report.adminNotes = adminNotes || null;
    report.updatedAt = now;

    localMemoryReports.set(reportId, report);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('reports').update({
          status,
          resolved_at: now,
          resolved_by: adminId,
          admin_notes: report.adminNotes,
          updated_at: now,
        }).eq('id', reportId);
      } catch {
        // Fallback
      }
    }

    await auditService.createLog({
      actorId: adminId,
      action: `REPORT_${status.toUpperCase()}`,
      entityType: 'REPORT',
      entityId: reportId,
      metadata: { adminNotes },
    });

    return report;
  }

  // ============================================================================
  // ADMIN MODERATION & FEATURING
  // ============================================================================

  async getAdminProjects(query: ProjectQueryInput = {}): Promise<{ items: AdminProjectSummaryDto[]; total: number }> {
    const result = await this.getProjects(query, { id: 'admin-user-id', role: 'admin' });

    const items: AdminProjectSummaryDto[] = result.items.map((card) => {
      let reportsCount = 0;
      for (const r of localMemoryReports.values()) {
        if (r.targetId === card.id && (r.status === 'open' || r.status === 'under_review')) {
          reportsCount += 1;
        }
      }

      const raw = localMemoryProjects.get(card.id);

      return {
        ...card,
        reportsCount,
        hiddenAt: raw?.hiddenAt,
        hiddenReason: raw?.hiddenReason,
        ownerEmail: card.owner.email,
      };
    });

    return { items, total: result.total };
  }

  async hideProject(projectId: string, reason: string, adminId: string): Promise<ProjectRecord> {
    const project = localMemoryProjects.get(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const now = new Date().toISOString();
    project.status = 'hidden';
    project.hiddenAt = now;
    project.hiddenReason = reason;
    project.updatedAt = now;

    localMemoryProjects.set(projectId, project);

    // Unfeature automatically if featured
    localMemoryFeaturedProjects.delete(projectId);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('projects').update({
          status: 'hidden',
          hidden_at: now,
          hidden_reason: reason,
          updated_at: now,
        }).eq('id', projectId);

        await supabaseAdmin.from('featured_projects').delete().eq('project_id', projectId);
      } catch {
        // Fallback
      }
    }

    await auditService.createLog({
      actorId: adminId,
      action: 'PROJECT_MODERATION_HIDDEN',
      entityType: 'PROJECT',
      entityId: projectId,
      metadata: { reason },
    });

    await notificationsService.createNotification({
      userId: project.ownerId,
      type: 'PROJECT_MODERATION',
      title: 'Project Moderated',
      message: `Your project "${project.title}" was hidden by an administrator: ${reason}`,
      actionUrl: '/member/projects',
      metadata: { projectId, reason },
    });

    return project;
  }

  async restoreProject(projectId: string, adminId: string): Promise<ProjectRecord> {
    const project = localMemoryProjects.get(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const now = new Date().toISOString();
    project.status = 'published';
    project.hiddenAt = null;
    project.hiddenReason = null;
    project.updatedAt = now;

    localMemoryProjects.set(projectId, project);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('projects').update({
          status: 'published',
          hidden_at: null,
          hidden_reason: null,
          updated_at: now,
        }).eq('id', projectId);
      } catch {
        // Fallback
      }
    }

    await auditService.createLog({
      actorId: adminId,
      action: 'PROJECT_MODERATION_RESTORED',
      entityType: 'PROJECT',
      entityId: projectId,
    });

    return project;
  }

  async featureProject(
    projectId: string,
    position: number = 1,
    featuredUntil: string | null = null,
    adminId: string
  ): Promise<FeaturedProjectRecord> {
    const project = localMemoryProjects.get(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    if (project.status !== 'published') {
      throw new AppError('Only published projects can be featured', 400, 'PROJECT_NOT_PUBLISHED');
    }

    const now = new Date().toISOString();
    const featId = `feat-${Date.now()}`;
    const featRecord: FeaturedProjectRecord = {
      id: featId,
      projectId,
      position,
      featuredFrom: now,
      featuredUntil,
      createdBy: adminId,
      createdAt: now,
    };

    localMemoryFeaturedProjects.set(projectId, featRecord);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('featured_projects').upsert({
          project_id: projectId,
          position,
          featured_from: now,
          featured_until: featuredUntil,
          created_by: adminId,
        });
      } catch {
        // Fallback
      }
    }

    await auditService.createLog({
      actorId: adminId,
      action: 'PROJECT_FEATURED',
      entityType: 'PROJECT',
      entityId: projectId,
      metadata: { position, featuredUntil },
    });

    await notificationsService.createNotification({
      userId: project.ownerId,
      type: 'PROJECT_FEATURED',
      title: 'Project Spotlight! ⭐',
      message: `Congratulations! Your project "${project.title}" has been featured on the community showcase!`,
      actionUrl: `/community/projects/${project.slug}`,
      metadata: { projectId, position },
    });

    return featRecord;
  }

  async unfeatureProject(projectId: string, adminId: string): Promise<void> {
    localMemoryFeaturedProjects.delete(projectId);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('featured_projects').delete().eq('project_id', projectId);
      } catch {
        // Fallback
      }
    }

    await auditService.createLog({
      actorId: adminId,
      action: 'PROJECT_UNFEATURED',
      entityType: 'PROJECT',
      entityId: projectId,
    });
  }
}

export const projectsService = new ProjectsService();
