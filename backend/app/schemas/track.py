from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TrackResponse(BaseModel):
    id: str
    job_id: str
    title: str
    tags: str
    lyrics: str
    output_url: str
    duration_ms: int
    file_size_bytes: Optional[int] = None
    favorite: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TrackUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    tags: Optional[str] = None
    favorite: Optional[bool] = None


class TrackListResponse(BaseModel):
    tracks: list[TrackResponse]
    total: int
