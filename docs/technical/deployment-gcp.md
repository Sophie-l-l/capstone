# EduCode Platform - 3-Day Google Cloud Deployment Plan
## Conference-Ready Production Deployment

**Target Infrastructure**:
- ✅ Frontend: Next.js on **Vercel**
- ✅ Backend API: Node.js + Express + Prisma on **Google Cloud Run**
- ✅ AI Service: Python FastAPI on **Google Cloud Run**
- ✅ Database: **Cloud SQL for PostgreSQL**
- ✅ Code Execution: **Judge0 API** (external service)
- ✅ LLM: **Gemini API** (paid tier - already upgraded)

**Timeline**: 3 days (72 hours)  
**Goal**: Fully functional production deployment for conference demo  
**Status**: Ready to execute

---

## Day 1: Infrastructure Setup & Database Migration (8-10 hours)

### Morning (4 hours): Google Cloud Project Setup

#### Task 1.1: Create GCP Project (30 min)
```bash
# Install Google Cloud SDK if not already installed
brew install --cask google-cloud-sdk

# Login and create project
gcloud auth login
gcloud projects create educode-platform --name="EduCode Adaptive Platform"
gcloud config set project educode-platform

# Enable billing (REQUIRED for Cloud Run & Cloud SQL)
# Go to: https://console.cloud.google.com/billing
# Link billing account to educode-platform project

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

**Checklist**:
- [ ] GCP project created: `educode-platform`
- [ ] Billing enabled and linked
- [ ] All 7 APIs enabled
- [ ] gcloud CLI authenticated

---

#### Task 1.2: Set Up Cloud SQL PostgreSQL (1 hour)

```bash
# Create Cloud SQL instance (this takes 10-15 minutes)
gcloud sql instances create educode-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --retention-window-days=7

# Set root password (SAVE THIS!)
gcloud sql users set-password postgres \
  --instance=educode-db \
  --password=YOUR_SECURE_PASSWORD_HERE

# Create application database
gcloud sql databases create educode \
  --instance=educode-db

# Get connection name (you'll need this)
gcloud sql instances describe educode-db --format="value(connectionName)"
# Output example: educode-platform:us-central1:educode-db
```

**Important**: Save these credentials securely:
```bash
# Create a secure credentials file (DO NOT COMMIT TO GIT)
cat > .env.production << EOF
DATABASE_URL="postgresql://postgres:YOUR_SECURE_PASSWORD_HERE@localhost:5432/educode?host=/cloudsql/educode-platform:us-central1:educode-db"
INSTANCE_CONNECTION_NAME="educode-platform:us-central1:educode-db"
EOF
```

**Checklist**:
- [ ] Cloud SQL instance `educode-db` created
- [ ] Database `educode` created
- [ ] Root password set and saved
- [ ] Connection name noted
- [ ] `.env.production` file created (NOT committed)

---

#### Task 1.3: Set Up Secret Manager (30 min)

```bash
# Store database URL
echo -n "postgresql://postgres:YOUR_PASSWORD@localhost:5432/educode?host=/cloudsql/educode-platform:us-central1:educode-db" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Store Gemini API key (your paid key)
echo -n "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GOOGLE_API_KEY --data-file=-

# Store JWT secret (generate a strong random string)
openssl rand -base64 32 | gcloud secrets create JWT_SECRET --data-file=-

# Store Judge0 credentials
echo -n "YOUR_JUDGE0_API_KEY" | \
  gcloud secrets create JUDGE0_API_KEY --data-file=-

echo -n "https://judge0-ce.p.rapidapi.com" | \
  gcloud secrets create JUDGE0_API_URL --data-file=-

