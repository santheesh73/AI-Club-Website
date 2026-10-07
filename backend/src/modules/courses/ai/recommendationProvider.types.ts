import {
  CandidateCourseItem,
  MemberLearningContext,
  RawAIRecommendation,
} from '../providers/courseProvider.types';

export interface AIRecommendationProvider {
  readonly providerName: string;
  rankCandidateCourses(
    context: MemberLearningContext,
    candidates: CandidateCourseItem[]
  ): Promise<RawAIRecommendation[]>;
}
