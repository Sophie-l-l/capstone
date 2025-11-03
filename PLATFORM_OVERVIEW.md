# EduCode Platform Overview

## 🎓 What is EduCode?

EduCode is an adaptive learning platform for coding education that combines:
- **Intelligent Error Analysis** (AI-powered)
- **Bayesian Knowledge Tracing** (BKT for skill mastery)
- **Personalized Problem Recommendations**
- **Real-time Code Execution** (Judge0 integration)

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│                    http://localhost:3000                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                     │
│  • Student Dashboard    • Problem Browser                    │
│  • Code Editor          • Analytics Charts                   │
│  • Authentication       • Progress Tracking                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Node.js/Express)                  │
│                    http://localhost:3001                     │
│  • User Management      • Submission Processing              │
│  • Problem Management   • BKT Calculations                   │
│  • JWT Authentication   • Analytics Endpoints                │
└─────────┬──────────────────┬──────────────┬─────────────────┘
          │                  │              │
          ▼                  ▼              ▼
┌──────────────────┐  ┌─────────────┐  ┌──────────────────┐
│   PostgreSQL     │  │ AI Service  │  │   Judge0 API     │
│   (Database)     │  │  (Python)   │  │ (Code Execution) │
│   Port: 5432     │  │  Port: 8000 │  │   External       │
└──────────────────┘  └─────────────┘  └──────────────────┘
```

## 📦 Services

### **Frontend (Next.js)**
- **Location**: `apps/frontend/`
- **Port**: 3000
- **Technology**: Next.js 15, React, TypeScript, Tailwind CSS
- **Features**:
  - Student/Instructor dashboards
  - Monaco code editor
  - Real-time feedback
  - Responsive charts (Recharts)

### **Backend (Express)**
- **Location**: `apps/backend/`
- **Port**: 3001
- **Technology**: Node.js, Express, TypeScript, Prisma ORM
- **Features**:
  - RESTful API
  - JWT authentication
  - Code submission handling
  - BKT algorithm implementation
  - Analytics aggregation

### **AI Service (FastAPI)** ⭐ *Your Focus*
- **Location**: `apps/ai-service/`
- **Port**: 8000
- **Technology**: Python, FastAPI, OpenAI API
- **Features**:
  - Error classification
  - Error clustering
  - LLM-powered analysis

### **Database (PostgreSQL)**
- **Port**: 5432
- **Container**: `educode-postgres`
- **Access**: 
  ```bash
  docker exec -it educode-postgres psql -U postgres -d educode
  ```

### **Cache (Redis)**
- **Port**: 6379
- **Container**: `educode-redis`
- **Usage**: Session storage, rate limiting

## 🗄️ Database Schema

### **Core Tables**

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | Students & instructors | id, email, role, passwordHash |
| `problems` | Coding challenges | id, title, difficulty, topics, knowledgeComponents |
| `test_cases` | Problem test inputs/outputs | id, problemId, input, output, isHidden |
| `submissions` | Student code attempts | id, userId, problemId, code, status, runtime |
| `submission_errors` | Raw error data | id, submissionId, compileOutput, stderr |
| `error_signatures` | AI-classified errors | id, hash, label, confidence, embedding |
| `error_clusters` | Grouped similar errors | id, name, centroid |
| `knowledge_components` | Skills (arrays, stacks, etc.) | id, name, description |
| `bkt_states` | Student skill mastery | userId, kcId, pKnown, attempts, corrects |

### **Relationships**

```
User 1──N Submission N──1 Problem
  │                   │
  │                   └──1 SubmissionError 1──1 ErrorSignature
  │                                               │
  └──N BKTState N──1 KnowledgeComponent          │
                                                  N
                                            ErrorCluster
```

## 🔄 Request Flow: Code Submission

### **Step-by-Step Flow**

```
1. Student writes code in Monaco editor (Frontend)
   ↓
2. Click "Submit" → POST /api/code/submit (Backend)
   ↓
3. Backend validates & sends to Judge0 API
   ↓
4. Judge0 executes code in sandbox
   ↓
5. If error detected:
   Backend → AI Service POST /classify
   ↓
6. AI Service analyzes error with LLM
   ↓
7. Backend stores:
   - Submission (code, status, runtime)
   - SubmissionError (raw error)
   - ErrorSignature (AI classification)
   ↓
8. Backend updates BKT state for student's knowledge components
   ↓
