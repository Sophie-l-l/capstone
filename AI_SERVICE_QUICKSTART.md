# AI Service Quick Start Guide

## 🎯 Overview

The AI Service is a Python FastAPI microservice responsible for analyzing student code submissions and classifying errors using LLM (Large Language Model) technology. It provides intelligent error detection, classification, and similarity clustering to help students understand and learn from their mistakes.

## 📋 Prerequisites

- Docker & Docker Compose installed
- Python 3.11+ (for local development)
- LLM API key (OpenAI, Anthropic, or other provider - **TO BE DETERMINED**)
- Basic knowledge of FastAPI and Python async/await

> **⚠️ LLM Provider Not Yet Selected**: The current code has OpenAI integration as a placeholder, but **no API key is configured**. Your first task is to research and select an appropriate LLM provider that fits the project budget. See "Your Responsibilities" section below.

## 🏗️ Architecture

```
educode-adaptive-platform/
├── apps/
│   ├── ai-service/          ← YOUR WORKSPACE
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── requirements.txt # Python dependencies
│   │   ├── test_service.py  # Test scripts
│   │   ├── test_service.sh  # Shell test runner
│   │   └── Dockerfile.dev   # Development container
│   ├── backend/             # Node.js API (calls AI service)
│   └── frontend/            # Next.js UI
└── docker-compose.dev.yml   # Orchestrates all services
```

## 🚀 Quick Start

### 1. **Clone & Setup Environment**

```bash
cd /path/to/educode-adaptive-platform

# Create .env file with your API keys (AFTER selecting LLM provider)
cat > .env << EOF
OPENAI_API_KEY=your_api_key_here  # Replace with your chosen provider's key
LLM_MIN_CONFIDENCE=0.75
OPENAI_MODEL=gpt-4o-mini           # Or your chosen model
EOF
```

> **📌 Note**: Currently running **without LLM** - only rule-based classification is active. LLM integration will work once you add an API key.

### 2. **Start All Services**

```bash
# Start everything (Postgres, Redis, Backend, Frontend, AI Service)
docker compose -f docker-compose.dev.yml up

# Or start only AI service (if others are already running)
docker compose -f docker-compose.dev.yml up ai-service
```

The AI service will be available at: **http://localhost:8000**

### 3. **Verify Service is Running**

```bash
# Health check
curl http://localhost:8000/health

# Expected response:
# {"status":"ok","service":"ai-service"}
```

### 4. **Test Error Classification**

```bash
cd apps/ai-service

# Run test script
./test_service.sh

# Or use Python test
python test_service.py
```

## 📁 AI Service File Structure

```
apps/ai-service/
├── main.py              # Main FastAPI application
│   ├── /health         # Health check endpoint
│   ├── /classify       # Error classification endpoint
│   └── /cluster        # Error clustering endpoint
├── requirements.txt     # Python dependencies
├── Dockerfile.dev       # Docker configuration
├── test_service.py      # Automated tests
└── test_service.sh      # Shell test script
```

## 🔌 API Endpoints

### **POST /classify**

Classifies a code error using LLM analysis.

**Request:**
```json
{
  "language": "python",
  "error_output": "NameError: name 'x' is not defined",
  "code": "print(x)",
  "problem_context": "Print a variable"
}
```

**Response:**
```json
{
  "label": "Undefined Variable",
  "confidence": 0.95,
  "suggestion": "Variable 'x' is used before being defined. Initialize it first."
}
```

### **POST /cluster**

Groups similar errors for pattern analysis.

**Request:**
```json
{
  "error_signatures": [
    {
      "id": "error_1",
      "embedding": [0.1, 0.2, ...],  // Vector representation
      "label": "Syntax Error"
    }
  ],
  "n_clusters": 5
}
```

**Response:**
```json
{
  "clusters": [
    {
      "cluster_id": 0,
      "error_ids": ["error_1", "error_2"],
      "representative_label": "Syntax Error"
    }
  ]
}
```

## 🛠️ Development Workflow

### **Option 1: Docker Development (Recommended)**

