import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.db import init_db
from app.routers import auth, documents


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Prelegal API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(documents.router, prefix="/api")

STATIC_DIR = Path(os.getenv("STATIC_DIR", Path(__file__).parent.parent / "static"))


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Serve a specific file if it exists (JS, CSS, images, etc.)
    file_path = STATIC_DIR / full_path
    if file_path.is_file():
        return FileResponse(file_path)

    # With trailingSlash: true, Next.js generates route/index.html for each page
    index_path = STATIC_DIR / full_path / "index.html"
    if index_path.is_file():
        return FileResponse(index_path)

    # Root path and fallback — serve the root index.html (login page)
    root_index = STATIC_DIR / "index.html"
    if root_index.is_file():
        return FileResponse(root_index)

    return {"detail": "Frontend not built yet — run the start script or npm run build"}
