import { Router, Request, Response, NextFunction } from 'express';
import { adminAssessmentService } from './assessment.service';
import { sendSuccess, AppError } from '../../utils/response';

const router = Router();

// GET /api/v1/admin/assessment/questions
router.get('/questions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, status, search, page, pageSize } = req.query;
    const result = await adminAssessmentService.getQuestions({
      category: typeof category === 'string' ? category : undefined,
      status: typeof status === 'string' ? status : undefined,
      search: typeof search === 'string' ? search : undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    sendSuccess(res, result.questions, 200, {
      total: result.total,
      page: result.page,
      limit: result.pageSize,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/assessment/questions/:id
router.get('/questions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const question = await adminAssessmentService.getQuestionById(id);
    sendSuccess(res, question, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/assessment/questions
router.post('/questions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const {
      questionText,
      category,
      difficulty,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      marks,
      status,
      explanation,
    } = req.body;

    if (!questionText || !category || !optionA || !optionB || !optionC || !optionD || !correctOption) {
      return next(
        new AppError(
          'Missing required fields (questionText, category, optionA, optionB, optionC, optionD, correctOption)',
          400,
          'BAD_REQUEST'
        )
      );
    }

    const created = await adminAssessmentService.createQuestion(
      {
        questionText,
        category,
        difficulty,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
        marks,
        status,
        explanation,
      },
      adminUser.id,
      req.requestId
    );

    sendSuccess(res, created, 201, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/admin/assessment/questions/:id
router.put('/questions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const { id } = req.params;
    const updated = await adminAssessmentService.updateQuestion(
      id,
      req.body,
      adminUser.id,
      req.requestId
    );

    sendSuccess(res, updated, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/assessment/questions/:id
router.delete('/questions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const { id } = req.params;
    const result = await adminAssessmentService.deleteQuestion(id, adminUser.id, req.requestId);
    sendSuccess(res, result, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/assessment/generate (AI-assisted MCQ generation)
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const { count, category, difficulty, topic, additionalInstructions } = req.body;
    const { questionGenerationService } = await import('../ai/questionGenerator');

    const result = await questionGenerationService.generateAndStageQuestions(
      {
        count: count !== undefined ? Number(count) : 10,
        category: category || 'AI Fundamentals',
        difficulty: difficulty || 'medium',
        topic,
        additionalInstructions,
      },
      adminUser.id,
      req.requestId
    );

    sendSuccess(res, result, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/assessment/questions/:id/publish
router.post('/questions/:id/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const { id } = req.params;
    const published = await adminAssessmentService.publishQuestion(id, adminUser.id, req.requestId);
    sendSuccess(res, published, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/assessment/publish-batch
router.post('/publish-batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUser = req.user;
    if (!adminUser) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const { questionIds } = req.body;
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return next(new AppError('questionIds array is required', 400, 'BAD_REQUEST'));
    }

    const result = await adminAssessmentService.publishBatch(questionIds, adminUser.id, req.requestId);
    sendSuccess(res, result, 200, { requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/assessment/settings
router.get('/settings', (req: Request, res: Response) => {
  const settings = adminAssessmentService.getAssessmentSettings();
  sendSuccess(res, settings, 200, { requestId: req.requestId });
});

export const adminAssessmentRoutes = router;
