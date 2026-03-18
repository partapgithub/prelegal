import json
import os
from pathlib import Path
from typing import Any, Literal, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from litellm import acompletion
from pydantic import BaseModel

router = APIRouter()

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}
TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"
CATALOG_PATH = Path(__file__).parent.parent.parent / "catalog.json"

_AVAILABLE_DOCS = """Available documents this platform can generate:
- Mutual NDA (Mutual-NDA.md): Mutual non-disclosure agreement between two parties
- Mutual NDA Cover Page (Mutual-NDA-coverpage.md): Cover page for the Mutual NDA
- Cloud Service Agreement (CSA.md): SaaS subscription agreement
- Service Level Agreement (SLA.md): Uptime and support commitments addendum
- Design Partner Agreement (Design-Partner-Agreement.md): Early-access design partner program
- Professional Services Agreement (PSA.md): Custom work or consulting engagement
- Data Processing Agreement (DPA.md): GDPR-compliant data processing terms
- Partnership Agreement (Partnership-Agreement.md): Co-marketing, referral, or integration partnership
- Software License Agreement (Software-License-Agreement.md): On-premises software license
- Pilot Agreement (Pilot-Agreement.md): Short-term evaluation or proof-of-concept
- Business Associate Agreement (BAA.md): HIPAA-compliant business associate agreement
- AI Addendum (AI-Addendum.md): Addendum covering AI/ML feature usage

If the user asks for a document type not on this list, explain that it is not currently supported and suggest the closest available document."""

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


# ─── Generic document chat ────────────────────────────────────────────────────

_GENERIC_FIELD_GUIDE = """
Fields to collect:
- party1Company: Company name of the first party
- party1Name: Full name of the signatory for the first party
- party1Title: Job title of the signatory for the first party
- party1Address: Email or postal address for notices (first party)
- party1Date: Date first party signs (YYYY-MM-DD)
- party2Company: Company name of the second party
- party2Name: Full name of the signatory for the second party
- party2Title: Job title of the signatory for the second party
- party2Address: Email or postal address for notices (second party)
- party2Date: Date second party signs (YYYY-MM-DD)
- effectiveDate: Date the agreement takes effect (YYYY-MM-DD)
- term: Duration of the agreement, e.g. "1 year", "2 years", "ongoing"
- description: Brief description of the specific engagement or scope
- fees: Fee amount and payment terms, if any (e.g. "$5,000/month"); leave blank if no fees
- governingLaw: Governing state, e.g. "Delaware"
- jurisdiction: Court location, e.g. "courts located in New Castle, Delaware"
"""


def _build_doc_system_prompt(doc_name: str, party1_role: str, party2_role: str, current_fields: dict) -> str:
    filled = {k: v for k, v in current_fields.items() if v not in ("", None)}
    missing = [k for k, v in current_fields.items() if v in ("", None)]
    return f"""You are a friendly legal document assistant helping users fill out a {doc_name}.
The two parties are referred to as "{party1_role}" (first party) and "{party2_role}" (second party).
Your goal is to collect all required information through natural conversation, one or two related fields at a time.
As users provide information, the document preview updates in real time.
{_GENERIC_FIELD_GUIDE}
{_AVAILABLE_DOCS}
Current state:
- Already filled: {json.dumps(filled) if filled else "nothing yet"}
- Still needed: {", ".join(missing) if missing else "all done!"}

Guidelines:
- Address the parties by their roles ({party1_role} and {party2_role}) when asking questions
- Ask about one topic at a time (e.g. {party1_role} company + name together, then title + address)
- Accept natural phrasing; convert dates to YYYY-MM-DD when extracting
- Keep replies to 2–4 sentences
- When everything is filled, congratulate the user and suggest printing/saving the document
"""


class _GenericDocFields(BaseModel):
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
    effectiveDate: Optional[str] = None
    term: Optional[str] = None
    description: Optional[str] = None
    fees: Optional[str] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None


_DOC_ROLES: dict[str, tuple[str, str]] = {
    "CSA.md": ("Provider", "Customer"),
    "SLA.md": ("Provider", "Customer"),
    "Design-Partner-Agreement.md": ("Provider", "Partner"),
    "PSA.md": ("Provider", "Customer"),
    "DPA.md": ("Provider", "Customer"),
    "Partnership-Agreement.md": ("Company", "Partner"),
    "Software-License-Agreement.md": ("Provider", "Customer"),
    "Pilot-Agreement.md": ("Provider", "Customer"),
    "BAA.md": ("Business Associate", "Covered Entity"),
    "AI-Addendum.md": ("Provider", "Customer"),
}

_DOC_NAMES: dict[str, str] = {}


def _get_doc_name(filename: str) -> str:
    global _DOC_NAMES
    if not _DOC_NAMES and CATALOG_PATH.exists():
        catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        _DOC_NAMES = {entry["filename"]: entry["name"] for entry in catalog}
    return _DOC_NAMES.get(filename, filename)


class GenericChatRequest(BaseModel):
    history: list[_ChatMessage]
    fields: dict[str, Any]
    docType: str


@router.post("/chat/document")
async def chat_document(body: GenericChatRequest):
    filename = body.docType
    if filename not in _DOC_ROLES:
        raise HTTPException(status_code=400, detail=f"Unsupported document type: {filename}")

    api_key = os.getenv("OPENROUTER_API_KEY")
    party1_role, party2_role = _DOC_ROLES[filename]
    doc_name = _get_doc_name(filename)

    messages = [{"role": "system", "content": _build_doc_system_prompt(doc_name, party1_role, party2_role, body.fields)}]
    messages += [{"role": m.role, "content": m.content} for m in body.history]

    async def generate():
        try:
            full_reply = ""

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

            extract_messages = messages + [
                {"role": "assistant", "content": full_reply},
                {
                    "role": "user",
                    "content": (
                        f"Based on the full conversation above, extract every field value "
                        f"that the user has explicitly provided for this {doc_name}. "
                        "Convert dates to YYYY-MM-DD. Only include fields the user actually stated. "
                        f"Respond with a JSON object matching this schema (all fields optional): "
                        f"{_GenericDocFields.model_json_schema()}"
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
                extracted = _GenericDocFields.model_validate_json(
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
