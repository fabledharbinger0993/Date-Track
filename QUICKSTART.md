# Quick Start: Offline-First AI Calendar

## 🚀 5-Minute Setup (Free, No Cloud Required)

### Step 1: Install Ollama (AI Engine)

**Windows:**
```powershell
# Download and run installer
# https://ollama.com/download/windows
```

**Mac:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Step 2: Download AI Model

Choose one based on your needs:

```bash
# RECOMMENDED: Phi-3 (2.3GB) - Best balance
ollama pull phi

# OR Ultra-lightweight (637MB) - Faster, slightly less accurate
ollama pull tinyllama

# OR Alternative (934MB) - Good reasoning
ollama pull qwen2:1.5b
```

This downloads the model once - works offline forever after!

### Step 3: Start Ollama

```bash
ollama serve
```

Leave this running in a terminal.

### Step 4: Configure Your App

```bash
cd backend
cp .env.example .env

# Edit .env and set:
# OLLAMA_MODEL=phi
```

### Step 5: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 6: Run the App

**Option A: Docker (Everything Packaged)**
```bash
docker-compose up
```

**Option B: Manual (More Control)**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm start
```

### Step 7: Test It Out!

1. Open http://localhost:3000
2. Try quick event input: **"Dentist tomorrow at 2pm"**
3. See AI parse it instantly!
4. **Turn off WiFi** - everything still works!

---

## 🎯 API Endpoints Available

### Check AI Status
```bash
curl http://localhost:5000/api/ai/status
```

Response:
```json
{
  "enabled": true,
  "model": "phi",
  "host": "http://localhost:11434",
  "message": "AI assistant is ready!"
}
```

### Parse Event with AI
```bash
curl -X POST http://localhost:5000/api/events/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Team meeting tomorrow at 3pm in conference room A"}'
```

Response:
```json
{
  "title": "Team meeting",
  "date": "2026-02-26",
  "time": "15:00",
  "location": "conference room A",
  "aiParsed": true,
  "confidence": "high"
}
```

### Scan Events for Conflicts
```bash
curl -X POST http://localhost:5000/api/ai/scan
```

Response:
```json
{
  "analysis": "CONFLICTS: None found\nPATTERNS: 3 back-to-back meetings on Tuesday\nSUGGESTIONS: Consider adding buffer time between meetings",
  "scanned": 15,
  "aiGenerated": true
}
```

### Organize Events
```bash
curl -X POST http://localhost:5000/api/ai/organize
```

Response:
```json
{
  "categories": {
    "Work": ["Team Meeting", "Code Review", "Sprint Planning"],
    "Health": ["Dentist", "Gym Session"],
    "Social": ["Dinner with friends", "Birthday party"]
  },
  "aiOrganized": true
}
```

### Chat with AI Assistant
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What do I have today?"}'
```

Response:
```json
{
  "reply": "You have 3 events today: Team standup at 9am, Lunch with Sarah at noon, and Dentist at 2pm.",
  "context": {
    "todayCount": 3,
    "upcomingCount": 8
  }
}
```

---

## 🧪 Testing Offline Mode

1. Start the app (both backend and frontend)
2. Create a few events
3. **Disconnect from internet**
4. Try:
   - Creating new events via voice/text
   - Viewing existing events
   - AI parsing (still works!)
   - Event organization
5. **Reconnect to internet**
   - (Optional) Sync to cloud if configured

Everything should work seamlessly offline!

---

## 📊 What Works Offline

| Feature | Offline? | Notes |
|---------|----------|-------|
| View events | ✅ Yes | Stored in SQLite/memory |
| Create events | ✅ Yes | Saves locally |
| Voice-to-text | ✅ Yes | Browser built-in |
| AI parsing | ✅ Yes | Ollama runs locally |
| Event scanning | ✅ Yes | AI analyzes locally |
| Event organization | ✅ Yes | AI categorizes locally |
| Chat assistant | ✅ Yes | Ollama responds locally |
| Google Calendar sync | ❌ No | Requires internet |
| Facebook import | ❌ No | Requires internet |
| Canva designs | ❌ No | Requires internet |

**Bottom line:** Core functionality is 100% offline!

---

## 🔧 Troubleshooting

### "Ollama not available"
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve
```

### "Model not found"
```bash
# List installed models
ollama list

# Pull the model you specified in .env
ollama pull phi
```

### "AI parsing is slow"
- First request may take 1-2 seconds (loading model)
- Subsequent requests are faster (0.3-0.5s)
- Use `tinyllama` for faster parsing (less accurate)
- Hardware: Works on any laptop from last 5 years

### "Out of memory"
Models by RAM requirement:
- tinyllama: 1GB RAM
- qwen2:1.5b: 2GB RAM
- phi: 3GB RAM
- mistral: 5GB RAM

Close other apps or use a smaller model.

---

## 🚢 Distribution Options

### Option 1: GitHub + User Setup (Current)
Users clone repo, install Ollama, run app.
- **Pros:** Full control, easy to update
- **Cons:** Technical users only

### Option 2: Electron App (All-in-One)
Package everything (app + Ollama + model) into desktop app.
```bash
npm install electron electron-builder
npm run build
electron-builder
```
- **Pros:** Non-tech users can use it
- **Cons:** Larger download (500MB-1GB)

### Option 3: Docker Image (One Command)
```bash
docker pull datetrack/app:latest
docker run -p 3000:3000 -p 5000:5000 datetrack/app
```
- **Pros:** Easy for Docker users
- **Cons:** Requires Docker installed

---

## 💰 Cost Breakdown

| Component | Cost |
|-----------|------|
| Ollama AI | **$0** (free, open source) |
| Model (phi/tinyllama) | **$0** (free, open source) |
| SQLite database | **$0** (included) |
| Backend (Express) | **$0** (runs locally) |
| Frontend (React) | **$0** (runs locally) |
| **TOTAL** | **$0/month** |

Compare to cloud options:
- Azure OpenAI: $0.03-0.12 per 1K tokens (~$20-100/month)
- PostgreSQL (cloud): $7-25/month
- Redis (cloud): $5-15/month

**Offline-first saves $30-140/month!**

---

## 📈 Next Steps

### To Make It Better:
1. **Add SQLite** for persistent storage (currently in-memory)
2. **Build Electron app** for easy distribution
3. **Add cloud sync** (optional, when online)
4. **Improve UI** with offline indicators
5. **Add data export** (backup to JSON/CSV)

### To Share with Users:
1. Create installer (Electron or Docker)
2. Write user docs (non-technical)
3. Add demo video
4. Publish to GitHub releases

**Want help with any of these?**
