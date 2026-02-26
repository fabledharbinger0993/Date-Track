# Email Crawler Sub-Agent

> **AI-powered email assistant for Calinvite** - Automatically connects to email, identifies spam, categorizes messages, alerts urgent items, and extracts calendar events.

## 🌟 Features

- **🔌 Multi-Provider Support**: Gmail (OAuth), Outlook/Yahoo (IMAP)
- **🚫 Spam Detection**: AI-powered spam identification and quarantine
- **📂 Smart Categorization**: Urgent, Calendar, Receipt, Newsletter, Work, Personal
- **⏰ Time-Sensitive Alerts**: Flags urgent emails requiring immediate attention
- **📅 Calendar Extraction**: Automatically extracts meeting invites and events
- **🤖 AI Integration**: Uses OpenClaw → Ollama → Rule-based cascade
- **🔒 Privacy-First**: Processes emails locally when using local AI

## 📋 Supported Email Providers

| Provider | Connection Method | OAuth Required | Notes |
|----------|------------------|----------------|-------|
| Gmail | OAuth + Gmail API | ✓ Yes | Best integration, full features |
| Outlook | IMAP | ✗ No | Works with app password |
| Yahoo | IMAP | ✗ No | Requires app password |
| iCloud | IMAP | ✗ No | Use app-specific password |
| Custom | IMAP | ✗ No | Any IMAP-compatible server |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install googleapis imap mailparser
```

### 2. Configure Environment

Add to your `.env`:

```bash
# Email Crawler Agent
EMAIL_CRAWLER_ENABLED=true

# Gmail (OAuth - uses same Google Calendar credentials)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# IMAP (for Outlook, Yahoo, etc.)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-app-password
IMAP_TLS=true
```

### 3. Connect Email Account

#### Option A: Gmail (Recommended)

```bash
# Frontend user clicks "Connect Gmail"
# OAuth flow handles authentication
POST /api/email/connect/gmail
{
  "accessToken": "ya29.a0AfH6SMB..."
}
```

#### Option B: IMAP (Outlook, Yahoo, etc.)

```bash
POST /api/email/connect/imap
{
  "email": "you@outlook.com",
  "password": "your-app-password",
  "host": "outlook.office365.com",
  "port": 993,
  "tls": true
}
```

### 4. Scan Inbox

```bash
GET /api/email/scan?limit=50&unreadOnly=true
```

**Response:**
```json
{
  "success": true,
  "total": 47,
  "categorized": {
    "urgent": [
      {
        "id": "18d4e2c1f8a3b9d0",
        "subject": "URGENT: Server outage",
        "from": "alerts@company.com",
        "date": "2026-02-25T10:30:00Z",
        "isUrgent": true,
        "confidence": 0.95
      }
    ],
    "spam": [...],
    "calendarEvents": [
      {
        "id": "18d4e2c1f8a3b9d1",
        "subject": "Team Meeting Tomorrow",
        "hasCalendarEvent": true,
        "extractedEvent": {
          "title": "Team Meeting",
          "date": "2026-02-26",
          "time": "14:00",
          "duration": 60
        }
      }
    ],
    "other": [...]
  }
}
```

## 📡 API Endpoints

### Connect Email

**Gmail:**
```http
POST /api/email/connect/gmail
Content-Type: application/json

{
  "accessToken": "oauth_access_token"
}
```

**IMAP:**
```http
POST /api/email/connect/imap
Content-Type: application/json

