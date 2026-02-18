import os
import uuid
from pathlib import Path
from datetime import date
from fastapi import UploadFile
from app.config import Settings


class StorageService:
    def __init__(self, settings: Settings):
        self.output_dir = Path(settings.output_dir)
        self.upload_dir = Path(settings.upload_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def get_output_path(self, job_id: str) -> Path:
        """Return path organized by date: data/outputs/YYYY-MM-DD/job_id.mp3"""
        date_dir = self.output_dir / date.today().isoformat()
        date_dir.mkdir(parents=True, exist_ok=True)
        return date_dir / f"{job_id}.mp3"

    def get_output_url(self, output_path: Path) -> str:
        """Convert file path to HTTP URL."""
        rel = output_path.relative_to(self.output_dir)
        return f"/outputs/{rel}"

    async def save_upload(self, file: UploadFile) -> Path:
        """Save uploaded file, return path."""
        ext = Path(file.filename or "upload").suffix or ".mp3"
        filename = f"{uuid.uuid4()}{ext}"
        path = self.upload_dir / filename
        content = await file.read()
        path.write_bytes(content)
        return path

    async def delete_file(self, path: Path) -> None:
        """Delete a file if it exists."""
        if path.exists():
            path.unlink()

    def get_file_size(self, path: Path) -> int | None:
        """Get file size in bytes."""
        if path.exists():
            return path.stat().st_size
        return None