# Grant Cloud Run service account access to secrets
PROJECT_NUMBER=$(gcloud projects describe educode-platform --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding GOOGLE_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JUDGE0_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JUDGE0_API_URL \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**Checklist**:
- [ ] DATABASE_URL secret created
- [ ] GOOGLE_API_KEY secret created
- [ ] JWT_SECRET secret created
- [ ] JUDGE0_API_KEY secret created
- [ ] JUDGE0_API_URL secret created
- [ ] IAM permissions granted for all secrets

---

### Afternoon (4 hours): Database Migration & Backend Prep

#### Task 1.4: Run Prisma Migrations to Cloud SQL (1.5 hours)

First, create a Cloud SQL Proxy to connect locally:

```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.7.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Start proxy (in a separate terminal - keep it running)
./cloud-sql-proxy educode-platform:us-central1:educode-db

# In your main terminal, navigate to backend
cd apps/backend

# Create production DATABASE_URL pointing to proxy
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/educode"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed initial data (optional but recommended)
npx prisma db seed
```

**Verify migration success**:
```bash
# Connect to database and check tables
psql "postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/educode"

# In psql:
\dt  -- List all tables (should see users, problems, submissions, etc.)
SELECT COUNT(*) FROM users;  -- Should return 0 or seed data count
\q  -- Exit
```

**Checklist**:
- [ ] Cloud SQL Proxy running
- [ ] Prisma migrations deployed successfully
- [ ] All tables created (users, problems, submissions, etc.)
- [ ] Seed data loaded (if applicable)
- [ ] Database connection verified

---

#### Task 1.5: Prepare Backend for Cloud Run (1 hour)

Create optimized production Dockerfile:

```bash
# Create apps/backend/Dockerfile.production
cat > apps/backend/Dockerfile.production << 'EOF'
# Multi-stage build for smaller image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY apps/backend/package*.json ./
COPY apps/backend/prisma ./prisma/

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY apps/backend/ ./

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy only production dependencies
COPY apps/backend/package*.json ./
RUN npm ci --only=production

# Copy built app from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Install Cloud SQL Proxy for database connection
RUN wget https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.7.0/cloud-sql-proxy.linux.amd64 -O cloud-sql-proxy \
  && chmod +x cloud-sql-proxy

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start script that runs Cloud SQL Proxy and Node app
CMD ./cloud-sql-proxy ${INSTANCE_CONNECTION_NAME} & node dist/server.js
EOF
```

**Update apps/backend/src/server.ts** to use PORT from environment:
```typescript
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
```

**Create .dockerignore**:
```bash
cat > apps/backend/.dockerignore << 'EOF'
node_modules
dist
.env
.env.*
npm-debug.log
coverage
.git
.gitignore
README.md
EOF
```

**Checklist**:
- [ ] `Dockerfile.production` created
- [ ] `.dockerignore` created
- [ ] Server port reads from environment
- [ ] Build script verified in package.json

---

#### Task 1.6: Prepare AI Service for Cloud Run (1 hour)

Create optimized production Dockerfile:

```bash
# Create apps/ai-service/Dockerfile.production
cat > apps/ai-service/Dockerfile.production << 'EOF'
FROM python:3.11-slim AS builder

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir virtualenv
RUN virtualenv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY apps/ai-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim AS production

WORKDIR /app

# Copy virtual environment
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY apps/ai-service/ .

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8080/health')"

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
EOF
```

**Update apps/ai-service/main.py** to use PORT from environment:
```python
import os

# At the bottom of main.py
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

**Create .dockerignore**:
```bash
cat > apps/ai-service/.dockerignore << 'EOF'
__pycache__
*.pyc
.env
.env.*
.pytest_cache
.venv
venv
EOF
```

**Checklist**:
- [ ] `Dockerfile.production` created for AI service
- [ ] `.dockerignore` created
- [ ] Port configuration updated
- [ ] Health check endpoint verified

---

#### Task 1.7: Build and Test Docker Images Locally (30 min)

```bash
# Build backend image
docker build -f apps/backend/Dockerfile.production -t educode-backend:test .

# Build AI service image
docker build -f apps/ai-service/Dockerfile.production -t educode-ai:test .

# Test backend locally (with mock DATABASE_URL)
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://postgres:password@host.docker.internal:5432/educode" \
  -e INSTANCE_CONNECTION_NAME="educode-platform:us-central1:educode-db" \
  -e JWT_SECRET="test-secret" \
  educode-backend:test

# Test AI service locally
docker run -p 8081:8080 \
  -e GOOGLE_API_KEY="your-gemini-key" \
  educode-ai:test

# Verify health endpoints
curl http://localhost:8080/health  # Backend
curl http://localhost:8081/health  # AI service
```

**Checklist**:
- [ ] Backend Docker image builds successfully
- [ ] AI service Docker image builds successfully
- [ ] Both services start without errors
- [ ] Health endpoints respond

---

## Day 2: Deploy Services to Cloud Run (8-10 hours)

### Morning (4 hours): Deploy Backend & AI Service

#### Task 2.1: Set Up Artifact Registry (30 min)

```bash
# Create Artifact Registry repository
gcloud artifacts repositories create educode-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="EduCode Docker images"

# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev
```

**Checklist**:
- [ ] Artifact Registry repository created
- [ ] Docker authentication configured

---

#### Task 2.2: Build and Push Backend to Artifact Registry (1 hour)

```bash
# Set project ID
PROJECT_ID="educode-platform"
REGION="us-central1"

# Build and tag backend image
docker build -f apps/backend/Dockerfile.production \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/educode-repo/backend:latest \
  .

# Push to Artifact Registry
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/educode-repo/backend:latest
```

**Checklist**:
- [ ] Backend image built
- [ ] Backend image pushed to Artifact Registry

---

#### Task 2.3: Deploy Backend to Cloud Run (1.5 hours)

```bash
# Deploy backend with Cloud SQL connection and secrets
gcloud run deploy educode-backend \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/educode-repo/backend:latest \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,INSTANCE_CONNECTION_NAME=educode-platform:us-central1:educode-db" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,JUDGE0_API_KEY=JUDGE0_API_KEY:latest,JUDGE0_API_URL=JUDGE0_API_URL:latest" \
  --add-cloudsql-instances=educode-platform:us-central1:educode-db \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=10 \
  --timeout=300 \
  --port=8080

# Get backend URL
BACKEND_URL=$(gcloud run services describe educode-backend --region=${REGION} --format="value(status.url)")
echo "Backend deployed at: ${BACKEND_URL}"

# Test backend
curl ${BACKEND_URL}/health
curl ${BACKEND_URL}/api/problems  # Should return empty array or seeded problems
```

**Expected response**:
```json
{
  "status": "ok",
  "service": "backend"
}
```

**Checklist**:
- [ ] Backend deployed to Cloud Run
- [ ] Health endpoint responds
- [ ] Database connection works (test /api/problems)
- [ ] Backend URL saved: `___________________`

---

#### Task 2.4: Build and Deploy AI Service (1 hour)

```bash
# Build and tag AI service image
docker build -f apps/ai-service/Dockerfile.production \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/educode-repo/ai-service:latest \
  .

# Push to Artifact Registry
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/educode-repo/ai-service:latest

# Deploy AI service
gcloud run deploy educode-ai-service \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/educode-repo/ai-service:latest \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --set-env-vars="PYTHONUNBUFFERED=1" \
  --set-secrets="GOOGLE_API_KEY=GOOGLE_API_KEY:latest" \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=5 \
  --timeout=300 \
  --port=8080

# Get AI service URL
AI_SERVICE_URL=$(gcloud run services describe educode-ai-service --region=${REGION} --format="value(status.url)")
echo "AI Service deployed at: ${AI_SERVICE_URL}"

# Test AI service
curl ${AI_SERVICE_URL}/health
```

**Checklist**:
- [ ] AI service image built and pushed
- [ ] AI service deployed to Cloud Run
- [ ] Health endpoint responds
- [ ] AI service URL saved: `___________________`

---

### Afternoon (4 hours): Frontend Deployment & Integration

#### Task 2.5: Update Backend CORS for Frontend (30 min)

**Update apps/backend/src/app.ts** to allow Vercel domain:

```typescript
app.use(cors({ 
  origin: [
    "http://localhost:3000",
    "https://educode-platform.vercel.app",  // Your Vercel domain
    "https://educode-*.vercel.app",  // Preview deployments
    /\.vercel\.app$/  // All Vercel domains
  ],
  credentials: true 
}));
```

**Rebuild and redeploy backend**:
```bash
docker build -f apps/backend/Dockerfile.production \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/educode-repo/backend:latest \
  .

docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/educode-repo/backend:latest

gcloud run deploy educode-backend \
  --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/educode-repo/backend:latest \
  --region=${REGION}
```

**Checklist**:
- [ ] CORS updated to allow Vercel
- [ ] Backend redeployed

---

#### Task 2.6: Update Backend to Call AI Service (30 min)

**Update environment variable in backend**:

```bash
# Update backend deployment with AI service URL
gcloud run services update educode-backend \
  --set-env-vars="AI_SERVICE_URL=${AI_SERVICE_URL}" \
  --region=${REGION}
```

**Verify in apps/backend/src/services/** that AI service calls use `process.env.AI_SERVICE_URL`:

```typescript
// Example in error classification service
const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const response = await axios.post(`${aiServiceUrl}/classify-error`, {...});
```

**Checklist**:
- [ ] Backend has AI_SERVICE_URL environment variable
- [ ] Backend code uses AI_SERVICE_URL
- [ ] Test error classification endpoint

---

#### Task 2.7: Prepare Frontend for Vercel (1 hour)

**Create Vercel configuration** (`vercel.json`):

```bash
cat > apps/frontend/vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "${BACKEND_URL}"
  }
}
EOF
```

**Update apps/frontend/lib/config.ts** to use environment variable:

```typescript
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

