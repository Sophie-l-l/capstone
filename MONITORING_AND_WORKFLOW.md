# EduCode Platform - Monitoring & Deployment Workflow Guide

**Last Updated**: December 8, 2025

---

## 🔍 Monitoring Production Deployment (Real-Time Status)

### 1. Backend API (Cloud Run) - Real-Time Monitoring

#### Check Service Status
```bash
# Check if backend is running
gcloud run services describe educode-backend \
  --project=educode-platform-2025 \
  --region=us-central1 \
  --format="value(status.url,status.conditions.status)"

# Quick health check
curl -s https://educode-backend-162585155042.us-central1.run.app/health | jq .
```

#### View Live Logs (Real-Time)
```bash
# Stream backend logs in real-time
gcloud run services logs read educode-backend \
  --project=educode-platform-2025 \
  --region=us-central1 \
  --limit=50 \
  --follow

# Filter for errors only
gcloud run services logs read educode-backend \
  --project=educode-platform-2025 \
  --region=us-central1 \
  --log-filter='severity>=ERROR' \
  --follow
```

#### Check Metrics (CPU, Memory, Requests)
```bash
# View service metrics
gcloud run services describe educode-backend \
  --project=educode-platform-2025 \
  --region=us-central1 \
  --format="table(status.traffic.percent,status.latestReadyRevisionName,status.conditions)"
```

**Web Dashboard**: 
- https://console.cloud.google.com/run/detail/us-central1/educode-backend/metrics?project=educode-platform-2025

### 2. Database (Cloud SQL) - Real-Time Monitoring

#### Check Database Status
```bash
# Check Cloud SQL instance status
gcloud sql instances describe educode-db \
  --project=educode-platform-2025 \
  --format="value(state,databaseVersion,ipAddresses[0].ipAddress)"
```

#### Connect to Database and Query
```bash
# Start Cloud SQL Proxy
cloud-sql-proxy educode-platform-2025:us-central1:educode-db --port=5433 &

# Connect to database
PGPASSWORD=EduCode2025SecureDB! psql -h localhost -p 5433 -U postgres -d educode

# Inside psql, run queries:
# Check total problems
SELECT COUNT(*) as total_problems FROM problems;

# Check total users
SELECT COUNT(*) as total_users, role FROM users GROUP BY role;

# Check recent submissions
SELECT COUNT(*) as submissions_today 
FROM submissions 
WHERE "createdAt" > NOW() - INTERVAL '24 hours';

# Check database size
SELECT pg_size_pretty(pg_database_size('educode')) as db_size;
```

#### Quick Database Stats Script
```bash
# Create a quick stats script
cat > check-prod-db.sh << 'EOF'
#!/bin/bash
cloud-sql-proxy educode-platform-2025:us-central1:educode-db --port=5433 &
PROXY_PID=$!
sleep 3

PGPASSWORD=EduCode2025SecureDB! psql -h localhost -p 5433 -U postgres -d educode << SQL
SELECT 'Database Stats' as info;
SELECT COUNT(*) as problems FROM problems;
SELECT COUNT(*) as users FROM users;
SELECT COUNT(*) as submissions FROM submissions;
SELECT COUNT(*) as test_cases FROM test_cases;
SELECT pg_size_pretty(pg_database_size('educode')) as db_size;
SQL

kill $PROXY_PID
EOF

chmod +x check-prod-db.sh
./check-prod-db.sh
```

**Web Dashboard**: 
- https://console.cloud.google.com/sql/instances/educode-db/overview?project=educode-platform-2025

### 3. AI Service (Cloud Run) - Monitoring

```bash
# Check AI service health
curl -s https://educode-ai-162585155042.us-central1.run.app/health | jq .

# Stream logs
gcloud run services logs read educode-ai \
  --project=educode-platform-2025 \
  --region=us-central1 \
  --follow
```

**Web Dashboard**: 
- https://console.cloud.google.com/run/detail/us-central1/educode-ai/metrics?project=educode-platform-2025

### 4. Frontend (Vercel) - Monitoring

```bash
# List deployments
vercel ls

# Get deployment info
vercel inspect <deployment-url>

# View logs
vercel logs <deployment-url>
```

**Web Dashboard**: 
- Vercel Dashboard: https://vercel.com/dashboard
- Analytics: https://vercel.com/analytics

### 5. Unified Monitoring Dashboard Script

Create a comprehensive status checker:

