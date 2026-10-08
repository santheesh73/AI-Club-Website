import { CourseProviderKey, CourseCategory, CourseDifficulty } from '../courseProvider.types';

export interface ExtractedCourseMetadata {
  title: string | null;
  description: string | null;
  provider: CourseProviderKey;
  providerDisplayName: string;
  officialUrl: string;
  canonicalUrl: string;
  imageUrl: string | null;
  category: CourseCategory | null;
  difficulty: CourseDifficulty | null;
  skills: string[];
  duration?: string | null;
  priceType?: 'free' | 'paid' | 'freemium' | 'subscription' | null;
  rating?: number | null;
  externalCourseId?: string | null;
  extraction: {
    titleSource: string;
    descriptionSource: string;
    imageSource: string;
    categorySource?: string;
    difficultySource?: string;
    skillsSource?: string;
    providerSource: string;
  };
}

export interface CourseExtractor {
  readonly providerKey: CourseProviderKey;
  extract(html: string, officialUrl: string, canonicalUrl: string): Promise<ExtractedCourseMetadata>;
}