```bash
# Start with live reload
docker compose -f docker-compose.dev.yml up ai-service

# View logs
docker logs -f educode-ai-service

# Restart after code changes
docker compose -f docker-compose.dev.yml restart ai-service
```

**Code changes auto-reload** thanks to volume mounting in docker-compose.dev.yml:
```yaml
volumes:
  - ./:/app  # Your local code is mounted into container
```

### **Option 2: Local Development (Without Docker)**

```bash
cd apps/ai-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY=your_key_here
export LLM_MIN_CONFIDENCE=0.75

# Run server with hot reload
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 🧪 Testing

### **Manual Testing**

```bash
# Test classification endpoint
curl -X POST http://localhost:8000/classify \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "error_output": "IndentationError: unexpected indent",
    "code": "def foo():\n    print(hello)\n      print(world)",
    "problem_context": "Print multiple lines"
  }'
```

### **Automated Tests**

```bash
cd apps/ai-service

# Run Python test suite
python test_service.py

# Run shell tests
./test_service.sh
```

### **Integration Testing with Backend**

The backend calls the AI service automatically when processing submissions:

```bash
# From backend, check integration
curl -X POST http://localhost:3001/api/code/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "problemId": "1",
    "code": "buggy code here",
    "language": "python"
  }'
```

## 🔧 Configuration

### **LLM Provider Selection Guide** 🎯

#### **Options to Research**

| Provider | Model Options | Pricing (per 1M tokens) | Pros | Cons |
|----------|---------------|------------------------|------|------|
| **OpenAI** | GPT-4o-mini<br>GPT-4o<br>GPT-3.5-turbo | $0.15 / $0.60 (mini)<br>$2.50 / $10.00 (4o)<br>$0.50 / $1.50 (3.5) | Fast, accurate, easy API | Can be expensive |
| **Anthropic** | Claude 3.5 Sonnet<br>Claude 3 Haiku | $3.00 / $15.00 (Sonnet)<br>$0.25 / $1.25 (Haiku) | Great reasoning, safety | Higher cost |
| **Google** | Gemini 1.5 Pro<br>Gemini 1.5 Flash | $1.25 / $5.00 (Pro)<br>$0.075 / $0.30 (Flash) | Very cheap, good quality | Newer, less proven |
| **Open-Source** | Llama 3.1<br>Mistral 7B | Self-hosted: $0 | No API costs | Requires GPU, maintenance |

#### **Budget Estimation Formula**

```python
# Example calculation
errors_per_day = 500  # Estimate based on user count
tokens_per_error = 200  # ~150 error text + 50 response
api_cost_per_1M_tokens = 0.60  # e.g., GPT-4o-mini output

daily_cost = (errors_per_day * tokens_per_error / 1_000_000) * api_cost_per_1M_tokens
monthly_cost = daily_cost * 30

# With caching (80% hit rate):
effective_monthly_cost = monthly_cost * 0.20  # Only 20% hit API
```

#### **Testing Checklist**

Before selecting a provider, test:
- [ ] Classification accuracy on sample errors
- [ ] Response time (< 2 seconds preferred)
- [ ] Cost per 1000 classifications
- [ ] Rate limits (requests per minute)
- [ ] API reliability and uptime
- [ ] Ease of switching providers later

#### **Recommendation Template**

```markdown
## LLM Provider Recommendation

**Selected Provider**: [Name]
**Model**: [Specific model]
**Estimated Monthly Cost**: $X
**Expected Accuracy**: X%

**Justification**:
- [Why this provider?]
- [Cost-benefit analysis]
- [Performance metrics]

