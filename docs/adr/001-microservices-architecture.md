# ADR 001: Microservices Architecture

## Status
Accepted

## Date
2024-11-25

## Context
We need to build an adaptive learning platform that handles code execution, AI-powered error classification, and real-time student progress tracking. The system requires different technologies (TypeScript, Python) and needs to scale independently based on workload.

## Decision
We will adopt a microservices architecture with three core services:

1. **Frontend Service** (Next.js/React)
   - Student and instructor interfaces
   - Real-time visualization
   - Deployed on Vercel

2. **Backend Service** (Node.js/Express/TypeScript)
   - REST API for business logic
   - Authentication and authorization
   - Database operations (PostgreSQL + Prisma)
   - Code execution orchestration
   - Deployed on Google Cloud Run

3. **AI Service** (Python/FastAPI)
   - Error classification using LLM
   - Educational taxonomy mapping (IEEE 1044, Zehetmeier, Bloom's)
   - Deployed on Google Cloud Run

## Consequences

### Positive
- **Independent Scaling**: AI service scales separately during high classification load
- **Technology Flexibility**: Use Python for AI/ML, TypeScript for business logic
- **Fault Isolation**: AI service failures don't crash the main backend
- **Deployment Independence**: Deploy services separately without full system restart
- **Team Productivity**: Different teams can work on different services

### Negative
- **Increased Complexity**: Network calls between services add latency
- **Distributed Debugging**: Harder to trace errors across services
- **Data Consistency**: Need to manage eventual consistency
- **Infrastructure Overhead**: More services to monitor and maintain

### Mitigations
- Use Cloud Run's automatic scaling and health checks
- Implement comprehensive logging with request tracing
- Design for idempotency in AI service calls
- Use environment variables for service discovery