```bash
cat > check-all-services.sh << 'EOF'
#!/bin/bash

echo "=========================================="
echo "🔍 EduCode Platform Status Check"
echo "=========================================="
echo ""

# 1. Backend Health
echo "📡 Backend API:"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://educode-backend-162585155042.us-central1.run.app/health)
if [ "$BACKEND_STATUS" = "200" ]; then
  echo "  ✅ Running (HTTP $BACKEND_STATUS)"
else
  echo "  ❌ Error (HTTP $BACKEND_STATUS)"
fi

# 2. AI Service Health
echo "🤖 AI Service:"
AI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://educode-ai-162585155042.us-central1.run.app/health)
if [ "$AI_STATUS" = "200" ]; then
  echo "  ✅ Running (HTTP $AI_STATUS)"
else
  echo "  ❌ Error (HTTP $AI_STATUS)"
fi

# 3. Database Status
echo "🗄️  Database:"
DB_STATE=$(gcloud sql instances describe educode-db --project=educode-platform-2025 --format="value(state)" 2>/dev/null)
if [ "$DB_STATE" = "RUNNABLE" ]; then
  echo "  ✅ Running ($DB_STATE)"
else
  echo "  ❌ Error ($DB_STATE)"
fi

# 4. Quick DB Stats
echo ""
echo "📊 Database Quick Stats:"
cloud-sql-proxy educode-platform-2025:us-central1:educode-db --port=5433 &>/dev/null &
PROXY_PID=$!
sleep 2

PGPASSWORD=EduCode2025SecureDB! psql -h localhost -p 5433 -U postgres -d educode -t -c "SELECT '  Problems: ' || COUNT(*) FROM problems;" 2>/dev/null
PGPASSWORD=EduCode2025SecureDB! psql -h localhost -p 5433 -U postgres -d educode -t -c "SELECT '  Users: ' || COUNT(*) FROM users;" 2>/dev/null
PGPASSWORD=EduCode2025SecureDB! psql -h localhost -p 5433 -U postgres -d educode -t -c "SELECT '  Submissions: ' || COUNT(*) FROM submissions;" 2>/dev/null

kill $PROXY_PID 2>/dev/null

echo ""
echo "=========================================="
EOF

chmod +x check-all-services.sh
```

Run it anytime: `./check-all-services.sh`

---

## 🔄 Normal Development & Deployment Workflow

### The Correct Workflow (Best Practice)

```
Local Development (Docker) → Test → Git Commit → Deploy to Production
```

### Step-by-Step Workflow

#### Phase 1: Local Development with Docker ✅

**Why Docker first?**
- Ensures environment parity (dev = production)
- Avoids "works on my machine" issues
- Tests database migrations locally
- Validates all service integrations

```bash
# 1. Make code changes
vim apps/backend/src/routes/newFeature.ts

# 2. Start local environment
docker compose -f docker-compose.dev.yml up

# 3. Test locally
curl http://localhost:3001/api/new-endpoint

# 4. Check logs
docker compose -f docker-compose.dev.yml logs -f backend

# 5. If database changes, test migration
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# 6. Verify everything works locally
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3001
# - AI Service: http://localhost:8000
```

#### Phase 2: Version Control

```bash
# 7. Commit working code
git add .
git commit -m "feat: add new feature"
git push origin main
```

#### Phase 3: Deploy to Production 🚀

**Order matters!**

1. **Database first** (if schema changed):
```bash
# Connect to production DB via proxy
cloud-sql-proxy educode-platform-2025:us-central1:educode-db --port=5433 &

# Apply migrations
export DATABASE_URL="postgresql://postgres:EduCode2025SecureDB!@localhost:5433/educode"
cd apps/backend
npx prisma migrate deploy
```

2. **Backend second**:
```bash
cd apps/backend
gcloud run deploy educode-backend \
  --source . \
  --project=educode-platform-2025 \
  --region=us-central1
```

3. **AI Service third** (if changed):
```bash
cd apps/ai-service
gcloud run deploy educode-ai \
  --source . \
  --project=educode-platform-2025 \
  --region=us-central1
```

4. **Frontend last**:
```bash
cd apps/frontend
vercel --prod
```

#### Phase 4: Verify Production

```bash
# Run status check
./check-all-services.sh

# Test key endpoints
curl https://educode-backend-162585155042.us-central1.run.app/api/problems
```

### Common Workflows

#### A. Bug Fix Workflow
```bash
# 1. Reproduce bug locally in Docker
docker compose -f docker-compose.dev.yml up

# 2. Fix code

# 3. Test fix locally

# 4. Commit
git commit -m "fix: resolve submission error handling"

# 5. Deploy backend only (if backend fix)
cd apps/backend
gcloud run deploy educode-backend --source . --project=educode-platform-2025 --region=us-central1

# 6. Verify fix in production
curl https://educode-backend-162585155042.us-central1.run.app/health
```