{
  "email": "you@example.com",
  "password": "app-password",
  "host": "imap.example.com",
  "port": 993,
  "tls": true
}
```

### Scan Inbox

```http
GET /api/email/scan?limit=50&unreadOnly=true
```

**Query Parameters:**
- `limit` (default: 50) - Max emails to scan
- `unreadOnly` (default: true) - Only scan unread emails

### Get Urgent Emails

```http
GET /api/email/urgent
```

Returns only time-sensitive, non-spam emails.

### Auto-Process Inbox

```http
POST /api/email/auto-process
```

**Automatic actions:**
1. Scans inbox for unread emails
2. Quarantines spam automatically
3. Returns urgent alerts
4. Extracts calendar events

**Response:**
```json
{
  "success": true,
  "processed": 50,
  "actions": {
    "quarantined": 8,
    "urgentAlerts": 3,
    "calendarEventsFound": 5
  },
  "urgent": [...],
  "calendarEvents": [...]
}
```

### Quarantine Email

```http
POST /api/email/{messageId}/quarantine
```

Moves email to spam folder.

### Connection Status

```http
GET /api/email/status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "connected": true,
    "provider": "gmail",
    "connectedAt": "2026-02-25T09:00:00Z",
    "features": {
      "spamDetection": true,
      "categorization": true,
      "urgentAlerts": true,
      "calendarExtraction": true
    }
  }
}
```

## 🤖 AI Integration

The Email Crawler uses the **cascading AI architecture**:

1. **OpenClaw** (Primary) - Lightweight, fast, local
2. **Ollama** (Secondary) - More powerful, local
3. **Rule-based** (Fallback) - Always works, 70% accuracy

### Email Analysis

Each email is analyzed for:

```javascript
{
  "category": "urgent|spam|calendar_event|receipt|newsletter|personal|work|other",
  "isSpam": true/false,
  "isUrgent": true/false,
  "hasCalendarEvent": true/false,
  "confidence": 0.0-1.0,
  "extractedEvent": {...} // If calendar event detected
}
```

### Spam Detection Keywords

**AI analyzes context**, but fallback uses:
- `viagra`, `casino`, `lottery`, `winner`
- `click here`, `limited time`, `act now`
- Suspicious sender patterns (noreply@, random characters)

### Urgency Detection Keywords

- `urgent`, `asap`, `immediate`
- `deadline`, `expires`, `time-sensitive`
- `action required`, `respond by`

### Calendar Event Detection

- `meeting`, `appointment`, `scheduled`
- `calendar invite`, `event`, `zoom link`
- Date/time patterns in subject or body

## 🔐 Security & Privacy

### Data Handling

- **Local Processing**: When using OpenClaw/Ollama, emails are processed locally
- **No Storage**: Email content not stored on servers (only metadata)
- **OAuth**: Gmail uses secure OAuth (no password storage)
- **App Passwords**: IMAP uses app-specific passwords (not main password)

### Gmail OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify` (for spam quarantine)
4. Add redirect URI: `http://localhost:5000/api/auth/google/callback`

### IMAP App Passwords

**Outlook:**
1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Enable 2FA if not already enabled
3. Generate app password for "Other app"

