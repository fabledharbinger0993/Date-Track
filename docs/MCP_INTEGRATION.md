# Model Context Protocol (MCP) Integration

Date-Track uses **MCP (Model Context Protocol)** to provide enhanced AI context and seamless integration with external services.

## 🔌 What is MCP?

MCP is an open protocol that enables AI assistants to securely connect with external data sources and tools. Think of it as "USB-C for AI" - a standardized way for AI models to access:

- Databases (PostgreSQL, MySQL, etc.)
- File systems
- APIs (Google Calendar, Gmail, Slack, etc.)
- External services

## 📦 Available MCP Servers in Date-Track

### **Core Servers** (Always Enabled)

1. **PostgreSQL Server** (`@modelcontextprotocol/server-postgres`)
   - Direct database access for event queries
   - Enables complex event searches and analytics
   - Auto-configured with your DATABASE_URL

2. **Filesystem Server** (`@modelcontextprotocol/server-filesystem`)
   - Import/export calendar files (.ics format)
   - Backup and restore functionality
   - Access path: `/app/data` (configurable via `MCP_FILESYSTEM_PATH`)

### **Optional OAuth Servers** (Require API Keys)

3. **Google Calendar Server** (`@modelcontextprotocol/server-google-calendar`)
   - Two-way calendar sync with Google Calendar
   - Auto-enabled when `GOOGLE_CLIENT_ID` is set

4. **Gmail Server** (`@modelcontextprotocol/server-gmail`)
   - Email parsing for event extraction
   - Calendar invite detection
   - Auto-enabled when `GOOGLE_CLIENT_ID` is set

5. **Microsoft Graph Server** (`@modelcontextprotocol/server-microsoft-graph`)
   - Outlook calendar and email integration
   - Auto-enabled when `MICROSOFT_CLIENT_ID` is set

6. **Slack Server** (`@modelcontextprotocol/server-slack`)
   - Event reminder notifications
   - Team calendar sharing
   - Requires `SLACK_BOT_TOKEN`

7. **GitHub Server** (`@modelcontextprotocol/server-github`)
   - Project deadline sync
   - Milestone integration
   - Requires `GITHUB_PERSONAL_ACCESS_TOKEN`

## 🚀 Quick Start

### 1. Install Dependencies

MCP servers are automatically installed when you run:

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
# Core MCP settings
MCP_FILESYSTEM_PATH=/app/data
MCP_LOG_LEVEL=info

# Google services (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Microsoft services (optional)
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret

# Slack (optional)
SLACK_BOT_TOKEN=xoxb-your-token
```

### 3. Start the Backend

MCP servers initialize automatically on backend startup:

```bash
npm start
```

You'll see output like:
```
🔌 Initializing MCP (Model Context Protocol) servers...
  Starting MCP server: postgres...
  ✓ postgres started (Database access for event queries and management)
  Starting MCP server: filesystem...
  ✓ filesystem started (File access for .ics import/export and backups)
✓ MCP initialization complete: 2 started, 0 failed
```

## 📊 Check MCP Status

### API Endpoint

```bash
GET http://localhost:5000/api/mcp/status
```

**Response:**
```json
{
  "status": "ok",
  "servers": {
    "postgres": {
      "status": "running",
      "startTime": 1677445200000,
      "config": "Database access for event queries and management"
    },
    "filesystem": {
      "status": "running",
      "startTime": 1677445200000,
      "config": "File access for .ics import/export and backups"
    },
    "googleCalendar": {
      "status": "disabled",
      "reason": "missing_auth"
    }
  },
  "timestamp": "2026-02-26T12:00:00.000Z"
}
```

## 🔧 Configuration

### Configuration File

MCP servers are configured in [`backend/config/mcp.js`](../backend/config/mcp.js):

```javascript
module.exports = {
  servers: {
    postgres: {
      enabled: true,
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', process.env.DATABASE_URL],
      // ...
    },
    // ... other servers
  },
  settings: {
    autoStart: true,
    retryAttempts: 3,
    retryDelay: 5000,
    healthCheckInterval: 60000
  }
};
```

### Disable Specific Servers

Set `enabled: false` in the config:

```javascript
googleCalendar: {
  enabled: false,  // Disable Google Calendar MCP
  // ...
}
```

Or skip by not providing credentials (MCP will auto-disable).

## 🐳 Docker Integration

MCP servers work seamlessly in Docker:

```bash
docker-compose up -d
```

MCP servers start automatically with the backend container. No additional configuration needed!

## 🛠️ Troubleshooting

### Server Not Starting

**Check credentials:**
```bash
# Verify environment variables are set
echo $GOOGLE_CLIENT_ID
```

**View MCP logs:**
Set log level to debug in `.env`:
```bash
MCP_LOG_LEVEL=debug
```

### Server Crashed

MCP service automatically retries failed servers:
- 3 retry attempts
- 5-second delay between retries
- Health checks every 60 seconds

### Manual Restart

Restart the backend server:
```bash
npm restart
```

## 📚 Learn More

- [MCP Specification](https://modelcontextprotocol.io/introduction)
- [Available MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Build Custom MCP Servers](https://modelcontextprotocol.io/docs/building-servers)

## 🔐 Security Notes

- MCP servers run as child processes with restricted permissions
- OAuth tokens are never logged
- File access is restricted to `/app/data` directory
- Database access respects user permissions
- All external connections use HTTPS/TLS

## 💡 Use Cases

### Example: AI-Powered Event Search

With PostgreSQL MCP server, AI can directly query your events:

```
"Show me all urgent meetings next week"
→ MCP queries database with filters
→ Returns structured event data
```

### Example: Calendar Import

With Filesystem MCP server, import .ics files:

```
"Import calendar from vacation.ics"
→ MCP reads file from /app/data
→ Parses and creates events
```

### Example: Email Event Extraction

With Gmail MCP server, auto-create events from emails:

```
"Scan my emails for calendar invites"
→ MCP accesses Gmail API
→ Extracts event details
→ Creates calendar entries
```

---

**Questions?** Check the [main README](../README.md) or [deployment guide](../DEPLOYMENT.md).
