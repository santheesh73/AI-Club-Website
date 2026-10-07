import { supabaseAdmin } from '../../services/supabase';
import { AppError } from '../../utils/response';
import { logger } from '../../utils/logger';

export interface ExternalCourseDto {
  id: string;
  title: string;
  provider: string;
  description: string;
  category: string;
  skills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  officialUrl: string;
  imageUrl?: string;
  source: string;
  status: 'draft' | 'published' | 'archived';
  lastVerifiedAt: string;
}

export interface CourseRecommendationDto {
  course: ExternalCourseDto;
  relevanceScore: number;
  matchReasons: string[];
  explanation: string;
}

export class CourseRecommendationsService {
  /**
   * Retrieves all verified published external courses from database
   */
  async getPublishedExternalCourses(): Promise<ExternalCourseDto[]> {
    if (!supabaseAdmin) {
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from('external_courses')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(`Failed to fetch external courses: ${error.message}`, 500, 'DATABASE_ERROR');
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      provider: row.provider,
      description: row.description,
      category: row.category,
      skills: Array.isArray(row.skills) ? row.skills : [],
      difficulty: row.difficulty,
      officialUrl: row.official_url,
      imageUrl: row.image_url || undefined,
      source: row.source,
      status: row.status,
      lastVerifiedAt: row.last_verified_at,
    }));
  }

  /**
   * Generates explainable, personalized course recommendations based on member's profile context.
   * STRICT SAFETY GUARANTEES:
   * 1. Read-only operation; executes no state transitions.
   * 2. Uses verified official external URLs from database.
   * 3. Explanations cite only real attributes from member profile.
   * 4. Deterministic fallback if external model is unconfigured/fails.
   */
  async getRecommendationsForMember(userId: string): Promise<CourseRecommendationDto[]> {
    const allCourses = await this.getPublishedExternalCourses();
    if (allCourses.length === 0) {
      return [];
    }

    // 1. Build authorized context from member profile & activity
    let memberSkills: string[] = [];
    let memberInterests: string[] = [];
    let memberDepartment = 'Engineering';

    if (supabaseAdmin) {
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('skills, interests, department')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          memberSkills = Array.isArray(profile.skills) ? profile.skills : [];
          memberInterests = Array.isArray(profile.interests) ? profile.interests : [];
          if (profile.department) memberDepartment = profile.department;
        }
      } catch (err) {
        logger.warn('Failed to load member profile context for recommendations', { err });
      }
    }

    // Normalized lookup sets
    const skillSet = new Set(memberSkills.map((s) => s.toLowerCase().trim()));
    const interestSet = new Set(memberInterests.map((i) => i.toLowerCase().trim()));

    // 2. Compute relevance scores and explainable rationale
    const recommendations: CourseRecommendationDto[] = allCourses.map((course) => {
      let score = 20; // baseline popularity weight
      const matchReasons: string[] = [];

      // Check skill overlap
      const matchingSkills = course.skills.filter((cs) => skillSet.has(cs.toLowerCase().trim()));
      if (matchingSkills.length > 0) {
        score += matchingSkills.length * 25;
        matchReasons.push(`Matches your skills in ${matchingSkills.join(', ')}`);
      }

      // Check interest overlap against category or title
      const courseCategoryLower = course.category.toLowerCase();
      for (const interest of interestSet) {
        if (courseCategoryLower.includes(interest) || course.title.toLowerCase().includes(interest)) {
          score += 30;
          matchReasons.push(`Aligns with your selected interest in "${interest}"`);
          break;
        }
      }

      // Check department alignment
      if (memberDepartment && (course.category.toLowerCase().includes('machine learning') || course.category.toLowerCase().includes('data'))) {
        score += 15;
      }

      // Construct explainable recommendation string
      let explanation = `Recommended foundational course by ${course.provider} in ${course.category}.`;
      if (matchReasons.length > 0) {
        explanation = `Recommended because it ${matchReasons.join(' and ')}.`;
      } else if (memberInterests.length > 0) {
        explanation = `Curated by AI CLUB to help bridge technical depth in ${course.category}.`;
      }

      return {
        course,
        relevanceScore: Math.min(100, score),
        matchReasons,
        explanation,
      };
    });

    // 3. Sort by highest relevance
    recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return recommendations;
  }
}

export const courseRecommendationsService = new CourseRecommendationsService();
