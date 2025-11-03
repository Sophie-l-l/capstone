# AI Service Quick Start Guide

## 🎯 Overview

The AI Service is a Python FastAPI microservice responsible for analyzing student code submissions and classifying errors using LLM (Large Language Model) technology. It provides intelligent error detection, classification, and similarity clustering to help students understand and learn from their mistakes.

## 📋 Prerequisites

- Docker & Docker Compose installed
- Python 3.11+ (for local development)
- OpenAI API key (or other LLM provider)
- Basic knowledge of FastAPI and Python async/await

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

# Create .env file with your API keys
cat > .env << EOF
OPENAI_API_KEY=your_openai_api_key_here
LLM_MIN_CONFIDENCE=0.75
EOF
```

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

### **Environment Variables**

Set these in `.env` file at project root:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key for LLM | - | ✅ Yes |
| `LLM_MIN_CONFIDENCE` | Minimum confidence threshold | 0.75 | ❌ No |
| `PYTHONDONTWRITEBYTECODE` | Prevent .pyc files | 1 | ❌ No |
| `PYTHONUNBUFFERED` | Unbuffered output | 1 | ❌ No |

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

### **Immediate Tasks**

1. ✅ Verify service starts and responds to health check
2. ✅ Test `/classify` endpoint with sample errors
3. ✅ Review `main.py` to understand current implementation
4. 🔲 Add your LLM improvements

### **Enhancement Ideas**

1. **Improve Classification Accuracy**
   - Fine-tune prompts in `main.py`
   - Add more context (problem description, test cases)
   - Experiment with different LLM models

2. **Add Caching**
   - Cache identical errors to reduce API calls
   - Use Redis for distributed caching

3. **Better Error Clustering**
   - Implement HDBSCAN instead of K-means
   - Auto-determine optimal cluster count
   - Add hierarchical clustering

4. **Extended Features**
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
