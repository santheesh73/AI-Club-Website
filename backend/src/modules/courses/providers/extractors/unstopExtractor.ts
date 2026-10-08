import * as cheerio from 'cheerio';
import { BaseCourseExtractor } from './baseExtractor';
import { CourseProviderKey, CourseCategory, CourseDifficulty } from '../courseProvider.types';

export class UnstopExtractor extends BaseCourseExtractor {
  readonly providerKey: CourseProviderKey = 'UNSTOP';
  readonly providerDisplayName = 'Unstop';

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
    const title =
      $('h1.course_title, h1.header_title, div.opportunity_details h1, h1').first().text().trim();

    // 2. Description
    const description =
      $('div.course_description p, div.about_content p, div.details_content p').first().text().trim();

    // 3. Slug from URL
    let externalCourseId: string | undefined;
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/(?:courses|workshops|learn)\/([^/?#]+)/);
      if (match && match[1]) {
        externalCourseId = match[1];
      }
    } catch {
      // ignore
    }

    return {
      title: title || undefined,
      description: description || undefined,
      externalCourseId,
      priceType: 'freemium',
    };
  }
}
