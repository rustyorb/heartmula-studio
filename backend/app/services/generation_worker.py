import asyncio
import logging
import uuid
from pathlib import Path
from typing import Optional
from app.services.job_queue import JobQueue
from app.services.pipeline_manager import PipelineManager
from app.services.gpu_manager import GPUManager
from app.services.event_broadcaster import EventBroadcaster
from app.services.storage_service import StorageService
from app.utils.audio import get_audio_duration_ms

logger = logging.getLogger(__name__)


class GenerationWorker:
    """Background worker that processes generation jobs."""

    def __init__(
        self,
        job_queue: JobQueue,
        pipeline: PipelineManager,
        gpu: GPUManager,
        broadcaster: EventBroadcaster,
        storage: StorageService,
    ):
        self.job_queue = job_queue
        self.pipeline = pipeline
        self.gpu = gpu
        self.broadcaster = broadcaster
        self.storage = storage
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._current_job_id: Optional[str] = None

    async def start(self) -> None:
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info("Generation worker started")

    async def stop(self) -> None:
        self._running = False
        self.job_queue._notify.set()  # Wake up if waiting
        if self._task:
            await self._task
        logger.info("Generation worker stopped")

    async def _run_loop(self) -> None:
        while self._running:
            try:
                job = await self.job_queue.dequeue()
                if job is None:
                    await self.job_queue.wait_for_job()
                    continue

                self._current_job_id = job.id
                await self.broadcaster.broadcast("job:started", {"job_id": job.id})

                try:
                    gpu_lock = await self.gpu.gpu_lock()
                    async with gpu_lock:
                        output_path = await self._run_generation(job)

                    # Get audio duration
                    duration_ms = get_audio_duration_ms(output_path) or job.max_length_ms

                    # Get output URL
                    output_url = self.storage.get_output_url(output_path)
                    file_size = self.storage.get_file_size(output_path)

                    # Mark completed
                    await self.job_queue.mark_completed(
                        job.id, str(output_path), duration_ms
                    )

                    # Auto-create track
                    from app.models.track import Track
                    from app.database import async_session_factory

                    # Generate title from first line of lyrics
                    title = _extract_title(job.lyrics)

                    async with async_session_factory() as db:
                        track = Track(
                            id=str(uuid.uuid4()),
                            job_id=job.id,
                            title=title,
                            tags=job.tags,
                            lyrics=job.lyrics,
                            output_path=str(output_path),
                            output_url=output_url,
                            duration_ms=duration_ms,
                            file_size_bytes=file_size,
                        )
                        db.add(track)
                        await db.commit()
                        await db.refresh(track)

                    await self.broadcaster.broadcast("job:completed", {
                        "job_id": job.id,
                        "track_id": track.id,
                        "output_url": output_url,
                        "duration_ms": duration_ms,
                    })

                except Exception as e:
                    logger.error(f"Generation failed for job {job.id}: {e}")
                    await self.job_queue.mark_failed(job.id, str(e))
                    await self.broadcaster.broadcast("job:failed", {
                        "job_id": job.id,
                        "error": str(e),
                    })
                finally:
                    self._current_job_id = None

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker loop error: {e}")
                await asyncio.sleep(1)

    async def _run_generation(self, job) -> Path:
        """Run HeartMuLa pipeline with progress reporting via tqdm hook."""
        output_path = self.storage.get_output_path(job.id)
        loop = asyncio.get_running_loop()

        def progress_callback(step: int, total: int):
            """Called from generation thread by the tqdm ProgressHook."""
            progress = step / total if total > 0 else 0
            # Schedule the async broadcast from the worker thread
            asyncio.run_coroutine_threadsafe(
                self.broadcaster.broadcast("job:progress", {
                    "job_id": job.id,
                    "step": step,
                    "total_steps": total,
                    "progress": progress,
                }),
                loop,
            )

        await self.pipeline.generate(
            lyrics=job.lyrics,
            tags=job.tags,
            save_path=output_path,
            max_audio_length_ms=job.max_length_ms,
            temperature=job.temperature,
            topk=job.topk,
            cfg_scale=job.cfg_scale,
            progress_callback=progress_callback,
        )
        return output_path


def _extract_title(lyrics: str) -> str:
    """Extract title from lyrics (first non-tag, non-empty line)."""
    for line in lyrics.strip().split("\n"):
        line = line.strip()
        if line and not line.startswith("[") and not line.endswith("]"):
            return line[:60]
    return "Untitled Track"
