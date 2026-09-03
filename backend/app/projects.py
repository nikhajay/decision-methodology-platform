"""
projects.py
===========
The post-login project list: every analyzed project can be saved here and
tracked through three states — waiting to start, running (with a completion
%), delivered.

Storage is an in-memory list for this MVP (mirrors the `_HISTORY` pattern
already used in main.py). The function signatures already return/accept
plain dicts shaped like DB rows, so swapping in a real table later is a
localized change — nothing above this module needs to know.
"""

from __future__ import annotations

import itertools
import time
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

StatusLiteral = Literal["waiting_to_start", "running", "delivered"]

STATUS_LABEL = {
    "waiting_to_start": "Waiting to start",
    "running": "Running",
    "delivered": "Delivered",
}

_id_counter = itertools.count(1)
_PROJECTS: List[dict] = []


class ProjectCreate(BaseModel):
    name: str
    recommended_model: Optional[Literal["waterfall", "agile", "hybrid"]] = None
    opi: Optional[float] = None
    status: StatusLiteral = "waiting_to_start"
    completion_pct: float = Field(0, ge=0, le=100)


class ProjectUpdate(BaseModel):
    status: Optional[StatusLiteral] = None
    completion_pct: Optional[float] = Field(None, ge=0, le=100)


def _now() -> float:
    return time.time()


def _normalize_completion(status_value: str, completion_pct: float) -> float:
    """Keep completion % consistent with status: 0 while waiting, 100 once
    delivered, and clamped under 100 while still running (100% running
    should really be "delivered")."""
    if status_value == "waiting_to_start":
        return 0.0
    if status_value == "delivered":
        return 100.0
    return max(0.0, min(99.0, completion_pct))


def seed_demo_projects() -> None:
    """Populate a few example projects on first boot so the list isn't
    empty before anyone has run an analysis yet — safe to call repeatedly,
    only seeds once."""
    if _PROJECTS:
        return
    demo = [
        {"name": "Customer Portal", "recommended_model": "hybrid", "opi": 82.3, "status": "running", "completion_pct": 62, "owner": "pm"},
        {"name": "Hospital Management System", "recommended_model": "waterfall", "opi": 79.1, "status": "running", "completion_pct": 30, "owner": "architect"},
        {"name": "Railway Reservation System", "recommended_model": "agile", "opi": 74.8, "status": "delivered", "completion_pct": 100, "owner": "teamlead"},
        {"name": "Library Management System", "recommended_model": "hybrid", "opi": 77.5, "status": "waiting_to_start", "completion_pct": 0, "owner": "ba"},
    ]
    for d in demo:
        owner = d.pop("owner")
        create_project(ProjectCreate(**d), owner=owner)


def create_project(payload: ProjectCreate, owner: str) -> dict:
    now = _now()
    project = {
        "id": next(_id_counter),
        "name": payload.name,
        "recommended_model": payload.recommended_model,
        "opi": payload.opi,
        "status": payload.status,
        "completion_pct": _normalize_completion(payload.status, payload.completion_pct),
        "owner": owner,
        "created_at": now,
        "updated_at": now,
    }
    _PROJECTS.insert(0, project)
    return project


def list_projects() -> List[dict]:
    return sorted(_PROJECTS, key=lambda p: p["updated_at"], reverse=True)


def get_project(project_id: int) -> Optional[dict]:
    return next((p for p in _PROJECTS if p["id"] == project_id), None)


def update_project(project_id: int, payload: ProjectUpdate) -> Optional[dict]:
    project = get_project(project_id)
    if not project:
        return None
    if payload.status is not None:
        project["status"] = payload.status
    if payload.completion_pct is not None:
        project["completion_pct"] = payload.completion_pct
    project["completion_pct"] = _normalize_completion(project["status"], project["completion_pct"])
    project["updated_at"] = _now()
    return project


def delete_project(project_id: int) -> bool:
    global _PROJECTS
    before = len(_PROJECTS)
    _PROJECTS = [p for p in _PROJECTS if p["id"] != project_id]
    return len(_PROJECTS) != before
