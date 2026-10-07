# AI CLUB — Membership & Member Experience API (Milestone 5)

## Overview
The Membership & Member Experience API powers member identity induction, member number generation, member portal telemetry, and member-exclusive profile and academic history records.

---

## Security & Authorization
- **Authentication**: `Authorization: Bearer <access_token>`
- **Member Access**: Endpoints under `/api/v1/membership/*` require role `'member'` or `'admin'`.
- **Admin Access**: Endpoints under `/api/v1/admin/memberships/*` and `/api/v1/admin/members` require role `'admin'`.
- **Identity Invariance**: Member number (`AIC-YYYY-XXXX`), user identity, and application link are strictly immutable.

---

## Endpoints

### 1. Activate Membership (Admin Only)
- **Method:** `POST`
- **Path:** `/api/v1/admin/memberships/activate`
- **Auth:** Required (`admin`)
- **Description:** Transactionally inducts an approved applicant into club membership, assigns a collision-free member number (`AIC-YYYY-XXXX`), elevates their profile role to `'member'`, and records an audit log.
- **Request Body:**
```json
{
  "applicationId": "app-c1f7b702-8693-4a11-827b-fb8a876a3921",
  "notes": "Admitted to 2026 Core AI cohort. Outstanding performance."
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "mem-e4b2d190-8802-4fc8-8090-e2bca1c39021",
    "userId": "usr-8a213942-0091-4921-9921-bc194a281042",
    "applicationId": "app-c1f7b702-8693-4a11-827b-fb8a876a3921",
    "memberNumber": "AIC-2026-0001",
    "status": "active",
    "joinedAt": "2026-10-06T12:00:00.000Z",
    "activatedAt": "2026-10-06T12:00:00.000Z",
    "activatedBy": "admin-usr-uuid",
    "createdAt": "2026-10-06T12:00:00.000Z",
    "updatedAt": "2026-10-06T12:00:00.000Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: `applicationId` missing or invalid UUID.
  - `403 Forbidden`: Caller lacks `admin` privileges.
  - `404 Not Found`: Target application record does not exist.
  - `409 Conflict` (`APPLICATION_NOT_APPROVED`): Application is not in `'approved'` status.
  - `409 Conflict` (`MEMBERSHIP_ALREADY_EXISTS`): Candidate already possesses an active membership.

---

### 2. List Club Members (Admin Only)
- **Method:** `GET`
- **Path:** `/api/v1/admin/members`
- **Auth:** Required (`admin`)
- **Description:** Lists all inducted members with their membership credentials and profile details.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mem-e4b2d190-8802-4fc8-8090-e2bca1c39021",
      "userId": "usr-8a213942-0091-4921-9921-bc194a281042",
      "memberNumber": "AIC-2026-0001",
      "status": "active",
      "joinedAt": "2026-10-06T12:00:00.000Z",
      "fullName": "Sri Nikesh",
      "email": "sri.nikesh@aiclub.internal",
      "department": "Artificial Intelligence & Data Science",
      "year": 3
    }
  ]
}
```

---

### 3. Get Current Member Record
- **Method:** `GET`
- **Path:** `/api/v1/membership/me`
- **Auth:** Required (`member` or `admin`)
- **Description:** Returns the authenticated user's active membership record.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "mem-e4b2d190-8802-4fc8-8090-e2bca1c39021",
    "userId": "usr-8a213942-0091-4921-9921-bc194a281042",
    "applicationId": "app-c1f7b702-8693-4a11-827b-fb8a876a3921",
    "memberNumber": "AIC-2026-0001",
    "status": "active",
    "joinedAt": "2026-10-06T12:00:00.000Z",
    "activatedAt": "2026-10-06T12:00:00.000Z",
    "activatedBy": "admin-usr-uuid",
    "createdAt": "2026-10-06T12:00:00.000Z",
    "updatedAt": "2026-10-06T12:00:00.000Z"
  }
}
```
- **Error Responses:**
  - `404 Not Found` (`MEMBERSHIP_NOT_FOUND`): User does not have an active membership.

---

### 4. Get Consolidated Member Dashboard
- **Method:** `GET`
- **Path:** `/api/v1/membership/me/dashboard`
- **Auth:** Required (`member` or `admin`)
- **Description:** Returns an aggregate payload containing the member's profile, active membership card details, approved entrance application, and entrance assessment results.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "usr-8a213942-0091-4921-9921-bc194a281042",
      "email": "sri.nikesh@aiclub.internal",
      "fullName": "Sri Nikesh",
      "role": "member",
      "department": "Artificial Intelligence & Data Science",
      "year": 3,
      "section": "A",
      "registerNumber": "REG-2026-001"
    },
    "membership": {
      "id": "mem-e4b2d190-8802-4fc8-8090-e2bca1c39021",
      "userId": "usr-8a213942-0091-4921-9921-bc194a281042",
      "applicationId": "app-c1f7b702-8693-4a11-827b-fb8a876a3921",
      "memberNumber": "AIC-2026-0001",
      "status": "active",
      "joinedAt": "2026-10-06T12:00:00.000Z"
    },
    "application": {
      "id": "app-c1f7b702-8693-4a11-827b-fb8a876a3921",
      "userId": "usr-8a213942-0091-4921-9921-bc194a281042",
      "applicationNumber": "AIC-2026-000001",
      "status": "approved",
      "academicYear": "2026-2027",
      "submittedAt": "2026-10-01T10:00:00.000Z",
      "reviewedAt": "2026-10-06T11:00:00.000Z"
    },
    "assessment": {
      "id": "att-420914-1182",
      "userId": "usr-8a213942-0091-4921-9921-bc194a281042",
      "score": 24,
      "percentage": 96,
      "totalQuestions": 25,
      "isPassed": true,
      "durationSeconds": 1050,
      "submittedAt": "2026-10-01T11:30:00.000Z"
    }
  }
}
```

---

### 5. Get Member Admissions Application
- **Method:** `GET`
- **Path:** `/api/v1/membership/me/application`
- **Auth:** Required (`member` or `admin`)
- **Description:** Returns the member's own approved entrance application record.

---

### 6. Get Member Entrance Assessment
- **Method:** `GET`
- **Path:** `/api/v1/membership/me/assessment`
- **Auth:** Required (`member` or `admin`)
- **Description:** Returns the member's entrance assessment scorecard and question statistics.
