# EduCode Platform - Deployment Status & Walkthrough

**Last Updated**: December 8, 2025

---

## 🌐 Current Deployment Status

### ✅ **DEPLOYED & LIVE**

#### Google Cloud Platform (GCP)
- **Project ID**: `educode-platform-2025`
- **Account**: capstone.yanlin.ao@gmail.com
- **Region**: us-central1

**Services Running**:

1. **Backend API (Cloud Run)**
   - URL: https://educode-backend-162585155042.us-central1.run.app
   - Status: ✅ Running
   - Last Deploy: November 25, 2025
   - Technology: Node.js + Express + Prisma
   
2. **AI Service (Cloud Run)**
   - URL: https://educode-ai-162585155042.us-central1.run.app
   - Status: ✅ Running
   - Last Deploy: November 24, 2025
   - Technology: Python FastAPI + Gemini 2.0
   
3. **Database (Cloud SQL)**
   - Instance: `educode-db`
   - Connection: educode-platform-2025:us-central1:educode-db
   - IP: 34.28.152.182
   - Status: ✅ RUNNABLE
   - Database: PostgreSQL 15
   - **Note**: Currently has only 5 seeded problems (needs 200+ problems)

### ⚠️ **NOT DEPLOYED**

4. **Frontend (Vercel)**
   - Status: ❌ Not deployed to Vercel
   - Current: Only running locally
   - Action Required: Deploy to Vercel

---

## 🔧 Local Development Setup

### Current Issue: Not Using Docker

**Problem**: According to README, local development should use Docker, but currently running via npm scripts.

**Solution**: Use Docker Compose for proper local development.

### Step-by-Step Local Setup with Docker

#### 1. Stop Current Running Services

```bash
# Kill any running npm dev servers
pkill -f "node\|nodemon\|next"
```

#### 2. Create Environment Files

Create `.env` files for each service:

**`apps/backend/.env`**:
```env
# Database (local PostgreSQL in Docker)
DATABASE_URL="postgresql://postgres:postgres@db:5432/educode"

# JWT
JWT_SECRET="your-secret-key-change-in-production"

# Judge0 API
JUDGE0_API_URL="https://judge0-ce.p.rapidapi.com"
JUDGE0_API_KEY="a2ba568f17msh764fdc1bdbb5be0p14b3f6jsna386bdbbd47d"

# AI Service
AI_SERVICE_URL="http://ai-service:8000"

# Port
PORT=3001
```

**`apps/ai-service/.env`**:
```env
# Google Gemini API
GOOGLE_API_KEY="AIzaSyC7X0sEt_fk5uFLlj8sQ8NdDpssAOFmcpM"

# Backend URL
BACKEND_URL="http://backend:3001"
```

**`apps/frontend/.env.local`**:
```env
# API URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_AI_SERVICE_URL="http://localhost:8000"
```

#### 3. Start All Services with Docker

```bash
cd /Users/sofi/Documents/Capstone/capstone/educode-adaptive-platform

# Start development environment with hot reload
docker compose -f docker-compose.dev.yml up --build
```

**What this starts**:
- 🗄️ PostgreSQL database on port 5432
- 🔧 Backend API on port 3001
- 🤖 AI Service on port 8000
- 🌐 Frontend on port 3000

#### 4. Seed the Database with Problems

After containers are running, seed the database:

```bash
# Open new terminal
docker compose -f docker-compose.dev.yml exec backend npx prisma db seed
```

This will create **5 sample problems**. To add 200+ problems, see below.

#### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/problems
- **AI Service**: http://localhost:8000/health
- **Database**: localhost:5432

---

## 📊 Database Problem: Only 5 Problems

### Current State
- Database has only **5 problems** (seeded from `prisma/seed.ts`)
- Need **200+ problems** for proper testing

### Solution: Import More Problems

You have two options:

#### Option 1: Run Comprehensive Seed Script
```bash
# Inside backend container or locally
cd apps/backend
npx ts-node prisma/seed-problems-comprehensive.ts
```

This script creates more diverse problems but still limited.

#### Option 2: Import from CodeNet Dataset (Recommended)

The `prisma/CODENET_IMPORT_GUIDE.md` mentions importing from IBM's Project CodeNet:

```bash
cd apps/backend/prisma

# Follow the guide to import problems
# This will give you hundreds of real problems
```

#### Option 3: Quick Fix - Add Problems to seed.ts

Edit `apps/backend/prisma/seed.ts` to add more problems following the existing pattern.

---

## 🚀 Deploying Updates to Production

### Update Backend on Cloud Run

```bash
cd apps/backend

# Build and deploy
gcloud run deploy educode-backend \
  --source . \
  --project=educode-platform-2025 \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=$(gcloud secrets versions access latest --secret=DATABASE_URL),JWT_SECRET=$(gcloud secrets versions access latest --secret=JWT_SECRET),JUDGE0_API_KEY=$(gcloud secrets versions access latest --secret=JUDGE0_API_KEY),JUDGE0_API_URL=$(gcloud secrets versions access latest --secret=JUDGE0_API_URL)"
```

