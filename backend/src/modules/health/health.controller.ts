import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { env } from '../../config/env';
import { supabaseAdmin } from '../../services/supabase';

export async function getHealthStatus(req: Request, res: Response) {
  const databaseStatus = supabaseAdmin ? 'configured' : 'standby_local';

  return sendSuccess(
    res,
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      environment: env.NODE_ENV,
      services: {
        server: 'healthy',
        database: databaseStatus,
      },
    },
    200,
    { requestId: req.requestId }
  );
}