#### B. New Feature Workflow
```bash
# 1. Develop in Docker
docker compose -f docker-compose.dev.yml up

# 2. Add database migration if needed
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev --name add_new_feature

# 3. Test locally thoroughly

# 4. Commit
git commit -m "feat: add instructor analytics"

# 5. Deploy in order:
# - Database migrations
# - Backend
# - Frontend (if UI changes)

# 6. Monitor logs
gcloud run services logs read educode-backend --follow
```

#### C. Data Import Workflow
```bash
# 1. Test import locally first
docker compose -f docker-compose.dev.yml exec backend npx ts-node prisma/import-codenet.ts

# 2. Verify data locally
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d educode -c "SELECT COUNT(*) FROM problems;"

# 3. Once verified, import to production
cloud-sql-proxy educode-platform-2025:us-central1:educode-db --port=5433 &
export DATABASE_URL="postgresql://postgres:EduCode2025SecureDB!@localhost:5433/educode"
npx ts-node prisma/import-codenet.ts
```

---

## 🎯 Next Steps - Detailed Plan

### Task 1: Start Docker Properly ✅

```bash
cd /Users/sofi/Documents/Capstone/capstone/educode-adaptive-platform

# Check if Docker Desktop is running
docker ps || echo "Start Docker Desktop first!"

# Start all services
docker compose -f docker-compose.dev.yml up

# Verify in separate terminal
docker compose -f docker-compose.dev.yml ps

# Expected output:
# educode-postgres     Running   5432->5432
# educode-backend      Running   3001->3001
# educode-frontend     Running   3000->3000
# educode-ai-service   Running   8000->8000
# educode-redis        Running   6379->6379
```

**Access URLs**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/problems
- AI Service: http://localhost:8000/health
- Database: localhost:5432

### Task 2: Deploy Frontend to Vercel 📤

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd apps/frontend
vercel --prod

# Set environment variables (in Vercel dashboard or CLI):
vercel env add NEXT_PUBLIC_API_URL
# Value: https://educode-backend-162585155042.us-central1.run.app

vercel env add NEXT_PUBLIC_AI_SERVICE_URL
# Value: https://educode-ai-162585155042.us-central1.run.app

# Redeploy with env vars
vercel --prod
```

**Time Estimate**: 10-15 minutes

### Task 3: Import 600+ Problems from CodeNet 📚

#### Pre-Import Analysis

Let me analyze the CodeNet dataset first:

```bash
# Check the CODENET_IMPORT_GUIDE
cat apps/backend/prisma/CODENET_IMPORT_GUIDE.md
```

**CodeNet Dataset Details**:
- **Source**: IBM's Project CodeNet (4+ million submissions)
- **Format**: JSONL files with problem metadata and test cases
- **Available Subset**: `sample-200.jsonl` (284 KB) - contains 200 submissions

#### Estimate: Time & Space for 600+ Problems

**Current Available Data**:
- You have `sample-200.jsonl` (284 KB) with 200 submissions
- To get 600+ **problems** (not submissions), you'd need to:
  1. Download full CodeNet dataset, OR
  2. Use existing `sample-200.jsonl` and extract unique problems

**Option 1: Use Existing sample-200.jsonl**
```bash
# Estimate unique problems in sample-200.jsonl
cd apps/backend/prisma
wc -l data/sample-200.jsonl
# Output: 200 lines = 200 submissions

# Each submission links to a problem
# Estimate: ~50-100 unique problems from 200 submissions
```

**Time**: 2-5 minutes  
**Space**: 284 KB (already have it)  
**Problems**: ~50-100 unique problems

**Option 2: Download Full CodeNet Dataset**

**Dataset Size**: ~13 GB (compressed), ~60 GB (uncompressed)  
**Problems**: 4,000+ unique problems  
**Submissions**: 14+ million code submissions  

**Download Time**: 
- Fast connection (100 Mbps): ~20-30 minutes
- Medium connection (50 Mbps): ~45-60 minutes

**Processing Time**: 
- Parse 4,000 problems: ~10-15 minutes
- Import to database: ~20-30 minutes
- **Total**: ~1-2 hours

**Disk Space Needed**:
- Download: 13 GB
- Extracted: 60 GB
- Database: ~500 MB - 1 GB
- **Total**: ~75 GB free space needed

#### Recommended Approach: Hybrid Solution

**Phase 1: Quick Win (Use sample-200.jsonl)** - 5 minutes
```bash
# Extract unique problems from existing sample
cd apps/backend
npx ts-node prisma/extract-problems-from-sample.ts
# Result: ~50-100 problems
```

**Phase 2: Later Enhancement (Full CodeNet)** - 2 hours
```bash
# Download during off-hours
# Import 4,000+ problems
```

#### Create Extract Script

Let me create a quick script to extract problems from the existing sample:

```bash
cat > apps/backend/prisma/extract-problems-from-sample.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CodeNetSubmission {
  problem_id: string;
  language: string;
  submission_id: string;
  cpu_time: number;
  memory: number;
  status: string;
  code_size: number;
}

