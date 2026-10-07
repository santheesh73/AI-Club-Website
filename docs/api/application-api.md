# AI CLUB - Application API Specification (Milestone 3)

## Overview
The Applications API manages the student club application dossier lifecycle. It enforces profile completeness verification before allowing application generation and assigns an official unique application identifier formatted as `AIC-YYYY-XXXXXX`.

---

## Endpoints

### 1. Initiate Application
- **Method:** `POST`
- **Path:** `/api/v1/applications`
- **Auth:** Required (`Bearer <access_token>`)
- **Roles:** `applicant`, `member`, `admin`
- **Description:** Creates an official club application record for the authenticated user.
- **Preconditions:**
  - Authenticated user's profile must be complete (`registerNumber`, `department`, `year`, `skills`). If incomplete, returns `400 PROFILE_INCOMPLETE`.
  - User must not already have an active application. If one exists, returns the existing record (`200 OK`).
- **Response `201 Created` / `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "c1f7b702-8693-4a11-827b-fb8a876a3921",
    "userId": "usr-12345",
    "applicationNumber": "AIC-2026-000001",
    "status": "draft",
    "academicYear": 2026,
    "submittedAt": null,
    "reviewedAt": null,
    "reviewerNotes": null,
    "assessmentScore": null,
    "assessmentPassed": null,
    "createdAt": "2026-10-06T18:00:00.000Z",
    "updatedAt": "2026-10-06T18:00:00.000Z"
  }
}
```

---

### 2. Get User Application
- **Method:** `GET`
- **Path:** `/api/v1/applications/me`
- **Auth:** Required (`Bearer <access_token>`)
- **Description:** Retrieves the authenticated user's current club application dossier.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "c1f7b702-8693-4a11-827b-fb8a876a3921",
    "userId": "usr-12345",
    "applicationNumber": "AIC-2026-000001",
    "status": "under_review",
    "academicYear": 2026,
    "submittedAt": "2026-10-06T18:25:00.000Z",
    "reviewedAt": null,
    "reviewerNotes": null,
    "assessmentScore": 21,
    "assessmentPassed": true,
    "createdAt": "2026-10-06T18:00:00.000Z",
    "updatedAt": "2026-10-06T18:25:00.000Z"
  }
}
```
- **Response `404 Not Found`:** Returns `APPLICATION_NOT_FOUND` if the user has not initiated an application yet.

---

### 3. Get Application Readiness & Lifecycle Status
- **Method:** `GET`
- **Path:** `/api/v1/applications/me/status`
- **Auth:** Required (`Bearer <access_token>`)
- **Description:** Returns aggregate readiness metrics: profile completeness check, missing fields, application state, and assessment eligibility.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "hasApplication": true,
    "application": { ... },
    "profileComplete": true,
    "missingFields": [],
    "canStartAssessment": true,
    "assessmentStatus": "in_progress"
  }
}
```
