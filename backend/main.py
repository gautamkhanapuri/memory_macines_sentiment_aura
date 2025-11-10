from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv
import httpx
import json

# Load environment variables
load_dotenv()

app = FastAPI(title="Sentiment Aura Backend")

# CORS - allow frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class TextRequest(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    sentiment: float  # -1.0 (negative) to 1.0 (positive)
    keywords: List[str]
    raw_sentiment: str  # "positive", "negative", "neutral"


# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


@app.get("/")
async def root():
    return {
        "message": "Sentiment Aura Backend API",
        "status": "running",
        "endpoints": ["/process_text"]
    }


@app.post("/process_text", response_model=SentimentResponse)
async def process_text(request: TextRequest):
    """
    Analyze text for sentiment and extract keywords using Groq LLM
    """
    if not request.text or len(request.text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Text too short to analyze")

    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    try:
        # Construct the prompt for the LLM
        system_prompt = """You are a sentiment and keyword extraction system.
            Analyze the given text and return ONLY a valid JSON object with this exact structure:
            {
              "sentiment": "positive" | "negative" | "neutral",
              "sentiment_score": <float between -1.0 and 1.0>,
              "keywords": [<list of 3-5 key words or short phrases>]
            }
            
            Rules:
            - sentiment_score: -1.0 = very negative, 0.0 = neutral, 1.0 = very positive
            - keywords: extract the most important topics, emotions, or subjects (3-5 items max)
            - Return ONLY the JSON, no additional text"""

        user_prompt = f"Text to analyze: {request.text}"

        # Call Groq API
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",  # Fast and accurate
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.3,  # Lower = more consistent
                    "max_tokens": 200
                }
            )
            response.raise_for_status()

        # Parse Groq response
        groq_data = response.json()
        ai_response = groq_data["choices"][0]["message"]["content"]

        # Extract JSON from response (sometimes LLMs add extra text)
        ai_response = ai_response.strip()
        if "```json" in ai_response:
            ai_response = ai_response.split("```json")[1].split("```")[0].strip()
        elif "```" in ai_response:
            ai_response = ai_response.split("```")[1].split("```")[0].strip()

        # Parse the AI's JSON response
        parsed = json.loads(ai_response)

        return SentimentResponse(
            sentiment=float(parsed.get("sentiment_score", 0.0)),
            keywords=parsed.get("keywords", [])[:5],  # Max 5 keywords
            raw_sentiment=parsed.get("sentiment", "neutral")
        )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="LLM API timeout")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"LLM API error: {str(e)}")
    except json.JSONDecodeError as e:
        # Fallback if JSON parsing fails
        print(f"JSON parse error: {e}")
        print(f"Raw response: {ai_response}")
        raise HTTPException(status_code=500, detail="Failed to parse LLM response")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "groq_api_configured": bool(GROQ_API_KEY)
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)