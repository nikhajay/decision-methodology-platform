"""
main.py — FastAPI backend for the SDLC Model Advisor
(Waterfall vs Agile vs Hybrid suitability + performance analysis)

Run:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal, List
from app.calculations import analyze

app = FastAPI(
    title="SDLC Model Advisor API",
    description="Recommends Waterfall / Agile / Hybrid based on project baseline factors.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev-friendly; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BaselineInput(BaseModel):
    project_name: str = Field(..., example="Customer Portal")
    kloc: float = Field(..., gt=0, example=60)
    base_effort_pm: float = Field(..., gt=0, example=480)
    team_cost_per_pm_lakh: float = Field(..., gt=0, example=1.2)
    target_budget_cr: float = Field(..., gt=0, example=15)
    target_duration_months: float = Field(..., gt=0, example=8)
    requirement_change_pct: float = Field(..., ge=0, le=100, example=30)
    billing: Literal["fixed_price", "time_material"] = "fixed_price"
    compliance: Literal["low", "medium", "high"] = "medium"
    technical_uncertainty: Literal["low", "medium", "high"] = "medium"
    feedback: Literal["low", "medium", "high"] = "medium"
    fixed_scope: bool = True
    fixed_price: bool = True


class HistoryItem(BaseModel):
    project_name: str
    recommended_model: str
    opi: float


# Very small in-memory history so the frontend can show "recent analyses"
# without needing a database for this MVP.
_HISTORY: List[dict] = []


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze")
def analyze_baseline(payload: BaselineInput):
    try:
        result = analyze(payload.dict())
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=400, detail=str(exc))

    _HISTORY.insert(
        0,
        {
            "project_name": payload.project_name,
            "recommended_model": result["recommendation"]["recommended_label"],
            "opi": result["opi"][result["recommendation"]["recommended_model"]]["opi"],
        },
    )
    del _HISTORY[20:]  # keep last 20

    return result


@app.get("/api/history")
def history():
    return _HISTORY




import re 
import html 
import urllib.request 

def print_secret_message(url: str) -> None: 
    """Fetch Google Doc data and print the secret message grid.""" 
    # Fetch document 
    with urllib.request.urlopen(url) as response: 
        content = response.read().decode("utf-8") 

    # Decode HTML entities such as &#9608; 
    content = html.unescape(content) 

    # Remove HTML tags 
    text = re.sub(r"<[^>]+>", "\n", content) 

    points = {} 
    max_x = max_y = 0 

    # Look for rows containing: 
    # x-coordinate, character, y-coordinate 
    for line in text.splitlines(): 
        line = " ".join(line.split()) 

        # Find three fields separated by whitespace 
        match = re.match(r"^(\d+)\s+(.+?)\s+(\d+)$", line) 
        if not match: 
            continue

            x = int(match.group(1)) 
            character = match.group(2) 
            y = int(match.group(3)) 

            points[(x, y)] = character 
            max_x = max(max_x, x) 
            max_y = max(max_y, y) 

        # Print top -> bottom because y=0 is the bottom. 
        for y in range(max_y, -1, -1): 
            
            print( 
                "".join( 
                    points.get((x, y), " ") 
                    for x in range(max_x + 1) 
                    ).rstrip() 
                ) 
            
            if __name__ == "__main__": 
                print_secret_message( 
                    "https://docs.google.com/document/d/e/" 
                    "2PACX-1vTMOmshQe8YvaRXi6gEPKKlsC6UpFJSMAk4mQjLm_u1gmHdVVTaeh7nBNFBRlui0sTZ-snGwZM4DBCT/pub" 
                )