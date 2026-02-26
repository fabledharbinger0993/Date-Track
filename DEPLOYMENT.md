# Date-Track Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Client Browser                      │
│              (React App - Port 3000)                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│            Backend API (Express - Port 5000)         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Events    │  │ Integrations │  │    OAuth   │ │
│  │   Controller│  │  Controller  │  │ Controller │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
│         │                  │                │        │
│         └──────────────────┴────────────────┘        │
│                     ▼                                │
│         ┌──────────────────────┐                     │
│         │   AI Service (Azure) │                     │
│         │   OpenAI GPT-4       │                     │
│         └──────────────────────┘                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              Data Layer                              │
│  ┌──────────────┐       ┌──────────────┐           │
│  │  PostgreSQL  │       │    Redis     │           │
│  │   Database   │       │    Cache     │           │
│  └──────────────┘       └──────────────┘           │
└─────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│           External Services                          │
│  • Google Calendar  • Microsoft Graph                │
│  • Facebook Events  • Yahoo Calendar                 │
│  • Apple iCloud     • Canva API                      │
│  • Google Maps      • OpenWeather                    │
└─────────────────────────────────────────────────────┘
```

## Deployment Options

### Option 1: Free Tier (Recommended for Starting Out)

**Services Required:**
- Vercel or Netlify (Frontend) - **FREE**
- Railway.app or Render (Backend + Database) - **FREE tier available**
- Railway Redis - **FREE tier**
- Ollama (AI) - **FREE, self-hosted on backend**

**Cost Estimate:** $0-5/month (free tiers cover most small-medium usage)

**Steps:**
```bash
# 1. Deploy to Railway (includes PostgreSQL + Redis)
railway login
railway init
railway up

# 2. Add PostgreSQL database
railway add --database postgresql

# 3. Add Redis
railway add --database redis

# 4. Set environment variables in Railway dashboard
# OLLAMA_HOST=http://localhost:11434 (Ollama runs on same container)
# DATABASE_URL=(auto-provided by Railway)
# REDIS_URL=(auto-provided by Railway)

# 5. Deploy frontend to Vercel
cd frontend
vercel --prod
```

**Ollama Setup:**
```bash
# Install Ollama in Docker (included in Dockerfile)
# Models available: llama2, mistral, phi, codellama
# Model is downloaded on first use (~4GB)
```

### Option 2: Azure (For Enterprise/Large Scale)

**Services Required:**
- Azure Static Web Apps (Frontend)
- Azure Container Apps (Backend)
- Azure Database for PostgreSQL Flexible Server
- Azure Cache for Redis
- Ollama on Container Apps (or Azure OpenAI)
- Azure Key Vault (secrets)
- Azure Application Insights (monitoring)

**Cost Estimate:** ~$30-80/month with Ollama, ~$50-100/month with Azure OpenAI

**Steps:**
```bash
# 1. Install Azure CLI
az login

# 2. Create resource group
az group create --name date-track-rg --location eastus

# 3. Create PostgreSQL database
az postgres flexible-server create \
  --resource-group date-track-rg \
  --name datetrack-db \
  --location eastus \
  --admin-user datetrack \
  --admin-password <strong-password> \
  --sku-name Standard_B1ms \
  --version 15

# 4. Create Redis cache
az redis create \
  --resource-group date-track-rg \
  --name datetrack-cache \
  --location eastus \
  --sku Basic \
  --vm-size c0

# 5. Create Azure OpenAI resource
az cognitiveservices account create \
  --name datetrack-openai \
  --resource-group date-track-rg \
  --kind OpenAI \
  --sku S0 \
  --location eastus

# 6. Deploy container
docker build -t date-track-api .
az acr create --resource-group date-track-rg --name datetrack --sku Basic
az acr login --name datetrack
docker tag date-track-api datetrack.azurecr.io/date-track-api:latest
docker push datetrack.azurecr.io/date-track-api:latest

# 7. Create container app
az container app create \
  --name date-track-api \
  --resource-group date-track-rg \
  --image datetrack.azurecr.io/date-track-api:latest \
  --target-port 5000 \
  --ingress external \
  --query properties.configuration.ingress.fqdn

# 8. Deploy frontend to Static Web Apps
cd frontend
npm run build
az staticwebapp create \
  --name date-track \
  --resource-group date-track-rg \
  --source . \
  --location eastus \
  --branch main \
  --app-location "/" \
  --output-location "build"
