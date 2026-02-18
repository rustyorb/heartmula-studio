from fastapi import APIRouter, HTTPException, Request
from app.schemas.job import GenerationRequest, GenerationResponse, JobResponse, JobListResponse
from typing import Optional

router = APIRouter(prefix="/api", tags=["generation"])


@router.post("/generate", response_model=GenerationResponse)
async def submit_generation(
    params: GenerationRequest,
    request: Request,
):
    job_queue = request.app.state.job_queue
    broadcaster = request.app.state.broadcaster

    job = await job_queue.enqueue({
        "lyrics": params.lyrics,
        "tags": params.tags,
        "max_length_ms": params.max_length_ms,
        "temperature": params.temperature,
        "topk": params.topk,
        "cfg_scale": params.cfg_scale,
    })

    position = await job_queue.get_queue_position(job.id)

    await broadcaster.broadcast("job:queued", {
        "job_id": job.id,
        "status": job.status,
        "lyrics": job.lyrics,
        "tags": job.tags,
        "queue_position": position,
        "created_at": job.created_at.isoformat(),
    })

    return GenerationResponse(
        job_id=job.id,
        status=job.status,
        queue_position=position,
        created_at=job.created_at,
    )


@router.get("/jobs", response_model=JobListResponse)
async def list_jobs(
    request: Request,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    job_queue = request.app.state.job_queue
    jobs, total = await job_queue.get_jobs(status=status, limit=limit, offset=offset)
    return JobListResponse(
        jobs=[JobResponse.model_validate(j) for j in jobs],
        total=total,
    )


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, request: Request):
    job_queue = request.app.state.job_queue
    job = await job_queue.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse.model_validate(job)


@router.delete("/jobs/{job_id}")
async def cancel_job(job_id: str, request: Request):
    job_queue = request.app.state.job_queue
    broadcaster = request.app.state.broadcaster
    cancelled = await job_queue.cancel(job_id)
    if cancelled:
        await broadcaster.broadcast("job:cancelled", {"job_id": job_id})
        return {"success": True, "message": "Job cancelled"}
    return {"success": False, "message": "Job not found or already processing"}
