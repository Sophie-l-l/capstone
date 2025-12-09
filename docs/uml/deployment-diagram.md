# Deployment Diagram - EduCode Adaptive Platform

```plantuml
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Deployment.puml

LAYOUT_WITH_LEGEND()

title Deployment Diagram - EduCode Adaptive Learning Platform

Person(student, "Student", "Uses platform to solve coding problems")
Person(instructor, "Instructor", "Creates problems and monitors progress")

Deployment_Node(vercel, "Vercel Edge Network", "Global CDN") {
    Container(frontend, "Frontend Application", "Next.js 14, React, TypeScript", "Student & instructor user interfaces")
}

Deployment_Node(gcp, "Google Cloud Platform - us-central1", "Cloud Infrastructure") {
    
    Deployment_Node(cloudrun_backend, "Cloud Run", "Serverless Container Platform") {
        Container(backend, "Backend Service", "Node.js, Express, TypeScript", "REST API, authentication, business logic")
    }
    
    Deployment_Node(cloudrun_ai, "Cloud Run", "Serverless Container Platform") {
        Container(ai_service, "AI Service", "Python, FastAPI", "Error classification using LLM")
    }
    
    Deployment_Node(cloudsql, "Cloud SQL", "Managed Database") {
        ContainerDb(database, "PostgreSQL", "PostgreSQL 14", "Stores users, problems, submissions, BKT states")
    }
    
    Deployment_Node(secrets, "Secret Manager", "Secret Storage") {
        Container(secret_mgr, "Secrets", "Secret Manager", "DATABASE_URL, JWT_SECRET, API keys")
    }
    
    Deployment_Node(build, "Cloud Build", "CI/CD Pipeline") {
        Container(cicd, "Build Pipeline", "Cloud Build", "Automated Docker builds and deployments")
    }
}

Deployment_Node(rapidapi, "RapidAPI", "External API Service") {
    Container(judge0, "Judge0 CE", "Code Execution Engine", "Sandboxed code execution for 40+ languages")
}

Deployment_Node(openai, "OpenAI", "External AI Service") {
    Container(gemini, "Gemini API", "GPT-4", "Large language model for error classification")
}

Deployment_Node(github, "GitHub", "Version Control") {
    Container(repo, "Source Repository", "Git", "Source code and version control")
}

Rel(student, frontend, "Uses", "HTTPS")
Rel(instructor, frontend, "Uses", "HTTPS")

Rel(frontend, backend, "API calls", "HTTPS/JSON")
Rel(backend, ai_service, "Classify error", "HTTP/JSON")
Rel(backend, database, "Read/Write", "PostgreSQL Protocol / Private IP")
Rel(backend, judge0, "Execute code", "HTTPS/REST")
Rel(backend, secret_mgr, "Fetch secrets", "Secret Manager API")
Rel(ai_service, database, "Read problems", "PostgreSQL Protocol / Private IP")
Rel(ai_service, gemini, "LLM inference", "HTTPS/REST")

Rel(repo, cicd, "Trigger on commit", "Webhook")
Rel(cicd, cloudrun_backend, "Deploy", "Cloud Run API")
Rel(cicd, cloudrun_ai, "Deploy", "Cloud Run API")

SHOW_LEGEND()
@enduml
```

## Deployment Architecture Overview

### Edge Layer (Vercel)
- **Frontend**: Next.js application served from global edge network
- **Purpose**: Low-latency page loads, static site generation, API routes
- **Auto-scaling**: Handled by Vercel
- **Deployment**: Automatic on `git push` to main branch

### Application Layer (Google Cloud Run)
- **Backend Service**: 
  - Container: `gcr.io/educode-platform/backend`
  - Port: 8080
  - Auto-scaling: 0-100 instances
  - CPU: 1 vCPU, Memory: 512MB
  - Concurrency: 80 requests/instance
  
- **AI Service**:
  - Container: `gcr.io/educode-platform/ai-service`
  - Port: 8000
  - Auto-scaling: 0-50 instances
  - CPU: 2 vCPU, Memory: 1GB (for LLM operations)
  - Concurrency: 10 requests/instance

### Data Layer (Google Cloud SQL)
- **Instance**: `educode-db` (db-f1-micro)
- **Engine**: PostgreSQL 14
- **Storage**: 10GB SSD
- **Backups**: Automated daily backups, 7-day retention
- **High Availability**: Optional (not enabled in dev)
- **Network**: Private IP only (no public internet access)

### Secret Management
- **DATABASE_URL**: PostgreSQL connection string
- **JWT_SECRET**: Token signing key
- **JUDGE0_API_KEY**: RapidAPI authentication
- **AI_SERVICE_URL**: Internal service URL

### External Dependencies
- **Judge0**: Code execution via RapidAPI
- **GitHub**: Source control and CI/CD trigger

### Network Flow
```
Internet → Vercel Edge → Cloud Run (Backend) → Cloud SQL
                              ↓
                         Cloud Run (AI Service)
                              ↓
                         Judge0 API (RapidAPI)
```

### Security Boundaries
- All traffic encrypted with HTTPS/TLS
- Cloud SQL accessible only via private IP
- Cloud Run services use service accounts with least privilege
- Secrets never stored in code or environment variables
