# AI CLUB — Projects, Achievements & Community Showcase Platform API Specification

## 1. Overview
The Projects, Achievements & Community Showcase API provides endpoints for showcasing innovative AI projects, discovering member works, managing project lifecycles (draft, published, archived), managing project links and media, managing project contributors, claiming and verifying member achievements, and administering community moderation and spotlight features.

**Base URLs**:
- Public / Shared Showcase: `/api/v1/projects`
- Member Project Workspace: `/api/v1/member/projects`
- Achievements Catalog & Claims: `/api/v1/achievements` and `/api/v1/member/achievements`
- Admin Moderation & Community: `/api/v1/admin/community` and `/api/v1/admin/projects`

---

## 2. Authentication & Authorization

1. **Public Showcase Endpoints** (`GET /api/v1/projects/*`):
   - Optional authentication supported via `optionalAuthenticate`.
   - If unauthenticated, only published projects with `visibility = 'public'` are returned.
   - If authenticated as an active member, projects with `visibility = 'members_only'` are also returned.
   - Projects in `draft`, `archived`, or `hidden` status are strictly filtered out.

2. **Member Workspace Endpoints** (`/api/v1/member/projects/*`, `/api/v1/member/achievements/*`):
   - Requires valid JWT in `Authorization: Bearer <token>`.
   - Requires verified active membership (`public.memberships.status = 'active'`). Non-members or unverified applicants receive `403 FORBIDDEN` (`MEMBERSHIP_REQUIRED`).
   - Mutation operations strictly enforce project ownership (`project.owner_id === req.user.id`). Non-owners receive `403 FORBIDDEN`.

3. **Admin Moderation Endpoints** (`/api/v1/admin/community/*`, `/api/v1/admin/projects/*`):
   - Requires valid JWT with `role = 'admin'`.

---

## 3. Public & Shared Showcase Endpoints

### 3.1 List Project Categories
`GET /api/v1/projects/categories`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "c8111000-0000-0000-0000-000000000001",
      "name": "Natural Language Processing",
      "slug": "nlp",
      "description": "Transformers, LLMs, prompt engineering, and conversational AI agents."
    }
  ]
}
```

### 3.2 List Technologies
`GET /api/v1/projects/technologies`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "c8112000-0000-0000-0000-000000000001",
      "name": "PyTorch",
      "slug": "pytorch",
      "category": "Framework"
    }
  ]
}
```

### 3.3 List Featured Projects
`GET /api/v1/projects/featured`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "c8113000-0000-0000-0000-000000000001",
      "title": "MedVision: Autonomous Diagnostic Imaging Assistant",
      "slug": "medvision-autonomous-diagnostic-imaging-assistant",
      "shortDescription": "Multimodal Vision-Language model for radiological findings synthesis.",
      "featuredOrder": 1
    }
  ]
}
```

### 3.4 Browse Showcase Projects
`GET /api/v1/projects`

**Query Parameters**:
- `category` (string, optional): Category slug.
- `technology` (string, optional): Technology slug.
- `search` (string, optional): Keyword search matching title or short description.
- `featured` (boolean, optional): Filter only featured projects.
- `page` (number, optional, default: 1).
- `pageSize` (number, optional, default: 12).

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "c8113000-0000-0000-0000-000000000001",
      "title": "MedVision: Autonomous Diagnostic Imaging Assistant",
      "slug": "medvision-autonomous-diagnostic-imaging-assistant",
      "shortDescription": "Multimodal Vision-Language model for radiological findings synthesis.",
      "coverImageUrl": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80",
      "category": {
        "id": "c8111000-0000-0000-0000-000000000002",
        "name": "Computer Vision",
        "slug": "computer-vision"
      },
      "status": "published",
      "visibility": "public",
      "isFeatured": true,
      "owner": {
        "id": "e0000000-0000-0000-0000-000000000001",
        "fullName": "Aria Chen",
        "avatarUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330"
      },
      "technologies": ["PyTorch", "Hugging Face", "FastAPI"],
      "contributorCount": 2,
      "createdAt": "2026-09-01T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 12,
    "total": 3
  }
}
```

### 3.5 Get Project Dossier
`GET /api/v1/projects/:slug`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "c8113000-0000-0000-0000-000000000001",
    "title": "MedVision: Autonomous Diagnostic Imaging Assistant",
    "slug": "medvision-autonomous-diagnostic-imaging-assistant",
    "shortDescription": "Multimodal Vision-Language model for radiological findings synthesis.",
    "description": "Full technical breakdown...",
    "category": { "id": "...", "name": "Computer Vision", "slug": "computer-vision" },
    "status": "published",
    "visibility": "public",
    "isFeatured": true,
    "owner": { "id": "...", "fullName": "Aria Chen" },
    "technologies": [
      { "id": "...", "name": "PyTorch", "slug": "pytorch", "category": "Framework" }
    ],
    "contributors": [
      {
        "id": "...",
        "userId": "...",
        "role": "Model Architecture Lead",
        "isOwner": true,
        "fullName": "Aria Chen"
      }
    ],
    "links": [
      {
        "id": "...",
        "title": "Source Code",
        "url": "https://github.com/aiclub/medvision",
        "linkType": "github"
      }
    ],
    "media": [
      {
        "id": "...",
        "mediaType": "image",
        "url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d",
        "caption": "Segmentation output"
      }
    ]
  }
}
```

---

## 4. Member Project Workspace Endpoints

### 4.1 List My Projects
`GET /api/v1/member/projects`

Returns all projects owned by the authenticated member (including `draft`, `published`, `archived`, `hidden`).

### 4.2 Create Project
`POST /api/v1/member/projects`

**Request Body**:
```json
{
  "title": "Agentic Workflow Orchestrator",
  "shortDescription": "Autonomous multi-agent system executing real-time data pipelines.",
  "description": "Markdown detailed architecture overview...",
  "categoryId": "c8111000-0000-0000-0000-000000000001",
  "visibility": "public",
  "coverImageUrl": "https://images.unsplash.com/photo-1518770660439-4636190af475",
  "technologies": ["c8112000-0000-0000-0000-000000000001"],
  "links": [
    { "title": "GitHub Repo", "url": "https://github.com/member/agents", "linkType": "github" }
  ]
}
```

**Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "c8113000-0000-0000-0000-000000000099",
    "title": "Agentic Workflow Orchestrator",
    "slug": "agentic-workflow-orchestrator",
    "status": "draft",
    "visibility": "public"
  }
}
```

