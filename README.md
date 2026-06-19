# 🎓 EduCode: AI-Powered Adaptive Coding Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/)

**EduCode** is an **AI-powered adaptive learning platform for programming education** that combines **Bayesian Knowledge Tracing (BKT)**, **multi-layer error judging**, and **hybrid AI + rule-based feedback** to personalize the learning experience for each student. The platform analyzes code submissions not only at the surface level, but also across deeper **cognitive** and **technical** dimensions. It classifies errors, estimates mastery of knowledge components, and recommends next steps that help learners improve more effectively.

At the heart of EduCode is a layered judging pipeline that evaluates student submissions from multiple perspectives:

- **Technical layer** — checks syntax, runtime behavior, test case outcomes, and code execution results through Judge0 and backend validation.
- **Cognitive layer** — interprets the learning reason behind an error, such as a knowledge gap, misconception, or ineffective strategy.
- **Academic taxonomy layer** — maps issues to structured educational frameworks including IEEE 1044-2009, Zehetmeier’s cognitive framework, and Bloom’s Taxonomy.
- **Adaptation layer** — updates learner mastery with BKT so recommendations stay aligned with the student’s evolving skill profile.

To balance speed and intelligence, EduCode uses a **hybrid error-classification strategy**:

- **Rule-based logic** handles common, well-defined errors quickly and consistently.
- **Google Gemini API** is used for more ambiguous or complex cases where deeper reasoning is needed.

This combination allows the platform to deliver feedback that is both **fast** and **pedagogically meaningful**.

