import { supabaseAdmin } from '../../services/supabase';
import { logger } from '../../utils/logger';
import type { FlashcardDto, FlashcardType } from './flashcard.types';

// In-memory test store fallback for hermetic unit testing and offline development
export const localMemoryFlashcardStore = {
  announcements: [] as Array<Record<string, unknown>>,
  events: [] as Array<Record<string, unknown>>,
  achievements: [] as Array<Record<string, unknown>>,
  projectIdeas: [] as Array<Record<string, unknown>>,
};

export class FlashcardService {
  private mockMode = false;
  private failSource: string | null = null;

  setMockMode(enabled: boolean) {
    this.mockMode = enabled;
  }

  setFailSource(source: string | null) {
    this.failSource = source;
  }

  resetLocalStore() {
    localMemoryFlashcardStore.announcements = [];
    localMemoryFlashcardStore.events = [];
    localMemoryFlashcardStore.achievements = [];
    localMemoryFlashcardStore.projectIdeas = [];
    this.failSource = null;
    this.mockMode = false;
  }

  /**
   * Aggregate, normalize, prioritize, deduplicate, and limit flashcards
   * for an authenticated member.
   */
  async getMemberFlashcards(memberId: string, limit = 5): Promise<FlashcardDto[]> {
    const safeLimit = Math.min(10, Math.max(1, limit));

    // Retrieve member profile skills & name for personalization
    let memberName = 'Member';
    let memberSkills: string[] = [];

    if (supabaseAdmin) {
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name, skills')
          .eq('id', memberId)
          .maybeSingle();

        if (profile) {
          if (profile.full_name) memberName = profile.full_name;
          if (Array.isArray(profile.skills)) memberSkills = profile.skills.map((s: unknown) => String(s).toLowerCase());
        }
      } catch (err) {
        logger.warn('[FlashcardService] Error retrieving member profile for personalization:', { err });
      }
    }

    // Query all 4 content sources in parallel with graceful error isolation
    const [
      announcementsResult,
      eventsResult,
      achievementsResult,
      projectIdeasResult,
    ] = await Promise.allSettled([
      this.fetchEligibleAnnouncements(),
      this.fetchEligibleEvents(),
      this.fetchEligibleAchievements(memberId, memberName),
      this.fetchEligibleProjectIdeas(memberSkills),
    ]);

    const candidates: FlashcardDto[] = [];

    if (announcementsResult.status === 'fulfilled') {
      candidates.push(...announcementsResult.value);
    } else {
      logger.warn('[FlashcardService] Announcements query failed, gracefully proceeding with other sources:', {
        reason: announcementsResult.reason,
      });
    }

    if (eventsResult.status === 'fulfilled') {
      candidates.push(...eventsResult.value);
    } else {
      logger.warn('[FlashcardService] Events query failed, gracefully proceeding with other sources:', {
        reason: eventsResult.reason,
      });
    }

    if (achievementsResult.status === 'fulfilled') {
      candidates.push(...achievementsResult.value);
    } else {
      logger.warn('[FlashcardService] Achievements query failed, gracefully proceeding with other sources:', {
        reason: achievementsResult.reason,
      });
    }

    if (projectIdeasResult.status === 'fulfilled') {
      candidates.push(...projectIdeasResult.value);
    } else {
      logger.warn('[FlashcardService] Project Ideas query failed, gracefully proceeding with other sources:', {
        reason: projectIdeasResult.reason,
      });
    }

    // 1. Deduplicate by sourceType + ':' + sourceId
    const seen = new Set<string>();
    const deduplicated: FlashcardDto[] = [];

