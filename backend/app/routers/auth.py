import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import BaseModel

from app.db import get_db

router = APIRouter()

_SESSION_COOKIE = "session"
_SESSION_DAYS = 7


# ─── Password helpers ──────────────────────────────────────────────────────────

def _hash_password(password: str) -> str:
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return f"{salt.hex()}:{key.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, key_hex = stored.split(":", 1)
        key = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 100_000)
        return secrets.compare_digest(key.hex(), key_hex)
    except Exception:
        return False


# ─── Session helpers ───────────────────────────────────────────────────────────

def _make_token() -> str:
    return secrets.token_hex(32)


def _expiry_iso() -> str:
    return (datetime.now(timezone.utc) + timedelta(days=_SESSION_DAYS)).isoformat()


def _set_cookie(response: Response, token: str) -> None:
    # COOKIE_SECURE defaults True (production); set to "false" for local HTTP dev
    secure = os.getenv("COOKIE_SECURE", "true").lower() != "false"
    response.set_cookie(
        key=_SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=_SESSION_DAYS * 24 * 3600,
        path="/",
    )


# ─── Auth dependency ───────────────────────────────────────────────────────────

async def get_current_user(
    session: str | None = Cookie(default=None, alias=_SESSION_COOKIE),
    db=Depends(get_db),
):
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    now = datetime.now(timezone.utc).isoformat()
    async with db.execute(
        "SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?", (session, now)
    ) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    async with db.execute(
        "SELECT id, email FROM users WHERE id = ?", (row["user_id"],)
    ) as cur:
        user = await cur.fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": user["id"], "email": user["email"]}


# ─── Routes ───────────────────────────────────────────────────────────────────

class AuthRequest(BaseModel):
    email: str
    password: str


@router.post("/auth/signup")
async def signup(body: AuthRequest, response: Response, db=Depends(get_db)):
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    async with db.execute(
        "SELECT id FROM users WHERE email = ?", (body.email.lower(),)
    ) as cur:
        if await cur.fetchone():
            raise HTTPException(status_code=409, detail="Email already registered")
    async with db.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        (body.email.lower(), _hash_password(body.password)),
    ) as cur:
        user_id = cur.lastrowid
    token = _make_token()
    await db.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
        (token, user_id, _expiry_iso()),
    )
    await db.commit()
    _set_cookie(response, token)
    return {"user": {"id": user_id, "email": body.email.lower()}}


@router.post("/auth/login")
async def login(body: AuthRequest, response: Response, db=Depends(get_db)):
    async with db.execute(
        "SELECT id, password_hash FROM users WHERE email = ?", (body.email.lower(),)
    ) as cur:
        user = await cur.fetchone()
    if not user or not _verify_password(body.password, user["password_hash"] or ""):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = _make_token()
    await db.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
        (token, user["id"], _expiry_iso()),
    )
    await db.commit()
    _set_cookie(response, token)
    return {"user": {"id": user["id"], "email": body.email.lower()}}


@router.post("/auth/logout")
async def logout(
    response: Response,
    session: str | None = Cookie(default=None, alias=_SESSION_COOKIE),
    db=Depends(get_db),
):
    if session:
        await db.execute("DELETE FROM sessions WHERE token = ?", (session,))
        await db.commit()
    response.delete_cookie(key=_SESSION_COOKIE, path="/")
    return {"ok": True}


@router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {"user": user}
