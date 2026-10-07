# AI CLUB — Courses & Learning Management Platform API Specification

## 1. Overview
The Courses & Learning Management Platform API provides endpoints for discovering courses, inspecting syllabus structures, enrolling active members, rendering distraction-free lessons, tracking progress, and managing administrative curriculum lifecycles.

**Base URLs**:
- Public/Shared: `/api/v1/courses`
- Member Learning: `/api/v1/member/courses`
- Admin Curriculum: `/api/v1/admin/courses`

---

## 2. Authentication & Authorization

All member endpoints require:
1. Valid JWT in `Authorization: Bearer <token>`
2. Active verified membership (`public.memberships.status = 'active'`). Non-members or applicants are rejected with `403 FORBIDDEN`.

Admin endpoints require:
1. Valid JWT with `role = 'admin'`

---

## 3. Shared Endpoints

### 3.1 List Categories
`GET /api/v1/courses/categories`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "c7112000-0000-0000-0000-000000000001",
      "name": "Generative AI & LLMs",
      "slug": "generative-ai-llms",
      "description": "Foundational transformer models, prompt engineering, and fine-tuning pipelines."
    }
  ]
}
```

---

## 4. Member Endpoints

### 4.1 Browse Course Catalog
`GET /api/v1/member/courses`

**Query Parameters**:
- `category` (string, optional): Category slug.
- `difficulty` (string, optional): `beginner` | `intermediate` | `advanced`.
- `search` (string, optional): Case-insensitive keyword search.
- `page` (number, optional, default: 1).
- `pageSize` (number, optional, default: 12).

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "c7113000-0000-0000-0000-000000000001",
      "title": "Applied Generative AI & Large Language Models",
      "slug": "applied-generative-ai-llms",
      "shortDescription": "Master generative foundation models, transformer architectures, prompt engineering, and fine-tuning.",
      "category": {
        "id": "c7112000-0000-0000-0000-000000000001",
        "name": "Generative AI & LLMs",
        "slug": "generative-ai-llms"
      },
      "difficulty": "intermediate",
      "estimatedDuration": 240,
      "status": "published",
      "totalModules": 3,
      "totalLessons": 9,
      "isEnrolled": false,
      "enrollmentStatus": null,
      "progressPercentage": null
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 12,
    "total": 4
  }
}
```

### 4.2 Enrolled Courses
`GET /api/v1/member/courses/enrolled`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "c7113000-0000-0000-0000-000000000001",
      "title": "Applied Generative AI & Large Language Models",
      "slug": "applied-generative-ai-llms",
      "isEnrolled": true,
      "enrollmentStatus": "active",
      "progressPercentage": 33
    }
  ]
}
```

### 4.3 Learning Dashboard Telemetry
`GET /api/v1/member/courses/dashboard`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "enrolledCount": 2,
    "inProgressCount": 1,
    "completedCount": 1,
    "totalLessonsCompleted": 12,
    "recentEnrollments": [...],
    "continueLearning": {
      "courseTitle": "Applied Generative AI & Large Language Models",
      "courseSlug": "applied-generative-ai-llms",
      "lessonTitle": "Attention Mechanisms and Scaled Dot-Product",
      "lessonSlug": "attention-mechanisms-scaled-dot-product",
      "progressPercentage": 33
    }
  }
}
```

### 4.4 Course Detail & Syllabus
`GET /api/v1/member/courses/:slug`

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "c7113000-0000-0000-0000-000000000001",
    "title": "Applied Generative AI & Large Language Models",
    "slug": "applied-generative-ai-llms",
    "shortDescription": "...",
    "description": "...",
    "category": { "name": "Generative AI & LLMs" },
    "difficulty": "intermediate",
    "estimatedDuration": 240,
    "status": "published",
    "totalModules": 3,
    "totalLessons": 9,
    "isEnrolled": true,
    "enrollmentStatus": "active",
    "progressPercentage": 33,
    "completedLessonsCount": 3,
    "resumeLessonSlug": "attention-mechanisms-scaled-dot-product",
    "modules": [
      {
        "id": "mod-1",
        "title": "Module 1: Transformer Architectures",
        "position": 0,
        "lessons": [
          {
            "id": "les-1",
            "title": "Self-Attention in Depth",
            "slug": "self-attention-in-depth",
            "duration": 20,
            "position": 0,
            "isPreview": true,
            "isCompleted": true
          }
        ]
      }
    ]
  }
}
```

### 4.5 Enroll in Course
`POST /api/v1/member/courses/:id/enroll`

**Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "enr-uuid",
    "status": "active"
  }
}
```
*Returns `409 CONFLICT` if already enrolled.*

