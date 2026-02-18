from pydantic import BaseModel
from typing import Optional


class HealthResponse(BaseModel):
    status: str = "ok"
    model_state: str
    gpu_available: bool


class GpuStatusResponse(BaseModel):
    name: str
    vram_total_gb: float
    vram_used_gb: float
    vram_free_gb: float
    use_mmgp: bool


class ModelStatusResponse(BaseModel):
    state: str  # unloaded | downloading | loading | ready | generating | error
    progress: Optional[float] = None
    message: Optional[str] = None
