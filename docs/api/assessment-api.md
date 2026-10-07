# AI CLUB - Assessment API Specification (Milestone 3)

## Overview
The Assessment Engine API handles the 25-Question multiple-choice technical assessment. It strictly enforces server-authoritative timer countdown, persistent question order, safe question projection (answer keys are never leaked to clients), and server-side idempotent scoring.

---

## Endpoints

### 1. Start or Resume Assessment
- **Method:** `POST`
- **Path:** `/api/v1/assessment/applications/:applicationId/start`
- **Auth:** Required (`Bearer <access_token>`)
- **Description:** Initiates or resumes the assessment attempt for the given application.
- **Rules:**
  - If no attempt exists: samples exactly 25 active questions randomly from the database, persists the ordered UUID list in `assessment_attempts.question_ids`, initializes a 30-minute expiration window (`now() + 1800s`), and returns safe question DTOs.
  - If an in-progress attempt already exists: returns the exact same 25 questions in the exact same order, alongside all previously autosaved answers and real-time remaining seconds.
  - If already completed or expired: returns existing attempt metadata with `status: 'completed'`.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "att-4f89d9e1-25a8-48b2-8419-79f987d60923",
    "applicationId": "c1f7b702-8693-4a11-827b-fb8a876a3921",
    "userId": "usr-12345",
    "startedAt": "2026-10-06T18:05:00.000Z",
    "expiresAt": "2026-10-06T18:35:00.000Z",
    "submittedAt": null,
    "score": null,
    "percentage": null,
    "passed": null,
    "totalQuestions": 25,
    "status": "in_progress",
    "remainingSeconds": 1785,
    "questions": [
      {
        "id": "q-1",
        "category": "Machine Learning",
        "difficulty": "medium",
        "questionText": "What does ROC stand for in ROC-AUC?",
        "optionA": "Receiver Operating Characteristic",
        "optionB": "Rate of Convergence",
        "optionC": "Residual Operational Coefficient",
        "optionD": "Random Output Curve"
      }
    ],
    "answers": {
      "q-1": "A"
    }
  }
}
```

---

### 2. Get Attempt Details
- **Method:** `GET`
- **Path:** `/api/v1/assessment/attempts/:attemptId`
- **Auth:** Required (`Bearer <access_token>`)
- **Description:** Fetches current attempt questions, autosaved answers, and time left.

---

### 3. Record / Autosave Answer
- **Method:** `PUT`
- **Path:** `/api/v1/assessment/attempts/:attemptId/answers/:questionId`
- **Auth:** Required (`Bearer <access_token>`)
- **Body:**
```json
{
  "selectedOption": "A" // Must be 'A', 'B', 'C', or 'D'
}
```
- **Validation:**
  - `selectedOption` must be one of `'A'`, `'B'`, `'C'`, `'D'`.
  - `questionId` must belong to the active attempt's 25 questions.
  - Attempt must belong to the authenticated user and be `in_progress`.
  - Attempt must not have exceeded its `expiresAt` window.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "questionId": "q-1",
    "selectedOption": "A"
  }
}
```

---

### 4. Submit Assessment
- **Method:** `POST`
- **Path:** `/api/v1/assessment/attempts/:attemptId/submit`
- **Auth:** Required (`Bearer <access_token>`)
- **Description:** Evaluates the attempt against the authoritative database question bank, computes final score and pass/fail status, updates the attempt, and updates the application to `UNDER_REVIEW`.
- **Idempotency:** Calling `/submit` on an already submitted attempt returns the existing evaluation without re-evaluating or modifying data.
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "att-4f89d9e1-25a8-48b2-8419-79f987d60923",
    "applicationId": "c1f7b702-8693-4a11-827b-fb8a876a3921",
    "startedAt": "2026-10-06T18:05:00.000Z",
    "submittedAt": "2026-10-06T18:25:00.000Z",
    "score": 21,
    "totalQuestions": 25,
    "percentage": 84,
    "passed": true,
    "totalCorrect": 21,
    "totalWrong": 3,
    "totalUnanswered": 1,
    "status": "completed",
    "applicationStatus": "under_review"
  }
}
```

---

### 5. Get Assessment Result
- **Method:** `GET`
- **Path:** `/api/v1/assessment/attempts/:attemptId/result`
- **Auth:** Required (`Bearer <access_token>`)
- **Description:** Retrieves the completed evaluation metrics for the attempt.
