import * as cheerio from 'cheerio';
import { CourseProviderKey, CourseCategory, CourseDifficulty } from '../courseProvider.types';
import { ExtractedCourseMetadata, CourseExtractor } from './types';

export abstract class BaseCourseExtractor implements CourseExtractor {
  abstract readonly providerKey: CourseProviderKey;
  abstract readonly providerDisplayName: string;

  /**
   * Main extraction pipeline implementing LEVEL 1 -> LEVEL 2 -> LEVEL 3 -> LEVEL 4 priority
   */
  async extract(
    html: string,
    officialUrl: string,
    canonicalUrl: string
  ): Promise<ExtractedCourseMetadata> {
    const $ = cheerio.load(html);

    // LEVEL 1: Structured JSON-LD metadata
    const jsonLdData = this.extractJsonLd($);

    // LEVEL 2: Open Graph & Twitter Card metadata
    const ogData = this.extractOpenGraph($);

    // LEVEL 3: Standard HTML tags
    const htmlData = this.extractHtmlMeta($);

    // LEVEL 4: Provider-specific fallback selectors
    const providerSpecific = this.extractProviderSpecific($, officialUrl);

    // Determine Title by priority
    let title: string | null = null;
    let titleSource = 'none';

    if (jsonLdData?.name) {
      title = this.cleanTitle(jsonLdData.name);
      titleSource = 'jsonld';
    } else if (ogData.title) {
      title = this.cleanTitle(ogData.title);
      titleSource = 'og:title';
    } else if (providerSpecific.title) {
      title = this.cleanTitle(providerSpecific.title);
      titleSource = 'provider:selector';
    } else if (htmlData.title) {
      title = this.cleanTitle(htmlData.title);
      titleSource = 'html:title';
    }

    // Determine Description by priority
    let description: string | null = null;
    let descriptionSource = 'none';

    if (jsonLdData?.description) {
      description = this.cleanDescription(jsonLdData.description);
      descriptionSource = 'jsonld';
    } else if (ogData.description) {
      description = this.cleanDescription(ogData.description);
      descriptionSource = 'og:description';
    } else if (htmlData.description) {
      description = this.cleanDescription(htmlData.description);
      descriptionSource = 'meta:description';
    } else if (providerSpecific.description) {
      description = this.cleanDescription(providerSpecific.description);
      descriptionSource = 'provider:selector';
    }

    // Determine Image by priority
    let imageUrl: string | null = null;
    let imageSource = 'none';

    if (jsonLdData?.image) {
      imageUrl = this.validateImageUrl(jsonLdData.image);
      if (imageUrl) imageSource = 'jsonld';
    }
    if (!imageUrl && ogData.image) {
      imageUrl = this.validateImageUrl(ogData.image);
      if (imageUrl) imageSource = 'og:image';
    }
    if (!imageUrl && providerSpecific.image) {
      imageUrl = this.validateImageUrl(providerSpecific.image);
      if (imageUrl) imageSource = 'provider:selector';
    }

    // Determine Category
    let category: CourseCategory | null = null;
    let categorySource = 'none';

    if (providerSpecific.category) {
      category = providerSpecific.category;
      categorySource = 'provider:taxonomy';
    } else if (jsonLdData?.about || jsonLdData?.category) {
      category = this.mapCategory((jsonLdData.about || jsonLdData.category)!);
      if (category) categorySource = 'jsonld';
    }
    if (!category && title) {
      category = this.mapCategoryFromText(title, description);
      if (category) categorySource = 'heuristic:content';
    }

    // Determine Difficulty
    let difficulty: CourseDifficulty | null = null;
    let difficultySource = 'none';

    if (jsonLdData?.educationalLevel) {
      difficulty = this.mapDifficulty(jsonLdData.educationalLevel);
      if (difficulty) difficultySource = 'jsonld:educationalLevel';
    }
    if (!difficulty && providerSpecific.difficulty) {
      difficulty = providerSpecific.difficulty;
      difficultySource = 'provider:difficulty';
    }
    if (!difficulty && (title || description)) {
      difficulty = this.mapDifficultyFromText(title || '', description || '');
      if (difficulty) difficultySource = 'heuristic:content';
    }

    // Determine Skills
    let skills: string[] = [];
    let skillsSource = 'none';

    if (jsonLdData?.teaches && Array.isArray(jsonLdData.teaches)) {
      skills = this.cleanSkills(jsonLdData.teaches);
      skillsSource = 'jsonld:teaches';
    } else if (providerSpecific.skills && providerSpecific.skills.length > 0) {
      skills = this.cleanSkills(providerSpecific.skills);
      skillsSource = 'provider:skills';
    }

    // Determine Duration
    const duration = jsonLdData?.timeRequired || providerSpecific.duration || null;

    // Determine External Course ID
    const externalCourseId = providerSpecific.externalCourseId || this.extractCourseIdFromUrl(officialUrl);

    return {
      title,
      description,
      provider: this.providerKey,
      providerDisplayName: this.providerDisplayName,
      officialUrl,
      canonicalUrl,
      imageUrl,
      category,
      difficulty,
      skills,
      duration,
      priceType: providerSpecific.priceType || (jsonLdData?.isAccessibleForFree ? 'free' : null),
      rating: jsonLdData?.aggregateRating || providerSpecific.rating || null,
      externalCourseId,
      extraction: {
        titleSource,
        descriptionSource,
        imageSource,
        categorySource: category ? categorySource : undefined,
        difficultySource: difficulty ? difficultySource : undefined,
        skillsSource: skills.length > 0 ? skillsSource : undefined,
        providerSource: 'validated_hostname',
      },
    };
  }

