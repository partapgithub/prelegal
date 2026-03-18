import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

router = APIRouter()

CATALOG_PATH = Path(__file__).parent.parent.parent / "catalog.json"
TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"


_ALLOWED_FILENAMES: set[str] | None = None


def _allowed_filenames() -> set[str]:
    global _ALLOWED_FILENAMES
    if _ALLOWED_FILENAMES is None:
        if not CATALOG_PATH.exists():
            return set()
        catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        _ALLOWED_FILENAMES = {entry["filename"] for entry in catalog}
    return _ALLOWED_FILENAMES


@router.get("/documents")
async def get_catalog():
    if not CATALOG_PATH.exists():
        raise HTTPException(status_code=500, detail="Catalog not found")
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


@router.get("/documents/template/{filename}", response_class=PlainTextResponse)
async def get_template(filename: str):
    if filename not in _allowed_filenames():
        raise HTTPException(status_code=404, detail="Template not found")
    template_path = TEMPLATES_DIR / filename
    if not template_path.is_file():
        raise HTTPException(status_code=404, detail="Template file not found")
    return template_path.read_text(encoding="utf-8")
