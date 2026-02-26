# Deploy Calinvite to Replit 🚀

## Quick Start (2 Minutes)

### 1. Import to Replit

**Option A: From GitHub**
1. Go to [replit.com](https://replit.com)
2. Click **"Create Repl"**
3. Select **"Import from GitHub"**
4. Paste your repo URL: `https://github.com/yourusername/Date-Track`
5. Replit auto-detects Node.js ✓

**Option B: Manual Upload**
1. Click **"Create Repl"** → **"Node.js"**
2. Drag and drop your project folder
3. Replit configures automatically

### 2. Configure Environment

Click **Secrets** (🔒 icon in left sidebar) and add:

```
SESSION_SECRET=your-random-secret-here-make-it-long
NODE_ENV=production
REPLIT=true
```

### 3. Run It!

Click **"Run"** button at the top.

Replit will:
- Install all dependencies (`npm install`)
- Build the React frontend
- Start the Express server
- Open your app in a new tab

**Done!** Your app is live at: `https://your-repl-name.your-username.repl.co`

---

## Architecture on Replit

```
┌─────────────────────────────────────────┐
│         Replit Container                 │
│                                          │
│  ┌────────────────────────────────┐    │
│  │   Express Server (Port 5000)    │    │
│  │                                  │    │
│  │   ┌──────────┐   ┌──────────┐  │    │
│  │   │   API    │   │  React   │  │    │
│  │   │ /api/*   │   │  Build   │  │    │
│  │   └──────────┘   └──────────┘  │    │
│  │                                  │    │
│  │   • AI fallback (chrono-node)   │    │
│  │   • In-memory storage           │    │
│  │   • OAuth ready                 │    │
│  └────────────────────────────────┘    │
│                                          │
└─────────────────────────────────────────┘
              │
              ▼
    https://your-app.repl.co
```

---

## Features That Work on Replit

| Feature | Status | Notes |
|---------|--------|-------|
| Event creation (form) | ✅ Works | Full UI available |
| Voice-to-text input | ✅ Works | Browser Speech API |
| Natural language parsing | ✅ Works | chrono-node fallback |
| Smart validation | ✅ Works | Conflict detection, time validation |
| Event viewing/editing | ✅ Works | In-memory storage |
| Health check API | ✅ Works | `/health` endpoint |
| **Local Ollama AI** | ⚠️ Optional | See "Connect Local Ollama" below |
| **OAuth calendar sync** | ⚠️ Optional | Needs OAuth setup |
| **Database persistence** | ⚠️ Optional | Add Replit DB |

---

## What About AI Features?

**Replit can't run Ollama** (it's a container limitation), but you have 3 options:

### Option 1: Use Fallback (Recommended for MVP)
**Already configured!** The app uses `chrono-node` for parsing when Ollama isn't available.

**What you get:**
- ✅ "Dentist tomorrow at 2pm" → structured event
- ✅ "Team meeting next Monday at 9am" → parsed correctly
- ✅ Conflict detection
- ✅ Time validation
- ❌ AI chat responses (returns simple fallback messages)
- ❌ AI event organization (uses keyword matching)

**Accuracy:** ~70-80% (good enough for most cases!)

### Option 2: Connect Your Local Ollama (Advanced)
Run Ollama on your computer and expose it to Replit.

**Steps:**
1. Install Ollama on your machine
2. Run: `ollama serve`
3. Use a tunnel service (ngrok, Cloudflare Tunnel):
   ```bash
   ngrok http 11434
   ```
4. Add to Replit Secrets:
   ```
   OLLAMA_HOST=https://your-ngrok-url.ngrok.io
   ```
5. Your Replit app now uses your local AI! 🎉

**Pros:** Full AI features (chat, smart organization)
**Cons:** Ollama must be running on your computer

### Option 3: Use Ollama Cloud (Coming Soon)
Ollama is building a cloud API. When available:
```
OLLAMA_HOST=https://ollama.com
OLLAMA_API_KEY=your-key
```

---

## Storage Options on Replit

### Current: In-Memory (Default)
- Events stored in RAM
- **Persists during session**
- **Resets when Repl restarts**

### Upgrade: Replit Database (Free)
Add persistent storage:

```javascript
// backend/db/replitDb.js
const Database = require("@replit/database");
const db = new Database();

// Save event
await db.set(`event_${id}`, eventData);

// Get events
const events = await db.list("event_");
```

Install:
```bash
npm install @replit/database
```

Add to Secrets:
```
REPLIT_DB_URL=(auto-provided by Replit)
```

