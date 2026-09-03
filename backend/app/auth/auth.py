"""
auth.py
=======
Lightweight JWT authentication with role-based demo users, covering the
seven roles requested: Architect, Business Analyst, Project Manager,
Team Lead, Testing Lead, Senior Engineer, Engineer.

This is intentionally dependency-light (stdlib hashlib for password hashing,
PyJWT for tokens) so it installs cleanly on any host, including shared
hosting where compiling bcrypt/argon2 can be painful. It is DEMO-GRADE:

  - the user store (`_USERS`) is a hardcoded in-memory dict, reset on restart
  - password hashing is a salted SHA-256, not bcrypt/argon2/scrypt

Before production use: replace `_USERS` with a real user table (DB-backed),
and swap `hash_password`/`verify_password` for a proper password-hashing KDF
(e.g. passlib's bcrypt/argon2 handler) with a per-user random salt.
"""

from __future__ import annotations

import hashlib
import hmac
import os
import time
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

# --------------------------------------------------------------------------- #
# Roles
# --------------------------------------------------------------------------- #

ROLES = [
    "Architect",
    "Business Analyst",
    "Project Manager",
    "Team Lead",
    "Testing Lead",
    "Senior Engineer",
    "Engineer",
]

# --------------------------------------------------------------------------- #
# Password hashing (salted SHA-256 — see module docstring for caveats)
# --------------------------------------------------------------------------- #

_SALT = "sdlc-advisor-demo-salt"  # a fixed demo salt; use a per-user random salt in production


def hash_password(password: str) -> str:
    return hashlib.sha256((_SALT + password).encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return hmac.compare_digest(hash_password(password), password_hash)


# --------------------------------------------------------------------------- #
# Seed demo users — one per role, same demo password (see README to change)
# --------------------------------------------------------------------------- #

DEMO_PASSWORD = "Demo@123"

_USERS = {
    "architect": {"name": "Ava Architect", "role": "Architect", "password_hash": hash_password(DEMO_PASSWORD)},
    "ba": {"name": "Beth Analyst", "role": "Business Analyst", "password_hash": hash_password(DEMO_PASSWORD)},
    "pm": {"name": "Priya Manager", "role": "Project Manager", "password_hash": hash_password(DEMO_PASSWORD)},
    "teamlead": {"name": "Tom Lead", "role": "Team Lead", "password_hash": hash_password(DEMO_PASSWORD)},
    "testlead": {"name": "Tara Test", "role": "Testing Lead", "password_hash": hash_password(DEMO_PASSWORD)},
    "srengineer": {"name": "Sam Senior", "role": "Senior Engineer", "password_hash": hash_password(DEMO_PASSWORD)},
    "engineer": {"name": "Eli Engineer", "role": "Engineer", "password_hash": hash_password(DEMO_PASSWORD)},
}

ROLE_TO_USERNAME = {u["role"]: uname for uname, u in _USERS.items()}

# --------------------------------------------------------------------------- #
# JWT
# --------------------------------------------------------------------------- #

# Set SDLC_JWT_SECRET in your server environment for anything beyond local
# dev — the fallback below is fine for trying the app out, not for prod.
JWT_SECRET = os.environ.get("SDLC_JWT_SECRET", "dev-only-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_SECONDS = 8 * 60 * 60  # 8 hours


class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    username: str
    name: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


def authenticate(username: str, password: str) -> Optional[UserOut]:
    record = _USERS.get(username.strip().lower())
    if not record or not verify_password(password, record["password_hash"]):
        return None
    return UserOut(username=username.strip().lower(), name=record["name"], role=record["role"])


def create_access_token(user: UserOut) -> str:
    now = int(time.time())
    payload = {
        "sub": user.username,
        "name": user.name,
        "role": user.role,
        "iat": now,
        "exp": now + JWT_EXPIRY_SECONDS,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> UserOut:
    """FastAPI dependency — put `current_user: UserOut = Depends(get_current_user)`
    on any route that should require login."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token")

    return UserOut(username=payload["sub"], name=payload["name"], role=payload["role"])
