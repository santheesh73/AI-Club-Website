import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { env } from '../../config/env';
import { supabaseAdmin } from '../../services/supabase';

export async function getHealthStatus(req: Request, res: Response) {
  let dbStatus: 'connected' | 'standby_local' | 'unreachable' = 'standby_local';
  let overallStatus: 'ok' | 'degraded' = 'ok';

  if (supabaseAdmin) {
    try {
      // Lightweight connectivity probe using head query
      const { error } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      if (error) {
        dbStatus = 'unreachable';
        overallStatus = 'degraded';
      } else {
        dbStatus = 'connected';
      }
    } catch {
      dbStatus = 'unreachable';
      overallStatus = 'degraded';
    }
  }

  const mem = process.memoryUsage();

  return sendSuccess(
    res,
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: '0.1.0',
      environment: env.NODE_ENV,
      services: {
        server: 'healthy',
        database: dbStatus,
      },
      system: {
        heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      },
    },
    overallStatus === 'ok' ? 200 : 503,
    { requestId: req.requestId }
  );
}
