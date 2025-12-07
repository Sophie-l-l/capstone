# EduCode Adaptive Coding Platform

## Overview
EduCode is an **AI-powered adaptive learning platform** for computer science education that uses **Bayesian Knowledge Tracing (BKT)** and **advanced error classification** to personalize the learning experience. The platform combines a modern Next.js frontend, robust Node.js backend, Python AI microservice, and secure code execution via Judge0.

**Key Innovation**: First platform to integrate IEEE 1044-2009 + Zehetmeier cognitive framework for error classification with BKT-driven adaptive learning.

## 🚀 Core Features

### For Students
- **Multi-Language Code Editor**: Write and submit solutions in Python, Java, C++, JavaScript
- **Real-Time Execution**: Secure sandbox testing with performance metrics (runtime, memory)
- **Intelligent Error Analysis**: 
  - 60+ rule-based patterns + LLM fallback (Google Gemini 2.0)
  - Academic error classification (Surface Error → Cognitive Cause → Bloom Level)
  - Logic error detection for failed test cases
- **Bayesian Knowledge Tracing**: Track mastery of 10+ Knowledge Components (Arrays, Recursion, Hash Tables, etc.)
- **Personalized Dashboard**: Skill radar charts, progress tracking, strengths/weaknesses analysis
- **Achievement System**: XP, levels, badges for gamified learning

### For Instructors
- **Problem Creation Interface**: Rich markdown editor with KC tagging and test case management
- **Class Analytics Dashboard**: 
  - At-risk student identification (pKnown < 0.4)
  - Error pattern clustering across all students
  - Problem acceptance rates and time distributions
  - KC mastery heatmaps
- **Student Progress Tracking**: Individual submissions, error history, skill development over time

## 🏗️ Architecture

```
capstone/
├── apps/
│   ├── frontend/          # Next.js 15 + React 19 UI
│   │   ├── app/           # Pages (dashboard, problems, submissions, etc.)
│   │   ├── components/    # Reusable UI components (shadcn/ui)
│   │   └── lib/           # Auth context, API client, utilities
│   ├── backend/           # Node.js + Express + Prisma API
│   │   ├── src/
│   │   │   ├── routes/    # API endpoints (auth, problems, code execution)
│   │   │   └── services/  # BKT service, error recording
│   │   └── prisma/        # Database schema and migrations
│   └── ai-service/        # Python FastAPI microservice
│       ├── main.py        # API endpoints (error classification, BKT)
│       ├── error_classifier.py  # Academic framework implementation
## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and npm
**Step 1**: Create environment files (see [Environment Variables](#environment-variables) section below)

**Step 2**: Start all services with hot reload:
```bash
docker compose -f docker-compose.dev.yml up --build
```

**Step 3**: Access the application:
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:3001/api/problems
- 🤖 **AI Service**: http://localhost:8000/health
- 🗄️ **PostgreSQL**: localhost:5432

**Common Commands**:
```bash
# Stop all services
docker compose -f docker-compose.dev.yml down

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Restart specific service
docker compose -f docker-compose.dev.yml restart backend

# Reset database (⚠️ deletes all data)
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

### Option 2: Production Mode (Nginx Reverse Proxy)

```bash
# Build optimized images
docker compose -f docker-compose.prod.yml build

# Start services in background
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop
docker compose -f docker-compose.prod.yml down
```
After setup, verify everything works:

1. ✅ Services running:
   - [ ] Frontend: http://localhost:3000
   - [ ] Backend: http://localhost:3001/api/problems
   - [ ] AI Service: http://localhost:8000/health

2. ✅ Create test accounts:
   - [ ] Register as Student
   - [ ] Register as Instructor

3. ✅ Test student flow:
   - [ ] Browse problems
   - [ ] Submit code solution
   - [ ] View results and BKT update
   - [ ] Check dashboard shows KC mastery

4. ✅ Test instructor flow:
   - [ ] Create a new problem
   - [ ] Tag with Knowledge Components
   - [ ] Add test cases
   - [ ] View class analytics

---

## 🎯 Usage Guide

### For Students

**1. Register and Login**
```
Navigate to http://localhost:3000/register
→ Select "Student" role
→ Complete registration
→ Login at http://localhost:3000/login
```

**2. Solve Problems**
```
Browse Problems → Select difficulty/topic
→ Read problem description
→ Write code in Monaco editor
→ Run against sample test cases
→ Submit for full evaluation
→ View feedback and error analysis
```

**3. Track Progress**
```
Dashboard → View:
- KC mastery radar chart (Arrays, Recursion, etc.)
- Strengths (pKnown > 70%)
- Weaknesses (pKnown < 40%)
- Recent submissions
- Recommended problems
```

