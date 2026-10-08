import * as cheerio from 'cheerio';
import { BaseCourseExtractor } from './baseExtractor';
import { CourseProviderKey, CourseCategory, CourseDifficulty } from '../courseProvider.types';

export class UdemyExtractor extends BaseCourseExtractor {
  readonly providerKey: CourseProviderKey = 'UDEMY';
  readonly providerDisplayName = 'Udemy';

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
    const leadTitle = $('h1[data-purpose="lead-title"]').text().trim() || $('h1.clp-lead__title').text().trim();

    // 2. Headline / Description
    const leadHeadline = $('div[data-purpose="lead-headline"]').text().trim() || $('div.clp-lead__headline').text().trim();

    // 3. Slug from URL
    let externalCourseId: string | undefined;
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/course\/([^/?#]+)/);
      if (match && match[1]) {
        externalCourseId = match[1];
      }
    } catch {
      // ignore
    }

    // 4. Rating
    let rating: number | undefined;
    const ratingStr = $('span[data-purpose="rating-number"]').text().trim();
    if (ratingStr) {
      const r = parseFloat(ratingStr);
      if (!isNaN(r)) rating = r;
    }

    // 5. Duration
    const duration = $('span[data-purpose="video-content-length"]').text().trim();

    return {
      title: leadTitle || undefined,
      description: leadHeadline || undefined,
      externalCourseId,
      rating,
      duration: duration || undefined,
      priceType: 'paid', // Udemy standard model is paid
    };
  }
}
