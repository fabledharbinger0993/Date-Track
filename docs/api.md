# API Documentation

Base URL: `http://localhost:5000`

---

## Health

### `GET /health`

Returns server status.

**Response `200`**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Events

### `GET /api/events`

Returns all events.

**Response `200`**
```json
[
  {
    "id": "1",
    "title": "Team Standup",
    "date": "2024-01-15",
    "source": "local",
    "description": "Daily team standup meeting"
  },
  {
    "id": "2",
    "title": "Project Review",
    "date": "2024-01-17",
    "source": "local",
    "description": "Monthly project review session"
  }
]
```

---

### `POST /api/events`

Creates a new event.

**Request Body**
```json
{
  "title": "Sprint Planning",
  "date": "2024-01-22",
  "description": "Q1 sprint planning session"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Event title |
| `date` | string | ✅ | Date in `YYYY-MM-DD` format |
| `description` | string | ❌ | Optional description |

**Response `201`**
```json
{
  "id": "1705312200000",
  "title": "Sprint Planning",
  "date": "2024-01-22",
  "description": "Q1 sprint planning session",
  "source": "local"
}
```

**Response `400`** – Missing required fields
```json
{
  "success": false,
  "message": "title and date are required"
}
```

---

### `DELETE /api/events/:id`

Deletes an event by ID.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | string | Event ID |

**Response `200`**
```json
{
  "success": true,
  "message": "Event 1 deleted"
}
```

**Response `404`**
```json
{
  "success": false,
  "message": "Event with id 999 not found"
}
```

---

## Auth

> ⚠️ All OAuth endpoints currently return HTTP 501 until credentials are configured in `.env`.

### `GET /api/auth/google`

Initiates Google OAuth flow. Redirects the browser to Google's authorization page.

**Response `501`** (when not configured)
```json
{
  "success": false,
  "message": "Google OAuth is not yet configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file."
}
```

---

### `GET /api/auth/microsoft`

Initiates Microsoft OAuth flow.

**Response `501`** (when not configured)
```json
{
  "success": false,
  "message": "Microsoft OAuth is not yet configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in your .env file."
}
```

---

### `GET /api/auth/apple`

Initiates Apple OAuth flow.

**Response `501`** (when not configured)
```json
{
  "success": false,
  "message": "Apple OAuth is not yet configured. Set APPLE_CLIENT_ID, APPLE_TEAM_ID, and APPLE_KEY_ID in your .env file."
}
```

---

### `GET /api/auth/callback/google`

OAuth callback endpoint for Google (handled automatically by the provider redirect).

---

### `GET /api/auth/callback/microsoft`

OAuth callback endpoint for Microsoft.

---

### `GET /api/auth/callback/apple`

OAuth callback endpoint for Apple.

---

### `GET /api/auth/logout`

Destroys the current session.

**Response `200`**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```
