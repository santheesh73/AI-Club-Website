import { BaseCourseExtractor } from './baseExtractor';
import { CourseProviderKey } from '../courseProvider.types';

export class GenericCourseExtractor extends BaseCourseExtractor {
  constructor(
    readonly providerKey: CourseProviderKey,
    readonly providerDisplayName: string
  ) {
    super();
  }
}
