export * from './types';
export * from './baseExtractor';
export * from './courseraExtractor';
export * from './freeCodeCampExtractor';
export * from './udemyExtractor';
export * from './unstopExtractor';
export * from './genericExtractor';
export * from './extractorRegistry';

import { courseExtractorRegistry } from './extractorRegistry';
import { CourseProviderKey } from '../courseProvider.types';
import { ExtractedCourseMetadata } from './types';

export async function extractMetadataFromHtml(
  html: string,
  url: string,
  providerKey: CourseProviderKey,
  canonicalUrl?: string
): Promise<ExtractedCourseMetadata> {
  return courseExtractorRegistry
    .getExtractor(providerKey)
    .extract(html, url, canonicalUrl || url);
}
