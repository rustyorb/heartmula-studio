import asyncio
import logging
import time
import random
from pathlib import Path
from typing import Optional, Callable
from enum import Enum
from app.config import Settings

logger = logging.getLogger(__name__)


class ModelState(str, Enum):
    UNLOADED = "unloaded"
    LOADING = "loading"
    READY = "ready"
    ERROR = "error"


class PipelineManager:
    """Manages HeartMuLa pipeline lifecycle."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.state = ModelState.UNLOADED
        self._gen_pipeline = None
        self._transcriptor_pipeline = None

    async def load_generation_model(self, progress_callback: Optional[Callable] = None) -> None:
        """Load the generation pipeline. Uses mock for now."""
        self.state = ModelState.LOADING
        try:
            # Simulate model loading with progress
            for i in range(10):
                await asyncio.sleep(0.1)
                if progress_callback:
                    await progress_callback(i / 10, f"Loading model... {i*10}%")

            self.state = ModelState.READY
            logger.info("Generation pipeline ready (mock mode)")
        except Exception as e:
            self.state = ModelState.ERROR
            logger.error(f"Failed to load model: {e}")
            raise

    async def generate(
        self,
        lyrics: str,
        tags: str,
        save_path: Path,
        max_audio_length_ms: int = 240000,
        temperature: float = 1.0,
        topk: int = 50,
        cfg_scale: float = 1.5,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> Path:
        """Run generation. Mock implementation creates a silent MP3."""
        if self.state != ModelState.READY:
            raise RuntimeError(f"Model not ready (state: {self.state})")

        # Calculate expected frames (12.5 Hz = 80ms per frame)
        total_frames = max_audio_length_ms // 80
        # Simulate shorter generation (mock stops early like real model would)
        actual_frames = min(total_frames, random.randint(total_frames // 2, total_frames))

        logger.info(f"Generating {actual_frames} frames (mock), saving to {save_path}")

        # Simulate frame-by-frame generation
        for frame in range(actual_frames):
            await asyncio.sleep(0.002)  # Very fast in mock mode
            if progress_callback and frame % 50 == 0:
                progress_callback(frame, actual_frames)

        # Create a minimal valid MP3 file (silence)
        # This is a valid MP3 frame header for silence
        save_path.parent.mkdir(parents=True, exist_ok=True)
        # Write a minimal MP3 with LAME header
        mp3_header = bytes([
            0xFF, 0xFB, 0x90, 0x00,  # MP3 frame header (MPEG1, Layer3, 128kbps, 44100Hz, stereo)
        ]) + b'\x00' * 413  # Pad frame to standard size
        # Write multiple frames to simulate duration
        num_mp3_frames = max(1, actual_frames // 10)
        with open(save_path, 'wb') as f:
            for _ in range(num_mp3_frames):
                f.write(mp3_header)

        if progress_callback:
            progress_callback(actual_frames, actual_frames)

        return save_path

    async def transcribe(self, audio_path: Path) -> str:
        """Transcribe audio to lyrics. Mock implementation."""
        if self._transcriptor_pipeline is None:
            # Mock: return placeholder lyrics
            await asyncio.sleep(0.5)
            return "[Verse]\nMock transcription - HeartTranscriptor not loaded\n\n[Chorus]\nThis is a placeholder for real transcription"
        # Real implementation would use HeartTranscriptorPipeline
        pass

    def get_state(self) -> str:
        return self.state.value

    async def unload(self) -> None:
        """Unload models from GPU."""
        self._gen_pipeline = None
        self._transcriptor_pipeline = None
        self.state = ModelState.UNLOADED
        logger.info("Models unloaded")