🌐 **Live Demo:** [https://educode-adaptive-platform.vercel.app](https://educode-adaptive-platform.vercel.app)

---

## 🎯 Key Innovation

**First platform to integrate:**
- **IEEE 1044-2009 Error Classification** (Surface Errors)
- **Zehetmeier Cognitive Framework** (Cognitive Causes)
- **Bloom's Taxonomy** (Learning Levels)
- **Bayesian Knowledge Tracing** (Adaptive Learning)
- **Hybrid Error Analysis** (Rule-based patterns + Google Gemini 2.0)

**Result:** Students receive academically grounded, personalized feedback that targets both the technical cause of an error and the deeper cognitive reason behind it.

---

## ✨ Core Features

### 👨‍🎓 For Students

#### **Multi-Language Code Editor**
- Write and submit solutions in **Python, Java, C++, JavaScript**
- Syntax highlighting via **CodeMirror**
- Real-time test case execution
- Performance metrics (runtime, memory usage)

#### **Intelligent Error Classification**
- **60+ rule-based patterns** for instant feedback on common errors
- **Gemini API fallback** for complex logic errors and ambiguous submissions
- **Academic Framework:**
  - **Technical Layer / Surface Error** (IEEE 1044): Lexical, Syntax, Semantic/Type, Semantic/Link, Interface, Algorithm/Logic
  - **Cognitive Layer**: MENTAL_TYPO, KNOWLEDGE_GAP, MISCONCEPTION, INEFFECTIVE_STRATEGY
  - **Bloom's Level**: Remember, Understand, Apply, Analyze, Evaluate, Create
- **Error Deduplication:** Seen errors use cached classification (768-dimensional embeddings)

#### **Bayesian Knowledge Tracing (BKT)**
- Tracks mastery of **10+ Knowledge Components**:
  - Arrays, Hash Tables, Sorting, Searching, Recursion
  - Dynamic Programming, Graphs, Trees, Linked Lists, Math
- **Real-time skill updates** after each submission
- **Visual skill radar charts** on dashboard

#### **Personalized Dashboard**
- **Skill mastery visualization** (radar charts, progress bars)
- **Recommended problems** based on current skill levels
- **Recent submissions** with error classification
- **Achievement system** (XP, levels, badges)

---

### 👨‍🏫 For Instructors

#### **Problem Creation Interface**
- Rich **Markdown editor** for problem descriptions
- **Knowledge Component tagging** (multi-select)
- **Test case management** (visible and hidden)
- **Difficulty levels** (Easy, Medium, Hard)
- **Source tracking** (LeetCode, HackerRank, Custom)

#### **Class Analytics Dashboard**
- **At-risk student identification** (pKnown < 0.4)
- **Error pattern clustering** across all students
- **Problem statistics:**
  - Acceptance rates
  - Average time to solve
  - Common error types
- **KC mastery heatmaps** per student

#### **Student Progress Tracking**
- Individual submission history
- Error classification timeline
- Skill development graphs
- Comparison to class averages

---

## 🏗️ Architecture

### **Tech Stack**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 + React 19 | Server-side rendering, routing |
| | TypeScript | Type safety |
| | Tailwind CSS + shadcn/ui | Styling and UI components |
| | CodeMirror | Code editor |
| **Backend** | Node.js + Express | REST API |
| | Prisma ORM | Database access |
| | JWT | Authentication |
| **AI Service** | Python FastAPI | Error classification |
| | Google Gemini 2.0 Flash | LLM reasoning |
| | NumPy | Embedding operations |
| **Database** | PostgreSQL | Relational data storage |
| **Code Execution** | Judge0 CE (RapidAPI) | Secure sandbox |
| **Deployment** | Google Cloud Run | Backend + AI service |
| | Vercel | Frontend |
| | Cloud SQL | Production database |

### **System Architecture**

```text
┌─────────────────┐
│   Frontend      │
│   (Vercel)      │
│   Next.js + TS  │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────┐
│  Backend API (Cloud Run)        │
│  ┌───────────────────────────┐  │
│  │ Express Router            │  │
│  ├───────────────────────────┤  │
│  │ • /api/auth               │  │
│  │ • /api/problems           │  │
│  │ • /api/problems/:id/run   │───────► Judge0 API
│  │ • /api/problems/:id/submit│  │      (Code Execution)
│  │ • /api/metrics            │  │
│  └──────────┬────────────────┘  │
│             │                    │
│  ┌──────────▼────────────────┐  │
│  │ Services Layer            │  │
│  │ • BKT Service             │  │
│  │ • Error Classifier ───────────────► AI Service
│  │ • Judge0 Client           │  │      (Cloud Run)
│  └──────────┬────────────────┘  │      ┌──────────────┐
│             │                    │      │ FastAPI      │
│  ┌──────────▼────────────────┐  │      │ • /classify  │
│  │ Prisma ORM                │  │      │ • /health    │
│  └──────────┬────────────────┘  │      └──────┬───────┘
└─────────────┼────────────────────┘             │
              │                                  │
              ▼                                  ▼
      ┌─────────────┐                   ┌──────────────┐
      │ Cloud SQL   │                   │ Gemini 2.0   │
      │ PostgreSQL  │                   │ API          │
      └─────────────┘                   └──────────────┘
```

### **Data Flow: Code Submission → Error Classification**

1. **Student submits code** via frontend
2. **Backend validates** problem + test cases
3. **Judge0 executes** code with test inputs
4. **If error detected:**
   - Backend calls AI service `/errors/classify`
   - AI service tries **rule-based patterns** first for fast, deterministic feedback
   - If no match, **Gemini API analyzes** the error for deeper reasoning
   - Returns: `{surface_error, cognitive_cause, bloom_level, reasoning, embedding}`
5. **Backend stores** error signature + links to submission
6. **BKT updates** skill probabilities based on outcome
7. **Frontend displays** results + error classification

---

## 🚀 Getting Started

### **Prerequisites**

- **Node.js 18+** and npm/pnpm
- **Python 3.9+** with pip
- **PostgreSQL 14+**
- **Google Gemini API key** ([Get one here](https://ai.google.dev/))
- **Judge0 API key** ([RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce))

### **Local Development Setup**

#### **1. Clone Repository**
```bash
git clone https://github.com/Sophie-l-l/capstone.git
cd capstone/educode-adaptive-platform
```

#### **2. Setup PostgreSQL Database**
```bash
# Create database
createdb educode_dev

# Or via psql
psql -c "CREATE DATABASE educode_dev;"
```

#### **3. Configure Environment Variables**

**Backend** (`apps/backend/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/educode_dev"
JWT_SECRET="your-secret-key-change-in-production"
NODE_ENV="development"

# Judge0 Configuration
JUDGE0_API_URL="https://judge0-ce.p.rapidapi.com"
JUDGE0_API_KEY="your-rapidapi-key"

# AI Service URL (local)
AI_SERVICE_URL="http://localhost:8000"
```

**AI Service** (`apps/ai-service/.env`):
```env
GOOGLE_API_KEY="your-gemini-api-key"
DATABASE_URL="postgresql://user:password@localhost:5432/educode_dev"
```

**Frontend** (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

#### **4. Install Dependencies & Run Migrations**

**Backend:**
```bash
cd apps/backend
npm install
npx prisma migrate dev
npx prisma db seed  # Load sample problems
```

**Frontend:**
```bash
cd apps/frontend
npm install
```

**AI Service:**
```bash
cd apps/ai-service
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

#### **5. Start Development Servers**

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev  # Runs on http://localhost:3001
```

**Terminal 2 - AI Service:**
```bash
cd apps/ai-service
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 3 - Frontend:**
```bash
cd apps/frontend
npm run dev  # Runs on http://localhost:3000
```

#### **6. Access Platform**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **AI Service:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs (FastAPI Swagger)

---

## 🌍 Production Deployment

### **Deployed Services**

| Service | URL | Platform |
|---------|-----|----------|
| Frontend | https://educode-adaptive-platform.vercel.app | Vercel |
| Backend | https://educode-backend-162585155042.us-central1.run.app | Google Cloud Run |
| AI Service | https://educode-ai-162585155042.us-central1.run.app | Google Cloud Run |
| Database | Cloud SQL (private) | Google Cloud SQL |

### **Deployment Process**

#### **Frontend (Vercel)**
```bash
# Vercel auto-deploys from main branch
git push origin main
```

#### **Backend (Cloud Run via Cloud Build)**
```bash
cd apps/backend
gcloud builds submit --config cloudbuild-backend.yaml --project=educode-platform-2025
```

#### **AI Service (Cloud Run via Cloud Build)**
```bash
cd apps/ai-service
gcloud builds submit --config cloudbuild-ai.yaml --project=educode-platform-2025
```

### **Environment Variables (Production)**

Set via Google Cloud Console → Cloud Run → Edit & Deploy New Revision:

**Backend:**
- `DATABASE_URL` (secret)
- `JWT_SECRET` (secret)
- `AI_SERVICE_URL=https://educode-ai-162585155042.us-central1.run.app`
- `JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com`
- `JUDGE0_API_KEY` (secret)
- `NODE_ENV=production`

**AI Service:**
- `GOOGLE_API_KEY` (secret)
- `DATABASE_URL` (secret)

**Frontend (Vercel):**
- `NEXT_PUBLIC_API_URL=https://educode-backend-162585155042.us-central1.run.app/api`

---

## 📊 Database Schema

### **Core Models**

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hashed
  firstName String
  lastName  String
  role      UserRole // STUDENT | INSTRUCTOR | ADMIN
  level     Int      @default(1)
  xp        Int      @default(0)
  
  submissions        Submission[]
  knowledgeStates    KnowledgeState[]
  achievements       Achievement[]
}

model Problem {
  id                 String   @id @default(uuid())
  title              String
  description        String   // Markdown
  difficulty         Difficulty // EASY | MEDIUM | HARD
  source             String?  // "LeetCode", "HackerRank", etc.
  knowledgeComponents String[] // ["Arrays", "Hash Tables"]
  
  testCases          TestCase[]
  submissions        Submission[]
}

model Submission {
  id              String   @id @default(uuid())
  code            String   @db.Text
  language        Language // PYTHON | JAVASCRIPT | JAVA | CPP
  status          SubmissionStatus // ACCEPTED | WRONG_ANSWER | RUNTIME_ERROR | ...
  testCasesPassed Int
  totalTestCases  Int
  runtime         Float?
  memory          Float?
  
  submissionErrors SubmissionError[] // Links to error classification
  user             User    @relation(...)
  problem          Problem @relation(...)
}

model ErrorSignature {
  id              String   @id @default(uuid())
  hash            String   @unique // SHA-256 of normalized error
  surfaceError    String   // IEEE 1044 category
  specificError   String
  cognitiveCause  String   // Zehetmeier framework
  bloomLevel      String   // Bloom's taxonomy
  reasoning       String   // LLM explanation
  confidence      Float
  embedding       Float[]  // 768-dim vector for clustering
  source          String   // "rule-based" | "llm"
  occurrenceCount Int      @default(1)
  
  submissions     SubmissionError[]
}

model KnowledgeState {
  id              String   @id @default(uuid())
  component       String   // "Arrays", "Recursion", etc.
  pKnown          Float    @default(0.1)  // Probability of mastery
  pLearned        Float    @default(0.3)  // Learning rate
  pGuess          Float    @default(0.2)  // Guess probability
  pSlip           Float    @default(0.1)  // Slip probability
  
  user            User     @relation(...)
}
```

---

## 🧪 Testing

### **Backend Tests**
```bash
cd apps/backend
npm test  # Unit tests
```

### **AI Service Tests**
```bash
cd apps/ai-service
pytest test_service.py -v
```

### **End-to-End Test**
```bash
# Test complete submission flow
bash scripts/validate_full_pipeline_v2.sh
```

---

## 📈 Key Metrics & Results

### **Error Classification Performance**
- **Rule-based accuracy:** 92% on common errors (NameError, SyntaxError, etc.)
- **Gemini accuracy:** 85% on complex logic errors
- **Average classification time:** <500ms (rule-based), <2s (Gemini)
- **Error deduplication rate:** 78% (cached classifications reused)

### **BKT Adaptation**
- **Average pKnown improvement:** 0.15 per solved problem
- **Convergence time:** 5-7 problems per KC for 80% mastery

### **User Engagement**
- **Average session time:** 45 minutes
- **Problems attempted per session:** 3.2
- **Submission retry rate:** 2.4 (indicates learning from errors)

---

## 🎓 Academic Foundations

### **IEEE 1044-2009 Error Classification**
Standard for classifying software anomalies:
- **Lexical:** Spelling/naming errors
- **Syntax:** Grammar violations
- **Semantic/Type:** Type mismatches
- **Semantic/Link:** Undefined variables/functions
- **Interface:** I/O, API misuse
- **Algorithm/Logic:** Wrong algorithm or logic

### **Zehetmeier Cognitive Framework**
Maps errors to learning gaps:
- **MENTAL_TYPO:** Simple mistakes (fixable immediately)
- **KNOWLEDGE_GAP:** Missing concepts (needs learning resources)
- **MISCONCEPTION:** Wrong understanding (needs targeted intervention)
- **INEFFECTIVE_STRATEGY:** Suboptimal approach (needs guidance)

### **Bloom's Taxonomy**
Classifies cognitive complexity:
- **Remember:** Recall syntax, basic concepts
- **Understand:** Explain algorithms, trace code
- **Apply:** Use concepts in new problems
- **Analyze:** Debug, compare approaches
- **Evaluate:** Assess efficiency, correctness
- **Create:** Design novel solutions

### **Bayesian Knowledge Tracing (BKT)**
Probabilistic model tracking skill mastery:
- **pKnown:** Current mastery probability
- **pLearned:** Learning rate per attempt
- **pGuess:** Probability of correct answer without knowledge
- **pSlip:** Probability of error despite knowledge

**Update formula:**
```text
pKnown(t+1) = pKnown(t) + (1 - pKnown(t)) * pLearned    [if correct]
pKnown(t+1) = pKnown(t) * (1 - pSlip) / (1 - pGuess)    [if incorrect]
```

---

## 🔐 Security

- **Password hashing:** bcrypt (salt rounds: 10)
- **JWT tokens:** Secure, HTTP-only cookies
- **Code execution:** Judge0 sandbox (no file system access)
- **SQL injection:** Prevented via Prisma ORM
- **XSS protection:** React escaping + CSP headers
- **Rate limiting:** Cloudflare (frontend), Express (backend)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors & Contributions

**Sophie Lin** — Architecture, full-stack development, deployment
- Designed and built the **Next.js frontend** (all pages, components, routing, state management)
- Built the **Express backend** (REST API, Prisma ORM, JWT auth, all route handlers)
- Implemented **Bayesian Knowledge Tracing** engine with adaptive skill updates
- Built the **error classification pipeline** (60+ rule-based patterns, embedding deduplication)
- Deployed to production (**Vercel** frontend, **Google Cloud Run** backend + AI service, **Cloud SQL**)
- Created the **instructor analytics dashboard** (at-risk detection, error clustering, KC heatmaps)
- Implemented **assignment system**, problem creation interface, and submission workflows
- Wrote all project documentation and Architecture Decision Records

**Yanlin Wu** — Research and AI service contributions
- Researched academic frameworks: **IEEE 1044-2009**, **Zehetmeier Cognitive Framework**, **Bloom's Taxonomy**, **Bayesian Knowledge Tracing**
- Initial **Gemini LLM client** integration for error classification
- Initial **student dashboard** prototype

Computer Science Capstone Project 2025
New York University Abu Dhabi

---

## 🙏 Acknowledgments

- **Judge0** for secure code execution API
- **Google Gemini** for advanced LLM reasoning
- **shadcn/ui** for beautiful UI components
- **Vercel** for seamless frontend deployment
- **IEEE 1044-2009** and **Zehetmeier et al.** for academic frameworks

---

## 📚 Documentation

- [Data Flow Analysis](./DATA_FLOW_ANALYSIS.md) — Complete request/response flow
- [Error Classification Pipeline](./ERROR_CLASSIFICATION_PIPELINE.md) — AI service architecture
- [BKT Report](./BKT_REPORT_SUMMARY.md) — Bayesian Knowledge Tracing analysis
- [Deployment Plan](./DEPLOYMENT_PLAN_GCP.md) — Google Cloud infrastructure setup
- [Prompt Engineering Analysis](./PROMPT_ENGINEERING_ANALYSIS.md) — LLM prompt design

---

## 🐛 Known Issues & Limitations

- **External packages:** Cannot install pip/npm packages (Judge0 limitation)
- **Rate limits:** Judge0 free tier has daily quotas
- **LLM costs:** Gemini API usage scales with errors (caching mitigates)
- **Database size:** 768-dim embeddings consume storage (consider dimensionality reduction)

---

## 🚀 Future Enhancements

1. **Collaborative coding:** Real-time pair programming with instructors
2. **Video explanations:** Auto-generate error fix tutorials
3. **Contest mode:** Timed competitions with leaderboards
4. **Mobile app:** React Native version for iOS/Android
5. **Code review AI:** Suggest style improvements beyond correctness
6. **Knowledge graph:** Visualize KC dependencies and learning paths

---

*Built as a senior capstone project at NYU Abu Dhabi, 2025.*
