import io
import json

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile
from pydantic import BaseModel, Field

load_dotenv()

import llm  # noqa: E402  (after load_dotenv so keys are visible)

app = FastAPI(title="AI Assignment Feedback Assistant")

ASSIGNMENT_TYPE = "Argumentative essay"
MAX_CHARS = 60_000


class Criterion(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    max_points: int = Field(ge=1, le=100)


class EvaluateRequest(BaseModel):
    assignment_prompt: str = Field(default="", max_length=5000)
    submission: str = Field(min_length=20, max_length=MAX_CHARS)
    rubric: list[Criterion] = Field(min_length=1, max_length=10)


PROMPT = """You are a teaching assistant helping an instructor give feedback on a student's {assignment_type}.
Your output is a DRAFT the instructor will review and edit. Be specific, fair and constructive.
Quote short phrases from the submission to ground every point. Never invent content the student did not write.

ASSIGNMENT PROMPT:
{assignment_prompt}

RUBRIC (score each criterion from 0 to its max_points):
{rubric}

STUDENT SUBMISSION:
<<<
{submission}
>>>

Return ONLY a JSON object with exactly this shape:
{{
  "overall_summary": "2-4 sentence summary addressed to the student",
  "criteria": [
    {{
      "name": "criterion name exactly as given",
      "suggested_score": 0,
      "max_points": 0,
      "rationale": "why this score, citing the submission",
      "strengths": ["..."],
      "issues": ["..."],
      "missing_concepts": ["concepts/elements expected for this criterion but absent"],
      "suggestions": [{{"suggestion": "practical improvement", "example": "a concrete rewritten sentence or short example"}}]
    }}
  ],
  "missing_concepts": ["key concepts missing from the submission overall"],
  "instructor_notes": "recurring mistake patterns and anything the instructor should double-check"
}}
Include one entry in "criteria" per rubric criterion, in the same order."""


@app.get("/api/health")
def health():
    return {"provider": llm.provider(), "assignment_type": ASSIGNMENT_TYPE}


@app.post("/api/extract")
async def extract(file: UploadFile):
    """Turn an uploaded .txt/.md/.pdf/.docx into plain text."""
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(413, "File too large (max 10 MB)")
    name = (file.filename or "").lower()
    try:
        if name.endswith(".pdf"):
            from pypdf import PdfReader

            text = "\n".join(p.extract_text() or "" for p in PdfReader(io.BytesIO(data)).pages)
        elif name.endswith(".docx"):
            from docx import Document

            text = "\n".join(p.text for p in Document(io.BytesIO(data)).paragraphs)
        elif name.endswith((".txt", ".md")):
            text = data.decode("utf-8", errors="replace")
        else:
            raise HTTPException(415, "Supported files: .txt, .md, .pdf, .docx")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(422, f"Could not read file: {e}")
    if not text.strip():
        raise HTTPException(422, "No text found in file (scanned PDFs are not supported)")
    return {"text": text[:MAX_CHARS]}


@app.post("/api/evaluate")
def evaluate(req: EvaluateRequest):
    rubric = "\n".join(
        f"- {c.name} (max_points: {c.max_points}): {c.description}" for c in req.rubric
    )
    prompt = PROMPT.format(
        assignment_type=ASSIGNMENT_TYPE,
        assignment_prompt=req.assignment_prompt or "(not provided)",
        rubric=rubric,
        submission=req.submission,
    )
    try:
        result = llm.complete_json(prompt)
    except (ValueError, json.JSONDecodeError) as e:
        raise HTTPException(502, f"Model returned an unreadable response: {e}")
    except Exception as e:
        raise HTTPException(502, f"LLM call failed ({llm.provider()}): {e}")

    return normalize(result, req.rubric)


def normalize(result: dict, rubric: list[Criterion]) -> dict:
    """Fill missing fields and clamp scores so the UI always gets the same shape."""
    out = {
        "overall_summary": str(result.get("overall_summary", "")),
        "missing_concepts": list(result.get("missing_concepts") or []),
        "instructor_notes": str(result.get("instructor_notes", "")),
        "criteria": [],
        "provider": llm.provider(),
    }
    got = {c.get("name"): c for c in result.get("criteria", []) if isinstance(c, dict)}
    for i, crit in enumerate(rubric):
        raw = result.get("criteria", [])
        c = got.get(crit.name) or (raw[i] if i < len(raw) and isinstance(raw[i], dict) else {})
        try:
            score = int(c.get("suggested_score") or 0)
        except (TypeError, ValueError):
            score = 0
        out["criteria"].append({
            "name": crit.name,
            "max_points": crit.max_points,
            "suggested_score": max(0, min(score, crit.max_points)),
            "rationale": str(c.get("rationale", "")),
            "strengths": list(c.get("strengths") or []),
            "issues": list(c.get("issues") or []),
            "missing_concepts": list(c.get("missing_concepts") or []),
            "suggestions": [
                {"suggestion": str(s.get("suggestion", "")), "example": str(s.get("example", ""))}
                for s in c.get("suggestions") or [] if isinstance(s, dict)
            ],
        })
    return out
