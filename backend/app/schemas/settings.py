from pydantic import BaseModel, Field
from typing import Optional


class SettingsResponse(BaseModel):
    default_temperature: float
    default_topk: int
    default_cfg_scale: float
    default_max_length_ms: int
    theme: str
    auto_save_tracks: bool

    class Config:
        from_attributes = True


class SettingsUpdateRequest(BaseModel):
    default_temperature: Optional[float] = Field(None, ge=0.1, le=2.0)
    default_topk: Optional[int] = Field(None, ge=1, le=500)
    default_cfg_scale: Optional[float] = Field(None, ge=1.0, le=10.0)
    default_max_length_ms: Optional[int] = Field(None, ge=30000, le=360000)
    theme: Optional[str] = None
    auto_save_tracks: Optional[bool] = None
