# AI CLUB — Production Deployment Guide

> **Milestone 10: Production Hardening, Security, Testing, Deployment & Launch Readiness**  
> Operational guide for deploying, configuring, and maintaining the AI CLUB platform in staging and production environments.

---

## 1. System Overview & Deployment Topology

The AI CLUB platform utilizes a decoupled, high-performance architecture:
- **Frontend SPA**: React 18 + Vite + TypeScript. Deployed to modern edge/static hosting (Vercel, Netlify, Cloudflare Pages, or AWS S3 + CloudFront / Nginx).
- **Backend API**: Node.js + Express + TypeScript. Deployed as a containerized service (Docker, AWS ECS/Fargate, Render, Fly.io, or DigitalOcean App Platform) managed by PM2 or Kubernetes.
- **Authoritative Database & Auth**: Supabase managed PostgreSQL 15 with Row Level Security (RLS) and Supabase Auth.
- **Object Storage**: Supabase Storage with dedicated private/public buckets (`avatars`, `project-media`).
- **AI Intelligence**: Google Gemini API via official `@google/genai` SDK.

```
                          [ Client Browser ]
                                  │
                  ┌───────────────┴──────────────┐
                  │ HTTPS (443)                  │ HTTPS (443)
                  ▼                              ▼
        [ Edge Static Hosting ]        [ Reverse Proxy / Cloudflare ]
           (Frontend SPA)                        │
                                                 ▼
                                     [ Backend Node.js / Express ]
                                        (Rate Limiting & RBAC)
                                                 │
                                ┌────────────────┴────────────────┐
                                │ SSL / TLS (5432)                │ HTTPS (REST)
                                ▼                                 ▼
                     [ Supabase PostgreSQL 15 ]          [ Google Gemini API ]
                     (RLS Enforced Policies)             (AI Intelligence)
```

---

## 2. Environment Configuration & Matrix

All secrets must be injected securely via platform secret managers (e.g. AWS Secrets Manager, Doppler, GitHub Actions Secrets). Never commit `.env` files to git.

### 2.1 Backend Environment Variables (`backend/.env`)

