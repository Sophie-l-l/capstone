# ADR 005: Google Cloud Platform for Deployment

## Status
Accepted

## Date
2024-11-15

## Context
We need to deploy a microservices-based platform with:
- Frontend (Next.js) requiring edge caching
- Backend (Node.js) requiring auto-scaling
- AI Service (Python) requiring compute resources
- PostgreSQL database requiring high availability
- CI/CD automation
- Low latency for educational use case

## Decision
We will use a **hybrid deployment model**:

### Frontend: Vercel
- **Why**: Specialized Next.js hosting with edge CDN
- **Features**: Auto-deploy from GitHub, preview environments
- **Region**: Global edge network

### Backend + AI Service: Google Cloud Run
- **Why**: Serverless containers with auto-scaling
- **Features**: 
  - Scale to zero when idle
  - Pay per request
  - Automatic HTTPS
  - Container flexibility
- **Region**: us-central1

### Database: Google Cloud SQL (PostgreSQL)
- **Why**: Managed database with backups
- **Features**:
  - Automated backups
  - Point-in-time recovery
  - High availability option
  - Private IP for security
- **Region**: us-central1 (same as Cloud Run)

### CI/CD: Google Cloud Build
- **Why**: Native GCP integration
- **Features**:
  - Docker builds
  - Automatic deployments
  - Triggered by GitHub commits
  - Secret management

### Secrets: Google Secret Manager
- **Why**: Centralized secret storage
- **Secrets Stored**:
  - DATABASE_URL
  - JWT_SECRET
  - JUDGE0_API_KEY
  - AI service credentials

## Alternatives Considered

### 1. AWS (All Services on AWS)
- **Rejected**: Higher complexity for our scale
- **Why**: 
  - ECS/EKS more complex than Cloud Run
  - RDS similar to Cloud SQL but more expensive
  - Lambda cold starts problematic for Node.js

### 2. Heroku (Full Platform)
- **Rejected**: Limited free tier, expensive scaling
- **Why**: Cloud Run more cost-effective at scale

### 3. Self-Managed Kubernetes
- **Rejected**: Too much operational overhead
- **Why**: We need focus on features, not infrastructure

### 4. Frontend on Netlify
- **Rejected**: Vercel better for Next.js
- **Why**: Vercel created Next.js, optimized hosting

## Consequences

### Positive
- **Auto-Scaling**: Cloud Run scales 0→1000 instances automatically
- **Cost-Effective**: Pay only for actual usage, not idle time
- **Low Latency**: All GCP resources in same region (us-central1)
- **Developer Experience**: Vercel provides excellent DX for frontend
- **Reliability**: Managed services with SLA guarantees
- **Security**: Private networking, secret management, IAM

### Negative
- **Vendor Lock-in**: Tied to GCP for backend/database
- **Cold Starts**: Cloud Run has ~1s cold start (rare after warmup)
- **Complexity**: Managing two platforms (Vercel + GCP)
- **Debugging**: Distributed logs across platforms

### Mitigations
- **Portability**: Docker containers can move to other cloud providers
- **Min Instances**: Set Cloud Run min instances to 1 during peak hours
- **Unified Monitoring**: Use Google Cloud Logging for GCP, Vercel logs for frontend
- **Documentation**: Maintain deployment runbooks

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel Edge Network                  │
│                    (Global CDN)                          │
│                                                          │
│   ┌──────────────────────────────────────────┐          │
│   │     Frontend (Next.js)                   │          │
│   │     - Student Dashboard                  │          │
│   │     - Instructor Portal                  │          │
│   │     - Code Editor                        │          │
│   └──────────────────────────────────────────┘          │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────────────────┐
│         Google Cloud Platform (us-central1)             │
│                                                          │
│  ┌────────────────────┐      ┌─────────────────────┐   │
│  │ Cloud Run          │      │ Cloud Run           │   │
│  │ Backend Service    │──────│ AI Service          │   │
│  │ (Node.js/Express)  │ HTTP │ (Python/FastAPI)    │   │
│  │ - Auth/Auth        │      │ - Error Classify    │   │
│  │ - Problem CRUD     │      │ - LLM Integration   │   │
│  │ - Code Execution   │      └─────────────────────┘   │
│  │ - BKT Updates      │                                │
│  └─────────┬──────────┘                                │
│            │                                            │
│            │ Private IP                                 │
│            ▼                                            │
│  ┌─────────────────────┐     ┌──────────────────┐     │
│  │ Cloud SQL           │     │ Secret Manager   │     │
│  │ (PostgreSQL)        │     │ - DATABASE_URL   │     │
│  │ - Auto Backups      │     │ - JWT_SECRET     │     │
│  │ - High Availability │     │ - JUDGE0_API_KEY │     │
│  └─────────────────────┘     └──────────────────┘     │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │ Cloud Build (CI/CD)                          │     │
│  │ - Triggered by GitHub commits                │     │
│  │ - Builds Docker images                       │     │
│  │ - Deploys to Cloud Run                       │     │
│  └──────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                  │
                  │ API Call
                  ▼
         ┌──────────────────┐
         │ Judge0 API       │
         │ (RapidAPI)       │
         │ - Code Execution │
         └──────────────────┘
```

## Deployment Process

### Backend/AI Service
```bash
# Automated via Cloud Build
git push origin main
  ↓
Cloud Build triggered
  ↓
Build Docker image
  ↓
Deploy to Cloud Run
  ↓
New revision available (~4 min)
```

### Frontend
```bash
# Automated via Vercel
git push origin main
  ↓
Vercel build triggered
  ↓
Deploy to edge network
  ↓
Live in ~2 minutes
```

### Database Migrations
```bash
# Manual via Cloud SQL Proxy
./cloud-sql-proxy --port 5432 educode-db
npx prisma migrate deploy
```

## Cost Analysis (Estimated Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| Cloud Run (Backend) | 100K requests | $5 |
| Cloud Run (AI) | 50K requests | $3 |
| Cloud SQL (db-f1-micro) | 24/7 uptime | $25 |
| Cloud Build | 50 builds/month | $0 (free tier) |
| Secret Manager | 10 secrets | $0.06 |
| Vercel | Unlimited bandwidth | $0 (free hobby) |
| **Total** | | **~$33/month** |

## Security Configuration

### Network Security
- Cloud SQL: Private IP only, no public access
- Cloud Run: HTTPS only, IAM authentication
- Vercel: Automatic HTTPS, DDoS protection

### Secret Management
- All secrets in Secret Manager
- Environment variables injected at runtime
- No secrets in code or Git

### IAM Roles
- Cloud Run service accounts: Minimal permissions
- Cloud Build: Deploy-only access
- Developers: Read-only production access
