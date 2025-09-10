from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/detectMood")
async def detect_mood():
    return {"mood": "happy", "confidence": 0.99, "source": "mock"}