console.log('🔧 API URL configured:', API_URL);
```

**Update all API calls** to use `API_URL`:

```typescript
// In apps/frontend/lib/api.ts
import { API_URL } from './config';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Checklist**:
- [ ] `vercel.json` created
- [ ] Frontend uses NEXT_PUBLIC_API_URL
- [ ] All API calls use centralized config
- [ ] Environment variables verified

---

#### Task 2.8: Deploy Frontend to Vercel (1.5 hours)

**Option A: Deploy via Vercel Dashboard (Recommended for first time)**

1. **Go to Vercel**: https://vercel.com/
2. **Sign in** with GitHub
3. **Import Project**: Click "Add New" → "Project"
4. **Select Repository**: `Sophie-l-l/capstone`
5. **Configure Project**:
   - Framework Preset: **Next.js**
   - Root Directory: `apps/frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   
6. **Environment Variables** (CRITICAL):
   ```
   NEXT_PUBLIC_API_URL = https://educode-backend-<hash>.a.run.app
   ```
   *(Use your actual backend URL from Task 2.3)*

7. **Deploy**: Click "Deploy"
8. **Wait**: 3-5 minutes for build and deployment

**Option B: Deploy via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Navigate to frontend
cd apps/frontend

# Deploy (follow prompts)
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://educode-backend-<hash>.a.run.app

# Redeploy to apply env vars
vercel --prod
```