```

### Option 3: Docker Compose (Local/Self-Hosted)

```bash
# 1. Clone repo
git clone https://github.com/yourusername/Date-Track.git
cd Date-Track

# 2. Create .env file
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# 3. Start services
docker-compose up -d

# Access:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Database: localhost:5432
```

### Option 4: Alternative Cloud Providers

**Render (Backend + Database):**
- Free tier: 750 hours/month
- PostgreSQL: Free 90 days, then $7/month
- Deploy from GitHub repo

**Fly.io (Backend):**
- Free tier: 3 shared VMs
- Deploy with `fly launch`

**Supabase (Database):**
- Free PostgreSQL with 500MB storage
- Built-in realtime subscriptions

**Frontend (Vercel):**
```bash
cd frontend
vercel --prod
```

**Backend (Render/Heroku):**
- Connect GitHub repo
- Set environment variables
- Deploy from `backend/` directory

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for all required variables.

**Critical Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random secure string
- `OLLAMA_HOST` - Ollama server URL (default: http://localhost:11434)
- `OLLAMA_MODEL` - Model to use (default: mistral, options: llama2, phi, codellama)

## API Endpoints

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/parse` - Parse natural language to event (AI-powered)

### Integrations
- `POST /api/integrations/facebook/import` - Import Facebook events
- `POST /api/integrations/canva/attach` - Attach Canva design
- `POST /api/integrations/canva/validate` - Validate Canva URL

### OAuth
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/microsoft` - Initiate Microsoft OAuth
- `GET /api/auth/facebook` - Initiate Facebook OAuth
- (Similar patterns for other providers)

## AI Features

The app uses **Ollama** (open-source, free) for:
- **Natural Language Parsing** - "Dentist tomorrow at 2pm" → structured event
- **Smart Validation** - Detects conflicts, unusual times, missing details
- **Context-Aware Suggestions** - Recommends times, locations, attendees

**Recommended Models:**
- `mistral` (7B) - Fast, accurate, good for event parsing (~4GB RAM)
- `llama2` (7B) - Alternative, slightly slower (~4GB RAM)
- `phi` (3B) - Ultra-lightweight, faster but less accurate (~2GB RAM)

**Fallback:** If Ollama is not configured, falls back to `chrono-node` for basic date parsing.

**Ollama Installation:**
```bash
# Linux/Mac
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download/windows

# Pull a model
ollama pull mistral

# Run Ollama server
ollama serve  # Starts on http://localhost:11434
```

## Database Migrations

```bash
# Initialize database
psql -U datetrack -d datetrack -f backend/db/init.sql

# Or using Docker
docker-compose exec db psql -U datetrack -d datetrack -f /docker-entrypoint-initdb.d/init.sql
```

## Monitoring & Logs

**Azure:**
- Application Insights - Performance, errors, traces
- Log Analytics - Query logs
- Azure Monitor - Alerts

**Docker:**
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Health checks
curl http://localhost:5000/health
```

## Security Checklist

- [ ] Strong `SESSION_SECRET` set
- [ ] All OAuth credentials configured
- [ ] Database uses strong password
- [ ] HTTPS enabled in production
- [ ] CORS configured for production URLs
- [ ] API rate limiting enabled
- [ ] Secrets stored in Azure Key Vault (not .env in production)
- [ ] Regular security updates

## Scaling

**Horizontal Scaling:**
- Azure Container Apps auto-scales based on HTTP requests
- Add more PostgreSQL read replicas
- Use Redis for session storage (stateless backend)

**Performance:**
- CDN for frontend static assets
- Database indexing on frequently queried columns
- Caching frequently accessed calendar data

## Troubleshooting

**AI parsing not working:**
- Check Ollama is running: `curl http://localhost:11434`
- Verify model is installed: `ollama list`
- Pull model if needed: `ollama pull mistral`
- App falls back to basic parsing if Ollama unavailable
- Check `OLLAMA_HOST` environment variable

**OAuth failing:**
- Check redirect URIs match exactly
- Verify  client IDs/secrets
- Check provider API quotas

**Database connection issues:**
- Verify `DATABASE_URL` format
- Check firewall rules (Azure PostgreSQL)
- Ensure database initialized with schema

## Support

For issues, see [GitHub Issues](https://github.com/yourusername/Date-Track/issues)
