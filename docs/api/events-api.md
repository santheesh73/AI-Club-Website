# AI CLUB — Events & Activities Platform API Specification

## 1. Overview
The Events & Activities Platform API manages the complete lifecycle of club workshops, hackathons, technical talks, and bootcamps. It provides member registration with concurrency-safe capacity enforcement and administrative oversight of attendee rosters.

- **Base URL**: `/api/v1`
- **Authentication**: Bearer JWT (`Authorization: Bearer <supabase_access_token>`)
- **Authorization**:
  - Member Endpoints: Verified members (`role IN ('member', 'admin')`)
  - Admin Endpoints: Administrators (`role = 'admin'`)

---

## 2. Standard Error Responses

| HTTP Status | Error Code | Description |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request payload fails schema validation constraints |
| `401` | `UNAUTHORIZED` | Missing, expired, or invalid bearer token |
| `403` | `FORBIDDEN` | Insufficient authorization (e.g. non-member accessing member event) |
| `404` | `EVENT_NOT_FOUND` | Target event or registration was not found |
| `409` | `EVENT_FULL` | Maximum seat capacity has been reached |
| `409` | `ALREADY_REGISTERED` | Member already holds an active seat reservation |
| `409` | `REGISTRATION_NOT_OPEN` | Registration window has not opened or has closed |
| `409` | `INVALID_EVENT_STATE` | Operation disallowed for current event status |

---

## 3. Member Endpoints

### 3.1 List Events
**`GET /api/v1/member/events`**
Retrieves published events for member discovery.

- **Query Parameters**:
  - `category` *(optional)*: `workshop` | `hackathon` | `tech_talk` | `webinar` | `competition` | `meetup` | `bootcamp` | `other`
  - `timeline` *(optional)*: `upcoming` (default) | `past` | `all`
  - `search` *(optional)*: Search term matching title or description
  - `page` *(optional)*: Page number (default: 1)
  - `pageSize` *(optional)*: Page size (default: 20, max: 100)

- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "e9b25b6e-f782-4467-bc59-7b3b9b4f62e8",
      "title": "LLM Agents Architecture Workshop",
      "slug": "llm-agents-architecture-workshop",
      "shortDescription": "Hands-on build session implementing multi-agent workflows.",
      "category": "workshop",
      "eventMode": "physical",
      "location": "Turing Lab, Block C",
      "isOnline": false,
      "startAt": "2026-11-20T10:00:00.000Z",
      "endAt": "2026-11-20T13:00:00.000Z",
      "capacity": 45,
      "registeredCount": 42,
      "availableSeats": 3,
      "isFull": false,
      "isRegistered": false,
      "status": "published",
      "tags": ["AI", "Agents", "LangChain"]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

---

### 3.2 Member's Registered Events
**`GET /api/v1/member/events/registered`**
Retrieves all events the authenticated member is actively registered for.

- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "upcoming": [
      {
        "id": "e9b25b6e-f782-4467-bc59-7b3b9b4f62e8",
        "title": "LLM Agents Architecture Workshop",
        "slug": "llm-agents-architecture-workshop",
        "isRegistered": true,
        "userRegistrationStatus": "registered"
      }
    ],
    "past": []
  }
}
```

---

### 3.3 Get Event Details by Slug
**`GET /api/v1/member/events/:slug`**
Retrieves comprehensive event agenda and logistics. Private conference URLs are unlocked only if the member holds a verified registration.

- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "e9b25b6e-f782-4467-bc59-7b3b9b4f62e8",
    "title": "LLM Agents Architecture Workshop",
    "slug": "llm-agents-architecture-workshop",
    "shortDescription": "Hands-on build session implementing multi-agent workflows.",
    "description": "Comprehensive workshop covering ReAct framework, tool calling...",
    "category": "workshop",
    "eventMode": "hybrid",
    "location": "Turing Lab, Block C",
    "isOnline": true,
    "meetingUrl": "https://meet.aiclub.org/room-agents",
    "startAt": "2026-11-20T10:00:00.000Z",
    "endAt": "2026-11-20T13:00:00.000Z",
    "registrationOpenAt": "2026-10-01T00:00:00.000Z",
    "registrationCloseAt": "2026-11-19T23:59:59.000Z",
    "capacity": 45,
    "registeredCount": 42,
    "availableSeats": 3,
    "isFull": false,
    "isRegistered": true,
    "userRegistrationStatus": "registered",
    "status": "published",
    "speaker": "Dr. Sarah Lin",
    "organizer": "AI Club Core",
    "requirements": "Bring a laptop with Python 3.11+",
    "tags": ["AI", "Agents"]
  }
}
```

---

### 3.4 Register for Event
**`POST /api/v1/member/events/:eventId/register`**
Atomically reserves a seat for the authenticated member.

- **Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": "reg-48b4382c-47bc-4993-90d1-a53ecad07851",
    "eventId": "e9b25b6e-f782-4467-bc59-7b3b9b4f62e8",
    "userId": "usr-9104",
    "status": "registered",
    "registeredAt": "2026-10-07T08:00:00.000Z"
  }
}
```

---

### 3.5 Cancel Registration
**`DELETE /api/v1/member/events/:eventId/registration`**
Cancels an active registration and releases the allocated seat.

- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "Registration cancelled successfully"
  }
}
```

---

## 4. Admin Endpoints

### 4.1 Create Event
**`POST /api/v1/admin/events`**
Creates a new event record.

- **Request Body**:
```json
{
  "title": "Autonomous Robotics Hackathon",
  "shortDescription": "48-hour build challenge for autonomous navigation algorithms.",
  "description": "Full details on hardware kits, rules, evaluation benchmarks...",
  "category": "hackathon",
  "eventMode": "physical",
  "location": "Innovation Pavilion",
  "startAt": "2026-11-25T09:00:00.000Z",
  "endAt": "2026-11-27T18:00:00.000Z",
  "registrationOpenAt": "2026-10-15T00:00:00.000Z",
  "registrationCloseAt": "2026-11-24T23:59:59.000Z",
  "capacity": 60,
  "eligibility": "members_only",
  "speaker": "Industry Mentors",
  "organizer": "Robotics Lab",
  "requirements": "ROS 2 basics recommended",
  "tags": ["Robotics", "Hackathon", "ROS"]
}
```
- **Response (`201 Created`)**: Returns created `EventRecord`.

---

### 4.2 List Events (Admin)
**`GET /api/v1/admin/events`**
Returns all events including drafts, cancelled, and concluded events with registrant counts.

---

### 4.3 Update Event
**`PATCH /api/v1/admin/events/:id`**
Updates metadata and settings of an active or draft event.

---

### 4.4 Publish Event
**`POST /api/v1/admin/events/:id/publish`**
Transitions event status from `draft` to `published`.

---

### 4.5 Cancel Event
**`POST /api/v1/admin/events/:id/cancel`**
Cancels the event. Mandates a non-empty `reason`.

- **Request Body**:
```json
{
  "reason": "Severe weather disruption prompted campus facility closure."
}
```

---

### 4.6 Get Attendee Roster
**`GET /api/v1/admin/events/:id/registrations`**
Returns complete attendee list with member identification, contact, and registration time.

- **Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "registrationId": "reg-48b4382c",
      "userId": "usr-9104",
      "memberNumber": "AIC-2026-0042",
      "fullName": "Nikesh Sundaram",
      "email": "nikesh@aiclub.org",
      "department": "Artificial Intelligence & Data Science",
      "registerNumber": "REG-2026-9901",
      "status": "registered",
      "registeredAt": "2026-10-07T08:00:00.000Z"
    }
  ]
}
```
