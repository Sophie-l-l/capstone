from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

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
