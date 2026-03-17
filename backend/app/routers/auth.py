from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/auth/login")
async def login(body: LoginRequest):
    # PL-4: fake login — accept any credentials, always succeed.
    # Real authentication will be added in a future sprint.
    return {"ok": True}