**Fallback Plan**: 
- Rule-based for offline/budget constraints
- Can switch to [alternative provider]
```

### **Environment Variables**

Set these in `.env` file at project root:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | LLM API key (provider TBD) | - | ⚠️ **You need to add this** |
| `OPENAI_MODEL` | Model name | gpt-4o-mini | ❌ No (if using OpenAI) |
| `OPENAI_BASE_URL` | Custom API endpoint | - | ❌ No (for Azure/custom) |
| `LLM_MIN_CONFIDENCE` | Minimum confidence threshold | 0.75 | ❌ No |
| `PYTHONDONTWRITEBYTECODE` | Prevent .pyc files | 1 | ❌ No |
| `PYTHONUNBUFFERED` | Unbuffered output | 1 | ❌ No |

> **Current Status**: Service runs in **rule-based mode only** until you configure an LLM provider.

### **Docker Configuration**

Edit `docker-compose.dev.yml`:

```yaml
ai-service:
  environment:
    LLM_MIN_CONFIDENCE: "0.75"  # Adjust confidence threshold
  ports:
    - "8000:8000"  # Change port if needed
```

## 📊 How the System Works

### **Error Analysis Flow**

1. **Student submits code** → Frontend sends to Backend
2. **Backend runs code** → Judge0 executes and captures errors
3. **Backend calls AI Service** → POST /classify with error details
4. **AI Service analyzes** → LLM classifies error type
5. **Backend stores result** → Saves to `SubmissionError` and `ErrorSignature` tables
6. **Student sees feedback** → Intelligent error message in UI

### **Database Integration**

AI service is stateless. Backend handles database:

```typescript
// Backend stores AI service response
await prisma.errorSignature.create({
  data: {
    hash: errorHash,
    label: aiResponse.label,         // From AI service
    confidence: aiResponse.confidence, // From AI service
    sample: errorText,
    embedding: aiResponse.embedding    // For clustering
  }
})
```

## 🎓 Key Concepts

### **Error Classification**

The AI service uses LLM to categorize errors into meaningful types:

- **Syntax Errors**: Missing semicolons, brackets, etc.
- **Logic Errors**: Incorrect algorithm implementation
- **Runtime Errors**: Null pointer, division by zero, etc.
- **Type Errors**: Type mismatches, wrong data types

### **Error Clustering**

Similar errors are grouped to identify common student mistakes:

```python
# Pseudocode
errors = get_all_errors()
embeddings = [e.embedding for e in errors]
clusters = kmeans(embeddings, n_clusters=5)
# Result: 5 groups of similar errors
```

### **Confidence Scoring**

Each classification includes a confidence score (0.0 to 1.0):

- **≥ 0.9**: Very confident
- **0.75-0.89**: Confident (default threshold)
- **< 0.75**: Low confidence, may need review

## 🐛 Troubleshooting

### **Service Won't Start**

```bash
# Check logs
docker logs educode-ai-service

# Common issues:
# 1. Missing OPENAI_API_KEY
#    → Add to .env file
# 2. Port 8000 already in use
#    → Change port in docker-compose.dev.yml
# 3. Python dependencies failed
#    → Rebuild: docker compose -f docker-compose.dev.yml build ai-service
```

### **Classification Returns Low Confidence**

```python
# Adjust threshold in .env
LLM_MIN_CONFIDENCE=0.6  # Lower = more permissive
```

### **Health Check Fails**

```bash
# Check if container is running
docker ps | grep ai-service

# Check health endpoint
curl http://localhost:8000/health

# If timeout, check firewall/ports
docker compose -f docker-compose.dev.yml restart ai-service
```

### **LLM API Errors**

```bash
# Check API key is valid
echo $OPENAI_API_KEY