### 4.3 Update Project
`PUT /api/v1/member/projects/:id`
Enforces ownership (`project.owner_id === req.user.id`). Non-owners receive `403 FORBIDDEN`.

### 4.4 Publish Project
`POST /api/v1/member/projects/:id/publish`
Transitions status from `draft` to `published`. Sets `publishedAt = NOW()`.

### 4.5 Archive Project
`POST /api/v1/member/projects/:id/archive`
Transitions status from `published` to `archived`.

### 4.6 Contributor Operations
- `POST /api/v1/member/projects/:id/contributors`: Adds or invites a contributor. Reject duplicate contributors with `409 CONFLICT`.
- `DELETE /api/v1/member/projects/:id/contributors/:contributorId`: Removes a contributor. Cannot remove the owner.

### 4.7 External Link Operations
- `POST /api/v1/member/projects/:id/links`: Adds external link (`github`, `live_demo`, `paper`, `docs`, `other`).
- `DELETE /api/v1/member/projects/:id/links/:linkId`: Removes external link.

### 4.8 Media Gallery Operations
- `POST /api/v1/member/projects/:id/media`: Adds media item (`image`, `video`, `demo_embed`).
- `DELETE /api/v1/member/projects/:id/media/:mediaId`: Removes media item.

### 4.9 Report Project
`POST /api/v1/member/projects/:id/report`

**Request Body**:
```json
{
  "reason": "plagiarism",
  "details": "This submission copies architecture from an external repository without attribution."
}
```

**Constraints**:
- Enforces active membership.
- Partial unique index prevents duplicate open/under_review reports from the same reporter against the same project (`409 CONFLICT`).

---

## 5. Achievements Endpoints

### 5.1 List Achievement Categories
`GET /api/v1/achievements/categories`

### 5.2 List Achievement Catalog
`GET /api/v1/achievements`

### 5.3 Get Member Achievements
`GET /api/v1/member/achievements`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "totalPoints": 350,
    "earnedCount": 4,
    "totalCount": 8,
    "achievements": [
      {
        "id": "c8115000-0000-0000-0000-000000000001",
        "title": "Foundation Member",
        "badgeIcon": "award",
        "points": 50,
        "isEarned": true,
        "unlockedAt": "2026-08-15T10:00:00Z",
        "credentialId": "CRED-FOUNDATION-001"
      }
    ]
  }
}
```

### 5.4 Claim Achievement
`POST /api/v1/member/achievements/claim`

**Request Body**:
```json
{
  "achievementId": "c8115000-0000-0000-0000-000000000004",
  "proofUrl": "https://github.com/aiclub/open-source-contribution/pull/42",
  "notes": "Merged PR implementing distributed KV caching."
}
```

---

## 6. Admin Moderation & Community Endpoints

### 6.1 Community Statistics
`GET /api/v1/admin/community/stats`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "totalProjects": 18,
    "publishedProjects": 14,
    "draftProjects": 3,
    "hiddenProjects": 1,
    "openReports": 2,
    "featuredCount": 3
  }
}
```

### 6.2 Review Moderation Reports
`GET /api/v1/admin/community/reports?status=open`

### 6.3 Resolve Moderation Report
`POST /api/v1/admin/community/reports/:id/resolve`

**Request Body**:
```json
{
  "action": "dismissed",
  "notes": "Reviewed and verified source code attribution is valid."
}
```

### 6.4 Hide Project (Content Moderation)
`POST /api/v1/admin/projects/:id/hide`

**Request Body**:
```json
{
  "reason": "Violates community code of conduct regarding proprietary dataset leakage."
}
```
Sets project `status = 'hidden'`, hides project from all showcase discovery, and logs an immutable audit event (`PROJECT_HIDDEN`).

### 6.5 Restore Hidden Project
`POST /api/v1/admin/projects/:id/restore`

Sets project `status = 'published'` and logs an audit event (`PROJECT_RESTORED`).

### 6.6 Feature / Unfeature Project
- `POST /api/v1/admin/projects/:id/feature` (`{ "order": 1 }`): Adds project to spotlight carousel.
- `DELETE /api/v1/admin/projects/:id/feature`: Removes project from spotlight carousel.