**Yahoo:**
1. Go to [Yahoo Account Security](https://login.yahoo.com/account/security)
2. Enable 2FA
3. Generate app password

## 📊 Categories

| Category | Description | Auto-Actions |
|----------|-------------|--------------|
| `spam` | Junk, phishing, marketing | Quarantine automatically |
| `urgent` | Time-sensitive, deadlines | Alert user immediately |
| `calendar_event` | Meeting invites, events | Extract & suggest adding to calendar |
| `receipt` | Purchase confirmations | File under receipts |
| `newsletter` | Subscriptions, updates | Mark as low-priority |
| `personal` | Friends, family | Normal priority |
| `work` | Job-related emails | Normal priority |
| `other` | Uncategorized | Normal priority |

## ⚙️ Configuration

### Environment Variables

```bash
# Enable/disable email crawler
EMAIL_CRAWLER_ENABLED=true

# IMAP Configuration (for non-Gmail providers)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-app-password
IMAP_TLS=true

# Auto-processing settings (optional)
EMAIL_AUTO_PROCESS_INTERVAL=300000  # 5 minutes in ms
EMAIL_SCAN_LIMIT=100
EMAIL_UNREAD_ONLY=true
```

## 🔧 Advanced Usage

### Custom Categorization Rules

Edit `backend/services/emailCrawlerAgent.js`:

```javascript
// Add custom category
this.categories.BILLS = 'bills';

// Custom rule in fallbackAnalyze()
if (combined.includes('invoice') || combined.includes('bill due')) {
  category = this.categories.BILLS;
}
```

### Scheduled Auto-Processing

```javascript
// In server.js
const emailAgent = require('./services/emailCrawlerAgent').getInstance();

// Run every 5 minutes
setInterval(async () => {
  const users = await getAllConnectedUsers();
  for (const user of users) {
    await emailAgent.scanInbox(user.id, { unreadOnly: true });
  }
}, 5 * 60 * 1000);
```

## 🐛 Troubleshooting

### Gmail: "Access Blocked"

**Solution:** Enable "Less secure app access" or use OAuth.

1. Use OAuth (recommended)
2. Or enable IMAP in Gmail settings
3. Generate app password for IMAP

### IMAP: Connection Timeout

**Solution:** Check firewall/port settings.

```bash
# Test IMAP connection
telnet imap.gmail.com 993
```

### Spam Detection Too Aggressive

**Solution:** Adjust confidence threshold.

```javascript
// In emailCrawlerAgent.js
if (analysis.isSpam && analysis.confidence > 0.85) { // Increased from 0.60
  // Quarantine
}
```

### Calendar Extraction Not Working

**Solution:** Ensure AI is running (OpenClaw/Ollama).

```bash
# Check AI status
curl http://localhost:5000/api/email/status
```

## 📈 Performance

| Operation | Time (Gmail) | Time (IMAP) | Notes |
|-----------|--------------|-------------|-------|
| Connect | ~2s | ~1s | OAuth vs IMAP |
| Scan 50 emails | ~5-10s | ~15-30s | API vs IMAP protocol |
| Categorize (AI) | ~0.5s/email | ~0.5s/email | OpenClaw/Ollama |
| Categorize (Rules) | ~0.01s/email | ~0.01s/email | Fallback |
| Quarantine | ~0.5s | ~2s | API vs IMAP move |

## 🎯 Use Cases

### 1. Automatic Event Extraction

```javascript
// User receives "Team meeting tomorrow at 2pm"
// Email Crawler:
//   1. Scans email
//   2. Detects calendar event
//   3. Extracts: { title: "Team meeting", date: "2026-02-26", time: "14:00" }
//   4. Suggests: "Add to calendar?"
```

### 2. Urgent Email Alerts

```javascript
// Email with "URGENT: Server down"
// Email Crawler:
//   1. Detects urgency (AI: 0.95 confidence)
//   2. Sends push notification
//   3. Displays in urgent inbox
```

### 3. Smart Spam Filtering

```javascript
// Suspicious email from "winner@lottery.com"
// Email Crawler:
//   1. AI detects spam (0.98 confidence)
//   2. Automatically quarantines
//   3. Logs action for review
```

## 🔮 Future Enhancements

- [ ] **Smart Replies**: AI-generated email responses
- [ ] **Follow-up Reminders**: "Reply by Friday" → sets reminder
- [ ] **Contact Extraction**: Auto-save new contacts
- [ ] **Attachment Analysis**: Scan attachments for events (ICS files)
- [ ] **Multi-account**: Support multiple email accounts per user
- [ ] **Email Templates**: Quick responses to common emails
- [ ] **Search**: Natural language email search ("Find emails about meetings")

## 📚 Related Documentation

- [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) - AI engine setup
- [OAUTH_INTEGRATION.md](./OAUTH_INTEGRATION.md) - OAuth configuration
- [API.md](./API.md) - Complete API reference

## 🤝 Contributing

Want to add support for more email providers? Check [CONTRIBUTING.md](../CONTRIBUTING.md).

## 📝 License

Part of Calinvite - see [LICENSE](../LICENSE)
