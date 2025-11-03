# AI Service - Your To-Do List 🎯

## Current Status

✅ **What's Done**:
- FastAPI service structure is complete
- Rule-based error classification (20+ patterns) works
- LLM integration code is written (in `llm_client.py`)
- Service runs and responds, but **LLM is not active** (no API key)

⚠️ **What's Needed**: **YOUR WORK STARTS HERE**

---

## High Priority Tasks

### 1. 🔍 LLM Provider Research & Selection (Week 1)

**Your Decision**: Choose which LLM provider to use based on budget.

#### Research These Options:

| Provider | Best Model | Cost/1M tokens | Notes |
|----------|-----------|----------------|-------|
| OpenAI | GPT-4o-mini | $0.15 / $0.60 | Currently in code, easy to use |
| Google | Gemini 1.5 Flash | $0.075 / $0.30 | **Cheapest option** |
| Anthropic | Claude 3 Haiku | $0.25 / $1.25 | Good for reasoning |
| Open-Source | Llama 3.1 | $0 (self-host) | Need GPU server |

#### Budget Calculation:

```python
# Estimate our usage:
students = 50  # How many students will use this?
errors_per_student_per_day = 10
tokens_per_error = 200  # ~150 input + 50 output

daily_api_calls = students * errors_per_student_per_day
monthly_api_calls = daily_api_calls * 30

# Cost (example with GPT-4o-mini at $0.60 per 1M output tokens):
monthly_cost = (monthly_api_calls * tokens_per_error / 1_000_000) * 0.60

# With 80% cache hit rate:
effective_cost = monthly_cost * 0.20  # Only 20% hit API
```

#### What You Need to Deliver:

```markdown
## LLM Provider Recommendation

**Provider**: [Your choice]
**Model**: [Specific model]
**Estimated Monthly Cost**: $X
**Why**: [1-2 sentences justification]

**Setup**:
1. Created account at [provider]
2. Got API key: [first 10 chars]...
3. Added to .env file
4. Tested with sample errors
```

---

### 2. 🧪 Test LLM Integration (Week 1)

Once you have an API key:

```bash
# 1. Add your API key to .env
echo "OPENAI_API_KEY=your_key_here" >> .env
echo "OPENAI_MODEL=gpt-4o-mini" >> .env

# 2. Restart AI service
docker compose -f docker-compose.dev.yml restart ai-service

# 3. Test with a confusing error (triggers LLM)
curl -X POST http://localhost:8000/errors/classify \
  -H "Content-Type: application/json" \
  -d '{
    "text": "unexpected symbol near '\''#'\''",
    "language": "python"
  }'

# Should now see: "source": "llm" (not "rule-based")
```

**Success Criteria**:
- LLM responds with reasonable labels
- Response time < 3 seconds
- Cost per call is within budget

---

### 3. ⚡ Implement Caching (Week 2)

**Goal**: Reduce API costs by 80% by caching identical errors.

#### Files to Modify:

1. **`apps/ai-service/cache.py`** (create new file):
```python
import redis
import json
import hashlib

redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)

def get_cached_classification(error_text: str):
    """Check if we've seen this error before."""
    key = f"error:{hashlib.sha256(error_text.encode()).hexdigest()}"
    cached = redis_client.get(key)
    if cached:
        return json.loads(cached)
    return None

def cache_classification(error_text: str, result: dict, ttl: int = 86400):
    """Cache classification for 24 hours."""
    key = f"error:{hashlib.sha256(error_text.encode()).hexdigest()}"
    redis_client.setex(key, ttl, json.dumps(result))
```

2. **Update `error_classifier.py`**:
```python
from cache import get_cached_classification, cache_classification

def classify_error(request: ClassifyRequest) -> ClassifyResponse:
    normalized = normalize_error(request.text)
    
    # Check cache first
    cached = get_cached_classification(normalized)
    if cached:
        return ClassifyResponse(**cached, source=f"{cached['source']}-cached")
    
    # ... existing classification logic ...
    
    # Cache the result
    result_dict = response.dict()
    cache_classification(normalized, result_dict)
    
    return response
```

**Metrics to Track**:
- Cache hit rate (target: 80%)
- Average response time (should drop significantly)
- API cost savings

---

### 4. 🎯 Improve Classification Accuracy (Week 2-3)