**Get Frontend URL**:
```
https://educode-platform.vercel.app
```
(Or whatever domain Vercel assigns)

**Checklist**:
- [ ] Frontend deployed to Vercel
- [ ] NEXT_PUBLIC_API_URL set correctly
- [ ] Frontend loads successfully
- [ ] Frontend can reach backend API
- [ ] Frontend URL saved: `___________________`

---

#### Task 2.9: End-to-End Integration Testing (1 hour)

**Test Complete User Flow**:

1. **Registration**:
   ```
   Visit: https://your-frontend.vercel.app/register
   Create account: test@example.com / SecurePass123!
   Verify: User created in Cloud SQL database
   ```

2. **Login**:
   ```
   Visit: https://your-frontend.vercel.app/login
   Login with credentials
   Verify: JWT token received, redirected to dashboard
   ```

3. **View Problems**:
   ```
   Visit: https://your-frontend.vercel.app/problems
   Verify: Problems list loads (empty or seeded data)
   ```

4. **Submit Code** (if you have test problems):
   ```
   Visit: https://your-frontend.vercel.app/problems/[id]
   Write simple code: print('hello')
   Submit
   Verify: Judge0 executes, result shown
   ```

5. **Test AI Error Classification**:
   ```
   Submit code with syntax error
   Verify: Error classification appears with LLM analysis
   Check backend logs for Gemini API calls
   ```

**Verify in Cloud SQL**:
```bash
# Connect via Cloud SQL Proxy
./cloud-sql-proxy educode-platform:us-central1:educode-db

# In another terminal
psql "postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/educode"

# Check data
SELECT * FROM users;
SELECT * FROM submissions ORDER BY "submittedAt" DESC LIMIT 5;
SELECT * FROM error_signatures ORDER BY "createdAt" DESC LIMIT 5;
\q
```

**Check Logs**:
```bash
# Backend logs
gcloud run services logs read educode-backend --region=us-central1 --limit=50

# AI service logs
gcloud run services logs read educode-ai-service --region=us-central1 --limit=50
```

**Checklist**:
- [ ] Registration works end-to-end
- [ ] Login works, JWT issued
- [ ] Problems page loads
- [ ] Code submission works (if applicable)
- [ ] Error classification works
- [ ] Data persists in Cloud SQL
- [ ] No CORS errors
- [ ] All logs clean (no critical errors)

---

## Day 3: Polish, Testing & Conference Prep (8-10 hours)

### Morning (4 hours): Performance & Stability

#### Task 3.1: Load Testing (1 hour)

**Install k6** (load testing tool):
```bash
brew install k6
```

**Create load test script** (`load-test.js`):

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '2m', target: 20 },   // Stay at 20
    { duration: '1m', target: 50 },   // Ramp to 50
    { duration: '2m', target: 50 },   // Stay at 50
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2s
    http_req_failed: ['rate<0.05'],    // Less than 5% failure
  },
};

const BACKEND_URL = 'https://your-backend-url.a.run.app';