  /**
   * Provider-specific CSS or DOM overrides (implemented by child extractors where helpful)
   */
  protected extractProviderSpecific(
    _$: cheerio.CheerioAPI,
    _url: string
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
    return {};
  }

  /**
   * Extracts JSON-LD Course schema
   */
  protected extractJsonLd($: cheerio.CheerioAPI): {
    name?: string;
    description?: string;
    image?: string;
    about?: string;
    category?: string;
    educationalLevel?: string;
    teaches?: string[];
    timeRequired?: string;
    isAccessibleForFree?: boolean;
    aggregateRating?: number;
  } | null {
    const scripts = $('script[type="application/ld+json"]').toArray();

    for (const elem of scripts) {
      try {
        const text = $(elem).text().trim();
        if (!text) continue;
        const parsed = JSON.parse(text);

        // Could be a single object, an array, or an object with @graph
        const objects: any[] = [];
        if (Array.isArray(parsed)) {
          objects.push(...parsed);
        } else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
          objects.push(...parsed['@graph']);
        } else if (typeof parsed === 'object' && parsed !== null) {
          objects.push(parsed);
        }

        // Look for @type === 'Course' or 'LearningResource' or similar
        const courseObj = objects.find(
          (o) =>
            o &&
            (o['@type'] === 'Course' ||
              o['@type'] === 'LearningResource' ||
              (Array.isArray(o['@type']) && (o['@type'].includes('Course') || o['@type'].includes('LearningResource'))))
        );

        if (courseObj) {
          let imageStr: string | undefined;
          if (typeof courseObj.image === 'string') {
            imageStr = courseObj.image;
          } else if (Array.isArray(courseObj.image) && typeof courseObj.image[0] === 'string') {
            imageStr = courseObj.image[0];
          } else if (courseObj.image?.url) {
            imageStr = courseObj.image.url;
          }

          let ratingNum: number | undefined;
          if (courseObj.aggregateRating?.ratingValue) {
            const val = parseFloat(courseObj.aggregateRating.ratingValue);
            if (!isNaN(val)) ratingNum = val;
          }

          let teachesList: string[] | undefined;
          if (Array.isArray(courseObj.teaches)) {
            teachesList = courseObj.teaches.map((t: any) => (typeof t === 'string' ? t : t?.name || ''));
          } else if (typeof courseObj.teaches === 'string') {
            teachesList = courseObj.teaches.split(',').map((s: string) => s.trim());
          }

          return {
            name: courseObj.name,
            description: courseObj.description,
            image: imageStr,
            about: typeof courseObj.about === 'string' ? courseObj.about : courseObj.about?.name,
            category: courseObj.courseCategory || courseObj.category,
            educationalLevel: courseObj.educationalLevel,
            teaches: teachesList,
            timeRequired: courseObj.timeRequired,
            isAccessibleForFree: courseObj.isAccessibleForFree,
            aggregateRating: ratingNum,
          };
        }
      } catch {
        // Continue to next script
      }
    }

