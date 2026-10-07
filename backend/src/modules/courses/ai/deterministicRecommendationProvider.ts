import {
  CandidateCourseItem,
  MemberLearningContext,
  RawAIRecommendation,
} from '../providers/courseProvider.types';
import { AIRecommendationProvider } from './recommendationProvider.types';

export class DeterministicRecommendationProvider implements AIRecommendationProvider {
  public readonly providerName = 'deterministic-rules';

  public async rankCandidateCourses(
    context: MemberLearningContext,
    candidates: CandidateCourseItem[]
  ): Promise<RawAIRecommendation[]> {
    if (!candidates || candidates.length === 0) {
      return [];
    }

    const userSkills = new Set((context.skills || []).map((s) => s.toLowerCase().trim()));
    const userInterests = new Set((context.interests || []).map((i) => i.toLowerCase().trim()));
    const projectTopics = (context.projectTopics || []).map((p) => p.toLowerCase().trim());
    const completedCount = (context.completedCourses || []).length;

    const scored = candidates.map((course) => {
      let score = 25; // baseline quality weight
      const reasons: string[] = [];
      const courseSkillsLower = (course.skills || []).map((s) => s.toLowerCase().trim());
      const courseCategoryLower = (course.category || '').toLowerCase().trim();
      const courseTitleLower = (course.title || '').toLowerCase().trim();

      // 1. Skill overlap (+20 per matching skill, max 40)
      const matchingSkills: string[] = [];
      for (const skill of courseSkillsLower) {
        if (userSkills.has(skill)) {
          matchingSkills.push(skill);
        }
      }
      if (matchingSkills.length > 0) {
        score += Math.min(40, matchingSkills.length * 20);
        reasons.push(`strengthens your skills in ${matchingSkills.slice(0, 3).join(', ')}`);
      }

      // 2. Interest alignment (+25)
      let matchedInterest: string | null = null;
      for (const interest of userInterests) {
        if (
          courseCategoryLower.includes(interest) ||
          courseTitleLower.includes(interest) ||
          courseSkillsLower.some((s) => s.includes(interest))
        ) {
          score += 25;
          matchedInterest = interest;
          break;
        }
      }
      if (matchedInterest) {
        reasons.push(`aligns with your active interest in "${matchedInterest}"`);
      }

      // 3. Project topic relevance (+15)
      for (const proj of projectTopics) {
        if (
          courseTitleLower.includes(proj) ||
          courseSkillsLower.some((s) => s.includes(proj)) ||
          courseCategoryLower.includes(proj)
        ) {
          score += 15;
          reasons.push(`directly supports your club project work in "${proj}"`);
          break;
        }
      }

      // 4. Learning progression / Difficulty match (+10)
      if (completedCount === 0 && course.difficulty === 'beginner') {
        score += 10;
      } else if (completedCount > 0 && (course.difficulty === 'intermediate' || course.difficulty === 'advanced')) {
        score += 10;
        reasons.push(`advances your learning curve to ${course.difficulty} concepts`);
      }

      // 5. Rating bonus (+5)
      if (course.rating && course.rating >= 4.8) {
        score += 5;
      }

      // Identify skill gap
      const gapSkills = (course.skills || []).filter((s) => !userSkills.has(s.toLowerCase().trim()));
      const skillGap = gapSkills.length > 0 ? gapSkills[0] : undefined;

      // Construct reason string
      let reason = `Top-rated curriculum by ${course.provider} in ${course.category}.`;
      if (reasons.length > 0) {
        reason = `Recommended because it ${reasons.join(' and ')}.`;
      } else if (skillGap) {
        reason = `Expands your foundational engineering toolkit into ${skillGap}.`;
      }

      return {
        course_id: course.id,
        match_score: Math.min(99, Math.max(30, score)),
        reason,
        skill_gap: skillGap,
      };
    });

    // Sort descending by match score
    scored.sort((a, b) => b.match_score - a.match_score);
    return scored;
  }
}