    for (const card of candidates) {
      const key = `${card.sourceType}:${card.sourceId}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(card);
      }
    }

    // 2. Deterministic Sorting:
    // Highest priority first, tie-break with newest publication timestamp
    deduplicated.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    // 3. Limit result to top N cards (default 5, max 10)
    return deduplicated.slice(0, safeLimit);
  }

  // ============================================================================
  // SOURCE 1: ANNOUNCEMENTS
  // ============================================================================
  private async fetchEligibleAnnouncements(): Promise<FlashcardDto[]> {
    if (this.failSource === 'announcements') {
      throw new Error('Announcements failure simulated');
    }

    const now = new Date();
    const cards: FlashcardDto[] = [];

    if (!this.mockMode && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('announcements')
        .select('*')
        .eq('status', 'published')
        .lte('published_at', now.toISOString())
        .order('published_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        for (const item of data) {
          // Check expiration window
          if (item.expires_at && new Date(item.expires_at) <= now) {
            continue;
          }

          // Check audience visibility: members or all
          const audience = String(item.audience || 'all').toLowerCase();
          if (audience === 'admin' || audience === 'admin_only' || audience === 'applicants_only') {
            continue;
          }

          const rawPriority = item.priority;
          const isUrgent = rawPriority === 'urgent' || rawPriority === 'high' || rawPriority === 80;
          const type: FlashcardType = isUrgent ? 'IMPORTANT_UPDATE' : 'ANNOUNCEMENT';
          const badgeText = isUrgent ? 'IMPORTANT UPDATE' : 'ANNOUNCEMENT';

          // Base score
          let score = isUrgent ? 85 : 60;
          if (typeof item.flashcard_priority === 'number' && item.flashcard_priority > 0) {
            score = Math.max(score, item.flashcard_priority);
          }

          // Recency bonus (within 3 days +5)
          const ageDays = (now.getTime() - new Date(item.published_at || item.created_at).getTime()) / (1000 * 3600 * 24);
          if (ageDays <= 3) score += 5;

          cards.push({
            id: `flash-ann-${item.id}`,
            sourceType: type,
            sourceId: String(item.id),
            title: String(item.title),
            description: String(item.content || ''),
            actionLabel: 'View Details',
            actionUrl: '/member',
            priority: score,
            badgeText,
            publishedAt: String(item.published_at || item.created_at || now.toISOString()),
            expiresAt: item.expires_at ? String(item.expires_at) : undefined,
          });
        }
      }
    }

    // In-memory test store fallback or mock mode
    if ((this.mockMode || cards.length === 0) && localMemoryFlashcardStore.announcements.length > 0) {
      for (const item of localMemoryFlashcardStore.announcements) {
        if (item.status !== 'published') continue;
        if (item.expires_at && new Date(String(item.expires_at)) <= now) continue;
        const audience = String(item.audience || 'all').toLowerCase();
        if (audience === 'admin' || audience === 'admin_only' || audience === 'applicants_only') continue;

        let score = typeof item.priority === 'number' ? item.priority : 60;
        if (typeof item.flashcard_priority === 'number') {
          score = item.flashcard_priority;
        }

        cards.push({
          id: `flash-ann-${item.id}`,
          sourceType: 'ANNOUNCEMENT',
          sourceId: String(item.id),
          title: String(item.title),
          description: String(item.content || ''),
          actionLabel: 'View Details',
          actionUrl: '/member',
          priority: score,
          badgeText: 'ANNOUNCEMENT',
          publishedAt: String(item.published_at || now.toISOString()),
        });
      }
    }

    return cards;
  }

  // ============================================================================
  // SOURCE 2: EVENTS (Upcoming, Published, Not Cancelled/Completed)
  // ============================================================================
  private async fetchEligibleEvents(): Promise<FlashcardDto[]> {
    if (this.failSource === 'events') {
      throw new Error('Events failure simulated');
    }

    const now = new Date();
    const cards: FlashcardDto[] = [];

    if (!this.mockMode && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('status', 'published')
        .gt('end_at', now.toISOString())
        .order('start_at', { ascending: true })
        .limit(10);

      if (!error && data) {
        for (const item of data) {
          // Never promote cancelled or past events
          if (item.status === 'cancelled' || item.status === 'completed') continue;
          if (item.cancelled_at) continue;

          const startAt = new Date(item.start_at);
          const diffDays = Math.ceil((startAt.getTime() - now.getTime()) / (1000 * 3600 * 24));
          
          let urgencyHint = '';
          let urgencyBonus = 0;

          if (diffDays <= 0) {
            urgencyHint = 'Happening Today';
            urgencyBonus = 25;
          } else if (diffDays <= 3) {
            urgencyHint = `Starts in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
            urgencyBonus = 20;
          } else if (diffDays <= 7) {
            urgencyHint = `Starts in ${diffDays} days`;
            urgencyBonus = 10;
          } else {
            urgencyHint = `Scheduled for ${startAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
            urgencyBonus = 5;
          }

          let score = 70 + urgencyBonus;
          if (typeof item.flashcard_priority === 'number' && item.flashcard_priority > 0) {
            score = Math.max(score, item.flashcard_priority);
          }

          const desc = item.short_description || item.description || '';
          const fullDesc = urgencyHint ? `[${urgencyHint}] ${desc}` : desc;

          cards.push({
            id: `flash-evt-${item.id}`,
            sourceType: 'EVENT',
            sourceId: String(item.id),
            title: String(item.title),
            description: fullDesc,
            imageUrl: item.cover_image_url ? String(item.cover_image_url) : undefined,
            actionLabel: 'View Event',
            actionUrl: `/member/events/${item.id}`,
            priority: score,
            badgeText: 'UPCOMING EVENT',
            publishedAt: String(item.published_at || item.created_at || now.toISOString()),
            expiresAt: String(item.end_at),
          });
        }
      }
    }

    // In-memory test store fallback or mock mode
    if ((this.mockMode || cards.length === 0) && localMemoryFlashcardStore.events.length > 0) {
      for (const item of localMemoryFlashcardStore.events) {
        if (item.status !== 'published') continue;
        if (item.cancelled_at) continue;
        if (item.end_at && new Date(String(item.end_at)) <= now) continue;

        let score = 75;
        if (typeof item.flashcard_priority === 'number') {
          score = item.flashcard_priority;
        }

        cards.push({
          id: `flash-evt-${item.id}`,
          sourceType: 'EVENT',
          sourceId: String(item.id),
          title: String(item.title),
          description: String(item.short_description || item.description || ''),
          actionLabel: 'View Event',
          actionUrl: `/member/events/${item.id}`,
          priority: score,
          badgeText: 'UPCOMING EVENT',
          publishedAt: String(item.published_at || now.toISOString()),
        });
      }
    }

    return cards;
  }

  // ============================================================================
  // SOURCE 3: ACHIEVEMENTS (Published, Personalized for Member)
  // ============================================================================
  private async fetchEligibleAchievements(memberId: string, memberName: string): Promise<FlashcardDto[]> {
    if (this.failSource === 'achievements') {
      throw new Error('Achievements failure simulated');
    }

    const now = new Date();
    const cards: FlashcardDto[] = [];

    if (!this.mockMode && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('achievements')
        .select('*, profiles:user_id(full_name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(8);

      if (!error && data) {
        for (const item of data) {
          const isMemberOwned = String(item.user_id) === memberId;
          const ownerName = isMemberOwned ? memberName : (item.profiles?.full_name || 'AI Club Member');

          const title = isMemberOwned
            ? `Congratulations, ${memberName}! You earned ${item.title}`
            : `${ownerName} earned: ${item.title}`;

          const description = item.description || `Issued by ${item.issuing_organization || 'AI CLUB'}`;
          
          let score = isMemberOwned ? 88 : 50;
          if (typeof item.flashcard_priority === 'number' && item.flashcard_priority > 0) {
            score = Math.max(score, item.flashcard_priority);
          }

          cards.push({
            id: `flash-ach-${item.id}`,
            sourceType: 'ACHIEVEMENT',
            sourceId: String(item.id),
            title,
            description,
            imageUrl: item.image_url ? String(item.image_url) : undefined,
            actionLabel: isMemberOwned ? 'View My Achievement' : 'View Achievements',
            actionUrl: '/member/achievements',
            priority: score,
            badgeText: isMemberOwned ? 'YOUR ACHIEVEMENT' : 'ACHIEVEMENT SPOTLIGHT',
            publishedAt: String(item.created_at || now.toISOString()),
          });
        }
      }
    }

    // In-memory test store fallback or mock mode
    if ((this.mockMode || cards.length === 0) && localMemoryFlashcardStore.achievements.length > 0) {
      for (const item of localMemoryFlashcardStore.achievements) {
        if (item.status !== 'published') continue;
        const isMemberOwned = String(item.user_id) === memberId;
        const title = isMemberOwned
          ? `Congratulations, ${memberName}! You earned ${item.title}`
          : `Achievement: ${item.title}`;

        let score = isMemberOwned ? 88 : 50;
        if (typeof item.flashcard_priority === 'number') {
          score = item.flashcard_priority;
        }

        cards.push({
          id: `flash-ach-${item.id}`,
          sourceType: 'ACHIEVEMENT',
          sourceId: String(item.id),
          title,
          description: String(item.description || ''),
          actionLabel: 'View Achievement',
          actionUrl: '/member/achievements',
          priority: score,
          badgeText: isMemberOwned ? 'YOUR ACHIEVEMENT' : 'ACHIEVEMENT SPOTLIGHT',
          publishedAt: String(item.created_at || now.toISOString()),
        });
      }
    }

    return cards;
  }

  // ============================================================================
  // SOURCE 4: PROJECT IDEAS (Curated Admin Inspiration for Members)
  // ============================================================================
  private async fetchEligibleProjectIdeas(memberSkills: string[]): Promise<FlashcardDto[]> {
    if (this.failSource === 'projectIdeas') {
      throw new Error('Project ideas failure simulated');
    }

    const now = new Date();
    const cards: FlashcardDto[] = [];

    if (!this.mockMode && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('project_ideas')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error && data) {
        for (const item of data) {
          // Check for member interest/skills match
          const ideaSkills = [
            ...(Array.isArray(item.skills) ? item.skills : []),
            ...(Array.isArray(item.technologies) ? item.technologies : []),
            item.category || '',
          ].map((s: unknown) => String(s).toLowerCase());

          const hasSkillMatch = memberSkills.length > 0 && memberSkills.some((s) =>
            ideaSkills.some((is) => is.includes(s) || s.includes(is))
          );

          let score = hasSkillMatch ? 72 : 55;
          if (typeof item.flashcard_priority === 'number' && item.flashcard_priority > 0) {
            score = Math.max(score, item.flashcard_priority);
          }

          const desc = item.problem_statement
            ? `${item.description} — Goal: ${item.problem_statement}`
            : item.description;

          cards.push({
            id: `flash-idea-${item.id}`,
            sourceType: 'PROJECT_IDEA',
            sourceId: String(item.id),
            title: `Project Idea: ${item.title}`,
            description: desc,
            imageUrl: item.media_url ? String(item.media_url) : undefined,
            actionLabel: 'Explore Idea',
            actionUrl: '/member/projects',
            priority: score,
            badgeText: 'PROJECT INSPIRATION',
            publishedAt: String(item.created_at || now.toISOString()),
          });
        }
      }
    }

    // In-memory test store fallback or mock mode
    if ((this.mockMode || cards.length === 0) && localMemoryFlashcardStore.projectIdeas.length > 0) {
      for (const item of localMemoryFlashcardStore.projectIdeas) {
        if (item.status !== 'published') continue;
        let score = 65;
        if (typeof item.flashcard_priority === 'number') {
          score = item.flashcard_priority;
        }

        cards.push({
          id: `flash-idea-${item.id}`,
          sourceType: 'PROJECT_IDEA',
          sourceId: String(item.id),
          title: `Project Idea: ${item.title}`,
          description: String(item.description || ''),
          actionLabel: 'Explore Idea',
          actionUrl: '/member/projects',
          priority: score,
          badgeText: 'PROJECT INSPIRATION',
          publishedAt: String(item.created_at || now.toISOString()),
        });
      }
    }

    return cards;
  }
}

export const flashcardService = new FlashcardService();