### For Instructors

**1. Create Problems**
```
Create Problem → Fill form:
- Title, difficulty, topics
### Manual Testing

**Test BKT Algorithm**:
1. Solve problem with KC "Arrays" (correct) → pKnown increases
2. Solve another Arrays problem (wrong) → pKnown decreases slightly
3. Check database: `SELECT * FROM bkt_states WHERE "userId" = 'your-user-id';`
4. Verify dashboard reflects changes

**Test Error Classification**:
1. Submit code with syntax error → Should classify as "Syntax/Lexical"
2. Submit code with logic error → Should detect via test case mismatch
3. View submissions page → See detailed error analysis with cognitive cause
## 🛠️ Common Issues & Troubleshooting

<details>
<summary><b>Database connection errors</b></summary>

```bash
# Check PostgreSQL is running
psql $DATABASE_URL

## 📖 Additional Documentation

- **[DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md)**: Complete development history and technical decisions
- **[PLATFORM_IMPROVEMENT_PLAN.md](./PLATFORM_IMPROVEMENT_PLAN.md)**: Roadmap for production readiness (testing, security, scalability)
- **[ERROR_CLASSIFICATION_PIPELINE.md](./ERROR_CLASSIFICATION_PIPELINE.md)**: Detailed error classification methodology
- **[DEPLOYMENT_PLAN_GCP.md](./DEPLOYMENT_PLAN_GCP.md)**: Google Cloud Platform deployment guide
- **[JUDGE0-TESTING.md](./JUDGE0-TESTING.md)**: Code execution testing and validation

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

**Development Guidelines**:
- Follow TypeScript/Python style guides
- Write tests for new features
- Update documentation
- Ensure all services pass health checks

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👥 Team & Contact

