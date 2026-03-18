import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter()

CATALOG_PATH = Path(__file__).parent.parent.parent / "catalog.json"


@router.get("/documents")
async def get_catalog():
    if not CATALOG_PATH.exists():
        raise HTTPException(status_code=500, detail="Catalog not found")
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