async function extractProblems() {
  const samplePath = path.join(__dirname, 'data', 'sample-200.jsonl');
  const content = fs.readFileSync(samplePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  const problemMap = new Map<string, any>();
  
  console.log(`📖 Reading ${lines.length} submissions...`);
  
  lines.forEach((line, index) => {
    try {
      const submission: CodeNetSubmission = JSON.parse(line);
      
      if (!problemMap.has(submission.problem_id)) {
        problemMap.set(submission.problem_id, {
          id: submission.problem_id,
          submissions: [],
          languages: new Set<string>(),
          statuses: new Set<string>()
        });
      }
      
      const problem = problemMap.get(submission.problem_id)!;
      problem.submissions.push(submission);
      problem.languages.add(submission.language);
      problem.statuses.add(submission.status);
    } catch (e) {
      console.error(`Error parsing line ${index + 1}:`, e);
    }
  });
  
  console.log(`\n📊 Found ${problemMap.size} unique problems\n`);
  
  let created = 0;
  
  for (const [problemId, data] of problemMap.entries()) {
    const acceptedSubmissions = data.submissions.filter((s: CodeNetSubmission) => s.status === 'Accepted');
    const difficulty = acceptedSubmissions.length / data.submissions.length > 0.7 ? 'easy' : 
                       acceptedSubmissions.length / data.submissions.length > 0.4 ? 'medium' : 'hard';
    
    try {
      await prisma.problem.create({
        data: {
          title: `CodeNet Problem ${problemId}`,
          description: `Problem from IBM Project CodeNet dataset.\n\nProblem ID: ${problemId}\nLanguages: ${Array.from(data.languages).join(', ')}\nTotal Submissions: ${data.submissions.length}\nAcceptance Rate: ${(acceptedSubmissions.length / data.submissions.length * 100).toFixed(1)}%`,
          difficulty,
          inputFormat: 'See problem description',
          outputFormat: 'See problem description',
          constraints: [`Time Limit: 2 seconds`, `Memory Limit: 256 MB`],
          topics: ['Algorithms', 'Data Structures'],
          knowledgeComponents: ['problem-solving'],
          timeLimit: 2,
          memoryLimit: 256,
          tags: ['codenet', difficulty],
          testCases: {
            create: [
              {
                input: 'Sample input',
                output: 'Sample output',
                isHidden: false,
                points: 100
              }
            ]
          }
        }
      });
      created++;
      console.log(`✅ Created: ${problemId} (${difficulty})`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`⏭️  Skipped: ${problemId} (already exists)`);
      } else {
        console.error(`❌ Error creating ${problemId}:`, e.message);
      }
    }
  }
  
  console.log(`\n✅ Import complete! Created ${created} problems`);
}

extractProblems()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
EOF
```

Now run it:

```bash
# Test locally first
docker compose -f docker-compose.dev.yml exec backend npx ts-node prisma/extract-problems-from-sample.ts

# Check results
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d educode -c "SELECT COUNT(*) FROM problems;"
```

**Expected Result**: ~50-100 problems imported

---

## 📋 Summary Checklist

### Before Starting
- [ ] Docker Desktop running
- [ ] Vercel CLI installed (`npm i -g vercel`)
- [ ] GCP CLI authenticated (`gcloud auth list`)
- [ ] Cloud SQL Proxy installed

### Task 1: Local Docker
- [ ] `docker compose -f docker-compose.dev.yml up`
- [ ] Verify all 5 services running
- [ ] Test at http://localhost:3000

### Task 2: Deploy Frontend
- [ ] `cd apps/frontend && vercel --prod`
- [ ] Set environment variables
- [ ] Test production URL

### Task 3: Import Problems
- [ ] Quick: Run extract script (5 min, ~50-100 problems)
- [ ] Full: Download CodeNet (2 hours, 4000+ problems)

### Task 4: Monitor
- [ ] Create `check-all-services.sh`
- [ ] Run status check
- [ ] Verify production database

---

**Time Estimates**:
- Docker setup: 5 minutes
- Vercel deploy: 15 minutes
- Quick problem import: 5 minutes
- Full CodeNet: 2 hours (optional)
- **Total**: ~25 minutes (or ~2.5 hours with full CodeNet)