**Project Lead**: Sophie Lin, Yanlin Wu  
**Repository**: [github.com/Sophie-l-l/capstone](https://github.com/Sophie-l-l/capstone)  
**Institution**: Capstone Project - Adaptive Learning Platform for CS Education  
**Year**: 2025

**Research Focus**: Integrating Bayesian Knowledge Tracing with academic error classification frameworks (IEEE 1044-2009, Zehetmeier et al. 2015) to create personalized adaptive learning pathways.

---

## 🙏 Acknowledgments

- **Judge0**: Code execution engine
- **Google Gemini**: LLM for error classification
- **shadcn/ui**: UI component library
- **Next.js Team**: React framework
- **Prisma**: Database ORM

---

**Built with ❤️ for computer science education**
</details>

<details>
<summary><b>AI Service not classifying errors</b></summary>

```bash
# Check Gemini API key
cd apps/ai-service
python3 -c "import os; print(os.getenv('GOOGLE_API_KEY'))"

# Test directly
curl -X POST http://localhost:8000/errors/classify \
  -H "Content-Type: application/json" \
  -d '{"text": "test error", "language": "python"}'
```
</details>

<details>
<summary><b>Port already in use</b></summary>

```bash
# Find and kill process using port 3000/3001/8000
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```
</details>

---

## 📚 Project Structure & Key Files

| Path | Description |
|------|-------------|
| `apps/frontend/app/` | Next.js pages (dashboard, problems, submissions) |
| `apps/frontend/components/` | Reusable UI components |
| `apps/backend/src/routes/` | API endpoints |
| `apps/backend/src/services/bkt.service.ts` | **BKT algorithm implementation** |
| `apps/backend/prisma/schema.prisma` | Database schema |
| `apps/ai-service/error_classifier.py` | **Error classification logic** |
| `apps/ai-service/llm_client.py` | Gemini LLM integration |
| `docker-compose.dev.yml` | Development environment |
| `docker-compose.prod.yml` | Production environment |

---

## 🎓 How It Works: Bayesian Knowledge Tracing

The BKT algorithm tracks student mastery using four parameters:

**Parameters** (in `apps/backend/src/services/bkt.service.ts`):
- `S = 0.05`: Slip probability (knows but answers wrong)
- `G = 0.2`: Guess probability (doesn't know but answers right)
- `T = 0.1`: Learn probability (learns from attempt)
- `pKnown`: Current mastery probability (0-1)

**Algorithm**:
1. **Observe**: Student submits answer (correct/incorrect)
2. **Update belief** via Bayes' Theorem:
   - If correct: `P(know|correct) = [pKnown × (1-S)] / [pKnown × (1-S) + (1-pKnown) × G]`
   - If incorrect: `P(know|incorrect) = [pKnown × S] / [pKnown × S + (1-pKnown) × (1-G)]`
3. **Apply learning**: `pNew = posterior + (1 - posterior) × T`
4. **Store** new `pKnown` in database
5. **Display** on student dashboard as mastery percentage

**Example**: Student with 60% mastery solves problem correctly → pKnown increases to ~89%

---

## 🤖 Error Classification Framework

**Pipeline** (in `apps/ai-service/error_classifier.py`):
1. Normalize error text (remove file paths, line numbers)
2. Try 60+ rule-based patterns (instant, 95% confidence)
3. If confidence < 75%, fallback to Gemini LLM
4. Classify into academic framework:
   - **Surface Error**: Syntax, Semantic, Runtime, Logic, etc.
   - **Cognitive Cause**: MENTAL_TYPO, KNOWLEDGE_GAP, MISCONCEPTION, etc.
   - **Bloom Level**: Remember → Create
5. Generate 768-dim embedding for clustering
6. Store signature in database

---

## 📊 Project Status & Milestones

| Phase | Key Deliverables | Status |
|-------|------------------|--------|
| Phase 1 | ✅ DB schema, auth, KC tagging, BKT core algorithm | ✅ Complete |
| Phase 2 | ✅ Error classification (LLM), instructor dashboard, analytics | ✅ Complete |
| Phase 3 | ⏳ Adaptive problem recommendations, hinting system | 🔄 In Progress |
| Phase 4 | 📋 Real-time collaboration, mobile PWA, IDE integrations | 📋 Planned |

**Current Features** (December 2025):
- ✅ Full BKT implementation with Bayesian updates
- ✅ Academic error classification (IEEE 1044 + Zehetmeier)
- ✅ Multi-language code execution (Judge0)
- ✅ Student & instructor dashboards
- ✅ KC mastery tracking & visualization
- ✅ Error pattern clustering
- ✅ Profile management & achievements
  -H "Content-Type: application/json" \
  -d '{
    "text": "SyntaxError: unexpected EOF while parsing",
    "language": "python"
  }'
```

### Database Inspection

```bash
cd apps/backend

# Open Prisma Studio (GUI)
npx prisma studio

# Or use psql
psql $DATABASE_URL
\dt  # List tables
SELECT * FROM users;
SELECT * FROM "bkt_states";
SELECT * FROM error_signatures;
```

See `TESTING.md` for comprehensive test logs and screenshots.
- Class performance overview
- At-risk students (low KC mastery)
- Problem acceptance rates
- Common error patterns
- Individual student progress
```

---

## 🧪 Testing & Verificationord@localhost:5432/educode"

# Auth
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Judge0 API (get from RapidAPI)
JUDGE0_HOST="judge0-ce.p.rapidapi.com"
JUDGE0_API_KEY="your-judge0-api-key"

# AI Service
AI_SERVICE_URL="http://localhost:8000"

# Server
PORT=3001
NODE_ENV=development
```

**`apps/ai-service/.env`**:
```env
# Google Gemini API
GOOGLE_API_KEY="your-gemini-api-key"
GOOGLE_MODEL="gemini-2.0-flash-exp"

# OpenAI (for embeddings - optional)
OPENAI_API_KEY="your-openai-api-key"

# LLM Configuration
LLM_MIN_CONFIDENCE=0.75
```

### Step 4: Initialize Database

```bash
cd apps/backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database with sample problems and KCs
npm run seed

cd ../..
```

### Step 5: Start All Services

**Terminal 1 - Backend & Frontend**:
```bash
npm run dev
```
This starts:
- Frontend on http://localhost:3000
- Backend on http://localhost:3001

**Terminal 2 - AI Service**:
```bash
cd apps/ai-service
source .venv/bin/activate  # Activate virtual environment
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Step 6: Verify Installation

✅ **Backend**: http://localhost:3001/api/problems (should return JSON)  
✅ **AI Service**: http://localhost:8000/health (should return `{"status": "ok"}`)  
✅ **Frontend**: http://localhost:3000 (should show login page)

---

## 🔑 Environment Variables

<details>
<summary><b>Click to expand complete environment variable reference</b></summary>

### Backend (`apps/backend/.env`)
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | `postgresql://user:pass@localhost:5432/educode` |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ Yes | `your-256-bit-secret` |
| `JUDGE0_HOST` | Judge0 API host | ✅ Yes | `judge0-ce.p.rapidapi.com` |
| `JUDGE0_API_KEY` | Judge0 RapidAPI key | ✅ Yes | `your-rapidapi-key` |
| `AI_SERVICE_URL` | AI service endpoint | No | `http://localhost:8000` |
| `PORT` | Backend server port | No | `3001` |
| `NODE_ENV` | Environment mode | No | `development` |

### AI Service (`apps/ai-service/.env`)
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `GOOGLE_API_KEY` | Google Gemini API key | ✅ Yes | `AIza...` |
| `GOOGLE_MODEL` | Gemini model version | No | `gemini-2.0-flash-exp` |
| `OPENAI_API_KEY` | OpenAI API key (embeddings) | No | `sk-...` |
| `LLM_MIN_CONFIDENCE` | Confidence threshold for LLM fallback | No | `0.75` |

### Frontend (`apps/frontend/.env.local`)
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | No | `http://localhost:3001` |
| `NEXT_PUBLIC_AI_SERVICE_URL` | AI service URL | No | `http://localhost:8000` |

</details>

---

## 📝 First-Time Setup Checklist
# Follow logs
docker compose -f docker-compose.dev.yml logs -f
```

Prod-like (optimized images + nginx reverse proxy):

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Open the app at http://localhost
- API is proxied under http://localhost/api
- AI service (optional) under http://localhost/ai/health

To stop:
```bash
docker compose -f docker-compose.prod.yml down
```

Service health checklist (Docker):
- Frontend: http://localhost (prod) or http://localhost:3000 (dev)
- Backend: http://localhost/api/problems (prod) or http://localhost:3001/api/problems (dev)
- AI: http://localhost/ai/health (prod) or http://localhost:8000/health (dev)

If Docker isn't running or you prefer local, use the manual setup below.

### Run locally (fallback)

Prerequisites
- Node.js 18+
- Python 3.8+
- PostgreSQL 15+
- npm (with workspaces support)

Setup
1. **Clone the repo**
   ```bash
   git clone https://github.com/Sophie-l-l/capstone.git
   cd capstone/educode-adaptive-platform
   ```

2. **Install dependencies**
   ```bash
   npm install --workspaces
   ```

3. **Start PostgreSQL and set up database**
   ```bash
   brew install postgresql@15
   brew services start postgresql@15
   # Create DB and user as per .env.example
   ```

4. **Run Prisma migrations**
   ```bash
   cd apps/backend
   npx prisma migrate dev --name init
   ```

5. **Start the main services** (Frontend + Backend)
   ```bash
   npm run dev
   # Frontend: http://localhost:3000
   # Backend:  http://localhost:3001
   ```

6. **Start the AI service separately**
   
   Open a new terminal and run:
   ```bash
   cd apps/ai-service
   # Create venv if needed
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   # AI Service: http://localhost:8000
   ```

### Development Workflow
- **Terminal 1**: Run `npm run dev` (Frontend + Backend)
- **Terminal 2**: Run AI service command above
- **All services ready**: Frontend (3000), Backend (3001), AI Service (8000)

### Local health checks
- Backend: http://localhost:3001/api/problems should return a list/JSON
- AI service: http://localhost:8000/health returns `{ status: "ok" }`
- Frontend: http://localhost:3000 loads the app UI

## Testing & Verification
- Register and log in as a user
- Accept consent dialog (stored in DB)
- Solve a problem (tagged with KC)
- Submit code (Judge0 runs, backend updates BKT)
- Dashboard shows KC mastery and recommendations
- Instructor/admin can tag problems with KCs
- AI-service `/bkt/update` endpoint updates pKnown
- Face data endpoint `/analyze-face` accepts image (stub)

See `TESTING.md` for detailed test logs and screenshots.

## Project Phases & Milestones

| Phase | Key Deliverables | Status |
|-------|------------------|--------|
| Phase 1 | DB schema, consent, KC tagging, BKT, OpenFace prep | ✅ Complete |
| Phase 2 | Automated feedback, instructor dashboard, profiles | 🔄 In progress |
| Phase 3 | Analytics, adaptive hinting, recommendations | 📋 Planned |
| Phase 4 | Emotion/face data integration, privacy controls | 📋 Planned |

## Documentation
- `TESTING.md`: Core platform test checklist and evidence
- `docs/screenshots/`: UI and DB verification images
- `API_SPEC.md`: REST API endpoints and contracts
- `DEVELOPMENT_LOG.md`: Complete development history and progress

## Contributing
Pull requests and issues are welcome! Please open an issue to discuss major changes.

## License
MIT License

## Contact
- **Project Lead**: Sophie Lin, Yanlin Wu
- **Repository**: https://github.com/Sophie-l-l/capstone
- **Project**: Capstone - Adaptive Learning Platform
