# AI CLUB — API Conventions & Standards

## 1. Protocol & Versioning

All endpoints are served over HTTPS and prefixed with the API version:

```
https://<domain>/api/v1/<resource>
```

Root level health checks are exposed at `/health` and `/api/v1/health`.

---

## 2. Standard Response Envelopes

Every JSON response adheres strictly to the envelope specification.

### 2.1 Successful Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "7f8b85b4-d576-464a-89aa-55271167448d",
    "name": "Machine Learning Lab"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "requestId": "2fa40e4b-ffad-4950-84fe-19a9d700dc65"
  }
}
```

### 2.2 Error Response (`4xx`, `5xx`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address format"
      }
    ],
    "requestId": "2fa40e4b-ffad-4950-84fe-19a9d700dc65"
  }
}
```

---

## 3. Standard Error Codes

| HTTP Status | Error Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request payload, query params, or URL params failed schema validation |
| 401 | `UNAUTHORIZED` | Bearer token is missing, expired, or invalid |
| 403 | `FORBIDDEN` | Authenticated user lacks permission / role to access resource |
| 404 | `ROUTE_NOT_FOUND` | The requested route does not exist |
| 404 | `RESOURCE_NOT_FOUND`| The requested database entity does not exist |
| 409 | `CONFLICT` | Resource already exists (e.g. unique constraint violation) |
| 429 | `RATE_LIMIT_EXCEEDED`| Request quota exceeded for the client IP |
| 500 | `INTERNAL_SERVER_ERROR` | Unhandled server exception (stack traces masked in production) |
| 503 | `SERVICE_UNAVAILABLE` | Downstream dependent service (e.g. database) unreachable |

---

## 4. HTTP Headers

### Request Headers
- `Authorization`: `Bearer <supabase_jwt_token>`
- `Content-Type`: `application/json`
- `X-Request-Id`: (Optional) Client-generated UUID for distributed request tracing.

### Response Headers
- `X-Request-Id`: Injected UUID associated with request logs.
- `Content-Type`: `application/json; charset=utf-8`
