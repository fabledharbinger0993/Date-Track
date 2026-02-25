# Architecture

## Overview

Date-Track is a full-stack calendar and event tracking application. It is split into two independent services:

- **Frontend** – A React.js single-page application (SPA) that renders a monthly calendar grid and provides OAuth-based calendar sync buttons.
- **Backend** – A Node.js + Express REST API that manages events in memory and exposes OAuth redirect endpoints.

---

## Project Structure

```
Date-Track/
├── frontend/               # React SPA
│   ├── public/             # Static HTML shell
│   └── src/
│       ├── components/     # Reusable UI components (Calendar)
│       ├── pages/          # Route-level page components (Home)
│       ├── utils/          # Pure utility functions (dateUtils)
│       └── assets/         # Static assets (images, icons)
├── backend/                # Express API server
│   ├── config/             # OAuth configuration
│   ├── controllers/        # Route handler logic
│   ├── middleware/         # Express middleware (auth guards)
│   ├── routes/             # Express routers
│   └── utils/              # Shared utilities (calendarSync)
└── docs/                   # Project documentation
```

---

## Frontend Architecture

The frontend is bootstrapped with Create React App.

| Layer | Responsibility |
|---|---|
| `App.js` | Top-level layout: nav bar + page outlet |
| `pages/Home.js` | Fetches events from the API; renders Calendar + sync UI |
| `components/Calendar/Calendar.js` | Pure presentational monthly grid; accepts `events` prop |
| `utils/dateUtils.js` | Date math helpers (no side effects) |

### Data Flow

```
Home (useEffect → axios GET /api/events)
  └── Calendar (events=[])
        └── renders day cells with event badges
```

---

## Backend Architecture

The backend is a lightweight Express server with no database dependency (in-memory store for now).

| Layer | Responsibility |
|---|---|
| `server.js` | Bootstraps middleware and mounts routers |
| `routes/auth.js` | OAuth redirect and callback routes |
| `routes/events.js` | CRUD routes for events |
| `controllers/authController.js` | OAuth initiation logic (placeholder) |
| `controllers/eventsController.js` | Event list, create, delete logic |
| `middleware/authMiddleware.js` | `requireAuth` and `optionalAuth` guards |
| `config/oauth.js` | Reads OAuth credentials from environment |
| `utils/calendarSync.js` | Calendar sync helpers (placeholder) |

---

## OAuth Flow (Planned)

```
Browser                     Backend                      Provider
  |                            |                             |
  |-- GET /api/auth/google -->  |                             |
  |                            |-- redirect to provider ---> |
  |                            |                             |
  |                            |<-- authorization code ----- |
  |                            |                             |
  |                            |-- exchange for tokens ----> |
  |                            |<-- access + refresh token - |
  |                            |                             |
  |                            | store token in session      |
  |<-- redirect to frontend -- |                             |
```

Currently all OAuth routes return HTTP 501 until credentials are configured in `.env`.

---

## Calendar Sync Approach

Once OAuth is implemented, the sync flow will:

1. Use the stored access token to query the provider's calendar API.
2. Retrieve events within a configurable date window.
3. Call `mergeEvents(localEvents, remoteEvents)` to deduplicate by `title + date`.
4. Persist merged events and return them to the frontend.
