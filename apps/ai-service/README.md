# AI Service

Intelligent error classification and analysis service for EduCode platform.

## 🚀 Quick Start

```bash
# From project root
docker compose -f docker-compose.dev.yml up ai-service

# Or local development
cd apps/ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## 🔗 Service URL

**http://localhost:8000**

## 📖 Full Documentation

See the comprehensive guides at the project root:

- **[AI_SERVICE_QUICKSTART.md](../../AI_SERVICE_QUICKSTART.md)** - Complete development guide
- **[PLATFORM_OVERVIEW.md](../../PLATFORM_OVERVIEW.md)** - System architecture

## 🧪 Quick Test

```bash
# Health check
curl http://localhost:8000/health

# Test classification
curl -X POST http://localhost:8000/classify \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "error_output": "NameError: name 'x' is not defined",
    "code": "print(x)"
  }'
```

## 📋 Environment Variables

Required in `.env` at project root:
```bash
OPENAI_API_KEY=your_key_here
LLM_MIN_CONFIDENCE=0.75
```

## 🛠️ Files

- `main.py` - FastAPI application
- `requirements.txt` - Python dependencies
- `test_service.py` - Test script
- `test_service.sh` - Shell test runner

## 📚 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/classify` | POST | Classify error with LLM |
| `/cluster` | POST | Cluster similar errors |
| `/docs` | GET | Swagger UI documentation |

## 🤝 Integration

Backend calls this service at:
- `apps/backend/src/services/judge0.service.ts`

Database tables:
- `submission_errors` - Raw errors
- `error_signatures` - AI classifications
- `error_clusters` - Grouped errors

---

**For detailed setup, architecture, and development workflow**, please read:
👉 **[AI_SERVICE_QUICKSTART.md](../../AI_SERVICE_QUICKSTART.md)**
