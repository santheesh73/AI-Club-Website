import { supabaseAdmin } from '../../services/supabase';
import { AppError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { auditService } from '../admin/audit.service';
import {
  CourseRecommendationResult,
  ExternalCourseEntity,
  MemberLearningContext,
  CandidateCourseItem,
} from './providers/courseProvider.types';
import {
  normalizeProviderKey,
  validateOfficialCourseUrl,
} from './providers/urlValidator';
import { AIRecommendationProvider } from './ai/recommendationProvider.types';
import { GeminiRecommendationProvider } from './ai/geminiRecommendationProvider';
import { DeterministicRecommendationProvider } from './ai/deterministicRecommendationProvider';

// In-memory cache fallback for recommendation results & rate limits
interface CachedRecommendationRecord {
  recommendations: CourseRecommendationResult[];
  expiresAt: number;
}
const localRecommendationCache = new Map<string, CachedRecommendationRecord>();
const refreshRateLimitTracker = new Map<string, { count: number; resetTime: number }>();

// In-memory store for fallback / tests if database is offline
const memoryExternalCourses: Map<string, ExternalCourseEntity> = new Map();

export class CourseRecommendationsService {
  private aiProvider: AIRecommendationProvider;
  private deterministicFallback: DeterministicRecommendationProvider;

  constructor(aiProvider?: AIRecommendationProvider) {
    this.deterministicFallback = new DeterministicRecommendationProvider();
    this.aiProvider = aiProvider || new GeminiRecommendationProvider();
  }

  /**
   * Set custom AI provider (useful for testing or switching to future LLM providers)
   */
  public setAiProvider(provider: AIRecommendationProvider): void {
    this.aiProvider = provider;
  }

  /**
   * Reset local in-memory caches (testing helper)
   */
  public resetLocalCache(): void {
    localRecommendationCache.clear();
    refreshRateLimitTracker.clear();
  }

  /**
   * Retrieves all verified, active, published external courses from the catalog.
   * STRICT GUARANTEE: Excludes any course whose official URL fails provider validation.
   */
  async getPublishedExternalCourses(): Promise<ExternalCourseEntity[]> {
    let rows: Record<string, unknown>[] = [];

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('external_courses')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) {
          logger.warn('Failed to query external_courses from Supabase:', { error: error.message });
        } else if (data) {
          rows = data;
        }
      } catch (err: unknown) {
        logger.warn('Exception querying external_courses:', { err });
      }
    }

    // Merge in-memory fallback courses if available
    const activeFromMemory = Array.from(memoryExternalCourses.values())
      .filter((c) => c.status === 'published' && c.isActive);

    const resultCourses: ExternalCourseEntity[] = [];

    for (const row of rows) {
      const provider = String(row.provider || 'Coursera');
      const providerKey = normalizeProviderKey(provider);
      const rawUrl = String(row.official_url || '');

      // Strict URL verification
      const urlCheck = validateOfficialCourseUrl(rawUrl, providerKey);
      if (!urlCheck.isValid || !urlCheck.normalizedUrl) {
        logger.warn(`[ExternalCourse] Excluded course "${row.title}" (ID: ${row.id}) due to invalid URL: ${urlCheck.error}`);
        continue;
      }

      // Check isActive if column present
      if (row.is_active === false) {
        continue;
      }

      resultCourses.push({
        id: String(row.id),
        title: String(row.title),
        provider,
        providerKey,
        description: String(row.description || ''),
        category: String(row.category || 'AI'),
        skills: Array.isArray(row.skills) ? (row.skills as string[]) : [],
        difficulty: (row.difficulty as ExternalCourseEntity['difficulty']) || 'all_levels',
        officialUrl: urlCheck.normalizedUrl,
        imageUrl: row.image_url ? String(row.image_url) : undefined,
        duration: row.duration ? String(row.duration) : undefined,
        language: row.language ? String(row.language) : 'English',
        priceType: (row.price_type as ExternalCourseEntity['priceType']) || 'free',
        rating: typeof row.rating === 'number' ? row.rating : undefined,
        isActive: row.is_active !== false,
        status: (row.status as ExternalCourseEntity['status']) || 'published',
        lastVerifiedAt: String(row.last_verified_at || new Date().toISOString()),
        createdAt: String(row.created_at || new Date().toISOString()),
        updatedAt: String(row.updated_at || new Date().toISOString()),
      });
    }

    // Include any in-memory courses not already represented
    for (const mem of activeFromMemory) {
      if (!resultCourses.some((c) => c.id === mem.id || c.officialUrl === mem.officialUrl)) {
        resultCourses.push(mem);
      }
    }

    return resultCourses;
  }

  /**
   * Builds rich, consolidated student learning signals from existing database tables:
   * 1. profiles (skills, interests, department)
   * 2. course_enrollments + courses (completed courses, in-progress learning)
   * 3. projects / project_contributors (technologies, categories, titles)
   * 4. achievements (awarded badges, categories)
   */
  async getMemberLearningProfile(userId: string): Promise<{
    context: MemberLearningContext;
    hasSufficientSignals: boolean;
  }> {
    const context: MemberLearningContext = {
      skills: [],
      interests: [],
      completedCourses: [],
      currentLearning: [],
      projectTopics: [],
    };

    if (!supabaseAdmin) {
      return { context, hasSufficientSignals: true };
    }

    try {
      // 1. Profile signals
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('skills, interests, department')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        context.skills = Array.isArray(profile.skills) ? profile.skills : [];
        context.interests = Array.isArray(profile.interests) ? profile.interests : [];
        if (profile.department) context.department = profile.department;
      }

      // 2. Internal course learning records
      const { data: enrollments } = await supabaseAdmin
        .from('course_enrollments')
        .select(`
          status,
          progress_percentage,
          course:courses (title, category)
        `)
        .eq('user_id', userId);

      if (enrollments) {
        for (const item of enrollments) {
          const courseInfo = item.course as unknown as { title: string; category: string } | null;
          if (!courseInfo) continue;

          if (item.status === 'completed' || item.progress_percentage === 100) {
            context.completedCourses.push(courseInfo.title);
          } else {
            context.currentLearning.push(courseInfo.title);
          }
        }
      }

      // 3. Project signals
      const { data: userProjects } = await supabaseAdmin
        .from('projects')
        .select('title, category, tags')
        .eq('created_by', userId);

      if (userProjects) {
        for (const p of userProjects) {
          if (p.title) context.projectTopics.push(p.title);
          if (p.category) context.projectTopics.push(p.category);
          if (Array.isArray(p.tags)) {
            context.skills.push(...p.tags);
          }
        }
      }

      // 4. Achievement signals
      const { data: achievements } = await supabaseAdmin
        .from('achievements')
        .select('title, category')
        .eq('user_id', userId);

      if (achievements) {
        for (const a of achievements) {
          if (a.category) context.interests.push(a.category);
        }
      }
    } catch (err: unknown) {
      logger.warn('Failed to collect full learning profile for member:', { userId, err });
    }

    // Deduplicate array values
    context.skills = [...new Set(context.skills.filter(Boolean))];
    context.interests = [...new Set(context.interests.filter(Boolean))];
    context.completedCourses = [...new Set(context.completedCourses.filter(Boolean))];
    context.currentLearning = [...new Set(context.currentLearning.filter(Boolean))];
    context.projectTopics = [...new Set(context.projectTopics.filter(Boolean))];

    const hasSufficientSignals =
      context.skills.length > 0 ||
      context.interests.length > 0 ||
      context.completedCourses.length > 0 ||
      context.projectTopics.length > 0;

    return { context, hasSufficientSignals };
  }

  /**
   * Deterministically filters the candidate courses pool to a relevant subset of 20-50 courses.
   * Prevents sending entire database to LLM, drastically cutting token cost, latency & hallucination risk.
   */
  retrieveCandidateCourses(
    context: MemberLearningContext,
    allCourses: ExternalCourseEntity[],
    maxCandidates = 30
  ): CandidateCourseItem[] {
    const userSkills = new Set(context.skills.map((s) => s.toLowerCase().trim()));
    const userInterests = new Set(context.interests.map((i) => i.toLowerCase().trim()));
    const projectTopics = context.projectTopics.map((p) => p.toLowerCase().trim());

    // Score all courses deterministically for candidate filtering
    const scoredCandidates = allCourses.map((course) => {
      let relevance = 0;
      const courseSkills = course.skills.map((s) => s.toLowerCase().trim());
      const categoryLower = course.category.toLowerCase().trim();
      const titleLower = course.title.toLowerCase().trim();

      // Check skill matches
      for (const s of courseSkills) {
        if (userSkills.has(s)) relevance += 10;
      }

      // Check interest matches
      for (const i of userInterests) {
        if (categoryLower.includes(i) || titleLower.includes(i)) relevance += 15;
      }

      // Check project topic matches
      for (const p of projectTopics) {
        if (categoryLower.includes(p) || titleLower.includes(p) || courseSkills.includes(p)) {
          relevance += 10;
        }
      }

      // Rating bonus
      if (course.rating && course.rating >= 4.8) {
        relevance += 5;
      }

      return {
        course,
        relevance,
      };
    });

    // Sort by preliminary candidate relevance
    scoredCandidates.sort((a, b) => b.relevance - a.relevance);

    const candidates = scoredCandidates.slice(0, maxCandidates).map(({ course }) => ({
      id: course.id,
      title: course.title,
      provider: course.provider,
      category: course.category,
      difficulty: course.difficulty,
      skills: course.skills,
      description: course.description,
      rating: course.rating,
    }));

    return candidates;
  }

  /**
   * Main recommendation entrypoint.
   * Coordinates cached retrieval, candidate retrieval, AI ranking, strict verification, and caching.
   */
  async getRecommendationsForMember(
    userId: string,
    options: { forceRefresh?: boolean } = {}
  ): Promise<{
    recommendations: CourseRecommendationResult[];
    source: 'cache' | 'ai' | 'fallback';
    emptyReason?: string;
  }> {
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();

    // 1. Check in-memory cache if forceRefresh is false
    if (!options.forceRefresh) {
      const cached = localRecommendationCache.get(userId);
      if (cached && cached.expiresAt > now && cached.recommendations.length > 0) {
        return {
          recommendations: cached.recommendations,
          source: 'cache',
        };
      }

      // Check database cache if table exists
      if (supabaseAdmin) {
        try {
          const { data: dbRecs, error: dbErr } = await supabaseAdmin
            .from('course_recommendations')
            .select(`
              reason,
              match_score,
              skill_gap,
              generated_at,
              expires_at,
              course:external_courses (*)
            `)
            .eq('user_id', userId)
            .gt('expires_at', new Date().toISOString())
            .order('match_score', { ascending: false });

          if (!dbErr && dbRecs && dbRecs.length > 0) {
            const mapped: CourseRecommendationResult[] = [];
            for (const item of dbRecs) {
              const rawCourse = item.course as unknown as Record<string, unknown> | null;
              if (!rawCourse) continue;

              const urlCheck = validateOfficialCourseUrl(
                String(rawCourse.official_url || ''),
                String(rawCourse.provider || 'Coursera')
              );

              if (!urlCheck.isValid || !urlCheck.normalizedUrl) continue;

              mapped.push({
                course: {
                  id: String(rawCourse.id),
                  title: String(rawCourse.title),
                  provider: String(rawCourse.provider),
                  providerKey: normalizeProviderKey(String(rawCourse.provider)),
                  description: String(rawCourse.description || ''),
                  category: String(rawCourse.category || 'AI'),
                  skills: Array.isArray(rawCourse.skills) ? (rawCourse.skills as string[]) : [],
                  difficulty: (rawCourse.difficulty as ExternalCourseEntity['difficulty']) || 'all_levels',
                  officialUrl: urlCheck.normalizedUrl,
                  imageUrl: rawCourse.image_url ? String(rawCourse.image_url) : undefined,
                  duration: rawCourse.duration ? String(rawCourse.duration) : undefined,
                  priceType: (rawCourse.price_type as ExternalCourseEntity['priceType']) || 'free',
                  rating: typeof rawCourse.rating === 'number' ? rawCourse.rating : undefined,
                  isActive: rawCourse.is_active !== false,
                  status: (rawCourse.status as ExternalCourseEntity['status']) || 'published',
                  lastVerifiedAt: String(rawCourse.last_verified_at || new Date().toISOString()),
                  createdAt: String(rawCourse.created_at || new Date().toISOString()),
                  updatedAt: String(rawCourse.updated_at || new Date().toISOString()),
                },
                relevanceScore: Number(item.match_score),
                matchReasons: [String(item.reason)],
                explanation: String(item.reason),
                skillGap: item.skill_gap ? String(item.skill_gap) : undefined,
                isAiRanked: true,
                generatedAt: String(item.generated_at),
              });
            }

            if (mapped.length > 0) {
              localRecommendationCache.set(userId, {
                recommendations: mapped,
                expiresAt: new Date(dbRecs[0].expires_at).getTime(),
              });
              return { recommendations: mapped, source: 'cache' };
            }
          }
        } catch {
          // Schema may not have table yet, gracefully proceed
        }
      }
    }

    // 2. Enforce refresh rate limiting (Max 10 refreshes per hour per member)
    if (options.forceRefresh) {
      const windowMs = 60 * 60 * 1000;
      let record = refreshRateLimitTracker.get(userId);
      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + windowMs };
        refreshRateLimitTracker.set(userId, record);
      } else {
        record.count += 1;
        if (record.count > 10) {
          const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
          throw new AppError(
            `Recommendation refresh limit reached. Please wait ${Math.ceil(retryAfterSec / 60)} minutes before refreshing again.`,
            429,
            'TOO_MANY_REQUESTS',
            { retryAfterSeconds: retryAfterSec }
          );
        }
      }
    }

    // 3. Collect active courses & student learning profile
    const allCourses = await this.getPublishedExternalCourses();
    if (allCourses.length === 0) {
      return {
        recommendations: [],
        source: 'fallback',
        emptyReason: 'NO_COURSES_AVAILABLE',
      };
    }

    const { context, hasSufficientSignals } = await this.getMemberLearningProfile(userId);
    if (!hasSufficientSignals) {
      return {
        recommendations: [],
        source: 'fallback',
        emptyReason: 'INSUFFICIENT_SIGNALS',
      };
    }

    // 4. Retrieve candidate set
    const candidates = this.retrieveCandidateCourses(context, allCourses, 30);
    const candidateMap = new Map(allCourses.map((c) => [c.id, c]));

    // 5. Query AI Recommendation Provider (with deterministic fallback)
    let aiRecs = await this.aiProvider.rankCandidateCourses(context, candidates);
    let source: 'ai' | 'fallback' = 'ai';

    if (!aiRecs || aiRecs.length === 0) {
      logger.info(`[CourseRecommendations] AI returned empty recommendations for user ${userId}. Using deterministic provider.`);
      aiRecs = await this.deterministicFallback.rankCandidateCourses(context, candidates);
      source = 'fallback';
    }

    // 6. Authoritative Server Verification:
    // Discard any AI suggestion that doesn't correspond to a real, valid course in candidateMap!
    const verifiedRecommendations: CourseRecommendationResult[] = [];
    const generatedAtIso = new Date().toISOString();

    for (const rec of aiRecs) {
      const courseEntity = candidateMap.get(rec.course_id);
      if (!courseEntity) {
        logger.warn(`[CourseRecommendations] Rejected course ID ${rec.course_id} not present in database catalog!`);
        continue;
      }

      // Re-verify official URL security
      const urlCheck = validateOfficialCourseUrl(courseEntity.officialUrl, courseEntity.providerKey);
      if (!urlCheck.isValid || !urlCheck.normalizedUrl) {
        logger.warn(`[CourseRecommendations] Discarded course ${courseEntity.title} due to URL validation failure: ${urlCheck.error}`);
        continue;
      }

      verifiedRecommendations.push({
        course: {
          ...courseEntity,
          officialUrl: urlCheck.normalizedUrl,
        },
        relevanceScore: rec.match_score,
        matchReasons: [rec.reason],
        explanation: rec.reason,
        skillGap: rec.skill_gap,
        isAiRanked: source === 'ai',
        generatedAt: generatedAtIso,
      });

      if (verifiedRecommendations.length >= 10) break;
    }

    // 7. Store in Cache (In-Memory + Database)
    const expiresAtMs = now + CACHE_TTL_MS;
    localRecommendationCache.set(userId, {
      recommendations: verifiedRecommendations,
      expiresAt: expiresAtMs,
    });

    if (supabaseAdmin && verifiedRecommendations.length > 0) {
      try {
        const dbPayload = verifiedRecommendations.map((r) => ({
          user_id: userId,
          course_id: r.course.id,
          reason: r.explanation,
          match_score: r.relevanceScore,
          skill_gap: r.skillGap || null,
          generated_at: generatedAtIso,
          expires_at: new Date(expiresAtMs).toISOString(),
        }));

        await supabaseAdmin
          .from('course_recommendations')
          .upsert(dbPayload, { onConflict: 'user_id,course_id' });
      } catch (err: unknown) {
        logger.warn('Failed to persist course_recommendations to DB cache:', { err });
      }
    }

    // 8. Audit event
    await auditService.createLog({
      actorId: userId,
      action: 'COURSE_RECOMMENDATION_GENERATED',
      entityType: 'COURSE_RECOMMENDATIONS',
      entityId: userId,
      metadata: {
        count: verifiedRecommendations.length,
        source,
      },
    });

    return {
      recommendations: verifiedRecommendations,
      source,
    };
  }

  /**
   * Safe click logger for external course navigation.
   * Logs audit analytics event and returns verified official URL.
   */
  async recordExternalCourseClick(
    userId: string,
    courseId: string
  ): Promise<{ officialUrl: string; provider: string; title: string }> {
    let course: ExternalCourseEntity | undefined;

    // Check database
    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('external_courses')
          .select('*')
          .eq('id', courseId)
          .maybeSingle();

        if (data) {
          const providerKey = normalizeProviderKey(data.provider);
          const urlCheck = validateOfficialCourseUrl(data.official_url, providerKey);
          if (urlCheck.isValid && urlCheck.normalizedUrl) {
            course = {
              id: data.id,
              title: data.title,
              provider: data.provider,
              providerKey,
              description: data.description,
              category: data.category,
              skills: data.skills || [],
              difficulty: data.difficulty,
              officialUrl: urlCheck.normalizedUrl,
              isActive: data.is_active !== false,
              status: data.status,
              lastVerifiedAt: data.last_verified_at,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };
          }
        }
      } catch (err) {
        logger.warn('Error reading course for click tracking:', { err });
      }
    }

    if (!course) {
      course = memoryExternalCourses.get(courseId);
    }

    if (!course) {
      throw new AppError('External course not found in catalog.', 404, 'COURSE_NOT_FOUND');
    }

    // Log EXTERNAL_COURSE_CLICKED audit event
    await auditService.createLog({
      actorId: userId,
      action: 'EXTERNAL_COURSE_CLICKED',
      entityType: 'EXTERNAL_COURSE',
      entityId: courseId,
      metadata: {
        provider: course.provider,
        courseTitle: course.title,
        officialUrl: course.officialUrl,
      },
    });

    return {
      officialUrl: course.officialUrl,
      provider: course.provider,
      title: course.title,
    };
  }

  // ============================================================================
  // ADMIN CATALOG MANAGEMENT
  // ============================================================================

  /**
   * Admin: List external courses with filtering and pagination
   */
  async listExternalCoursesForAdmin(params: {
    provider?: string;
    category?: string;
    status?: string;
    search?: string;
  } = {}): Promise<ExternalCourseEntity[]> {
    let query = supabaseAdmin
      ? supabaseAdmin.from('external_courses').select('*').order('created_at', { ascending: false })
      : null;

    if (query) {
      if (params.provider) {
        query = query.ilike('provider', `%${params.provider}%`);
      }
      if (params.category) {
        query = query.eq('category', params.category);
      }
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.search) {
        query = query.ilike('title', `%${params.search}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map((row) => ({
          id: row.id,
          title: row.title,
          provider: row.provider,
          providerKey: normalizeProviderKey(row.provider),
          description: row.description,
          category: row.category,
          skills: row.skills || [],
          difficulty: row.difficulty,
          officialUrl: row.official_url,
          imageUrl: row.image_url,
          duration: row.duration,
          language: row.language,
          priceType: row.price_type,
          rating: row.rating,
          isActive: row.is_active !== false,
          status: row.status,
          lastVerifiedAt: row.last_verified_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
    }

    // Memory fallback
    let list = Array.from(memoryExternalCourses.values());
    if (params.provider) {
      list = list.filter((c) => c.provider.toLowerCase().includes(params.provider!.toLowerCase()));
    }
    if (params.category) {
      list = list.filter((c) => c.category === params.category);
    }
    if (params.status) {
      list = list.filter((c) => c.status === params.status);
    }
    if (params.search) {
      list = list.filter((c) => c.title.toLowerCase().includes(params.search!.toLowerCase()));
    }
    return list;
  }

  /**
   * Admin: Create a new external course with strict URL validation and duplicate prevention
   */
  async createExternalCourse(
    data: {
      title: string;
      provider: string;
      officialUrl: string;
      category: string;
      skills?: string[];
      difficulty?: ExternalCourseEntity['difficulty'];
      description: string;
      imageUrl?: string;
      duration?: string;
      language?: string;
      priceType?: ExternalCourseEntity['priceType'];
      rating?: number;
      status?: ExternalCourseEntity['status'];
    },
    adminUserId: string
  ): Promise<ExternalCourseEntity> {
    const providerKey = normalizeProviderKey(data.provider);

    // 1. Strict URL validation
    const urlCheck = validateOfficialCourseUrl(data.officialUrl, providerKey);
    if (!urlCheck.isValid || !urlCheck.normalizedUrl) {
      throw new AppError(urlCheck.error || 'Invalid official course URL.', 400, 'INVALID_URL');
    }

    const normalizedUrl = urlCheck.normalizedUrl;

    // 2. Prevent duplicate course records for the same provider + URL
    if (supabaseAdmin) {
      const { data: existing } = await supabaseAdmin
        .from('external_courses')
        .select('id, title')
        .eq('official_url', normalizedUrl)
        .maybeSingle();

      if (existing) {
        throw new AppError(
          `A course with this official URL already exists: "${existing.title}".`,
          409,
          'DUPLICATE_COURSE'
        );
      }

      const insertPayload: Record<string, unknown> = {
        title: data.title.trim(),
        provider: data.provider.trim(),
        official_url: normalizedUrl,
        category: data.category.trim(),
        skills: data.skills || [],
        difficulty: data.difficulty || 'beginner',
        description: data.description.trim(),
        source: 'curated',
        status: data.status || 'published',
        last_verified_at: new Date().toISOString(),
      };
      if (data.imageUrl) insertPayload.image_url = data.imageUrl;

      const { data: inserted, error } = await supabaseAdmin
        .from('external_courses')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        throw new AppError(`Failed to save external course: ${error.message}`, 500, 'DATABASE_ERROR');
      }

      await auditService.createLog({
        actorId: adminUserId,
        action: 'EXTERNAL_COURSE_CREATED',
        entityType: 'EXTERNAL_COURSE',
        entityId: inserted.id,
        metadata: { title: data.title, provider: data.provider, officialUrl: normalizedUrl },
      });

      return {
        id: inserted.id,
        title: inserted.title,
        provider: inserted.provider,
        providerKey,
        description: inserted.description,
        category: inserted.category,
        skills: inserted.skills || [],
        difficulty: inserted.difficulty,
        officialUrl: inserted.official_url,
        imageUrl: inserted.image_url,
        duration: inserted.duration,
        language: inserted.language,
        priceType: inserted.price_type,
        rating: inserted.rating,
        isActive: inserted.is_active !== false,
        status: inserted.status,
        lastVerifiedAt: inserted.last_verified_at,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
      };
    }

    // Memory fallback
    const newCourse: ExternalCourseEntity = {
      id: `ext-${Date.now()}`,
      title: data.title.trim(),
      provider: data.provider.trim(),
      providerKey,
      description: data.description.trim(),
      category: data.category.trim(),
      skills: data.skills || [],
      difficulty: data.difficulty || 'beginner',
      officialUrl: normalizedUrl,
      imageUrl: data.imageUrl,
      duration: data.duration,
      language: data.language || 'English',
      priceType: data.priceType || 'free',
      rating: data.rating,
      isActive: true,
      status: data.status || 'published',
      lastVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryExternalCourses.set(newCourse.id, newCourse);
    return newCourse;
  }

  /**
   * Admin: Update an existing external course record
   */
  async updateExternalCourse(
    id: string,
    updates: Partial<ExternalCourseEntity>,
    adminUserId: string
  ): Promise<ExternalCourseEntity> {
    let normalizedUrl: string | undefined;

    if (updates.officialUrl) {
      const providerKey = updates.provider ? normalizeProviderKey(updates.provider) : 'COURSERA';
      const urlCheck = validateOfficialCourseUrl(updates.officialUrl, providerKey);
      if (!urlCheck.isValid || !urlCheck.normalizedUrl) {
        throw new AppError(urlCheck.error || 'Invalid official course URL.', 400, 'INVALID_URL');
      }
      normalizedUrl = urlCheck.normalizedUrl;
    }

    if (supabaseAdmin) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminUserId);
      const dbPayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (isUuid) {
        dbPayload.updated_by = adminUserId;
      }

      if (updates.title) dbPayload.title = updates.title.trim();
      if (updates.provider) dbPayload.provider = updates.provider.trim();
      if (normalizedUrl) dbPayload.official_url = normalizedUrl;
      if (updates.description) dbPayload.description = updates.description.trim();
      if (updates.category) dbPayload.category = updates.category.trim();
      if (updates.skills) dbPayload.skills = updates.skills;
      if (updates.difficulty) dbPayload.difficulty = updates.difficulty;
      if (updates.imageUrl !== undefined) dbPayload.image_url = updates.imageUrl;
      if (updates.status) dbPayload.status = updates.status;
      if (updates.lastVerifiedAt) dbPayload.last_verified_at = updates.lastVerifiedAt;

      const { data, error } = await supabaseAdmin
        .from('external_courses')
        .update(dbPayload)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        throw new AppError(`Failed to update external course: ${error?.message || 'Course not found'}`, 400, 'UPDATE_FAILED');
      }

      await auditService.createLog({
        actorId: adminUserId,
        action: 'EXTERNAL_COURSE_UPDATED',
        entityType: 'EXTERNAL_COURSE',
        entityId: id,
        metadata: updates as Record<string, unknown>,
      });

      return {
        id: data.id,
        title: data.title,
        provider: data.provider,
        providerKey: normalizeProviderKey(data.provider),
        description: data.description,
        category: data.category,
        skills: data.skills || [],
        difficulty: data.difficulty,
        officialUrl: data.official_url,
        imageUrl: data.image_url,
        duration: data.duration,
        language: data.language,
        priceType: data.price_type,
        rating: data.rating,
        isActive: data.is_active !== false,
        status: data.status,
        lastVerifiedAt: data.last_verified_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    const existing = memoryExternalCourses.get(id);
    if (!existing) throw new AppError('Course not found', 404, 'NOT_FOUND');
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    memoryExternalCourses.set(id, updated);
    return updated;
  }

  /**
   * Admin: Verify an external course URL and refresh last_verified_at
   */
  async verifyExternalCourse(id: string, adminUserId: string): Promise<ExternalCourseEntity> {
    return this.updateExternalCourse(
      id,
      { lastVerifiedAt: new Date().toISOString() },
      adminUserId
    );
  }

  /**
   * Admin: Delete or archive an external course
   */
  async deleteExternalCourse(id: string, adminUserId: string): Promise<void> {
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.from('external_courses').delete().eq('id', id);
      if (error) {
        throw new AppError(`Failed to delete external course: ${error.message}`, 400, 'DELETE_FAILED');
      }
    }
    memoryExternalCourses.delete(id);

    await auditService.createLog({
      actorId: adminUserId,
      action: 'EXTERNAL_COURSE_DELETED',
      entityType: 'EXTERNAL_COURSE',
      entityId: id,
    });
  }

  /**
   * Admin: Get catalog analytics overview
   */
  async getExternalCoursesAnalytics(): Promise<{
    totalCourses: number;
    publishedCourses: number;
    providerCounts: Record<string, number>;
    categoryCounts: Record<string, number>;
  }> {
    const allCourses = await this.listExternalCoursesForAdmin();
    const providerCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    let publishedCourses = 0;

    for (const c of allCourses) {
      if (c.status === 'published' && c.isActive) publishedCourses++;
      providerCounts[c.provider] = (providerCounts[c.provider] || 0) + 1;
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    }

    return {
      totalCourses: allCourses.length,
      publishedCourses,
      providerCounts,
      categoryCounts,
    };
  }
}

export const courseRecommendationsService = new CourseRecommendationsService();
