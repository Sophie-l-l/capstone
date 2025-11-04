from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from error_classifier import classify_error, ClassifyRequest, ClassifyResponse
from openai import OpenAI
from pydantic import BaseModel
import numpy as np
from sklearn.cluster import KMeans

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


# Debug endpoint (temporary) - returns masked env var presence for troubleshooting
@app.get("/debug/env")
def debug_env():
    def mask(v: str | None):
        if v is None:
            return None
        return (v[:10] + "...") if len(v) > 10 else v

    return {
        "OPENAI_API_KEY": mask(os.getenv("OPENAI_API_KEY")),
        "OPENAI_MODEL": os.getenv("OPENAI_MODEL"),
        "LLM_MIN_CONFIDENCE": os.getenv("LLM_MIN_CONFIDENCE"),
        "OPENAI_BASE_URL": os.getenv("OPENAI_BASE_URL"),
        "OPENAI_API_BASE": os.getenv("OPENAI_API_BASE"),
        "OPENAI_API_BASE_URL": os.getenv("OPENAI_API_BASE_URL"),
        "HTTP_PROXY": os.getenv("HTTP_PROXY"),
        "HTTPS_PROXY": os.getenv("HTTPS_PROXY"),
        "ALL_PROXY": os.getenv("ALL_PROXY"),
        # lowercase variants (httpx and many tools respect these)
        "http_proxy": os.getenv("http_proxy"),
        "https_proxy": os.getenv("https_proxy"),
        "all_proxy": os.getenv("all_proxy"),
    }


@app.get("/debug/openai")
def debug_openai():
    """Construct an OpenAI client object and return what base-url attributes it exposes.
    This helps diagnose which URL the SDK will attempt to call (no network requests).
    """
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL") or None
    try:
        client = OpenAI(api_key=api_key, base_url=base_url) if base_url else OpenAI(api_key=api_key)
    except Exception as e:
        return {"error": str(e)}

    def first_non_none(*vals):
        for v in vals:
            if v:
                return v
        return None

    candidate_urls = {
        "client.base_url": getattr(client, "base_url", None),
        "client._base_url": getattr(client, "_base_url", None),
        "client._client.base_url": getattr(getattr(client, "_client", None), "base_url", None),
        "client._client._base_url": getattr(getattr(client, "_client", None), "_base_url", None),
    }

    # Mask any long values
    def mask_val(v):
        if v is None:
            return None
        s = str(v)
        return s if len(s) < 100 else s[:100] + "..."

    return {k: mask_val(v) for k, v in candidate_urls.items()}


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


class ClusterRequest(BaseModel):
    embeddings: List[List[float]]
    n_clusters: Optional[int] = 5


@app.post("/errors/cluster")
def cluster_embeddings(req: ClusterRequest):
    """Run k-means clustering on provided embeddings and return cluster ids.

    This endpoint accepts a JSON body with `embeddings` (array of vectors) and
    optional `n_clusters`. It returns a list of cluster assignments.
    """
    embs = np.array(req.embeddings)
    if embs.size == 0:
        return {"clusters": [], "n_clusters": 0}

    # Cap n_clusters to number of items
    k = max(1, min(req.n_clusters, embs.shape[0]))
    try:
        kmeans = KMeans(n_clusters=k, random_state=42)
        labels = kmeans.fit_predict(embs)
        centers = kmeans.cluster_centers_.tolist()
        return {"clusters": labels.tolist(), "centers": centers}
    except Exception as e:
        return {"error": str(e)}


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
