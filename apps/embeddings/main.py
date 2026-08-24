from pathlib import Path

import joblib
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI(title="neetaspirants-embeddings")
model = SentenceTransformer("all-MiniLM-L6-v2")

TOXICITY_MODEL_PATH = Path(__file__).parent / "models" / "toxicity_model.joblib"
toxicity_model = joblib.load(TOXICITY_MODEL_PATH) if TOXICITY_MODEL_PATH.exists() else None


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    vector: list[float]
    dimensions: int


class ToxicityRequest(BaseModel):
    text: str


class ToxicityResponse(BaseModel):
    toxic: bool
    score: float


class StressRequest(BaseModel):
    text: str


class StressResponse(BaseModel):
    stressed: bool
    score: float


# Interim keyword-weighted heuristic for /analyze/stress, pending a trained
# classifier (mirroring train_toxicity.py) once labeled data (e.g. Dreaddit)
# is available on disk. Weights are hand-picked, not learned.
STRESS_PHRASES: dict[str, float] = {
    "overwhelmed": 0.9,
    "can't cope": 0.9,
    "cant cope": 0.9,
    "burnout": 0.85,
    "burnt out": 0.8,
    "so stressed": 0.9,
    "stressed out": 0.85,
    "panic attack": 0.9,
    "panicking": 0.8,
    "can't sleep": 0.7,
    "cant sleep": 0.7,
    "hopeless": 0.9,
    "want to give up": 0.9,
    "giving up": 0.75,
    "exhausted": 0.6,
    "so tired": 0.55,
    "breaking down": 0.85,
    "crying": 0.65,
    "cried": 0.6,
    "depressed": 0.85,
    "anxious": 0.7,
    "anxiety": 0.7,
    "nervous": 0.5,
    "worried": 0.55,
    "scared": 0.55,
    "afraid": 0.5,
    "failed": 0.55,
    "failure": 0.55,
    "not good enough": 0.7,
    "behind schedule": 0.5,
    "running out of time": 0.6,
    "pressure": 0.45,
    "deadline": 0.35,
    "low rank": 0.5,
    "bad marks": 0.5,
    "bad score": 0.5,
}

CALM_PHRASES: dict[str, float] = {
    "feeling confident": 0.5,
    "confident": 0.35,
    "relaxed": 0.5,
    "calm": 0.45,
    "motivated": 0.35,
    "excited": 0.3,
    "happy": 0.35,
    "grateful": 0.35,
    "proud": 0.35,
    "good score": 0.4,
    "good marks": 0.4,
    "improved": 0.3,
    "on track": 0.35,
}


def _rule_based_stress_score(text: str) -> float:
    lowered = text.lower()
    signal = 0.0
    hits = 0
    for phrase, weight in STRESS_PHRASES.items():
        if phrase in lowered:
            signal += weight
            hits += 1
    for phrase, weight in CALM_PHRASES.items():
        if phrase in lowered:
            signal -= weight
            hits += 1
    if hits == 0:
        return 0.2
    score = 0.5 + (signal / hits) / 2
    return max(0.0, min(1.0, score))


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    vector = model.encode(req.text, normalize_embeddings=True).tolist()
    return EmbedResponse(vector=vector, dimensions=len(vector))


@app.post("/moderate/toxicity", response_model=ToxicityResponse)
def moderate_toxicity(req: ToxicityRequest):
    if toxicity_model is None:
        return ToxicityResponse(toxic=False, score=0.0)
    score = float(toxicity_model.predict_proba([req.text])[0][1])
    return ToxicityResponse(toxic=score >= 0.5, score=score)


@app.post("/analyze/stress", response_model=StressResponse)
def analyze_stress(req: StressRequest):
    score = _rule_based_stress_score(req.text)
    return StressResponse(stressed=score >= 0.5, score=score)
