# Package Diagram - EduCode Adaptive Platform

```plantuml
@startuml
!theme plain

title Package Diagram - EduCode Adaptive Learning Platform

package "Frontend (Vercel)" <<Node>> {
    package "app" {
        package "dashboard" {
            [student/page.tsx]
            [instructor/page.tsx]
        }
        package "problems" {
            [page.tsx]
            [[id]/page.tsx]
        }
        package "create-problem" {
            [page.tsx]
        }
        package "metrics" {
            [student/page.tsx]
            [submission/page.tsx]
        }
    }
    
    package "components" {
        [code-editor.tsx]
        [problems-table.tsx]
        [skill-mastery-chart.tsx]
        [at-risk-students.tsx]
        [dashboard-nav.tsx]
    }
    
    package "lib" {
        [api.ts]
        [utils.ts]
    }
}

package "Backend (Cloud Run)" <<Node>> {
    package "routes" {
        [auth.ts]
        [problems.ts]
        [codeExecution.ts]
        [submissions.ts]
        [classes.ts]
        [problemSets.ts]
        [studentDashboard.ts]
        [instructorDashboard.ts]
    }
    
    package "services" {
        [bkt.service.ts]
        [judge0.service.ts]
        [ai.service.ts]
    }
    
    package "middleware" {
        [authenticateToken.ts]
        [errorHandler.ts]
    }
    
    package "prisma" {
        [schema.prisma]
        [migrations/]
    }
    
    package "scripts" {
        [sync-knowledge-components.ts]
        [seed-sample-data.ts]
    }
}

package "AI Service (Cloud Run)" <<Node>> {
    package "ai-service" {
        [main.py]
        [llm_client.py]
        [error_classifier.py]
        [error_types.py]
    }
}

package "Shared Types" <<Node>> {
    package "packages/shared-types" {
        [index.ts]
    }
}

package "External Services" <<Cloud>> {
    [Judge0 API]
    [OpenAI API]
}

database "Cloud SQL" {
    [PostgreSQL]
}

' Frontend dependencies
[app] ..> [components] : uses
[app] ..> [lib] : uses
[lib] --> [routes] : HTTP/REST

' Backend dependencies
[routes] ..> [services] : uses
[routes] ..> [middleware] : uses
[routes] ..> [prisma] : uses
[services] --> [External Services] : API calls
[prisma] --> [PostgreSQL] : Prisma ORM

' AI Service dependencies
[ai-service] ..> [error_types.py] : uses
[llm_client.py] --> [OpenAI API] : API calls
[ai-service] --> [PostgreSQL] : Read problems

' Shared types
[Frontend (Vercel)] ..> [Shared Types] : imports
[Backend (Cloud Run)] ..> [Shared Types] : imports
[AI Service (Cloud Run)] ..> [error_types.py] : Python version

' Service communication
[services] --> [ai-service] : HTTP/REST
[routes] --> [ai-service] : Classify errors

@enduml
```

## Package Structure and Responsibilities

### Frontend (Vercel) - Next.js Application

#### `app/` - Application Pages
- **Purpose**: Next.js 14 App Router pages
- **Key Files**:
  - `dashboard/student/page.tsx`: Student overview with mastery charts
  - `dashboard/instructor/page.tsx`: Instructor analytics and class management
  - `problems/page.tsx`: Problem browsing with filters
  - `problems/[id]/page.tsx`: Individual problem with code editor
  - `create-problem/page.tsx`: Multi-step problem creation form
  - `metrics/student/page.tsx`: Detailed student progress metrics
  - `metrics/submission/[id]/page.tsx`: Individual submission details
- **Dependencies**: components, lib

#### `components/` - React Components
- **Purpose**: Reusable UI components
- **Key Files**:
  - `code-editor.tsx`: Monaco-based code editor with syntax highlighting
  - `problems-table.tsx`: Filterable table of problems with pagination
  - `skill-mastery-chart.tsx`: Recharts visualization of KC mastery
  - `at-risk-students.tsx`: List of students below mastery threshold
  - `dashboard-nav.tsx`: Role-based navigation menu
  - `protected-route.tsx`: Authentication wrapper component
- **Dependencies**: lib (for API calls)

#### `lib/` - Utilities and API Client
- **Purpose**: Shared utility functions and API client
- **Key Files**:
  - `api.ts`: Typed API client with methods for all endpoints
  - `utils.ts`: Helper functions (date formatting, color mapping, etc.)
- **Dependencies**: Backend REST API

---

### Backend (Cloud Run) - Node.js/Express API

#### `routes/` - REST API Endpoints
- **Purpose**: HTTP request handlers
- **Key Files**:
  - `auth.ts`: POST /register, /login
  - `problems.ts`: CRUD operations on problems
  - `codeExecution.ts`: POST /execute - Submit and grade code
  - `submissions.ts`: GET /submissions - Student submission history
  - `classes.ts`: Class CRUD operations
  - `problemSets.ts`: Assignment management
  - `studentDashboard.ts`: GET /dashboard/student/:id
  - `instructorDashboard.ts`: GET /dashboard/instructor/:id
