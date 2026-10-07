import {
  CourseProviderDefinition,
  CourseProviderKey,
} from './courseProvider.types';
import { PROVIDER_DOMAIN_ALLOWLIST } from './urlValidator';

export interface ExternalCourseProvider {
  definition: CourseProviderDefinition;
  validateUrl(url: string): boolean;
}

export class BaseCourseProvider implements ExternalCourseProvider {
  constructor(public definition: CourseProviderDefinition) {}

  validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      return (
        parsed.protocol === 'https:' &&
        this.definition.allowedDomains.some((d) => host === d || host.endsWith(`.${d}`))
      );
    } catch {
      return false;
    }
  }
}

/**
 * Provider Registry managing supported educational platforms
 */
export class CourseProviderRegistry {
  private providers: Map<CourseProviderKey, ExternalCourseProvider> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    const defaultDefinitions: CourseProviderDefinition[] = [
      {
        key: 'COURSERA',
        displayName: 'Coursera',
        allowedDomains: PROVIDER_DOMAIN_ALLOWLIST.COURSERA,
        websiteUrl: 'https://www.coursera.org',
        badgeColor: '#0056D2',
        supportsIngestion: true,
      },
      {
        key: 'FREECODECAMP',
        displayName: 'freeCodeCamp',
        allowedDomains: PROVIDER_DOMAIN_ALLOWLIST.FREECODECAMP,
        websiteUrl: 'https://www.freecodecamp.org',
        badgeColor: '#0A0A23',
        supportsIngestion: true,
      },
      {
        key: 'UDEMY',
        displayName: 'Udemy',
        allowedDomains: PROVIDER_DOMAIN_ALLOWLIST.UDEMY,
        websiteUrl: 'https://www.udemy.com',
        badgeColor: '#A435F0',
        supportsIngestion: true,
      },
      {
        key: 'UNSTOP',
        displayName: 'Unstop',
        allowedDomains: PROVIDER_DOMAIN_ALLOWLIST.UNSTOP,
        websiteUrl: 'https://unstop.com',
        badgeColor: '#008BDC',
        supportsIngestion: true,
      },
      {
        key: 'EDX',
        displayName: 'edX',
        allowedDomains: PROVIDER_DOMAIN_ALLOWLIST.EDX,
        websiteUrl: 'https://www.edx.org',
        badgeColor: '#B5121B',
      },
      {
        key: 'KAGGLE',
        displayName: 'Kaggle',
        allowedDomains: PROVIDER_DOMAIN_ALLOWLIST.KAGGLE,
        websiteUrl: 'https://www.kaggle.com',
        badgeColor: '#20BEFF',
      },
      {
        key: 'GOOGLE',
        displayName: 'Google Cloud Skills / Grow with Google',
        allowedDomains: PROVIDER_DOMAIN_ALLOWLIST.GOOGLE,
        websiteUrl: 'https://cloud.google.com/training',
        badgeColor: '#4285F4',
      },
      {
        key: 'MICROSOFT',
        displayName: 'Microsoft Learn',
        allowedDomains: PROVIDER_DOMAIN_ALLOWLIST.MICROSOFT,
        websiteUrl: 'https://learn.microsoft.com',
        badgeColor: '#0078D4',
      },
      {
        key: 'AWS',
        displayName: 'AWS Skill Builder',
        allowedDomains: PROVIDER_DOMAIN_ALLOWLIST.AWS,
        websiteUrl: 'https://skillbuilder.aws',
        badgeColor: '#FF9900',
      },
      {
        key: 'NVIDIA',
        displayName: 'NVIDIA Deep Learning Institute',
        allowedDomains: PROVIDER_DOMAIN_ALLOWLIST.NVIDIA,
        websiteUrl: 'https://www.nvidia.com/dli',
        badgeColor: '#76B900',
      },
      {
        key: 'STANFORD',
        displayName: 'Stanford Online',
        allowedDomains: PROVIDER_DOMAIN_ALLOWLIST.STANFORD,
        websiteUrl: 'https://online.stanford.edu',
        badgeColor: '#8C1515',
      },
      {
        key: 'MIT',
        displayName: 'MIT OpenCourseWare',
        allowedDomains: PROVIDER_DOMAIN_ALLOWLIST.MIT,
        websiteUrl: 'https://ocw.mit.edu',
        badgeColor: '#A31F34',
      },
    ];

    for (const def of defaultDefinitions) {
      this.providers.set(def.key, new BaseCourseProvider(def));
    }
  }

  public getProvider(key: CourseProviderKey): ExternalCourseProvider | undefined {
    return this.providers.get(key);
  }

  public getAllDefinitions(): CourseProviderDefinition[] {
    return Array.from(this.providers.values()).map((p) => p.definition);
  }

  public registerProvider(provider: ExternalCourseProvider): void {
    this.providers.set(provider.definition.key, provider);
  }
}

export const courseProviderRegistry = new CourseProviderRegistry();