9. Frontend displays results + intelligent feedback
```

### **Example: Syntax Error Flow**

```javascript
// Student code (has error)
def sum(a, b)
    return a + b  // Missing colon!

// Judge0 output
"SyntaxError: invalid syntax"

// AI Service classifies
{
  "label": "Missing Colon",
  "confidence": 0.98,
  "suggestion": "Add ':' after function definition"
}

// Student sees
"❌ Syntax Error: Missing Colon
💡 Tip: Add ':' after function definition"
```

## 🧠 Bayesian Knowledge Tracing (BKT)

### **What is BKT?**

A probabilistic model that tracks student mastery of skills over time.

### **Knowledge Components (KCs)**

Skills tracked in the system:
- `arrays` - Array manipulation
- `hash_maps` - Hash table usage
- `two_pointers` - Two-pointer technique
- `strings` - String processing
- `stacks` - Stack data structure
- `trees` - Tree algorithms
- `dfs` - Depth-first search
- `recursion` - Recursive solutions
- `math` - Mathematical reasoning
- `tree_traversal` - Tree traversal algorithms

### **BKT Parameters**

```typescript
// For each student + KC combination:
pKnown: 0.0 - 1.0  // Probability student knows the skill
attempts: number   // Total attempts on problems with this KC
corrects: number   // Successful attempts
```

### **How It Works**

```
Initial State: pKnown = 0.2 (20% mastery)

Student submits problem with KC "arrays":
✅ Correct → pKnown increases (e.g., 0.2 → 0.45)
❌ Wrong → pKnown decreases slightly (e.g., 0.45 → 0.38)

Mastery threshold: pKnown > 0.8 (80%)
```

### **Problem Recommendation**

```typescript
// Backend selects next problem based on:
1. Student's weak KCs (pKnown < 0.6)
2. Problems with those KCs
3. Appropriate difficulty level
4. Not recently attempted
```

## 📊 Student Dashboard Data

### **What Students See**

1. **Overview Metrics**
   - Problems solved
   - Success rate
   - Current streak
   - Class rank

2. **Skill Mastery Chart**
   - Progress bars for each KC
   - pKnown percentage
   - Mastered (>80%) vs Learning

3. **Recommended Problems**
   - Personalized based on BKT
   - Targets weak areas

4. **Recent Submissions**
   - Status (Accepted, Wrong Answer, etc.)
   - Runtime & memory
   - Error feedback

### **Data Sources**

```typescript
// Frontend calls:
GET /api/students/:id/dashboard
  → Returns: student info, accuracy, KC mastery, error distribution

GET /api/students/:id/submissions
  → Returns: paginated submission history

GET /api/students/:id/errors
  → Returns: top error types, recent errors with AI labels
```

## 🔐 Authentication Flow

### **Registration**

```
POST /api/auth/register
{
  "email": "student@example.com",
  "password": "secure123",
  "name": "Jane Doe",
  "role": "student"
}

Response: { "token": "jwt_token_here", "user": {...} }
```

### **Login**

```
POST /api/auth/login
{
  "email": "student@example.com",
  "password": "secure123"
}

Response: { "token": "jwt_token_here", "user": {...} }
```

### **Token Usage**

```javascript
// Frontend stores token in localStorage
localStorage.setItem('educode_token', token)

// All API requests include:
headers: {
  'Authorization': `Bearer ${token}`
}
```

## 🎯 Current Test Data

### **Test User**

```
Email: test@example.com
Password: password123
Role: student
User ID: Generated UUID (from seed)
```

### **Sample Problems (5 total)**

1. **Two Sum** (Easy)
   - Topics: Array, Hash Table
   - KCs: arrays, hash_maps, two_pointers

2. **Reverse String** (Easy)
   - Topics: String, Two Pointers
   - KCs: strings, two_pointers, in_place_algorithms

3. **Palindrome Number** (Easy)
   - Topics: Math
   - KCs: math, string_manipulation, number_theory

4. **Valid Parentheses** (Medium)
   - Topics: String, Stack
   - KCs: stacks, string_parsing, matching_algorithms

5. **Binary Tree Inorder Traversal** (Hard)
   - Topics: Tree, DFS, Stack
   - KCs: trees, dfs, recursion, tree_traversal

## 🛠️ Development Tools

### **Database Management**

```bash
# View schema
cd apps/backend
npx prisma studio  # Opens GUI at http://localhost:5555

