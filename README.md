# Date-Track

> A full-stack calendar and event tracking application with multi-provider OAuth calendar sync support (Google, Microsoft, Apple).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Clone the Repository](#clone-the-repository)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [OAuth Setup](#oauth-setup)
  - [Google Calendar](#google-calendar)
  - [Microsoft Calendar](#microsoft-calendar)
  - [Apple Calendar](#apple-calendar)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- npm v8 or higher

---

## Project Structure

```
Date-Track/
├── frontend/                       # React SPA (Create React App)
│   ├── public/
│   │   └── index.html              # HTML shell
│   └── src/
│       ├── App.js                  # Root component with nav
│       ├── App.css                 # Global styles
│       ├── index.js                # React DOM entry point
│       ├── components/
│       │   └── Calendar/
│       │       ├── Calendar.js     # Monthly calendar grid component
│       │       └── Calendar.css    # Calendar styles
│       ├── pages/
│       │   └── Home.js             # Home page: calendar + sync buttons
│       ├── utils/
│       │   └── dateUtils.js        # Date helper functions
│       └── assets/                 # Static assets
├── backend/                        # Express REST API
│   ├── server.js                   # Entry point
│   ├── .env.example                # Environment variable template
│   ├── config/
│   │   └── oauth.js                # OAuth provider configuration
│   ├── controllers/
│   │   ├── authController.js       # OAuth handler logic
│   │   └── eventsController.js     # Events CRUD logic
│   ├── middleware/
│   │   └── authMiddleware.js       # requireAuth / optionalAuth
│   ├── routes/
│   │   ├── auth.js                 # /api/auth routes
│   │   └── events.js               # /api/events routes
│   └── utils/
│       └── calendarSync.js         # Calendar sync helpers
├── docs/
│   ├── architecture.md             # System architecture overview
│   └── api.md                      # API endpoint reference
├── .gitignore
└── README.md
```

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/fabledharbinger0993/Date-Track.git
cd Date-Track
```

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

The backend will start on **http://localhost:5000**.

### Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

The frontend will open at **http://localhost:3000**.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values:

| Variable | Description |
|---|---|
| `PORT` | Port the backend server listens on (default: `5000`) |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret from Google Cloud Console |
| `MICROSOFT_CLIENT_ID` | Application (client) ID from Azure App Registration |
| `MICROSOFT_CLIENT_SECRET` | Client secret from Azure App Registration |
| `APPLE_CLIENT_ID` | Services ID from Apple Developer portal |
| `APPLE_TEAM_ID` | Team ID from Apple Developer portal |
| `APPLE_KEY_ID` | Key ID for the Sign in with Apple private key |
| `FRONTEND_URL` | URL of the frontend app (default: `http://localhost:3000`) |

---

## OAuth Setup

### Google Calendar

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Enable the **Google Calendar API**.
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
5. Set the redirect URI to `http://localhost:5000/api/auth/callback/google`.
6. Copy the **Client ID** and **Client Secret** into `.env`.

### Microsoft Calendar

1. Go to [Azure Portal](https://portal.azure.com/) → **App registrations → New registration**.
2. Set the redirect URI to `http://localhost:5000/api/auth/callback/microsoft`.
3. Under **Certificates & secrets**, create a new client secret.
4. Grant the **Calendars.Read** delegated permission under **API permissions**.
5. Copy the **Application (client) ID** and **Secret value** into `.env`.

### Apple Calendar

1. Go to [Apple Developer Portal](https://developer.apple.com/) → **Certificates, Identifiers & Profiles**.
2. Create a **Services ID** and enable **Sign in with Apple**.
3. Configure the redirect URL as `http://localhost:5000/api/auth/callback/apple`.
4. Create a **Sign in with Apple** key and download the `.p8` file.
5. Copy the **Services ID**, **Team ID**, and **Key ID** into `.env`.

---

## Available Scripts

### Backend (`/backend`)

| Script | Description |
|---|---|
| `npm start` | Start the server with `node` |
| `npm run dev` | Start the server with `nodemon` (auto-restart on changes) |

### Frontend (`/frontend`)

| Script | Description |
|---|---|
| `npm start` | Start the development server |
| `npm run build` | Build the app for production |
| `npm test` | Run tests in interactive watch mode |
| `npm run eject` | Eject from Create React App (irreversible) |

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Commit your changes: `git commit -m "Add my feature"`.
4. Push to the branch: `git push origin feature/my-feature`.
5. Open a Pull Request.

Please follow existing code style and add tests where applicable.

---

## License

This project is licensed under the MIT License.
