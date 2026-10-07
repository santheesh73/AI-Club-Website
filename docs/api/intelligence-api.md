# AI CLUB API Reference — Milestone 9: Notifications, Analytics & AI Intelligence

## 1. Overview
Milestone 9 provides an event-driven notification hub, cross-system analytics derivation, and an advisory AI platform intelligence engine.

---

## 2. Notification Endpoints

### 2.1 List Current User Notifications
- **Method**: `GET`
- **Route**: `/api/v1/notifications` (also available via `/api/v1/member/notifications`)
- **Authentication**: Required (`Bearer <token>`)
- **Query Parameters**:
  - `unreadOnly` (boolean, optional): Return only unread notifications (`readAt IS NULL`). Default: `false`.
  - `limit` (integer, optional): Number of items (default 20, max 100).
  - `offset` (integer, optional): Pagination offset (default 0).
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif-uuid",
        "userId": "user-uuid",
        "type": "COURSE_ENROLLMENT_CONFIRMED",
        "title": "Enrolled in AI Club Course",
        "message": "You have successfully enrolled in Introduction to Deep Learning.",
        "actionUrl": "/member/courses/deep-learning",
        "metadata": { "courseId": "c-1" },
        "readAt": null,
        "createdAt": "2026-10-07T12:00:00Z"
      }
    ],
    "total": 1,
    "unreadCount": 1
  }
}
```

### 2.2 Get Unread Notification Count
- **Method**: `GET`
- **Route**: `/api/v1/notifications/unread-count`
- **Authentication**: Required
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

### 2.3 Mark Single Notification as Read
- **Method**: `PATCH`
- **Route**: `/api/v1/notifications/:id/read`
- **Authentication**: Required (User must own notification)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "notif-uuid",
    "readAt": "2026-10-07T12:05:00Z"
  }
}
```

### 2.4 Mark All User Notifications as Read
- **Method**: `PATCH`
- **Route**: `/api/v1/notifications/read-all`
- **Authentication**: Required
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "updatedCount": 4
  }
}
```

### 2.5 Get Notification Delivery Preferences
- **Method**: `GET`
- **Route**: `/api/v1/notifications/preferences`
- **Authentication**: Required
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "pref-uuid",
    "userId": "user-uuid",
    "applicationUpdates": true,
    "membershipUpdates": true,
    "eventUpdates": true,
    "courseUpdates": true,
    "communityUpdates": true,
    "systemNotifications": true,
    "createdAt": "2026-10-07T10:00:00Z",
    "updatedAt": "2026-10-07T10:00:00Z"
  }
}
```

### 2.6 Update Notification Delivery Preferences
- **Method**: `PATCH`
- **Route**: `/api/v1/notifications/preferences`
- **Authentication**: Required
- **Body**: Partial boolean toggles
- **Response**: `200 OK`

---

## 3. Member Telemetry Endpoints

### 3.1 Member Learning Analytics
- **Method**: `GET`
- **Route**: `/api/v1/member/analytics/learning`
- **Authentication**: Required (Member role)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "enrolledCoursesCount": 2,
    "completedCoursesCount": 1,
    "lessonsCompletedCount": 14,
    "averageProgressPercentage": 68,
    "recentCourses": [
      {
        "courseId": "c-1",
        "title": "Computer Vision Foundations",
        "slug": "computer-vision",
        "progressPercentage": 100,
        "status": "completed"
      }
    ]
  }
}
```

### 3.2 Member Activity Timeline
- **Method**: `GET`
- **Route**: `/api/v1/member/analytics/activity`
- **Authentication**: Required (Member role)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "act-1",
      "type": "COURSE",
      "title": "Completed Course",
      "description": "Completed Computer Vision Foundations",
      "timestamp": "2026-10-07T11:00:00Z",
      "link": "/member/courses/computer-vision"
    }
  ]
}
```

---

## 4. Admin Analytics & Intelligence Endpoints

### 4.1 Admin Analytics Endpoints
- **Authorization**: `admin` role required
- **Routes**:
  - `GET /api/v1/admin/analytics/overview?period=30d`
  - `GET /api/v1/admin/analytics/memberships?period=30d`
  - `GET /api/v1/admin/analytics/applications?period=30d`
  - `GET /api/v1/admin/analytics/events?period=30d`
  - `GET /api/v1/admin/analytics/courses?period=30d`
  - `GET /api/v1/admin/analytics/community?period=30d`
  - `GET /api/v1/admin/analytics/engagement?period=30d`
- **Supported Periods**: `7d`, `30d`, `90d`, `12m`, `all`

### 4.2 Admin Intelligence (AI Insights)
- **Authorization**: `admin` role required
- **Routes**:
  - `GET /api/v1/admin/intelligence?period=30d`
  - `POST /api/v1/admin/intelligence/refresh` (body: `{ "period": "30d" }`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "insight-uuid",
    "period": "30d",
    "summary": "Platform operations demonstrate high member retention...",
    "platformOverview": "Overview of total registrations and active members.",
    "memberEngagement": "Engagement breakdown and participation metrics.",
    "learningInsights": "Curriculum completion and learner pace analysis.",
    "eventInsights": "Event RSVP trends and attendance capacity.",
    "communityInsights": "Showcase project velocity and badge claims.",
    "recommendations": [
      "Launch intermediate tracks for top courses.",
      "Highlight member projects in weekly broadcasts."
    ],
    "metricsSnapshot": { ... },
    "createdAt": "2026-10-07T12:00:00Z"
  }
}
```

### 4.3 Administrative Broadcast Announcement
- **Route**: `POST /api/v1/admin/notifications/announcement`
- **Authorization**: `admin` role required
- **Body**:
```json
{
  "title": "Spring Hackathon Registration Open",
  "message": "Registrations are now open for the AI Club Spring Hackathon.",
  "targetRole": "member"
}
```
- **Response**: `201 Created` (`{ "success": true, "data": { "count": 45 } }`)
