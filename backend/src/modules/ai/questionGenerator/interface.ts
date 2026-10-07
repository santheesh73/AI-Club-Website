import { GenerateMCQRequest, GeneratedRawMCQ } from './types';

/**
 * AI Provider abstraction interface.
 * Decouples the question generation business logic from specific AI models (Gemini, OpenAI, Claude, etc.)
 */
export interface AIQuestionGenerator {
  readonly providerName: string;
  readonly modelName: string;

  /**
   * Generates candidate MCQ questions returning structured raw questions
   */
  generateMCQs(request: GenerateMCQRequest): Promise<{
    questions: GeneratedRawMCQ[];
    provider: string;
    model: string;
  }>;
}