    return null;
  }

  /**
   * Extracts Open Graph and Twitter Card tags
   */
  protected extractOpenGraph($: cheerio.CheerioAPI): {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
  } {
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('meta[property="twitter:title"]').attr('content');

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[property="twitter:description"]').attr('content');

    const image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[property="twitter:image"]').attr('content');

    const url = $('meta[property="og:url"]').attr('content') || $('meta[name="og:url"]').attr('content');

    return {
      title: title ? title.trim() : undefined,
      description: description ? description.trim() : undefined,
      image: image ? image.trim() : undefined,
      url: url ? url.trim() : undefined,
    };
  }

  /**
   * Extracts HTML Standard Title and Meta Description
   */
  protected extractHtmlMeta($: cheerio.CheerioAPI): {
    title?: string;
    description?: string;
  } {
    const title = $('title').text().trim();
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="description"]').attr('content');

    return {
      title: title || undefined,
      description: description ? description.trim() : undefined,
    };
  }

  /**
   * Cleans title: removes provider suffixes, extra spaces, pipes
   */
  protected cleanTitle(rawTitle: string): string {
    let clean = rawTitle.replace(/\s+/g, ' ').trim();

    // Remove provider suffixes
    const suffixes = [
      /\s*\|\s*Coursera\s*$/i,
      /\s*-\s*Coursera\s*$/i,
      /\s*\|\s*freeCodeCamp\.org\s*$/i,
      /\s*-\s*freeCodeCamp\s*$/i,
      /\s*\|\s*freeCodeCamp\s*$/i,
      /\s*\|\s*Udemy\s*$/i,
      /\s*-\s*Udemy\s*$/i,
      /\s*\|\s*Unstop\s*$/i,
      /\s*-\s*Unstop\s*$/i,
      /\s*\|\s*edX\s*$/i,
      /\s*-\s*edX\s*$/i,
      /\s*\|\s*Online Course\s*$/i,
    ];

    for (const pattern of suffixes) {
      clean = clean.replace(pattern, '').trim();
    }

    return clean;
  }

  /**
   * Cleans description: strips HTML, removes tracking text, trims length
   */
  protected cleanDescription(rawDesc: string): string | null {
    if (!rawDesc || typeof rawDesc !== 'string') return null;

    // Strip HTML tags if any were embedded in metadata
    let clean = rawDesc.replace(/<[^>]*>?/gm, ' ');
    clean = clean.replace(/\s+/g, ' ').trim();

    // If description is trivial or contains only boilerplate
    if (clean.length < 15) return null;

    // Limit extreme length to 1200 characters for presentation clarity
    if (clean.length > 1200) {
      clean = clean.substring(0, 1197).trim() + '...';
    }

    return clean;
  }

  /**
   * Validates and normalizes image URL
   */
  protected validateImageUrl(rawUrl: string): string | null {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.toString();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Maps difficulty string to controlled CourseDifficulty
   */
  protected mapDifficulty(diffStr: string): CourseDifficulty | null {
    const lower = diffStr.toLowerCase().trim();
    if (lower.includes('beginner') || lower.includes('introductory') || lower.includes('foundation')) {
      return 'beginner';
    }
    if (lower.includes('intermediate') || lower.includes('medium')) {
      return 'intermediate';
    }
    if (lower.includes('advanced') || lower.includes('expert')) {
      return 'advanced';
    }
    if (lower.includes('all') || lower.includes('mixed')) {
      return 'all_levels';
    }
    return null;
  }

  /**
   * Heuristic difficulty mapper from course text
   */
  protected mapDifficultyFromText(title: string, desc: string): CourseDifficulty | null {
    const combined = `${title} ${desc}`.toLowerCase();
    if (combined.includes('for beginners') || combined.includes('intro to') || combined.includes('introduction to')) {
      return 'beginner';
    }
    if (combined.includes('advanced') || combined.includes('masterclass') || combined.includes('deep dive')) {
      return 'advanced';
    }
    return null;
  }

  /**
   * Maps string to known CourseCategory taxonomy
   */
  protected mapCategory(catStr: string): CourseCategory | null {
    const clean = catStr.toUpperCase().replace(/\s+/g, '_');

    if (clean.includes('GENERATIVE_AI') || clean.includes('GENAI') || clean.includes('LLM')) return 'GENERATIVE_AI';
    if (clean.includes('DEEP_LEARNING') || clean.includes('NEURAL')) return 'DEEP_LEARNING';
    if (clean.includes('MACHINE_LEARNING') || clean.includes('ML')) return 'MACHINE_LEARNING';
    if (clean.includes('ARTIFICIAL_INTELLIGENCE') || clean === 'AI') return 'AI';
    if (clean.includes('PYTHON')) return 'PYTHON';
    if (clean.includes('DATA_SCIENCE')) return 'DATA_SCIENCE';
    if (clean.includes('DATA_ANALYTICS') || clean.includes('BUSINESS_INTELLIGENCE')) return 'DATA_ANALYTICS';
    if (clean.includes('FULL_STACK')) return 'FULL_STACK';
    if (clean.includes('WEB_DEVELOPMENT') || clean.includes('FRONTEND') || clean.includes('BACKEND')) return 'WEB_DEVELOPMENT';
    if (clean.includes('CLOUD') || clean.includes('AWS') || clean.includes('AZURE') || clean.includes('GCP')) return 'CLOUD';
    if (clean.includes('CYBERSECURITY') || clean.includes('SECURITY')) return 'CYBERSECURITY';
    if (clean.includes('DEVOPS') || clean.includes('MLOPS')) return 'DEVOPS';
    if (clean.includes('DATABASE') || clean.includes('SQL')) return 'DATABASES';
    if (clean.includes('SOFTWARE_ENGINEERING')) return 'SOFTWARE_ENGINEERING';
    if (clean.includes('PROGRAMMING')) return 'PROGRAMMING';

    return null;
  }

  /**
   * Heuristic category mapper from title & description
   */
  protected mapCategoryFromText(title: string, desc: string | null): CourseCategory | null {
    const text = `${title} ${desc || ''}`.toLowerCase();

    if (text.includes('generative ai') || text.includes('large language model') || text.includes('prompt engineering') || text.includes('llm')) {
      return 'GENERATIVE_AI';
    }
    if (text.includes('deep learning') || text.includes('neural network') || text.includes('pytorch') || text.includes('tensorflow')) {
      return 'DEEP_LEARNING';
    }
    if (text.includes('machine learning') || text.includes('scikit-learn') || text.includes('supervised learning')) {
      return 'MACHINE_LEARNING';
    }
    if (text.includes('artificial intelligence') || text.includes('ai agent')) {
      return 'AI';
    }
    if (text.includes('python')) {
      return 'PYTHON';
    }
    if (text.includes('data science') || text.includes('data analysis') || text.includes('pandas') || text.includes('numpy')) {
      return 'DATA_SCIENCE';
    }
    if (text.includes('web development') || text.includes('react') || text.includes('node.js') || text.includes('javascript') || text.includes('html/css')) {
      return 'WEB_DEVELOPMENT';
    }
    if (text.includes('cloud computing') || text.includes('aws') || text.includes('azure') || text.includes('google cloud')) {
      return 'CLOUD';
    }
    if (text.includes('cybersecurity') || text.includes('ethical hacking') || text.includes('network security')) {
      return 'CYBERSECURITY';
    }
    if (text.includes('devops') || text.includes('docker') || text.includes('kubernetes') || text.includes('ci/cd')) {
      return 'DEVOPS';
    }
    if (text.includes('database') || text.includes('sql') || text.includes('postgres') || text.includes('mongodb')) {
      return 'DATABASES';
    }

    return null;
  }

  /**
   * Cleans skills array: trims, deduplicates, filters short/empty strings
   */
  protected cleanSkills(skills: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const s of skills) {
      if (typeof s !== 'string') continue;
      const clean = s.trim();
      if (clean.length >= 2 && clean.length <= 40 && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        result.push(clean);
      }
    }

    return result.slice(0, 10); // Limit to top 10 skills
  }

  /**
   * Helper to parse slug/ID from standard course URL
   */
  protected extractCourseIdFromUrl(urlStr: string): string | null {
    try {
      const parsed = new URL(urlStr);
      const segments = parsed.pathname.split('/').filter(Boolean);
      return segments.pop() || null;
    } catch {
      return null;
    }
  }
}
