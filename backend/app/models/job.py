from sqlalchemy import Column, String, Text, Integer, Float, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    status = Column(String(20), nullable=False, default="pending", index=True)
    lyrics = Column(Text, nullable=False)
    tags = Column(Text, nullable=False)
    max_length_ms = Column(Integer, nullable=False, default=240000)
    temperature = Column(Float, nullable=False, default=1.0)
    topk = Column(Integer, nullable=False, default=50)
    cfg_scale = Column(Float, nullable=False, default=1.5)

    output_path = Column(String(500), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    error = Column(Text, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    track = relationship("Track", back_populates="job", uselist=False)