export default function () {
  // Test health endpoint
  let healthRes = http.get(`${BACKEND_URL}/health`);
  check(healthRes, { 'health OK': (r) => r.status === 200 });

  sleep(1);

  // Test problems endpoint
  let problemsRes = http.get(`${BACKEND_URL}/api/problems`);
  check(problemsRes, { 'problems OK': (r) => r.status === 200 });

  sleep(2);
}
```

**Run load test**:
```bash
k6 run load-test.js
```

**If performance issues found**, scale up:
```bash
# Increase backend resources
gcloud run services update educode-backend \
  --memory=1Gi \
  --cpu=2 \
  --max-instances=20 \
  --region=us-central1
```

**Checklist**:
- [ ] Load test runs successfully
- [ ] 95th percentile < 2 seconds
- [ ] Error rate < 5%
- [ ] Cloud Run auto-scales as expected

---

#### Task 3.2: Set Up Monitoring & Alerts (1.5 hours)

**Enable Cloud Monitoring**:

```bash
# Create uptime check for backend
gcloud monitoring uptime-checks create http backend-uptime \
  --resource-type=uptime-url \
  --host=${BACKEND_URL} \
  --path=/health \
  --port=443 \
  --check-interval=5m

# Create uptime check for AI service
gcloud monitoring uptime-checks create http ai-service-uptime \
  --resource-type=uptime-url \
  --host=${AI_SERVICE_URL} \
  --path=/health \
  --port=443 \
  --check-interval=5m
```

**Set up Alert Policies** (via Console for simplicity):

1. Go to: https://console.cloud.google.com/monitoring/alerting
2. Create Alert:
   - **Name**: "Backend Down"
   - **Condition**: Uptime check fails for 5 minutes
   - **Notification**: Email to your address
3. Create Alert:
   - **Name**: "High Error Rate"
   - **Condition**: Error rate > 5% for 10 minutes
   - **Notification**: Email

**Create Dashboard**:

```bash
# Create custom dashboard (via Console is easier)
# Go to: https://console.cloud.google.com/monitoring/dashboards
```

Add charts for:
- Request count (last 1 hour)
- Request latency (p50, p95, p99)
- Error rate
- CPU utilization
- Memory utilization
- Active instances

**Checklist**:
- [ ] Uptime checks created
- [ ] Alert policies set
- [ ] Email notifications configured
- [ ] Dashboard created with key metrics

---

#### Task 3.3: Add Sample Data & Demo Content (1 hour)

**Create seed script for production data**:

```bash
# Update apps/backend/scripts/seed-sample-data.ts with demo problems
```

**Add demo problems for conference**:

```typescript
// Example problems to showcase platform
const demoProblems = [
  {
    title: "Two Sum",
    difficulty: "easy",
    description: "Find two numbers that add up to target",
    knowledgeComponents: ["arrays", "hash-tables"],
    // ... full problem details
  },
  {
    title: "Reverse Linked List",
    difficulty: "medium",
    description: "Reverse a singly linked list",
    knowledgeComponents: ["linked-lists", "pointers"],
    // ... full problem details
  },
  // Add 5-10 diverse problems
];
```

**Run seed script**:
```bash
# Connect to Cloud SQL
export DATABASE_URL="postgresql://postgres:PASSWORD@127.0.0.1:5432/educode"
./cloud-sql-proxy educode-platform:us-central1:educode-db &

# Run seed
cd apps/backend
npm run seed

# Verify
psql $DATABASE_URL -c "SELECT title, difficulty FROM problems;"
```

**Checklist**:
- [ ] 5-10 demo problems added
- [ ] Problems have test cases
- [ ] Problems tagged with knowledge components
- [ ] Sample user account created for demo

---

#### Task 3.4: Frontend Polish (30 min)

**Quick UX improvements**:

1. **Add loading states**:
   ```tsx
   // In components, show spinners during API calls
   {loading && <Spinner />}
   ```

2. **Error boundaries**:
   ```tsx
   // Catch errors gracefully
   <ErrorBoundary fallback={<ErrorMessage />}>
     <YourComponent />
   </ErrorBoundary>
   ```

3. **Toast notifications**:
   ```tsx
   // Show success/error messages
   toast.success("Code submitted successfully!");
   toast.error("Submission failed. Please try again.");
   ```

4. **Update branding**:
   - Check logo and favicon
   - Update page titles and meta tags
   - Add conference info in footer (optional)

**Redeploy frontend**:
```bash
cd apps/frontend
vercel --prod
```

**Checklist**:
- [ ] Loading states added
- [ ] Error handling improved
- [ ] Toast notifications working
- [ ] Branding looks professional
- [ ] Frontend redeployed

---

### Afternoon (4 hours): Documentation & Demo Prep

#### Task 3.5: Create Demo Script (1 hour)

**Write conference demo script** (`DEMO_SCRIPT.md`):

```markdown
# EduCode Platform - Conference Demo Script

