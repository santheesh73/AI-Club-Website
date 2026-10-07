import helmet from 'helmet';
import cors from 'cors';
import { env } from '../config/env';

const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

export const securityHeaders = helmet({
  contentSecurityPolicy:
    env.NODE_ENV === 'production'
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            connectSrc: ["'self'", 'https:', 'wss:'],
            fontSrc: ["'self'", 'https:', 'data:'],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginEmbedderPolicy: false,
  hsts:
    env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true,
});

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Non-browser / same-origin / server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    // Check exact matches or wildcard
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (allowedOrigins.includes('*')) {
      // In credentials mode, reflect the verified request origin
      return callback(null, origin);
    }

    // Reject non-allowed origins gracefully
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-Id',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
  ],
  exposedHeaders: [
    'X-Request-Id',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
    'Retry-After',
  ],
  maxAge: 86400, // 24 hours preflight cache
});
