import subprocess
from pathlib import Path
from typing import Optional


def get_audio_duration_ms(path: Path) -> Optional[int]:
    """Get audio duration in milliseconds using ffprobe."""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
            capture_output=True, text=True, check=True,
        )
        return int(float(result.stdout.strip()) * 1000)
    except Exception:
        pass
    # Fallback: estimate from file size (~192kbps MP3 = 24KB/s)
    try:
        size = path.stat().st_size
        return int(size / 24 * 1000 / 1000)
    except OSError:
        return None
