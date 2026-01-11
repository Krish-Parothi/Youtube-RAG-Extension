from pydantic import BaseModel, HttpUrl
from typing import Optional, List


# -------- URL INGEST --------
class IngestURLRequest(BaseModel):
    url: HttpUrl


class IngestURLResponse(BaseModel):
    video_id: str
    indexed: bool   # true if already present, false if newly indexed


# -------- CHAT / ASK --------
class AskRequest(BaseModel):
    video_id: str
    question: str
    session_id: Optional[str] = None  # for future multi-session support


class AskResponse(BaseModel):
    answer: str
    references: Optional[List[dict]] = None
    # example reference:
    # {
    #   "start_time": 120,
    #   "end_time": 145,
    #   "text": "..."
    # }


# -------- ERROR --------
class ErrorResponse(BaseModel):
    detail: str
