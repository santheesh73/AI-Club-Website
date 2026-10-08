import * as cheerio from 'cheerio';
import { BaseCourseExtractor } from './baseExtractor';
import { CourseProviderKey, CourseCategory, CourseDifficulty } from '../courseProvider.types';

export class CourseraExtractor extends BaseCourseExtractor {
  readonly providerKey: CourseProviderKey = 'COURSERA';
  readonly providerDisplayName = 'Coursera';

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
    // 1. Title fallback from Coursera hero
    const heroTitle = $('h1[data-e2e="hero-title"]').text().trim() || $('h1.cds-119').text().trim();

    // 2. Description fallback
    const heroDesc =
      $('div.content-inner p').first().text().trim() ||
      $('div[data-e2e="course-description"] p').first().text().trim();

    // 3. Skills list from Coursera skills badges
    const skillsList: string[] = [];
    $('ul[data-e2e="key-skills"] li, div[data-testid="skills-list"] button').each((_, el) => {
      const s = $(el).text().trim();
      if (s) skillsList.push(s);
    });

    // 4. Course slug from URL
    let externalCourseId: string | undefined;
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/(?:learn|specializations|professional-certificates)\/([^/?#]+)/);
      if (match && match[1]) {
        externalCourseId = match[1];
      }
    } catch {
      // ignore
    }

    // 5. Rating from Coursera badge
    let rating: number | undefined;
    const ratingText = $('div[data-e2e="rating-value"]').text().trim();
    if (ratingText) {
      const r = parseFloat(ratingText);
      if (!isNaN(r)) rating = r;
    }

    return {
      title: heroTitle || undefined,
      description: heroDesc || undefined,
      skills: skillsList.length > 0 ? skillsList : undefined,
      externalCourseId,
      rating,
      priceType: 'freemium', // Coursera standard model: Audit free, certificate paid
    };
  }
}