| Variable | Type | Required | Description & Recommended Production Value |
|---|---|---|---|
| `NODE_ENV` | string | Yes | Set strictly to `production` (enables HSTS, error stack stripping) |
| `PORT` | number | Yes | Server binding port (e.g. `5000` or assigned by platform) |
| `HOST` | string | Yes | Interface to bind (typically `0.0.0.0`) |
| `API_VERSION` | string | Yes | Current API version (`v1`) |
| `CORS_ORIGIN` | string | Yes | Explicit comma-separated allowed frontend origins (e.g. `https://aiclub.university.edu`) |
| `SUPABASE_URL` | string | Yes | Supabase project URL (`https://<project-ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | string | Yes | Authoritative service-role key for backend operations |
| `SUPABASE_JWT_SECRET` | string | Yes | JWT secret key matching the Supabase Auth project |
| `GEMINI_API_KEY` | string | Yes | Google Gemini API key for member intelligence and analytics |
| `RATE_LIMIT_WINDOW_MS` | number | No | Sliding window duration in milliseconds (default: `900000` = 15m) |
| `RATE_LIMIT_MAX_REQUESTS` | number | No | Max requests per IP per window (default: `100` general, `20` auth, `10` assessment, `15` AI) |
| `LOG_LEVEL` | string | No | Structured logging level (`info` or `warn` in production) |

### 2.2 Frontend Environment Variables (`frontend/.env.production`)

| Variable | Type | Required | Description |
|---|---|---|---|
| `VITE_APP_NAME` | string | Yes | Public application name (`AI CLUB`) |
| `VITE_APP_ENV` | string | Yes | Set to `production` |
| `VITE_API_BASE_URL` | string | Yes | Production backend URL (`https://api.aiclub.university.edu/api/v1`) |
| `VITE_SUPABASE_URL` | string | Yes | Supabase project URL (`https://<project-ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | string | Yes | Public anon key for client-side Auth |

---

## 3. Database Deployment & Migration Runbook

All database schema, enums, tables, check constraints, RLS policies, and storage configurations are managed as versioned SQL migrations in `database/supabase/migrations/`.

### 3.1 Migration Execution Order

Migrations must be executed sequentially:
1. `20261006000001_foundation_schema.sql`: Core schema, enums, profiles, audit logs.
2. `20261006000002_auth_profiles.sql`: Auth trigger, profiles table, RLS policies.
3. `20261006000003_applications_assessment.sql`: Applications, questions, submissions, answers, scores.
4. `20261006000004_admin_applications.sql`: Admin review queues, application review decisions.
5. `20261006000005_membership_activation.sql`: Memberships, member numbers, member status lifecycle.
6. `20261006000006_events_platform.sql`: Events, categories, registrations, attendance, waitlists.
7. `20261006000007_courses_platform.sql`: Courses, modules, lessons, enrollments, lesson progress.
8. `20261006000008_projects_achievements.sql`: Projects, team members, tags, achievements, project media.
9. `20261006000009_notifications_intelligence.sql`: Notifications, AI insight caches, user analytics.
10. `20261006000010_production_hardening_m10.sql`: Storage buckets (`avatars`, `project-media`), storage RLS policies, performance composite indexes, database integrity checks.

### 3.2 Applying to Remote Supabase Environment

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Authenticate CLI
supabase login

# 3. Link to target project
supabase link --project-ref <your-supabase-project-id>

# 4. Push and verify migrations
supabase db push

# 5. Verify all tables, indexes, and RLS policies
supabase db remote commit
```

---

## 4. Frontend Production Build & Deployment

### 4.1 Production Build
```bash
cd frontend
npm ci
npm run build
```
The output will be placed in `frontend/dist/`.

### 4.2 Nginx Configuration (Single Page Application Routing)
```nginx
server {
    listen 80;
    server_name aiclub.university.edu;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name aiclub.university.edu;

    ssl_certificate /etc/letsencrypt/live/aiclub.university.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aiclub.university.edu/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/aiclub/frontend/dist;
    index index.html;

    # Static asset caching (Vite hashes bundles with unique hashes)
    location ~* \.(?:css|js|woff2?|svg|png|jpg|jpeg|gif|webp)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # SPA Fallback for client-side routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header X-Frame-Options "DENY";
        add_header X-Content-Type-Options "nosniff";
        add_header Referrer-Policy "strict-origin-when-cross-origin";
    }
}
```

---

## 5. Backend Production Build & Deployment

### 5.1 Production Compilation
```bash
cd backend
npm ci
npm run build
```
Compiled JavaScript output is generated in `backend/dist/`.

### 5.2 PM2 Process Management
Deploy using PM2 for automatic process recovery, clustering, and log rotation:

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'aiclub-api',
      script: 'dist/server.js',
      cwd: '/var/www/aiclub/backend',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
```

Run and save:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5.3 Docker Containerization (Alternative)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci --workspace=backend
COPY backend/ ./backend/
RUN npm run build --workspace=backend

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/backend/dist ./dist
USER node
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

---

## 6. Zero-Downtime Deployment & Smoke Verification

### 6.1 Deployment Sequence
1. **Pre-flight**: Run automated test suite (`npm test`).
2. **Database Migration**: Run `supabase db push`. All migrations are strictly backward-compatible.
3. **Backend Rollout**: Deploy updated container/PM2 cluster. Wait for `/health` probe to return 200.
4. **Frontend Rollout**: Deploy static artifacts to edge CDN / Nginx web root.
5. **Post-Deployment Verification**:
   - Query `/health` endpoint to verify DB latency and memory bounds.
   - Run integration smoke verification against API routes (`/api/v1/health`, `/api/v1/auth`, `/api/v1/courses`, `/api/v1/events`).
   - Check error logs for 5xx anomalies.