# Check rate limits
# OpenAI free tier: 3 requests/min
# Consider implementing retry logic or caching
```

## 📚 Additional Resources

### **Backend Integration**

See how backend calls AI service:
- File: `apps/backend/src/services/judge0.service.ts`
- Function: `classifyError()`

### **Database Schema**

AI-related tables:
- `submission_errors`: Raw error data
- `error_signatures`: Classified errors with LLM labels
- `error_clusters`: Grouped similar errors

See: `apps/backend/prisma/schema.prisma`

### **API Documentation**

When service is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🎯 Next Steps for Development

### **YOUR PRIMARY RESPONSIBILITIES** 🎯

As the AI Service developer, you are responsible for:

#### 1. **LLM Provider Selection & Budget Planning** (HIGH PRIORITY)
   - **Research LLM options**:
     - OpenAI (GPT-4o-mini, GPT-4o, GPT-3.5-turbo)
     - Anthropic Claude (Claude 3.5 Sonnet, Haiku)
     - Google Gemini
     - Open-source options (Llama 3, Mistral)
   - **Cost Analysis**:
     - Estimate: ~X errors per day × Y cost per 1K tokens
     - Consider rate limits and quotas
     - Factor in development vs production usage
   - **Performance Testing**:
     - Accuracy on sample errors
     - Response time
     - Cost per classification
   - **Deliverable**: Recommendation document with chosen provider, API key, and budget justification

#### 2. **Improve Classification Accuracy**
   - Fine-tune LLM prompts in `llm_client.py`
   - Add more context (problem description, test cases, student history)
   - Experiment with different models and temperature settings
   - Test with real student error data
   - Measure improvement: accuracy, precision, recall

#### 3. **Add Caching**
   - Implement Redis caching for identical errors
   - Cache LLM responses to reduce API costs
   - Set appropriate TTL (time-to-live)
   - Track cache hit rate
   - **Goal**: Reduce API calls by 60-80%

#### 4. **Better Error Clustering**
   - Implement HDBSCAN or DBSCAN (better than K-means)
   - Auto-determine optimal cluster count
   - Generate embeddings for all error types
   - Visualize clusters for instructors
   - Group similar student mistakes

### **Immediate Tasks** (First Week)

1. ✅ Verify service starts and responds to health check
2. ✅ Test `/errors/classify` endpoint with rule-based classification
3. ✅ Review `main.py`, `error_classifier.py`, `llm_client.py`
4. 🔲 **Research and select LLM provider (Budget analysis required)**
5. 🔲 **Set up API key and test LLM integration**
6. 🔲 Benchmark rule-based vs LLM accuracy
7. 🔲 Design caching strategy

### **Current State** (What Works Now)

### **Current State** (What Works Now)

- ✅ **Rule-based classification**: Fast, works for ~20 common error patterns
- ✅ **Service architecture**: FastAPI endpoints ready
- ✅ **LLM integration code**: Written but inactive (no API key)
- ✅ **Fallback logic**: LLM triggers when rule confidence < 0.75
- ❌ **LLM provider**: Not selected yet
- ❌ **Caching**: Not implemented
- ❌ **Embeddings/Clustering**: Not implemented

### **Enhancement Ideas** (Beyond Core Responsibilities)

1. **~~Improve Classification Accuracy~~** ✅ *Core responsibility - see above*

2. **~~Add Caching~~** ✅ *Core responsibility - see above*

3. **~~Better Error Clustering~~** ✅ *Core responsibility - see above*

4. **Extended Features** (Future work)
   - Code suggestions/fixes
   - Personalized hints based on student level
   - Multi-language support improvements

5. **Performance Optimization**
   - Batch processing for multiple errors
   - Async LLM calls
   - Response streaming

## 🤝 Getting Help

### **Quick Reference**

```bash
# Common commands
docker compose -f docker-compose.dev.yml up ai-service     # Start
docker compose -f docker-compose.dev.yml restart ai-service # Restart
docker compose -f docker-compose.dev.yml logs ai-service    # View logs
docker compose -f docker-compose.dev.yml down               # Stop all

# Test credentials
Email: test@example.com
Password: password123

# Service URLs
Frontend: http://localhost:3000
Backend: http://localhost:3001
AI Service: http://localhost:8000
Postgres: localhost:5432
```

### **Project Structure Quick Ref**

```
Your focus: apps/ai-service/
Backend integration: apps/backend/src/services/judge0.service.ts
Database schema: apps/backend/prisma/schema.prisma
Environment: .env (project root)
Docker config: docker-compose.dev.yml
```

## ✨ Welcome to the Team!

You're working on the **AI brain** of the platform. Your improvements will directly help students learn from their mistakes. Good luck! 🚀

---

**Last Updated**: November 3, 2025  
**Maintained By**: EduCode Team  
**Questions?** Check the main README.md or ask in team chat
