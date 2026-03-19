import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db import get_db
from app.routers.auth import get_current_user

router = APIRouter()


class SaveRequest(BaseModel):
    doc_type: str
    doc_name: str
    fields: dict


@router.get("/saved-documents")
async def list_saved(user=Depends(get_current_user), db=Depends(get_db)):
    async with db.execute(
        """SELECT id, doc_type, doc_name, created_at, updated_at
           FROM saved_documents WHERE user_id = ? ORDER BY updated_at DESC""",
        (user["id"],),
    ) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]


@router.post("/saved-documents")
async def create_saved(body: SaveRequest, user=Depends(get_current_user), db=Depends(get_db)):
    now = datetime.now(timezone.utc).isoformat()
    async with db.execute(
        """INSERT INTO saved_documents (user_id, doc_type, doc_name, fields, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (user["id"], body.doc_type, body.doc_name, json.dumps(body.fields), now, now),
    ) as cur:
        doc_id = cur.lastrowid
    await db.commit()
    return {"id": doc_id, "doc_type": body.doc_type, "doc_name": body.doc_name}


@router.get("/saved-documents/{doc_id}")
async def get_saved(doc_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    async with db.execute(
        "SELECT * FROM saved_documents WHERE id = ? AND user_id = ?", (doc_id, user["id"])
    ) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    result = dict(row)
    result["fields"] = json.loads(result["fields"])
    return result


@router.put("/saved-documents/{doc_id}")
async def update_saved(
    doc_id: int, body: SaveRequest, user=Depends(get_current_user), db=Depends(get_db)
):
    now = datetime.now(timezone.utc).isoformat()
    async with db.execute(
        """UPDATE saved_documents SET doc_name = ?, fields = ?, updated_at = ?
           WHERE id = ? AND user_id = ?""",
        (body.doc_name, json.dumps(body.fields), now, doc_id, user["id"]),
    ) as cur:
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Document not found")
    await db.commit()
    return {"ok": True}


@router.delete("/saved-documents/{doc_id}")
async def delete_saved(doc_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    async with db.execute(
        "DELETE FROM saved_documents WHERE id = ? AND user_id = ?", (doc_id, user["id"])
    ) as cur:
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Document not found")
    await db.commit()
    return {"ok": True}
