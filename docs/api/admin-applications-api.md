# AI CLUB — Admin Applications & Decision Engine API (Milestone 4)

## Overview
The Admin Applications and Decision Engine API enables club administrators to inspect applicant dossiers, review student academic backgrounds and 25-MCQ entrance assessment results, and execute final review decisions (`APPROVE`, `WAITLIST`, `REJECT`).

All endpoints require a valid Supabase Auth Bearer token belonging to a user with the `admin` role authoritatively verified in `public.profiles`.

---

## Security & Authorization
- **Authentication**: `Authorization: Bearer <access_token>`
- **Authorization**: The user's role is queried directly from `public.profiles.role = 'admin'`. Non-admin accounts attempting access will receive `403 FORBIDDEN` (`ADMIN_ROLE_REQUIRED`).

---

## Endpoints

### 1. Get Dashboard Review Summary
- **Method:** `GET`
- **Path:** `/api/v1/admin/dashboard/summary`
- **Auth:** Required (Admin)
- **Description:** Returns aggregate admissions metrics for the dashboard KPI cards.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "totalApplications": 42,
    "underReview": 15,
    "approved": 20,
    "waitlisted": 4,
    "rejected": 3,
    "averageScore": 21.4,
    "passRate": 84.5
  }
}
```

---

### 2. Search & List Applications
- **Method:** `GET`
- **Path:** `/api/v1/admin/applications`
- **Auth:** Required (Admin)
- **Query Parameters:**
  - `page` (optional integer, default `1`): Current page number.
  - `pageSize` (optional integer, default `10`, max `50`): Number of items per page.
  - `search` (optional string): Full-text search term matching student name, email, register number, or application number.
  - `status` (optional string): Filter by status (`draft`, `submitted`, `under_review`, `approved`, `waitlisted`, `rejected`).
  - `department` (optional string): Filter by student department.
  - `sortBy` (optional string, default `createdAt`): Sort field (`createdAt`, `submittedAt`, `assessmentScore`, `applicationNumber`, `fullName`).
  - `sortOrder` (optional string, default `desc`): Sort direction (`asc`, `desc`).
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "app-c1f7b702-8693-4a11-827b-fb8a876a3921",
        "userId": "usr-550e8400-e29b-41d4-a716-446655440000",
        "applicationNumber": "AIC-2026-000001",
        "status": "under_review",
        "academicYear": 2026,
        "submittedAt": "2026-10-06T18:35:00.000Z",
        "reviewedAt": null,
        "reviewedBy": null,
        "student": {
          "id": "usr-550e8400-e29b-41d4-a716-446655440000",
          "fullName": "Aarav Sharma",
          "email": "aarav.sharma@example.com",
          "registerNumber": "2024-AI-014",
          "department": "Artificial Intelligence & Data Science",
          "year": 3
        },
        "assessmentScore": 22.0,
        "assessmentPercentage": 88.0,
        "assessmentPassed": true,
        "createdAt": "2026-10-06T17:00:00.000Z",
        "updatedAt": "2026-10-06T18:35:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}
```

---

