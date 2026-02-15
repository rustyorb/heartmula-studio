from pathlib import Path
from typing import Optional


def get_audio_duration_ms(path: Path) -> Optional[int]:
    """Get audio duration in milliseconds using torchaudio if available."""
    try:
        import torchaudio
        info = torchaudio.info(str(path))
        duration_s = info.num_frames / info.sample_rate
        return int(duration_s * 1000)
    except (ImportError, RuntimeError):
        pass
    # Fallback: estimate from file size (48kHz, 16-bit stereo ~ 192KB/s for MP3)
    try:
        size = path.stat().st_size
        # Rough MP3 estimate: ~128kbps = 16KB/s
        return int(size / 16 * 1000 / 1000)
    except OSError:
        return None