## Setup (Before Demo)
- Open tabs:
  1. Frontend: https://educode-platform.vercel.app
  2. Backend metrics: Cloud Run dashboard
  3. Database: Cloud SQL dashboard (optional)
- Login credentials ready: demo@educode.com / DemoPass123!
- Pre-select a demo problem to solve live

## Demo Flow (10 minutes)

### 1. Introduction (1 min)
"EduCode is an adaptive learning platform for programming education that uses:
- Bayesian Knowledge Tracing to track student mastery
- AI-powered error classification with Google Gemini
- Real-time code execution via Judge0
- Deployed on Google Cloud for scalability"

### 2. Student Experience (4 min)

**Show Dashboard**:
- "Here's a student dashboard showing skill mastery levels"
- Point out: Knowledge components tracked via BKT
- Show: Progress charts, recent submissions

**Solve a Problem**:
- Navigate to Problems page
- Select "Two Sum" (easy problem)
- "Monaco editor with syntax highlighting"
- Write code live (or paste pre-written)
- Click "Run" to test against sample cases
- Click "Submit" for full evaluation

**Show Results**:
- Test cases passed/failed
- Runtime and memory usage
- Updated skill mastery (BKT updated in real-time)

### 3. AI Error Classification (2 min)

**Trigger an Error**:
- Submit code with intentional syntax error
- "Watch as Gemini AI classifies the error"
- Show classification:
  - Surface error category (IEEE 1044)
  - Cognitive cause (Zehetmeier framework)
  - Bloom's taxonomy level
  - Confidence score

**Explain Value**:
- "Helps identify knowledge gaps"
- "Personalized feedback for students"
- "Informs adaptive learning recommendations"

### 4. Architecture (2 min)

**Show Cloud Infrastructure**:
- Frontend: Vercel (Next.js)
- Backend: Google Cloud Run (Node.js + Prisma)
- AI Service: Cloud Run (Python FastAPI)
- Database: Cloud SQL (PostgreSQL)
- Code Execution: Judge0 API

**Highlight Scalability**:
- Auto-scaling from 1 to 20 instances
- Load testing results: handles 50+ concurrent users
- 99.5% uptime with health monitoring

### 5. Q&A (1 min)
- Be ready for questions about:
  - BKT algorithm details
  - Gemini API integration
  - Privacy/security (JWT auth, encrypted DB)
  - Future features (collaboration, mobile app)

## Backup Plans
- If live demo fails: Have pre-recorded video ready
- If code execution slow: Have screenshot of results
- If questions about cost: Mention free tier + minimal usage
```

**Checklist**:
- [ ] Demo script written
- [ ] Demo account created and tested
- [ ] Demo problems selected
- [ ] Backup screenshots/video prepared

---

#### Task 3.6: Create Documentation (1.5 hours)

**Update README.md** with deployment info:

```markdown
# EduCode Adaptive Platform

## Live Demo
🌐 **Frontend**: https://educode-platform.vercel.app
🔗 **API**: https://educode-backend-xyz.a.run.app

## Architecture
- **Frontend**: Next.js on Vercel
- **Backend**: Node.js + Express + Prisma on Google Cloud Run
- **AI Service**: Python FastAPI on Google Cloud Run
- **Database**: Cloud SQL (PostgreSQL)
- **Code Execution**: Judge0 API
- **LLM**: Google Gemini API (paid tier)

## Features
✅ Bayesian Knowledge Tracing for skill mastery
✅ AI-powered error classification (IEEE 1044 + Zehetmeier)
✅ Real-time code execution (10+ languages)
✅ Adaptive problem recommendations
✅ Student & instructor dashboards
✅ Auto-scaling cloud infrastructure

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Monaco Editor
- **Backend**: Node.js 18, Express 5, Prisma 6, PostgreSQL 15
- **AI**: Python 3.11, FastAPI, Google Gemini 2.0
- **Infrastructure**: Google Cloud Run, Cloud SQL, Vercel
- **DevOps**: Docker, GitHub, Cloud Build

## Quick Start (Local Development)
See DEVELOPMENT.md

## Deployment
See DEPLOYMENT_PLAN_GCP.md

## License
MIT
```

**Create API documentation** (`API_DOCUMENTATION.md`):

Include key endpoints:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/problems`
- `POST /api/problems/:id/submit`
- `GET /api/students/:id/bkt`
- `POST /ai/classify-error`

**Create architecture diagram** (use draw.io or similar):

