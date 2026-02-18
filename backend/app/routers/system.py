from fastapi import APIRouter, Depends, Request
from app.dependencies import get_gpu_manager
from app.services.gpu_manager import GPUManager
from app.schemas.system import HealthResponse, GpuStatusResponse

router = APIRouter(prefix="/api", tags=["system"])


@router.get("/health", response_model=HealthResponse)
async def health(request: Request):
    pipeline = request.app.state.pipeline
    gpu = request.app.state.gpu_manager
    return HealthResponse(
        status="ok",
        model_state=pipeline.get_state(),
        gpu_available=gpu.info.cuda_available,
    )


@router.get("/gpu", response_model=GpuStatusResponse)
async def gpu_status(gpu: GPUManager = Depends(get_gpu_manager)):
    status = gpu.get_status()
    return GpuStatusResponse(**status)
