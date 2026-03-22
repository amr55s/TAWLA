# 🔌 tawla — API Design

## Version 1.0 | 2026-03-21

> **Suggested:** REST API — organizations, users, subscriptions, billing, invitations

---

# 📌 OVERVIEW

## API Style
<!-- REST / GraphQL / tRPC -->

## Base URL
<!-- e.g. https://api.example.com/v1 -->

## Authentication
<!-- e.g. JWT Bearer Token -->

---

# 🔐 AUTHENTICATION

## Auth Flow

```
Client → POST /auth/login (email, password)
Server → { accessToken, refreshToken, expiresIn }
Client → Authorization: Bearer <accessToken>
Client → POST /auth/refresh (refreshToken)
```

## Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Login, returns tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate tokens |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Reset with token |

---

# 📡 ENDPOINTS

## Resource: Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | Admin | List users (paginated) |
| GET | `/users/:id` | Auth | Get user by ID |
| PUT | `/users/:id` | Owner | Update user |
| DELETE | `/users/:id` | Admin | Delete user |

### Request/Response Examples

**GET /users**
```
Query: ?page=1&limit=20&sort=created_at:desc

Response 200:
{
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```

**POST /auth/login**
```
Body: { "email": "user@example.com", "password": "..." }

Response 200:
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 3600
}
```

<!-- TODO: Add more resource endpoints -->

---

# ❌ ERROR HANDLING

## Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ]
  }
}
```

## Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `BAD_REQUEST` | Invalid request body or params |
| 400 | `VALIDATION_ERROR` | Field validation failed |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 401 | `TOKEN_EXPIRED` | Access token expired |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate resource (e.g. email) |
| 422 | `UNPROCESSABLE` | Valid format but cannot process |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

# 📏 RATE LIMITING

| Tier | Limit | Window |
|------|-------|--------|
| Public | 30 requests | per minute |
| Authenticated | 100 requests | per minute |
| Admin | 500 requests | per minute |

**Headers returned:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```
