# EduCode Adaptive Platform - Architecture Documentation

This directory contains comprehensive architecture documentation for the EduCode Adaptive Learning Platform, including Architecture Decision Records (ADRs) and UML diagrams.

## 📋 Table of Contents

- [Architecture Decision Records (ADRs)](#architecture-decision-records-adrs)
- [UML Diagrams](#uml-diagrams)
- [Quick Links](#quick-links)

---

## 📝 Architecture Decision Records (ADRs)

ADRs document significant architectural decisions made during the development of the platform. Each ADR follows a standard format: Context, Decision, Consequences, and Alternatives Considered.

### Design Decisions

| ADR | Title | Date | Status | Key Topics |
|-----|-------|------|--------|------------|
| [001](adr/001-microservices-architecture.md) | Microservices Architecture | 2024-11-25 | ✅ Accepted | Frontend (Vercel), Backend (Cloud Run), AI Service separation |
| [002](adr/002-bayesian-knowledge-tracing.md) | Bayesian Knowledge Tracing | 2024-11-20 | ✅ Accepted | BKT model, mastery calculation, pKnown updates |
| [003](adr/003-judge0-code-execution.md) | Judge0 for Secure Code Execution | 2024-11-18 | ✅ Accepted | Sandboxed execution, multi-language support |
| [004](adr/004-educational-error-taxonomy.md) | Multi-Dimensional Error Classification | 2024-12-01 | ✅ Accepted | IEEE 1044, Zehetmeier, Bloom's taxonomy |
| [005](adr/005-google-cloud-platform-deployment.md) | Google Cloud Platform Deployment | 2024-11-15 | ✅ Accepted | Vercel + GCP hybrid, Cloud Run, Cloud SQL |
| [006](adr/006-knowledge-component-sync.md) | Automatic Knowledge Component Sync | 2024-12-09 | ✅ Accepted | Problem-KC bidirectional sync, BKT fix |

### Reading Guide

**New to the project?** Start with:
1. [ADR 001](adr/001-microservices-architecture.md) - System architecture overview
2. [ADR 005](adr/005-google-cloud-platform-deployment.md) - Deployment infrastructure
3. [Deployment Diagram](uml/deployment-diagram.md) - Visual architecture

**Understanding student progress tracking?** Read:
1. [ADR 002](adr/002-bayesian-knowledge-tracing.md) - How mastery is calculated
2. [ADR 006](adr/006-knowledge-component-sync.md) - How KCs are synced
3. [Sequence Diagram](uml/sequence-diagram-submission.md) - See BKT update flow

**Understanding error classification?** Read:
1. [ADR 004](adr/004-educational-error-taxonomy.md) - Error taxonomy explained
2. [Class Diagram](uml/class-diagram.md) - See ErrorSignature model

**Working on code execution?** Read:
1. [ADR 003](adr/003-judge0-code-execution.md) - Judge0 integration
2. [Sequence Diagram](uml/sequence-diagram-submission.md) - Full submission flow

---

## 🎨 UML Diagrams

UML diagrams provide visual representations of the system's structure and behavior. All diagrams use PlantUML format and include detailed descriptions.

### Structural Diagrams

| Diagram | Purpose | Key Elements | View |
|---------|---------|--------------|------|
| [Deployment Diagram](uml/deployment-diagram.md) | Infrastructure and deployment architecture | Vercel, Cloud Run, Cloud SQL, Judge0 | [View](uml/deployment-diagram.md) |
| [Class Diagram](uml/class-diagram.md) | Core domain models and relationships | User, Problem, Submission, BKTState, KnowledgeComponent | [View](uml/class-diagram.md) |
| [Package Diagram](uml/package-diagram.md) | Module organization and dependencies | Frontend packages, Backend routes, AI service | [View](uml/package-diagram.md) |

### Behavioral Diagrams

| Diagram | Purpose | Key Scenarios | View |
|---------|---------|---------------|------|
| [Use Case Diagram](uml/use-case-diagram.md) | User interactions and system features | Student solving problems, instructor analytics | [View](uml/use-case-diagram.md) |
| [Sequence Diagram: Submission](uml/sequence-diagram-submission.md) | Code submission end-to-end flow | Authentication → Execution → Grading → BKT Update | [View](uml/sequence-diagram-submission.md) |

### Rendering PlantUML Diagrams

**Option 1: VS Code Extension**
1. Install "PlantUML" extension
2. Open any `.md` file with PlantUML code blocks
3. Press `Alt+D` to preview

**Option 2: Online Viewer**
1. Copy PlantUML code from markdown files
2. Paste into [PlantUML Online Editor](https://www.plantuml.com/plantuml/uml/)
3. View rendered diagram

**Option 3: Command Line**
```bash
# Install PlantUML
brew install plantuml

# Generate PNG from markdown
plantuml docs/uml/deployment-diagram.md
```

---

## 🔗 Quick Links

### Architecture Documentation
- [ADR Index](adr/) - All architecture decisions
- [UML Index](uml/) - All diagrams
- [Deployment Plan](../DEPLOYMENT_PLAN_GCP.md) - Step-by-step deployment guide
- [Development Log](../DEVELOPMENT_LOG.md) - Historical development notes

### Technical Documentation
- [Database Schema](../apps/backend/prisma/schema.prisma) - Prisma schema
- [API Routes](../apps/backend/src/routes/) - Backend endpoints
- [Frontend Components](../apps/frontend/components/) - React components
- [Error Classifier](../apps/ai-service/error_classifier.py) - AI service logic

### User Documentation
- [README](../README.md) - Project overview and setup
- [Workflow Reflection](../WORKFLOW_REFLECTION_AND_STAR_MODEL.md) - Project methodology

---

## 📊 Architecture at a Glance

### System Architecture
```
┌─────────────────────────────────────────────────────┐
│               Students & Instructors                 │
└─────────────────┬───────────────────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────────────┐
│              Vercel Edge Network                     │
│           Frontend (Next.js 14)                      │
└─────────────────┬───────────────────────────────────┘
                  │ REST API
                  ▼
┌─────────────────────────────────────────────────────┐
│         Google Cloud Platform (us-central1)         │
│                                                      │
│  ┌──────────────┐      ┌──────────────┐            │
│  │ Cloud Run    │      │ Cloud Run    │            │
│  │ Backend      │─────▶│ AI Service   │            │
│  │ (Node.js)    │      │ (Python)     │            │
│  └──────┬───────┘      └──────────────┘            │
│         │                                            │
│         │ Prisma ORM                                │
│         ▼                                            │
│  ┌──────────────┐                                   │
│  │ Cloud SQL    │                                   │
│  │ PostgreSQL   │                                   │
│  └──────────────┘                                   │
└─────────────────────────────────────────────────────┘
         │
         │ HTTP
         ▼
┌──────────────────┐
│ Judge0 API       │
│ (Code Execution) │
└──────────────────┘
```

### Data Flow: Student Submission
```
1. Student writes code in editor (Frontend)
2. Submit → POST /api/code-execution (Backend)
3. Execute → Judge0 API (5 test cases)
4. Grade → Compare outputs (Backend)
5. Classify errors → AI Service (if failed)
6. Update mastery → BKT calculation (Backend)
7. Store → PostgreSQL (Backend)
8. Display results → Frontend
```

### Key Technologies
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **AI Service**: Python, FastAPI, OpenAI API
- **Database**: PostgreSQL 14
- **Infrastructure**: Google Cloud Run, Cloud SQL, Vercel
- **External Services**: Judge0 (code execution), OpenAI (error classification)

---

## 📈 Metrics and Monitoring

### Performance Targets
- **Page Load**: < 2s (global edge CDN)
- **API Response**: < 500ms (95th percentile)
- **Code Execution**: 3-12s (depends on test case count)
- **Error Classification**: 1-3s (LLM inference)

### Availability Targets
- **Frontend**: 99.9% (Vercel SLA)
- **Backend**: 99.5% (Cloud Run auto-scaling)
- **Database**: 99.95% (Cloud SQL managed)

### Cost Estimates (Monthly)
- **Cloud Run**: ~$8 (backend + AI service)
- **Cloud SQL**: ~$25 (db-f1-micro instance)
- **Vercel**: $0 (free hobby tier)
- **Judge0**: $0-50 (depends on submission volume)
- **OpenAI**: $10-30 (depends on error count)
- **Total**: ~$43-113/month

---

## 🛠️ Contributing to Documentation

### Adding a New ADR
1. Create `docs/adr/XXX-title.md`
2. Follow template:
   ```markdown
   # ADR XXX: Title
   ## Status
   ## Date
   ## Context
   ## Decision
   ## Consequences
   ## Alternatives Considered
   ```
3. Update this README index
4. Reference in related diagrams

### Adding a New Diagram
1. Create `docs/uml/diagram-name.md`
2. Include PlantUML code block
3. Add description and key elements
4. Update this README index
5. Cross-reference with ADRs

### Best Practices
- **ADRs**: Write when making significant architectural changes
- **Diagrams**: Update when structure/flow changes
- **Cross-reference**: Link ADRs to diagrams and code
- **Keep current**: Update docs when code changes

---

## 📞 Contact

For questions about architecture decisions or diagrams:
- Review existing ADRs first
- Check related diagrams
- Consult development team
- Create GitHub issue for clarifications

---

**Last Updated**: December 9, 2025  
**Version**: 1.0  
**Maintainers**: Development Team
