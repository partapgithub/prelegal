import json
import os
from typing import Any, Literal, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from litellm import acompletion
from pydantic import BaseModel

router = APIRouter()

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

_FIELD_GUIDE = """
Fields to collect:
- party1Company: Company name of Party 1
- party1Name: Full name of the signatory for Party 1
- party1Title: Job title of the signatory for Party 1
- party1Address: Email or postal address for notices (Party 1)
- party1Date: Date Party 1 signs (YYYY-MM-DD)
- party2Company: Company name of Party 2
- party2Name: Full name of the signatory for Party 2
- party2Title: Job title of the signatory for Party 2
- party2Address: Email or postal address for notices (Party 2)
- party2Date: Date Party 2 signs (YYYY-MM-DD)
- purpose: Business purpose of the NDA (lowercase, no trailing period)
- effectiveDate: Date the NDA takes effect (YYYY-MM-DD)
- mndaTermType: "expires" (fixed years) or "until_terminated" (indefinite)
- mndaTermYears: Duration in years as a string, e.g. "2" (only when mndaTermType is "expires")
- confidentialityTermType: "years" (fixed) or "perpetuity" (forever)
- confidentialityTermYears: Duration in years as a string (only when confidentialityTermType is "years")
- governingLaw: US state, e.g. "Delaware"
- jurisdiction: Court location, e.g. "courts located in New Castle, Delaware"
- modifications: Any custom modifications to standard terms (optional, usually empty)
"""


def _build_system_prompt(current_fields: dict) -> str:
    filled = {k: v for k, v in current_fields.items() if v not in ("", None)}
    missing = [k for k, v in current_fields.items() if v in ("", None)]
    return f"""You are a friendly legal document assistant helping users fill out a Mutual NDA.
Your goal is to collect all required information through natural conversation, one or two related fields at a time.
As users provide information, the document preview updates in real time.
{_FIELD_GUIDE}
Current state:
- Already filled: {json.dumps(filled) if filled else "nothing yet"}
- Still needed: {", ".join(missing) if missing else "all done!"}

Guidelines:
- Ask about one topic at a time (e.g. Party 1 company + name together, then title + address)
- Accept natural phrasing; convert dates to YYYY-MM-DD when extracting
- Keep replies to 2–4 sentences
- When everything is filled, congratulate the user and suggest printing/saving the document
"""


class _ChatMessage(BaseModel):
    role: str
    content: str


class _NdaFields(BaseModel):
    party1Company: Optional[str] = None
    party1Name: Optional[str] = None
    party1Title: Optional[str] = None
    party1Address: Optional[str] = None
    party1Date: Optional[str] = None
    party2Company: Optional[str] = None
    party2Name: Optional[str] = None
    party2Title: Optional[str] = None
    party2Address: Optional[str] = None
    party2Date: Optional[str] = None
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None
    mndaTermType: Optional[Literal["expires", "until_terminated"]] = None
    mndaTermYears: Optional[str] = None
    confidentialityTermType: Optional[Literal["years", "perpetuity"]] = None
    confidentialityTermYears: Optional[str] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    modifications: Optional[str] = None


class ChatRequest(BaseModel):
    history: list[_ChatMessage]
    fields: dict[str, Any]


@router.post("/chat/nda")
async def chat_nda(body: ChatRequest):
    api_key = os.getenv("OPENROUTER_API_KEY")
    messages = [{"role": "system", "content": _build_system_prompt(body.fields)}]
    messages += [{"role": m.role, "content": m.content} for m in body.history]

    async def generate():
        try:
            full_reply = ""

            # Phase 1: stream the conversational reply
            stream = await acompletion(
                model=MODEL,
                messages=messages,
                stream=True,
                reasoning_effort="low",
                api_key=api_key,
                extra_body=EXTRA_BODY,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                full_reply += delta
                if delta:
                    yield f"data: {json.dumps({'type': 'text', 'delta': delta})}\n\n"

            # Phase 2: extract field values — use json_object mode for broad provider compatibility
            extract_messages = messages + [
                {"role": "assistant", "content": full_reply},
                {
                    "role": "user",
                    "content": (
                        "Based on the full conversation above, extract every NDA field value "
                        "that the user has explicitly provided. Convert dates to YYYY-MM-DD. "
                        "Return numeric year values as strings. Only include fields the user actually stated. "
                        f"Respond with a JSON object matching this schema (all fields optional): "
                        f"{_NdaFields.model_json_schema()}"
                    ),
                },
            ]
            fields_resp = await acompletion(
                model=MODEL,
                messages=extract_messages,
                response_format={"type": "json_object"},
                reasoning_effort="low",
                api_key=api_key,
                extra_body=EXTRA_BODY,
            )
            try:
                extracted = _NdaFields.model_validate_json(
                    fields_resp.choices[0].message.content
                )
                fields_dict = extracted.model_dump(exclude_none=True)
            except Exception:
                fields_dict = {}

            yield f"data: {json.dumps({'type': 'fields', 'fields': fields_dict})}\n\n"
            yield "data: [DONE]\n\n"

        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