### 3. Get Application Review Dossier
- **Method:** `GET`
- **Path:** `/api/v1/admin/applications/:id`
- **Auth:** Required (Admin)
- **Description:** Returns the complete dossier for candidate inspection, including academic profile, 25-MCQ test breakdown, and decision history.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "app-c1f7b702-8693-4a11-827b-fb8a876a3921",
      "userId": "usr-550e8400-e29b-41d4-a716-446655440000",
      "applicationNumber": "AIC-2026-000001",
      "status": "under_review",
      "academicYear": 2026,
      "submittedAt": "2026-10-06T18:35:00.000Z",
      "reviewedAt": null,
      "reviewedBy": null,
      "reviewerNotes": null,
      "rejectionReason": null,
      "assessmentScore": 22.0,
      "assessmentPercentage": 88.0,
      "assessmentPassed": true,
      "createdAt": "2026-10-06T17:00:00.000Z",
      "updatedAt": "2026-10-06T18:35:00.000Z"
    },
    "student": {
      "id": "usr-550e8400-e29b-41d4-a716-446655440000",
      "fullName": "Aarav Sharma",
      "email": "aarav.sharma@example.com",
      "registerNumber": "2024-AI-014",
      "department": "Artificial Intelligence & Data Science",
      "year": 3,
      "section": "A",
      "phone": "+91 98765 43210",
      "skills": ["PyTorch", "Transformers", "FastAPI"],
      "interests": ["Computer Vision", "LLMs"],
      "githubUrl": "https://github.com/aaravsharma",
      "linkedinUrl": "https://linkedin.com/in/aaravsharma",
      "portfolioUrl": "https://aaravsharma.dev"
    },
    "assessment": {
      "id": "att-4f89d9e1-25a8-48b2-8419-79f987d60923",
      "score": 22.0,
      "percentage": 88.0,
      "passed": true,
      "totalQuestions": 25,
      "correctCount": 22,
      "wrongCount": 3,
      "unansweredCount": 0,
      "durationSeconds": 1800,
      "startedAt": "2026-10-06T18:05:00.000Z",
      "submittedAt": "2026-10-06T18:35:00.000Z",
      "status": "COMPLETED"
    },
    "auditLogs": [
      {
        "id": "aud-1234",
        "action": "APPLICATION_SUBMITTED",
        "actorId": "usr-550e8400-e29b-41d4-a716-446655440000",
        "createdAt": "2026-10-06T18:35:00.000Z",
        "metadata": { "score": 22.0 }
      }
    ]
  }
}
```

---

### 4. Approve Application
- **Method:** `POST`
- **Path:** `/api/v1/admin/applications/:id/approve`
- **Auth:** Required (Admin)
- **Request Body:**
```json
{
  "reviewerNotes": "Outstanding assessment performance and strong PyTorch project portfolio."
}
```
- **State Validation:**
  - Allowed previous status: `under_review`, `submitted`, `test_completed`, `waitlisted`.
  - Blocked status: `draft` (`409 INVALID_APPLICATION_STATE`).
  - Repeated approval: `409 APPLICATION_ALREADY_REVIEWED`.
- **Side Effects:**
  - Transitions `status` to `approved`.
  - Sets `reviewed_by` and `reviewed_at`.
  - Records immutable event `APPLICATION_APPROVED` in `public.audit_logs`.
  - **Does NOT** create a membership record (strictly deferred to Milestone 5).
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "applicationId": "app-c1f7b702-8693-4a11-827b-fb8a876a3921",
    "status": "approved",
    "reviewedAt": "2026-10-07T07:15:00.000Z",
    "reviewedBy": "admin-usr-id",
    "reviewerNotes": "Outstanding assessment performance and strong PyTorch project portfolio."
  }
}
```

---

### 5. Waitlist Application
- **Method:** `POST`
- **Path:** `/api/v1/admin/applications/:id/waitlist`
- **Auth:** Required (Admin)
- **Request Body:**
```json
{
  "reviewerNotes": "Strong candidate, reserved for cohort 2 intake pending seat allocation."
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "applicationId": "app-c1f7b702-8693-4a11-827b-fb8a876a3921",
    "status": "waitlisted",
    "reviewedAt": "2026-10-07T07:15:00.000Z",
    "reviewedBy": "admin-usr-id",
    "reviewerNotes": "Strong candidate, reserved for cohort 2 intake pending seat allocation."
  }
}
```

---

### 6. Reject Application
- **Method:** `POST`
- **Path:** `/api/v1/admin/applications/:id/reject`
- **Auth:** Required (Admin)
- **Request Body:**
```json
{
  "rejectionReason": "Assessment score of 12/25 does not meet the minimum entrance threshold.",
  "reviewerNotes": "Encourage candidate to re-apply next academic semester."
}
```
- **Validation:**
  - `rejectionReason`: Required string, minimum 3 characters. Returns `400 REJECTION_REASON_REQUIRED` if omitted or blank.
  - Enforced by backend validator and database check constraint `chk_applications_rejection_reason`.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "applicationId": "app-c1f7b702-8693-4a11-827b-fb8a876a3921",
    "status": "rejected",
    "reviewedAt": "2026-10-07T07:15:00.000Z",
    "reviewedBy": "admin-usr-id",
    "rejectionReason": "Assessment score of 12/25 does not meet the minimum entrance threshold.",
    "reviewerNotes": "Encourage candidate to re-apply next academic semester."
  }
}
```

---

## Error Codes

| Status Code | Error Code | Meaning |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or invalid Bearer access token |
| `403` | `ADMIN_ROLE_REQUIRED` | Authenticated user is not an administrator |
| `400` | `REJECTION_REASON_REQUIRED` | Attempted rejection without required explanation ($\ge 3$ characters) |
| `400` | `INVALID_QUERY_PARAMS` | Sort column not in allowlist or invalid pagination numbers |
| `404` | `APPLICATION_NOT_FOUND` | No application exists with the specified ID |
| `409` | `INVALID_APPLICATION_STATE` | Application is in `draft` state or cannot undergo the requested transition |
| `409` | `APPLICATION_ALREADY_REVIEWED`| Application was already approved/rejected and cannot be re-decided |