```
[User Browser]
      ↓
[Vercel - Next.js Frontend]
      ↓
[Google Cloud Run - Node.js Backend] ← [Cloud SQL PostgreSQL]
      ↓
[Google Cloud Run - Python AI Service] → [Gemini API]
      ↓
[Judge0 API]
```

**Checklist**:
- [ ] README.md updated
- [ ] API documentation created
- [ ] Architecture diagram created
- [ ] All URLs and credentials documented

---

#### Task 3.7: Create Presentation Slides (1 hour)

**Slide outline** (10-15 slides):

1. **Title Slide**
   - EduCode: Adaptive Programming Education Platform
   - Your names, institution, date

2. **Problem Statement**
   - Programming education challenges
   - One-size-fits-all doesn't work
   - Need for personalized learning

3. **Solution: EduCode Platform**
   - Adaptive learning with BKT
   - AI-powered error analysis
   - Real-time code execution

4. **Key Features**
   - Screenshot of dashboard
   - Screenshot of code editor
   - Screenshot of error classification

5. **Technical Architecture**
   - Architecture diagram
   - Tech stack highlights

6. **Bayesian Knowledge Tracing**
   - How BKT works (simple explanation)
   - Example skill mastery progression

7. **AI Error Classification**
   - IEEE 1044 framework
   - Zehetmeier cognitive causes
   - Example error classification

8. **Cloud Infrastructure**
   - Google Cloud Run scalability
   - Auto-scaling demo
   - Performance metrics

9. **Live Demo**
   - Transition to live platform

10. **Results & Impact**
    - Load testing results
    - Performance metrics
    - Future potential

11. **Future Work**
    - Real-time collaboration
    - Mobile app
    - Advanced analytics

12. **Q&A**
    - Thank you slide with contact info

**Checklist**:
- [ ] Slides created (PowerPoint/Google Slides)
- [ ] Screenshots embedded
- [ ] Architecture diagram included
- [ ] Demo transition planned
- [ ] Backup slides for technical questions

---

#### Task 3.8: Final Testing & Dry Run (30 min)

**Run through complete demo**:

1. **Start with fresh browser** (incognito mode)
2. **Navigate to frontend**
3. **Register new account**
4. **Solve a problem**
5. **Trigger error classification**
6. **Show dashboard analytics**
7. **Time yourself** (should be < 5 minutes for core demo)

**Test on different devices**:
- [ ] Desktop Chrome
- [ ] Desktop Safari
- [ ] Mobile Safari (iPhone)
- [ ] Mobile Chrome (Android)

**Test network conditions**:
- [ ] Fast WiFi
- [ ] Slow 3G (use Chrome DevTools)
- [ ] Verify loading states show properly

**Final checks**:
- [ ] All links work
- [ ] No console errors
- [ ] HTTPS enabled (automatic with Cloud Run/Vercel)
- [ ] CORS working
- [ ] Authentication working
- [ ] Database persists data
- [ ] Error classification responds within 5 seconds

**Checklist**:
- [ ] Dry run completed successfully
- [ ] Timing under 5 minutes
- [ ] Mobile responsive verified
- [ ] All features working
- [ ] Backup plan ready

---

## Pre-Conference Checklist (Morning of Conference)

### 2 Hours Before Presentation

**Technical Checks**:
- [ ] Frontend loads: https://educode-platform.vercel.app
- [ ] Backend health: `curl https://your-backend.a.run.app/health`
- [ ] AI service health: `curl https://your-ai-service.a.run.app/health`
- [ ] Demo account works (login and test)
- [ ] Cloud Run services running (check dashboard)
- [ ] No active incidents in Cloud Monitoring

**Equipment Checks**:
- [ ] Laptop fully charged
- [ ] Backup power adapter
- [ ] HDMI/display adapter
- [ ] Backup slides on USB drive
- [ ] Phone with hotspot (backup internet)
- [ ] Printed notes/script

**Content Checks**:
- [ ] Slides loaded and tested
- [ ] Demo tabs open and ready
- [ ] URLs bookmarked
- [ ] Login credentials accessible
- [ ] Timer app ready

**Communication**:
- [ ] Email sent to team: "All systems ready"
- [ ] Slack/Discord status: "Presenting soon"
- [ ] Phone on silent (but accessible for emergencies)

---

## Troubleshooting Guide

### Issue: Backend not responding

**Diagnosis**:
```bash
gcloud run services describe educode-backend --region=us-central1
gcloud run services logs read educode-backend --limit=50
```

**Fix**:
```bash
# Restart service
gcloud run services update educode-backend --region=us-central1
```

---

### Issue: Database connection timeout

