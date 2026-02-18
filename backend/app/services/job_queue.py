import asyncio
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import select, update, func
from app.models.job import GenerationJob

logger = logging.getLogger(__name__)


class JobQueue:
    """SQLite-backed persistent job queue with crash recovery."""

    def __init__(self, session_factory: async_sessionmaker):
        self._session_factory = session_factory
        self._notify = asyncio.Event()

    async def enqueue(self, job_data: dict) -> GenerationJob:
        """Insert a new pending job."""
        async with self._session_factory() as db:
            job = GenerationJob(**job_data)
            db.add(job)
            await db.commit()
            await db.refresh(job)
            self._notify.set()
            logger.info(f"Job {job.id} enqueued")
            return job

    async def dequeue(self) -> Optional[GenerationJob]:
        """Fetch oldest pending job and atomically set to processing."""
        async with self._session_factory() as db:
            # Note: with_for_update() is not supported by SQLite,
            # but SQLite serializes writes via its own locking, which
            # is sufficient for a single-worker queue.
            result = await db.execute(
                select(GenerationJob)
                .where(GenerationJob.status == "pending")
                .order_by(GenerationJob.created_at.asc())
                .limit(1)
            )
            job = result.scalar_one_or_none()
            if job:
                job.status = "processing"
                job.started_at = datetime.utcnow()
                await db.commit()
                await db.refresh(job)
                logger.info(f"Job {job.id} dequeued -> processing")
            return job

    async def mark_completed(self, job_id: str, output_path: str, duration_ms: int) -> None:
        async with self._session_factory() as db:
            await db.execute(
                update(GenerationJob)
                .where(GenerationJob.id == job_id)
                .values(
                    status="completed",
                    output_path=output_path,
                    duration_ms=duration_ms,
                    completed_at=datetime.utcnow(),
                )
            )
            await db.commit()
            logger.info(f"Job {job_id} completed")

    async def mark_failed(self, job_id: str, error: str) -> None:
        async with self._session_factory() as db:
            await db.execute(
                update(GenerationJob)
                .where(GenerationJob.id == job_id)
                .values(
                    status="failed",
                    error=error,
                    completed_at=datetime.utcnow(),
                )
            )
            await db.commit()
            logger.info(f"Job {job_id} failed: {error}")

    async def cancel(self, job_id: str) -> bool:
        """Cancel a pending job. Returns True if cancelled."""
        async with self._session_factory() as db:
            result = await db.execute(
                select(GenerationJob)
                .where(GenerationJob.id == job_id, GenerationJob.status == "pending")
            )
            job = result.scalar_one_or_none()
            if job:
                job.status = "cancelled"
                await db.commit()
                logger.info(f"Job {job_id} cancelled")
                return True
            return False

    async def get_job(self, job_id: str) -> Optional[GenerationJob]:
        async with self._session_factory() as db:
            result = await db.execute(
                select(GenerationJob).where(GenerationJob.id == job_id)
            )
            return result.scalar_one_or_none()

    async def get_jobs(self, status: Optional[str] = None, limit: int = 50, offset: int = 0) -> tuple[list[GenerationJob], int]:
        """Get jobs with optional filter. Returns (jobs, total_count)."""
        async with self._session_factory() as db:
            query = select(GenerationJob)
            count_query = select(func.count()).select_from(GenerationJob)
            if status:
                query = query.where(GenerationJob.status == status)
                count_query = count_query.where(GenerationJob.status == status)
            query = query.order_by(GenerationJob.created_at.desc()).limit(limit).offset(offset)

            result = await db.execute(query)
            jobs = list(result.scalars().all())
            count_result = await db.execute(count_query)
            total = count_result.scalar() or 0
            return jobs, total

    async def get_queue_position(self, job_id: str) -> int:
        """Get position of a pending job in queue (0-based)."""
        async with self._session_factory() as db:
            result = await db.execute(
                select(GenerationJob.id)
                .where(GenerationJob.status == "pending")
                .order_by(GenerationJob.created_at.asc())
            )
            ids = [row[0] for row in result.all()]
            try:
                return ids.index(job_id)
            except ValueError:
                return -1

    async def recover_stale_jobs(self) -> int:
        """Reset processing jobs to pending on startup (crash recovery)."""
        async with self._session_factory() as db:
            result = await db.execute(
                select(GenerationJob).where(GenerationJob.status == "processing")
            )
            stale = result.scalars().all()
            for job in stale:
                job.status = "pending"
                job.started_at = None
            await db.commit()
            if stale:
                logger.info(f"Recovered {len(stale)} stale jobs")
            return len(stale)

    async def wait_for_job(self) -> None:
        """Block until a new job is available."""
        self._notify.clear()
        await self._notify.wait()