- **Dependencies**: services, middleware, prisma

#### `services/` - Business Logic
- **Purpose**: Encapsulate domain logic
- **Key Files**:
  - `bkt.service.ts`: Bayesian Knowledge Tracing calculations
  - `judge0.service.ts`: Code execution via Judge0 API
  - `ai.service.ts`: Error classification via AI service
- **Dependencies**: External APIs (Judge0, AI Service)

#### `middleware/` - Express Middleware
- **Purpose**: Request/response processing
- **Key Files**:
  - `authenticateToken.ts`: JWT validation and user extraction
  - `errorHandler.ts`: Centralized error handling
- **Dependencies**: None (pure functions)

#### `prisma/` - Database Schema and Migrations
- **Purpose**: Database ORM and schema management
- **Key Files**:
  - `schema.prisma`: Database schema definition
  - `migrations/`: SQL migration history
- **Dependencies**: PostgreSQL

#### `scripts/` - Operational Scripts
- **Purpose**: Data management and maintenance
- **Key Files**:
  - `sync-knowledge-components.ts`: Backfill KCs from problems
  - `seed-sample-data.ts`: Populate dev/test database
- **Dependencies**: prisma

---

### AI Service (Cloud Run) - Python/FastAPI

#### `ai-service/` - Error Classification Service
- **Purpose**: LLM-powered error analysis
- **Key Files**:
  - `main.py`: FastAPI application with /classify endpoint
  - `llm_client.py`: OpenAI API integration with prompt engineering
  - `error_classifier.py`: Error pattern matching and classification logic
  - `error_types.py`: Enum definitions (Surface, Cognitive, Bloom)
- **Dependencies**: OpenAI API, PostgreSQL (read-only)

---

### Shared Types - Cross-Language Type Definitions

#### `packages/shared-types/`
- **Purpose**: Ensure type consistency across services
- **Key Files**:
  - `index.ts`: TypeScript enums and interfaces
  - Includes: `SurfaceErrorCategory`, `CognitiveCause`, `BloomLevel`
- **Python Equivalent**: `ai-service/error_types.py`
- **Dependencies**: None (pure types)

---

### External Services

#### Judge0 API (RapidAPI)
- **Purpose**: Sandboxed code execution
- **Used By**: `judge0.service.ts`
- **Endpoints**: POST /submissions, GET /submissions/:token

#### OpenAI API
- **Purpose**: LLM for error classification
- **Used By**: `llm_client.py`
- **Model**: GPT-3.5-turbo

---

### Database - Cloud SQL (PostgreSQL)

#### PostgreSQL Instance
- **Purpose**: Persistent data storage
- **Accessed By**: 
  - Backend (via Prisma ORM) - Read/Write
  - AI Service (via SQLAlchemy) - Read-only
- **Schema**: Defined in `prisma/schema.prisma`

---

## Dependency Flow

### Layer Architecture
```
Presentation Layer (Frontend)
        ↓
Application Layer (Backend Routes)
        ↓
Domain Layer (Services)
        ↓
Data Layer (Prisma/PostgreSQL)
```

### Service Communication
```
Frontend → Backend (REST)
Backend → AI Service (HTTP)
Backend → Judge0 (HTTP)
Backend → PostgreSQL (Prisma)
AI Service → PostgreSQL (SQLAlchemy)
AI Service → OpenAI (HTTP)
```

### Type Safety Flow
```
Shared Types (TypeScript)
    ↓
Frontend imports → Type-safe API calls
    ↓
Backend imports → Type-safe validation
    ↓
Python equivalent → Enum validation
```

## Module Cohesion

### High Cohesion Packages
- `services/bkt.service.ts`: Single responsibility (BKT calculations)
- `ai-service/error_classifier.py`: Single responsibility (error classification)
- `middleware/authenticateToken.ts`: Single responsibility (JWT validation)

### Coupling Analysis
- **Frontend ↔ Backend**: Loose coupling via REST API (HTTP/JSON)
- **Backend ↔ AI Service**: Loose coupling via HTTP (can be replaced)
- **Backend ↔ Judge0**: Loose coupling via API (external service)
- **Routes ↔ Services**: Medium coupling (direct imports, but interface-based)
- **Services ↔ Prisma**: Tight coupling (ORM dependency, acceptable)

## Deployment Boundaries

### Independently Deployable
1. Frontend (Vercel) - Auto-deploy from GitHub
2. Backend (Cloud Run) - Cloud Build trigger
3. AI Service (Cloud Run) - Cloud Build trigger

### Shared Database
- PostgreSQL accessed by Backend and AI Service
- Schema changes require coordination
- Use database migrations (Prisma)