# Run migrations
npx prisma migrate dev

# Seed data
npm run prisma:seed

# Reset database (careful!)
npx prisma migrate reset
```

### **API Testing**

```bash
# Test backend health
curl http://localhost:3001/api/health

# Get problems
curl http://localhost:3001/api/problems

# Login (get token)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### **Docker Management**

```bash
# Start all services
docker compose -f docker-compose.dev.yml up

# Start specific service
docker compose -f docker-compose.dev.yml up ai-service

# View logs
docker logs -f educode-ai-service

# Restart service
docker compose -f docker-compose.dev.yml restart ai-service

# Stop all
docker compose -f docker-compose.dev.yml down

# Rebuild after changes
docker compose -f docker-compose.dev.yml build ai-service
```

## 📝 Code Style & Conventions

### **Backend (TypeScript)**

```typescript
// Use async/await
async function getStudent(id: string) {
  return await prisma.user.findUnique({ where: { id } })
}

// Proper error handling
try {
  const result = await someOperation()
} catch (error) {
  console.error('Operation failed:', error)
  res.status(500).json({ error: 'Internal server error' })
}
```

### **AI Service (Python)**

```python
# FastAPI route
@app.post("/classify")
async def classify_error(request: ClassifyRequest):
    """Classify error using LLM."""
    # Implementation here
    return {"label": "...", "confidence": 0.9}

# Type hints
def process_error(error: str, language: str) -> dict:
    ...
```

### **Frontend (React/TypeScript)**

```typescript
// Functional components with hooks
export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  
  useEffect(() => {
    fetchData()
  }, [])
  
  return <div>...</div>
}
```

## 🚦 Environment Variables

### **Root .env File**

```bash
# AI Service
OPENAI_API_KEY=your_key_here
LLM_MIN_CONFIDENCE=0.75

# Backend (uses docker-compose.dev.yml values)
DATABASE_URL=postgres://postgres:postgres@postgres:5432/educode
AI_SERVICE_URL=http://ai-service:8000
```

### **Frontend .env.local**

```bash
# Created for mock data control
NEXT_PUBLIC_USE_MOCK_AUTH=false
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_USE_MOCK_PROBLEMS=false
NEXT_PUBLIC_USE_MOCK_ANALYTICS=false
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📚 Key Files Reference

### **For AI Service Work**

| File | Purpose |
|------|---------|
| `apps/ai-service/main.py` | Main FastAPI app - your primary workspace |
| `apps/ai-service/requirements.txt` | Python dependencies |
| `apps/backend/src/services/judge0.service.ts` | Backend integration with AI |
| `apps/backend/prisma/schema.prisma` | Database models (error tables) |

### **For Understanding System**

| File | Purpose |
|------|---------|
| `docker-compose.dev.yml` | Service orchestration |
| `apps/backend/src/routes/codeExecution.ts` | Code submission API |
| `apps/frontend/app/problems/[id]/page.tsx` | Problem solving UI |
| `apps/backend/src/services/bkt.service.ts` | BKT implementation |

## 🎓 Learning Resources

### **Technologies Used**

- **FastAPI**: https://fastapi.tiangolo.com/
- **Prisma ORM**: https://www.prisma.io/docs
- **Next.js 15**: https://nextjs.org/docs
- **OpenAI API**: https://platform.openai.com/docs

### **Concepts**

- **Bayesian Knowledge Tracing**: [Paper](https://www.semanticscholar.org/paper/Knowledge-Tracing%3A-Modeling-the-Acquisition-of-Corbett-Anderson/1e6d1d0f8a0c3b9d3b3c0c5d3f0f0c5c0c5c0c5c)
- **Error Classification**: Code error taxonomy and categorization
- **Adaptive Learning**: Personalized learning paths

## ✅ Quick Checklist for AI Service Development

- [ ] Service starts and responds to /health
- [ ] Can classify sample Python error
- [ ] Can classify sample Java error  
- [ ] Can classify sample JavaScript error
- [ ] Understands backend integration flow
- [ ] Knows where error data is stored (database)
- [ ] Can test end-to-end (submit code → see AI feedback)
- [ ] Familiar with current LLM prompt structure
- [ ] Knows how to add new classification categories

---

**Happy Coding!** 🚀

For AI Service specific guide, see: `AI_SERVICE_QUICKSTART.md`
