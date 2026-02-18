from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, func
from app.database import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, default=1)
    default_temperature = Column(Float, default=1.0)
    default_topk = Column(Integer, default=50)
    default_cfg_scale = Column(Float, default=1.5)
    default_max_length_ms = Column(Integer, default=240000)
    theme = Column(String(20), default="dark")
    auto_save_tracks = Column(Boolean, default=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
