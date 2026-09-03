"""
main.py — FastAPI backend for the SDLC Model Advisor
(Waterfall vs Agile vs Hybrid suitability + performance analysis,
 mid-project change-impact analysis, PDF report export,
 role-based login, and the post-login project list)

Run:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Everything except /api/health and /api/auth/login requires a Bearer token
from /api/auth/login — see auth.py for the seven demo accounts (one per
role) and README.md for how to try them.
"""

import os
import sys
from datetime import datetime
from typing import List, Literal, Optional

# Make sure this file's own directory is on sys.path, so the sibling modules
# (calculations.py, change_analysis.py, report_pdf.py, auth.py, projects.py)
# are importable no matter what working directory the server process was
# started from (Passenger, gunicorn, a systemd unit, etc. don't always cwd
# into this folder).
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from calculations import analyze
from change_analysis import analyze_change_request
from report_pdf import build_baseline_pdf, build_change_pdf
from auth.auth import (
    LoginRequest,
    TokenResponse,
    UserOut,
    ROLES,
    ROLE_TO_USERNAME,
    authenticate,
    create_access_token,
    get_current_user,
)
from projects import (
    ProjectCreate,
    ProjectUpdate,
    STATUS_LABEL,
    seed_demo_projects,
    list_projects,
    create_project,
    update_project,
    delete_project,
)

app = FastAPI(
    title="SDLC Model Advisor API",
    description=(
        "Recommends Waterfall / Agile / Hybrid from a project baseline, "
        "re-evaluates that choice when a mid-project change request lands, "
        "exports either result as a PDF, and tracks every analyzed project "
        "in a login-protected project list."
    ),
    version="1.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev-friendly; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _on_startup():
    seed_demo_projects()


# --------------------------------------------------------------------------- #
# Schemas (baseline / change-request — unchanged shape from before)
# --------------------------------------------------------------------------- #

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


class ChangeRequestPayload(BaseModel):
    original_inputs: BaselineInput
    chosen_model: Literal["waterfall", "agile", "hybrid"]

    change_title: str = "Untitled change"
    change_description: str = ""
    urgency: Literal["low", "medium", "high"] = "medium"

    current_phase: Literal["requirements", "design", "development", "testing", "deployment"]
    percent_complete: float = Field(0, ge=0, le=100)
    additional_effort_pm: float = Field(..., ge=0)

    architecture_areas: List[
        Literal["ui", "api", "business_logic", "database", "integration", "infrastructure"]
    ] = []

    change_requirement_volatility_pct: float = Field(..., ge=0, le=100)


# Very small in-memory run history so the frontend can show "recent
# analyses" without needing a database for this MVP.
_HISTORY: List[dict] = []


def _push_history(project_name: str, label: str, kind: str, opi: Optional[float], run_by: str):
    _HISTORY.insert(0, {
        "project_name": project_name,
        "label": label,
        "kind": kind,
        "opi": opi,
        "run_by": run_by,
    })
    del _HISTORY[20:]  # keep last 20


# --------------------------------------------------------------------------- #
# Health (public — used for uptime checks, no login needed)
# --------------------------------------------------------------------------- #

@app.get("/api/health")
def health():
    return {"status": "ok"}


# --------------------------------------------------------------------------- #
# Auth
# --------------------------------------------------------------------------- #

@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    user = authenticate(payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(user)
    return TokenResponse(access_token=token, user=user)


@app.get("/api/auth/me", response_model=UserOut)
def me(current_user: UserOut = Depends(get_current_user)):
    return current_user


@app.get("/api/auth/demo-accounts")
def demo_accounts():
    """Public on purpose — lets the login screen offer a role dropdown that
    auto-fills the matching demo username. Never returns passwords."""
    return [{"role": role, "username": ROLE_TO_USERNAME[role]} for role in ROLES]


# --------------------------------------------------------------------------- #
# Run history (login required)
# --------------------------------------------------------------------------- #

@app.get("/api/history")
def history(current_user: UserOut = Depends(get_current_user)):
    return _HISTORY


# --------------------------------------------------------------------------- #
# 1. First-time baseline analysis (login required)
# --------------------------------------------------------------------------- #

@app.post("/api/analyze")
def analyze_baseline(payload: BaselineInput, current_user: UserOut = Depends(get_current_user)):
    try:
        result = analyze(payload.dict())
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=400, detail=str(exc))

    winner = result["recommendation"]["recommended_model"]
    _push_history(
        payload.project_name,
        result["recommendation"]["recommended_label"],
        "baseline",
        result["opi"][winner]["opi"],
        current_user.username,
    )
    return result


@app.post("/api/analyze/pdf")
def analyze_baseline_pdf(
    payload: BaselineInput,
    label: str = "First-time baseline",
    current_user: UserOut = Depends(get_current_user),
):
    """Download the SAME baseline result as a PDF. Call this again with a
    different `label` (e.g. 'Recalculated baseline') any time the inputs
    are revised later — the frontend tracks first-run vs modified-run."""
    try:
        result = analyze(payload.dict())
        buf = build_baseline_pdf(result, datetime.now().strftime("%d %b %Y, %H:%M"), run_label=label)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=400, detail=str(exc))

    filename = f'{payload.project_name.strip().replace(" ", "_") or "project"}_baseline_report.pdf'
    return Response(
        content=buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# --------------------------------------------------------------------------- #
# 2. Mid-project change request (login required)
# --------------------------------------------------------------------------- #

@app.post("/api/change-request")
def change_request(payload: ChangeRequestPayload, current_user: UserOut = Depends(get_current_user)):
    try:
        result = analyze_change_request(payload.dict())
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=400, detail=str(exc))

    _push_history(
        payload.original_inputs.project_name,
        f"Change: {payload.change_title}",
        "change",
        result["original_result"]["opi"][payload.chosen_model]["opi"],
        current_user.username,
    )
    return result


@app.post("/api/change-request/pdf")
def change_request_pdf(
    payload: ChangeRequestPayload,
    label: str = "Change request",
    current_user: UserOut = Depends(get_current_user),
):
    try:
        result = analyze_change_request(payload.dict())
        buf = build_change_pdf(result, datetime.now().strftime("%d %b %Y, %H:%M"), run_label=label)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=400, detail=str(exc))

    filename = f'{payload.original_inputs.project_name.strip().replace(" ", "_") or "project"}_change_report.pdf'
    return Response(
        content=buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# --------------------------------------------------------------------------- #
# 3. Project list (login required) — every project shows up here with a
#    status of waiting to start / running (+ completion %) / delivered.
# --------------------------------------------------------------------------- #

@app.get("/api/projects")
def get_projects(current_user: UserOut = Depends(get_current_user)):
    return {"status_labels": STATUS_LABEL, "projects": list_projects()}


@app.post("/api/projects")
def post_project(payload: ProjectCreate, current_user: UserOut = Depends(get_current_user)):
    return create_project(payload, owner=current_user.username)


@app.patch("/api/projects/{project_id}")
def patch_project(
    project_id: int, payload: ProjectUpdate, current_user: UserOut = Depends(get_current_user)
):
    updated = update_project(project_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated


@app.delete("/api/projects/{project_id}")
def remove_project(project_id: int, current_user: UserOut = Depends(get_current_user)):
    if not delete_project(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return {"deleted": True}
