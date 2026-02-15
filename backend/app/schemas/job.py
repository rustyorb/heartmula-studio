from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime


class GenerationRequest(BaseModel):
    lyrics: str = Field(..., min_length=1, description="Song lyrics with optional section markers")
    tags: str = Field(..., min_length=1, description="Comma-separated style tags")
    max_length_ms: int = Field(240000, ge=30000, le=360000)
    temperature: float = Field(1.0, ge=0.1, le=2.0)
    topk: int = Field(50, ge=1, le=500)
    cfg_scale: float = Field(1.5, ge=1.0, le=10.0)


class GenerationResponse(BaseModel):
    job_id: str
    status: str
    queue_position: int
    created_at: datetime


class JobResponse(BaseModel):
    id: str
    status: str
    lyrics: str
    tags: str
    max_length_ms: int
    temperature: float
    topk: int
    cfg_scale: float
    output_path: Optional[str] = None
    output_url: Optional[str] = None
    duration_ms: Optional[int] = None
    error: Optional[str] = None
    progress: Optional[float] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @model_validator(mode="after")
    def compute_output_url(self):
        if self.output_path and not self.output_url:
            # Convert "data/outputs/2026-02-14/abc.mp3" -> "/outputs/2026-02-14/abc.mp3"
            path = self.output_path
            if "outputs/" in path:
                self.output_url = "/" + path.split("outputs/", 1)[0] + "outputs/" + path.split("outputs/", 1)[1]
                # Simplify: just replace data/outputs/ with /outputs/
                self.output_url = path.replace("data/outputs/", "/outputs/")
        return self


class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    total: int