### Update AI Service on Cloud Run

```bash
cd apps/ai-service

# Build and deploy
gcloud run deploy educode-ai \
  --source . \
  --project=educode-platform-2025 \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_API_KEY=$(gcloud secrets versions access latest --secret=GOOGLE_API_KEY)"
```

### Deploy Frontend to Vercel

```bash
# Install Vercel CLI if not already
npm i -g vercel

# Login
vercel login

# Deploy from frontend directory
cd apps/frontend
vercel --prod

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL = https://educode-backend-162585155042.us-central1.run.app
# NEXT_PUBLIC_AI_SERVICE_URL = https://educode-ai-162585155042.us-central1.run.app
```

### Update Production Database with 200+ Problems

```bash
# Connect to Cloud SQL via proxy
cloud-sql-proxy educode-platform-2025:us-central1:educode-db --port=5433 &

# Update DATABASE_URL to use proxy
export DATABASE_URL="postgresql://postgres:EduCode2025SecureDB!@localhost:5433/educode"

# Run seed script
cd apps/backend
npx prisma db seed

# Or import CodeNet dataset
npx ts-node prisma/import-submissions.ts
```

---

## 🔄 Complete Deployment Walkthrough

### 1. Fix Local Development (Use Docker)

```bash
# Stop any running services
pkill -f "node\|nodemon\|next"

# Start Docker Compose
cd /Users/sofi/Documents/Capstone/capstone/educode-adaptive-platform
docker compose -f docker-compose.dev.yml up --build

# In new terminal, seed database
docker compose -f docker-compose.dev.yml exec backend npx prisma db seed

# Access at http://localhost:3000
```

### 2. Add 200+ Problems to Local Database

```bash
# Option A: Run comprehensive seed
docker compose -f docker-compose.dev.yml exec backend npx ts-node prisma/seed-problems-comprehensive.ts

# Option B: Import from CodeNet (follow guide)
docker compose -f docker-compose.dev.yml exec backend npx ts-node prisma/import-submissions.ts
```

### 3. Update Production Backend & AI Service

```bash
# Backend
cd apps/backend
gcloud run deploy educode-backend --source . --project=educode-platform-2025 --region=us-central1

# AI Service
cd apps/ai-service
gcloud run deploy educode-ai --source . --project=educode-platform-2025 --region=us-central1
```

### 4. Deploy Frontend to Vercel

```bash
cd apps/frontend
vercel --prod

# Configure environment variables in Vercel dashboard
```

### 5. Update Production Database

```bash
# Start Cloud SQL Proxy
cloud-sql-proxy educode-platform-2025:us-central1:educode-db --port=5433 &

# Set production DATABASE_URL
export DATABASE_URL="postgresql://postgres:EduCode2025SecureDB!@localhost:5433/educode"

# Seed problems
cd apps/backend
npx prisma db seed
```

---

## 📋 Quick Reference Commands

### Docker Development
```bash
# Start all services
docker compose -f docker-compose.dev.yml up --build

# Stop all services
docker compose -f docker-compose.dev.yml down

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Restart specific service
docker compose -f docker-compose.dev.yml restart backend

# Execute command in container
docker compose -f docker-compose.dev.yml exec backend npx prisma db seed
```

### GCP Deployment
```bash
# Check deployed services
gcloud run services list --project=educode-platform-2025

# View logs
gcloud run services logs read educode-backend --project=educode-platform-2025

# Check Cloud SQL status
gcloud sql instances describe educode-db --project=educode-platform-2025
```

### Vercel Deployment
```bash
# List deployments
vercel ls

# Deploy
vercel --prod

# Check deployment status
vercel inspect
```

---

## 🎯 Action Items

### Immediate (Today)
1. ✅ Fix local development to use Docker Compose
2. ✅ Seed database with 200+ problems (not just 5)
3. ✅ Deploy frontend to Vercel

### Short-term (This Week)
4. Update production database with 200+ problems
5. Configure instructor role in production
6. Test full deployment flow

### Nice-to-Have
- Set up CI/CD with GitHub Actions
- Configure Cloud Build triggers for auto-deployment
- Add monitoring and alerting

---

## 🔗 Important URLs

**Production**:
- Backend: https://educode-backend-162585155042.us-central1.run.app
- AI Service: https://educode-ai-162585155042.us-central1.run.app
- Frontend: ⚠️ NOT DEPLOYED (need to deploy to Vercel)

**Local Development**:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- AI Service: http://localhost:8000
- Database: localhost:5432

**GCP Console**:
- Project: https://console.cloud.google.com/home/dashboard?project=educode-platform-2025
- Cloud Run: https://console.cloud.google.com/run?project=educode-platform-2025
- Cloud SQL: https://console.cloud.google.com/sql/instances?project=educode-platform-2025

---

**Summary**: Production backend and AI service are deployed on GCP, but frontend needs Vercel deployment, and database needs 200+ problems instead of just 5. Local development should use Docker Compose per README instructions.
