from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class Track(Base):
    __tablename__ = "tracks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("generation_jobs.id"), nullable=False, unique=True)
    title = Column(String(200), nullable=False)
    tags = Column(Text, nullable=False)
    lyrics = Column(Text, nullable=False)
    output_path = Column(String(500), nullable=False)
    output_url = Column(String(500), nullable=False)
    duration_ms = Column(Integer, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    favorite = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    job = relationship("GenerationJob", back_populates="track")