### Upgrade: PostgreSQL (Paid)
Use Replit's built-in PostgreSQL:
1. Click **"Database"** in left sidebar
2. Select **"PostgreSQL"**
3. Connection string auto-added to env

---

## OAuth Calendar Sync Setup

To enable Google/Microsoft/Facebook calendar sync:

### 1. Create OAuth Apps

**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. **Authorized redirect URI:** `https://your-repl-name.your-username.repl.co/api/auth/google/callback`
5. Copy Client ID & Secret

**Microsoft:**
1. [Azure Portal](https://portal.azure.com) → App Registrations
2. New registration
3. **Redirect URI:** `https://your-repl-name.your-username.repl.co/api/auth/microsoft/callback`

### 2. Add to Replit Secrets

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GOOGLE_REDIRECT_URI=https://your-repl.repl.co/api/auth/google/callback

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-secret
MICROSOFT_REDIRECT_URI=https://your-repl.repl.co/api/auth/microsoft/callback
```

### 3. Restart Your Repl

OAuth endpoints will be live at:
- `/api/auth/google`
- `/api/auth/microsoft`
- etc.

---

## Custom Domain (Optional)

### Free Subdomain
You get: `https://your-repl-name.your-username.repl.co`

### Custom Domain (Replit Hacker Plan - $7/month)
1. Purchase domain (Namecheap, Google Domains, etc.)
2. Replit → Settings → **"Link domain"**
3. Add DNS records
4. Update OAuth redirect URIs to use your domain

---

## Performance & Limits

### Replit Free Tier
- ✅ **CPU:** Shared (sufficient for small-medium usage)
- ✅ **RAM:** 512MB (enough for Node.js + React)
- ✅ **Storage:** 500MB
- ✅ **Bandwidth:** Unlimited
- ⚠️ **Auto-sleep:** After 1 hour of inactivity
- ⚠️ **Wakes up:** On first request (~5-10 seconds)

### Replit Hacker Plan ($7/month)
- Always-on (no sleep)
- 2x RAM (1GB)
- Custom domains
- Private Repls

### Tips for Free Tier
- Keep Repl awake with [UptimeRobot](https://uptimerobot.com) (free)
- Ping `/health` every 5 minutes
- Users may see 5-10s delay on first visit

---

## Deployment Checklist

Before going live:

- [ ] Test all API endpoints (`/health`, `/api/events`, `/api/ai/status`)
- [ ] Test event creation (voice + text)
- [ ] Test natural language parsing
- [ ] Verify OAuth redirect URIs match Repl URL
- [ ] Add `SESSION_SECRET` to Secrets
- [ ] Test on mobile (responsive?)
- [ ] Add analytics (optional: Google Analytics, Plausible)
- [ ] Set up monitoring (optional: Sentry, LogDNA)

---

## Troubleshooting

### "Cannot GET /"
Backend is running but frontend isn't built.
```bash
# In Replit Shell
cd frontend
npm run build
```

### "AI not available"
Expected on Replit. App uses fallback parsing (chrono-node).
Check: `/api/ai/status` should show `"enabled": false`

### Events disappear after restart
In-memory storage (default). Add Replit DB for persistence.

### OAuth redirect mismatch
Redirect URI must exactly match:
```
https://your-actual-repl-name.your-exact-username.repl.co/api/auth/google/callback
```

### Slow first load
Repl is waking up from sleep (free tier). Use UptimeRobot to keep it awake.

---

## Cost Breakdown

| Deployment | Monthly Cost | Features |
|------------|--------------|----------|
| **Replit Free** | **$0** | App works, auto-sleeps after 1hr |
| **Replit Hacker** | $7 | Always-on, custom domains |
| **+ Ngrok (for local Ollama)** | $0-8 | Expose local AI to Replit |
| **+ Custom domain** | $10-15/year | yourapp.com |

**Total for fully-featured app: $0-7/month** 🎉

---

## Next Steps

### After Deploy:
1. **Share your Repl** with users (they can fork it!)
2. **Add analytics** to track usage
3. **Set up OAuth** for calendar sync
4. **Add Replit DB** for persistent storage
5. **Upgrade to Hacker** if you need always-on

### To Keep Developing:
- Edit code directly in Replit
- Changes auto-rebuild
- Test at: `https://your-repl.repl.co`
- Push to GitHub from Replit (Version Control tab)

---

## Support

- **Replit Docs:** [docs.replit.com](https://docs.replit.com)
- **Discord:** Replit Community
- **This App:** GitHub Issues

**Need help?** Drop a message or check [QUICKSTART.md](QUICKSTART.md) for local testing first!