**Current**: Rule-based + LLM fallback  
**Goal**: Better labels, higher confidence

#### Improvements to Make:

1. **Better LLM Prompts** (edit `llm_client.py`):
```python
system = (
    "You are an expert programming tutor analyzing student code errors. "
    "Classify the error into ONE of these categories:\n"
    "- Missing semicolon\n"
    "- Missing/mismatched braces\n"
    "- Undefined variable\n"
    "- Type mismatch\n"
    # ... add more categories
    "\nProvide:\n"
    "1. label: Choose the MOST SPECIFIC category\n"
    "2. confidence: 0.0-1.0 (be conservative)\n"
    "3. explanation: Brief reason (1 sentence)\n"
)
```

2. **Add More Context**:
   - Include problem description
   - Show relevant code snippet
   - Consider student's history (beginner vs advanced)

3. **Test with Real Data**:
   - Collect 50-100 real student errors
   - Manually label them (ground truth)
   - Measure accuracy: correct labels / total errors

**Target**: 85%+ accuracy on test set

---

### 5. 🗂️ Implement Error Clustering (Week 3-4)

**Goal**: Group similar errors to identify common student mistakes.

#### What to Build:

1. **Generate Embeddings** (add to `llm_client.py`):
```python
def get_error_embedding(error_text: str) -> list[float]:
    """Convert error to vector for clustering."""
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",  # Cheap: $0.02/1M tokens
        input=error_text
    )
    return response.data[0].embedding
```

2. **Clustering** (create `clustering.py`):
```python
from sklearn.cluster import HDBSCAN
import numpy as np

def cluster_errors(embeddings: list[list[float]], min_cluster_size: int = 5):
    """Group similar errors using HDBSCAN."""
    X = np.array(embeddings)
    clusterer = HDBSCAN(min_cluster_size=min_cluster_size)
    labels = clusterer.fit_predict(X)
    return labels
```

3. **Add Endpoint** (in `main.py`):
```python
@app.post("/errors/cluster")
def cluster_similar_errors(error_ids: list[str]):
    # Fetch errors from database
    # Get embeddings
    # Run clustering
    # Return clusters
    pass
```

**Use Case**: Instructor dashboard showing "Top 5 error patterns this week"

---

## Timeline Summary

| Week | Focus | Deliverable |
|------|-------|-------------|
| Week 1 | LLM Research | Provider recommendation + API key setup |
| Week 2 | Caching | Redis integration, 80% cache hit rate |
| Week 2-3 | Accuracy | Improved prompts, 85%+ accuracy |
| Week 3-4 | Clustering | Error grouping for instructor insights |

---

## Files You'll Work With

**Primary Files**:
- `apps/ai-service/error_classifier.py` - Main classification logic
- `apps/ai-service/llm_client.py` - LLM API calls
- `apps/ai-service/main.py` - FastAPI endpoints

**New Files to Create**:
- `apps/ai-service/cache.py` - Redis caching
- `apps/ai-service/clustering.py` - Error clustering
- `apps/ai-service/requirements.txt` - Add: redis, scikit-learn, hdbscan

**Dependencies to Add**:
```txt
redis==5.0.1
scikit-learn==1.3.2
hdbscan==0.8.33
```

---

## Success Metrics

By the end of your work, the system should have:

- [ ] LLM provider selected and documented
- [ ] API costs < $50/month (with caching)
- [ ] Classification accuracy > 85%
- [ ] Cache hit rate > 80%
- [ ] Response time < 2 seconds average
- [ ] Error clustering working for instructor dashboard

---

## Getting Help

**Questions?** Check these docs:
1. `AI_SERVICE_QUICKSTART.md` - Complete development guide
2. `PLATFORM_OVERVIEW.md` - System architecture
3. `apps/ai-service/README.md` - Quick reference

**Stuck?** Common issues:
- **LLM not triggering**: Confidence needs to be < 0.75 (set in .env)
- **Redis connection**: Make sure Redis container is running
- **Import errors**: Rebuild container after adding dependencies

---

## Current System Without LLM

The system works right now with **rule-based only**:
- 20+ error patterns matched with regex
- Fast (< 50ms response time)
- No API costs
- ~70% accuracy

**Your job**: Make it smarter with LLM while keeping costs low! 🚀

Good luck! 💪
