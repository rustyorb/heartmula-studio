import logging
from pathlib import Path
from app.services.pipeline_manager import PipelineManager

logger = logging.getLogger(__name__)


class TranscriptionService:
    def __init__(self, pipeline: PipelineManager):
        self.pipeline = pipeline

    async def transcribe(self, audio_path: Path) -> dict:
        """Transcribe audio file to lyrics."""
        lyrics = await self.pipeline.transcribe(audio_path)
        return {
            "lyrics": lyrics,
            "audio_path": str(audio_path),
        }