**Diagnosis**:
```bash
# Check Cloud SQL instance
gcloud sql instances describe educode-db

# Check Cloud SQL proxy connection
./cloud-sql-proxy educode-platform:us-central1:educode-db
```

**Fix**:
```bash
# Restart Cloud SQL instance (if needed)
gcloud sql instances restart educode-db

# Verify connection from backend logs
gcloud run services logs read educode-backend --limit=20 | grep -i database
```

---

### Issue: Frontend not loading

**Diagnosis**:
- Check Vercel dashboard: https://vercel.com/dashboard
- Check browser console for errors
- Verify NEXT_PUBLIC_API_URL is set

**Fix**:
```bash
# Redeploy frontend
cd apps/frontend
vercel --prod

# Or trigger redeploy from Vercel dashboard
```

---

### Issue: AI error classification slow/failing

**Diagnosis**:
```bash
# Check AI service logs
gcloud run services logs read educode-ai-service --limit=50

# Check Gemini API quota
# Go to: https://console.cloud.google.com/apis/api/generativeai.googleapis.com/quotas
```

**Fix**:
```bash
# Verify GOOGLE_API_KEY is set correctly
gcloud secrets versions access latest --secret="GOOGLE_API_KEY"

# If quota exceeded, wait or upgrade tier
# If API key invalid, rotate key and update secret
```

---

### Issue: Code execution (Judge0) failing

**Diagnosis**:
- Check Judge0 API status: https://rapidapi.com/judge0-official/api/judge0-ce
- Check backend logs for Judge0 errors

**Fix**:
- Verify JUDGE0_API_KEY is valid
- Check RapidAPI dashboard for quota
- Consider fallback: Skip code execution in demo, show pre-recorded results

---

## Cost Estimate (After Conference)

**Google Cloud Platform** (per month):
- Cloud Run (Backend): ~$10-20 (with auto-scaling)
- Cloud Run (AI Service): ~$5-15
- Cloud SQL (db-f1-micro): ~$7-10
- Cloud Build: Free tier (120 builds/day)
- Cloud Storage (backups): ~$1-2
- **Total GCP**: ~$25-50/month

**External Services**:
- Gemini API (paid tier): ~$10-50/month (depending on usage)
- Judge0 API: ~$10-30/month (RapidAPI plan)
- Vercel (Hobby): Free (or $20/month for Pro features)
- **Total External**: ~$20-100/month

**Grand Total**: ~$45-150/month (depending on usage and tier)

**Cost Optimization Tips**:
- Use Cloud Run min-instances=0 for low traffic periods
- Set up billing alerts at $50, $100
- Downgrade Cloud SQL to db-f1-micro if not needed
- Use Cloud Scheduler to stop services during off-hours

---

## Post-Conference Next Steps

### Immediate (Week 1):
- [ ] Gather feedback from conference attendees
- [ ] Fix any bugs discovered during demo
- [ ] Write blog post about deployment experience
- [ ] Update GitHub README with conference badge

### Short-term (Month 1):
- [ ] Implement top 3 requested features
- [ ] Add comprehensive monitoring
- [ ] Set up automated backups
- [ ] Write technical documentation

### Long-term (Month 3+):
- [ ] Scale to real users (beta program)
- [ ] Implement advanced features (collaboration, mobile)
- [ ] Apply for academic conference publications
- [ ] Consider open-sourcing parts of platform

---

## Success Criteria

✅ **Platform is live and accessible**
✅ **All core features working** (auth, problems, code execution, error classification)
✅ **Conference demo runs smoothly** (< 5 minutes, no errors)
✅ **Audience engaged** (questions, interest in technology)
✅ **Team confident** in explaining architecture and features

**Congratulations! You've successfully deployed EduCode to production! 🎉**

---

## Quick Reference URLs

**Production URLs** (fill in after deployment):
- Frontend: `https://_____________________.vercel.app`
- Backend: `https://_____________________.a.run.app`
- AI Service: `https://_____________________.a.run.app`

**Dashboards**:
- Google Cloud Console: https://console.cloud.google.com
- Vercel Dashboard: https://vercel.com/dashboard
- RapidAPI (Judge0): https://rapidapi.com/judge0-official/api/judge0-ce

**Documentation**:
- This deployment plan: `DEPLOYMENT_PLAN_GCP.md`
- Demo script: `DEMO_SCRIPT.md`
- API docs: `API_DOCUMENTATION.md`

---

**Document Version**: 1.0  
**Last Updated**: November 21, 2025  
**Status**: Ready for execution  
**Estimated Total Time**: 24-30 hours over 3 days