### 4.6 Get Lesson Content
`GET /api/v1/member/courses/:courseSlug/lessons/:lessonSlug`

**Access Control**:
- If `lesson.isPreview === false`, the member MUST hold an active enrollment in the course. If not enrolled, returns `403 FORBIDDEN` (`ENROLLMENT_REQUIRED`).
- If `lesson.isPreview === true`, content is delivered directly.

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "les-1",
    "moduleId": "mod-1",
    "moduleTitle": "Module 1: Transformer Architectures",
    "courseId": "course-id",
    "courseTitle": "Applied Generative AI",
    "courseSlug": "applied-generative-ai-llms",
    "title": "Self-Attention in Depth",
    "slug": "self-attention-in-depth",
    "content": "### Detailed Markdown Content\n...",
    "contentType": "text",
    "videoUrl": null,
    "duration": 20,
    "position": 0,
    "isPreview": true,
    "isCompleted": false,
    "previousLesson": null,
    "nextLesson": {
      "slug": "multi-head-attention",
      "title": "Multi-Head Attention"
    }
  }
}
```

### 4.7 Record Lesson Progress
`POST /api/v1/member/courses/:courseSlug/lessons/:lessonSlug/progress`

**Request Body**:
```json
{
  "completed": true
}
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "enrollmentId": "enr-uuid",
    "courseId": "course-uuid",
    "status": "active",
    "totalLessons": 9,
    "completedLessons": 4,
    "percentage": 44,
    "lastAccessedAt": "2026-10-07T09:00:00Z",
    "completedAt": null,
    "resumeLesson": {
      "slug": "fine-tuning-lora",
      "title": "Parameter-Efficient Fine-Tuning"
    }
  }
}
```
*Note: If all lessons are completed, `status` automatically transitions to `"completed"` and `completedAt` timestamp is recorded.*

---

## 5. Admin Endpoints

- `GET /api/v1/admin/courses`: Filterable courses list.
- `POST /api/v1/admin/courses`: Create course.
- `GET /api/v1/admin/courses/:id`: Get full course for editor.
- `PUT /api/v1/admin/courses/:id`: Update course metadata.
- `DELETE /api/v1/admin/courses/:id`: Delete course.
- `POST /api/v1/admin/courses/:id/publish`: Publish course.
- `POST /api/v1/admin/courses/:id/unpublish`: Unpublish course back to draft.
- `POST /api/v1/admin/courses/:id/archive`: Archive course.
- `POST /api/v1/admin/courses/:id/modules`: Create module.
- `PUT /api/v1/admin/courses/:courseId/modules/:moduleId`: Update module.
- `DELETE /api/v1/admin/courses/:courseId/modules/:moduleId`: Delete module (returns 409 if non-empty).
- `POST /api/v1/admin/courses/:id/modules/reorder`: Reorder modules.
- `POST /api/v1/admin/courses/:courseId/modules/:moduleId/lessons`: Create lesson.
- `PUT /api/v1/admin/courses/:courseId/modules/:moduleId/lessons/:lessonId`: Update lesson.
- `DELETE /api/v1/admin/courses/:courseId/modules/:moduleId/lessons/:lessonId`: Delete lesson.
- `POST /api/v1/admin/courses/:courseId/modules/:moduleId/lessons/reorder`: Reorder lessons.
- `GET /api/v1/admin/courses/:id/enrollments`: Get learner enrollment roster.
