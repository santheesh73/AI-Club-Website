import { CourseProviderKey } from '../courseProvider.types';
import { CourseExtractor } from './types';
import { CourseraExtractor } from './courseraExtractor';
import { FreeCodeCampExtractor } from './freeCodeCampExtractor';
import { UdemyExtractor } from './udemyExtractor';
import { UnstopExtractor } from './unstopExtractor';
import { GenericCourseExtractor } from './genericExtractor';

export class CourseExtractorRegistry {
  private extractors: Map<CourseProviderKey, CourseExtractor> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.extractors.set('COURSERA', new CourseraExtractor());
    this.extractors.set('FREECODECAMP', new FreeCodeCampExtractor());
    this.extractors.set('UDEMY', new UdemyExtractor());
    this.extractors.set('UNSTOP', new UnstopExtractor());
  }

  public getExtractor(providerKey: CourseProviderKey, displayName = 'External Course'): CourseExtractor {
    const existing = this.extractors.get(providerKey);
    if (existing) {
      return existing;
    }

    // Fallback to generic extractor for edX, Kaggle, Google, Microsoft, AWS, etc.
    return new GenericCourseExtractor(providerKey, displayName);
  }

  public registerExtractor(extractor: CourseExtractor): void {
    this.extractors.set(extractor.providerKey, extractor);
  }
}

export const courseExtractorRegistry = new CourseExtractorRegistry();
