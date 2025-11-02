from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from error_classifier import classify_error, ClassifyRequest, ClassifyResponse

app = FastAPI(title="AI-Service", version="1.0.0")

# Allow local dev origins for backend and frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",  # backend
        "http://backend:3001",
        "http://localhost:3000",  # frontend
        "http://localhost:3002",  # frontend (alt port)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BKTUpdate(BaseModel):
    userId: str
    kcId: str
    correct: bool

@app.get("/health")
def health():
    return { "status": "ok", "service": "ai-service" }

@app.post("/bkt/update")
def update_bkt(data: BKTUpdate):
    # placeholder: return fixed values
    return {
        "userId": data.userId,
        "kcId": data.kcId,
        "pKnown": 0.65,
        "updated": True
    }

@app.post("/errors/classify", response_model=ClassifyResponse)
def classify_error_endpoint(request: ClassifyRequest):
    """
    Classify compiler or runtime errors into semantic categories.
    Uses rule-based matching for common patterns, with future LLM fallback.
    """
    return classify_error(request)


# Compatibility endpoint for clients that post { error_message: string }
class LegacyClassifyRequest(BaseModel):
    error_message: str
    language: Optional[str] = None


class LegacyClassifyResponse(BaseModel):
    label: str
    confidence: float
    embedding: Optional[List[float]] = None
    source: str


@app.post("/errors/classify-legacy", response_model=LegacyClassifyResponse)
def classify_error_legacy(req: LegacyClassifyRequest):
    result = classify_error(ClassifyRequest(text=req.error_message, language=req.language))
    return LegacyClassifyResponse(
        label=result.label,
        confidence=result.confidence,
        embedding=result.embedding,
        source=result.source,
    )
