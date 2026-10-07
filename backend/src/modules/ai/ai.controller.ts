import { Request, Response, NextFunction } from 'express';
import { aiIntelligenceService } from './ai.service';
import { sendSuccess } from '../../utils/response';
import { generateInsightSchema } from './ai.validators';

export class AiIntelligenceController {
  async getInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period } = generateInsightSchema.parse(req.query);
      const insight = await aiIntelligenceService.getLatestInsight(period);
      sendSuccess(res, insight);
    } catch (err) {
      next(err);
    }
  }

  async generateInsight(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period, forceRefresh } = generateInsightSchema.parse(req.body);
      const insight = await aiIntelligenceService.generateAdvisoryInsight(
        period,
        forceRefresh,
        req.user!.id
      );
      sendSuccess(res, insight);
    } catch (err) {
      next(err);
    }
  }
}

export const aiIntelligenceController = new AiIntelligenceController();
