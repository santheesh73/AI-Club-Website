import * as cheerio from 'cheerio';
import { BaseCourseExtractor } from './baseExtractor';
import { CourseProviderKey, CourseCategory, CourseDifficulty } from '../courseProvider.types';

export class FreeCodeCampExtractor extends BaseCourseExtractor {
  readonly providerKey: CourseProviderKey = 'FREECODECAMP';
  readonly providerDisplayName = 'freeCodeCamp';

  protected override extractProviderSpecific(
    $: cheerio.CheerioAPI,
    url: string
  ): {
    title?: string;
    description?: string;
    image?: string;
    category?: CourseCategory;
    difficulty?: CourseDifficulty;
    skills?: string[];
    duration?: string;
    priceType?: 'free' | 'paid' | 'freemium' | 'subscription';
    rating?: number;
    externalCourseId?: string;
  } {
    // 1. Title fallback
    const pageTitle = $('h1.title, h1.banner-heading, h1.site-title, h1').first().text().trim();

    // 2. Description fallback
    const pageDesc = $('div.desc p, div.post-content p, div.block-description p').first().text().trim();

    // 3. Course slug from URL
    let externalCourseId: string | undefined;
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      externalCourseId = segments.pop();
    } catch {
      // ignore
    }

    return {
      title: pageTitle || undefined,
      description: pageDesc || undefined,
      externalCourseId,
      priceType: 'free', // freeCodeCamp is always 100% free
      difficulty: 'beginner',
    };
  }
}
