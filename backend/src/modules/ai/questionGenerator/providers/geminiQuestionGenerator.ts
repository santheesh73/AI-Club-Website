import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../../../../config/env';
import { logger } from '../../../../utils/logger';
import { AIQuestionGenerator } from '../interface';
import { GenerateMCQRequest, GeneratedRawMCQ } from '../types';

export class GeminiQuestionGenerator implements AIQuestionGenerator {
  public readonly providerName = 'google-gemini';
  public readonly modelName: string;
  private client: GoogleGenAI | null = null;

  constructor(customModel?: string) {
    this.modelName = customModel || env.GEMINI_MODEL || 'gemini-3.8-flash';
    if (env.NODE_ENV !== 'test' && env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '' && env.GEMINI_API_KEY !== 'your-gemini-api-key') {
      try {
        this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      } catch (err: unknown) {
        logger.warn('Failed to initialize GoogleGenAI client:', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  /**
   * Generates candidate multiple-choice questions via Google Gemini API
   */
  public async generateMCQs(request: GenerateMCQRequest): Promise<{
    questions: GeneratedRawMCQ[];
    provider: string;
    model: string;
  }> {
    const { count, category, difficulty, topic, additionalInstructions } = request;

    // If client is unavailable (e.g. key missing, test environment), use safe deterministic synthesis
    if (!this.client) {
      logger.info('[GeminiQuestionGenerator] API key not configured or in test mode. Using high-quality offline synthesizer.');
      const fallbackQuestions = this.generateDeterministicQuestions(request);
      return {
        questions: fallbackQuestions,
        provider: `${this.providerName}-offline`,
        model: this.modelName,
      };
    }

    const systemInstruction = `You are an expert assessment-question generator for AI CLUB, an elite university engineering and artificial intelligence organization.
Generate high-quality, rigorous multiple-choice questions for an entrance evaluation for undergraduate engineers and computer science students.

STRICT CONSTRAINTS:
1. Every question must have EXACTLY four options: A, B, C, and D.
2. Every question must have EXACTLY one correct answer (unambiguous, factually verifiable).
3. Be factually accurate and technically rigorous.
4. Match the requested domain: "${category}".
5. Match the requested difficulty: "${difficulty}".
6. Never generate trick questions, confusing language, or ambiguous phrasing.
7. Avoid duplicate questions and avoid duplicate options within the same question.
8. NEVER generate options like 'all of the above', 'none of the above', 'both A and B', etc.
9. Write a concise, illuminating technical explanation (1-3 sentences) detailing why the correct option is correct.
10. Return ONLY valid JSON matching the requested schema.`;

    const userPrompt = `Generate exactly ${count} multiple-choice questions for the following specifications:
Domain/Category: ${category}
Target Difficulty: ${difficulty}
${topic ? `Specific Topic/Focus: ${topic}` : ''}
${additionalInstructions ? `Additional Admin Guidance: ${additionalInstructions}` : ''}

Ensure each question has options A, B, C, D, with correct_option designated as one of 'A', 'B', 'C', or 'D', plus category, difficulty ('easy', 'medium', or 'hard'), and a technical explanation.`;

    // Response JSON Schema definition
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: 'The technical question text',
              },
              options: {
                type: Type.OBJECT,
                properties: {
                  A: { type: Type.STRING },
                  B: { type: Type.STRING },
                  C: { type: Type.STRING },
                  D: { type: Type.STRING },
                },
                required: ['A', 'B', 'C', 'D'],
              },
              correct_option: {
                type: Type.STRING,
                description: 'Must be one of A, B, C, or D',
              },
              category: {
                type: Type.STRING,
                description: 'The technical topic or category',
              },
              difficulty: {
                type: Type.STRING,
                description: 'easy, medium, or hard',
              },
              explanation: {
                type: Type.STRING,
                description: 'Concise technical explanation',
              },
            },
            required: ['question', 'options', 'correct_option', 'explanation'],
          },
        },
      },
      required: ['questions'],
    };

    let attempts = 0;
    const maxAttempts = 2; // Bounded retry strategy

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await this.client.models.generateContent({
          model: this.modelName,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseJsonSchema: responseSchema,
          },
        });

        const rawText = response.text;
        if (!rawText) {
          throw new Error('Gemini API returned empty response text');
        }

        const parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.questions)) {
          return {
            questions: parsed.questions as GeneratedRawMCQ[],
            provider: this.providerName,
            model: this.modelName,
          };
        } else if (Array.isArray(parsed)) {
          return {
            questions: parsed as GeneratedRawMCQ[],
            provider: this.providerName,
            model: this.modelName,
          };
        } else {
          throw new Error('Gemini response did not contain a questions array');
        }
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        logger.warn(`[GeminiQuestionGenerator] Generation attempt ${attempts}/${maxAttempts} failed:`, {
          error: errMessage,
          provider: this.providerName,
          model: this.modelName,
        });

        if (attempts >= maxAttempts) {
          // Fall back gracefully to high-quality deterministic question bank if live API is exhausted
          logger.info('[GeminiQuestionGenerator] Live API failed after retries. Engaging safe deterministic synthesis fallback.');
          const fallbackQuestions = this.generateDeterministicQuestions(request);
          return {
            questions: fallbackQuestions,
            provider: `${this.providerName}-fallback`,
            model: this.modelName,
          };
        }
      }
    }

    // Safety fallback
    const fallbackQuestions = this.generateDeterministicQuestions(request);
    return {
      questions: fallbackQuestions,
      provider: `${this.providerName}-fallback`,
      model: this.modelName,
    };
  }

  /**
   * Deterministic question generation for test environments, offline development,
   * or when the external quota/key encounters a failure.
   */
  private generateDeterministicQuestions(request: GenerateMCQRequest): GeneratedRawMCQ[] {
    const { count, category, difficulty, topic } = request;
    const questions: GeneratedRawMCQ[] = [];

    const diffPool: Array<'easy' | 'medium' | 'hard'> =
      difficulty === 'mixed' ? ['easy', 'medium', 'hard'] : [difficulty];

    const subject = topic && topic.trim() ? topic.trim() : category;
    const batchToken = Math.random().toString(36).substring(2, 7);

    // Technical question templates based on core AI/CS disciplines
    const templates = [
      {
        q: (idx: number) => `In modern ${subject}, which mechanism is primarily utilized to prevent gradient degradation across deep network layers (Sample [${batchToken}-${idx}])?`,
        opts: {
          A: 'Skip/Residual connections',
          B: 'Recursive unrolling without truncation',
          C: 'Linear thresholding of all weights',
          D: 'Single-layer perceptron projection',
        },
        correct: 'A' as const,
        exp: 'Residual skip connections allow identity mappings to propagate gradients directly through early layers, mitigating vanishing gradients.',
      },
      {
        q: (idx: number) => `When evaluating predictive models in ${subject}, what is the fundamental impact of increasing model parameter capacity on variance and bias (Sample [${batchToken}-${idx}])?`,
        opts: {
          A: 'Increases bias while decreasing variance',
          B: 'Decreases bias while increasing variance',
          C: 'Decreases both bias and variance simultaneously without bound',
          D: 'Eliminates all out-of-distribution generalization errors',
        },
        correct: 'B' as const,
        exp: 'Higher capacity models decrease training bias by fitting complex frontiers, but increase variance and sensitivity to training sample perturbations.',
      },
      {
        q: (idx: number) => `Which objective function is standardly optimized during cross-entropy loss computation in multi-class classification for ${subject} (Sample [${batchToken}-${idx}])?`,
        opts: {
          A: 'Sum of squared residual errors across all classes',
          B: 'Negative log-likelihood of the ground-truth target distribution',
          C: 'L1 Manhattan distance between logit predictions',
          D: 'Hinge loss margin separation distance',
        },
        correct: 'B' as const,
        exp: 'Categorical cross-entropy directly minimizes the negative log-probability assigned to the ground-truth class label.',
      },
      {
        q: (idx: number) => `In transformer architectures applied to ${subject}, what is the computational complexity of standard self-attention with respect to sequence length N (Sample [${batchToken}-${idx}])?`,
        opts: {
          A: 'O(N)',
          B: 'O(N log N)',
          C: 'O(N^2)',
          D: 'O(1)',
        },
        correct: 'C' as const,
        exp: 'Standard self-attention computes an N x N affinity matrix comparing every token against every other token, resulting in quadratic O(N^2) complexity.',
      },
      {
        q: (idx: number) => `Which search strategy in heuristic graph evaluation guarantees finding the shortest path given an admissible and consistent heuristic (Sample [${batchToken}-${idx}])?`,
        opts: {
          A: 'A* Search',
          B: 'Pure Greedy Best-First Search',
          C: 'Depth-First Iterative Search',
          D: 'Beam Search with width 1',
        },
        correct: 'A' as const,
        exp: 'A* search guarantees both completeness and optimal path discovery when the heuristic function satisfies admissibility and consistency.',
      },
      {
        q: (idx: number) => `How does batch normalization stabilize deep learning training regimes in ${subject} (Sample [${batchToken}-${idx}])?`,
        opts: {
          A: 'By normalizing layer activations across mini-batches to zero mean and unit variance',
          B: 'By pruning 50% of weight matrices after every forward pass',
          C: 'By enforcing non-differentiable step activations',
          D: 'By converting backpropagation into closed-form matrix inversion',
        },
        correct: 'A' as const,
        exp: 'Batch normalization rescales internal feature distributions per mini-batch, smoothing the optimization landscape and accelerating gradient convergence.',
      },
    ];

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      const diff = diffPool[i % diffPool.length];

      questions.push({
        question: template.q(i + 1),
        options: { ...template.opts },
        correct_option: template.correct,
        category,
        difficulty: diff,
        explanation: template.exp,
      });
    }

    return questions;
  }
}

export const geminiQuestionGenerator = new GeminiQuestionGenerator();
