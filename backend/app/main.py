import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.config import get_settings
from app.database import init_db, async_session_factory
from app.services.event_broadcaster import EventBroadcaster
from app.services.gpu_manager import GPUManager
from app.services.storage_service import StorageService
from app.services.pipeline_manager import PipelineManager
from app.services.job_queue import JobQueue
from app.services.generation_worker import GenerationWorker
from app.services.transcription_service import TranscriptionService
from app.routers import events, system, settings as settings_router, generation, tracks, transcription

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Path(settings.output_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    await init_db()

    # Initialize core services
    app.state.broadcaster = EventBroadcaster()
    app.state.gpu_manager = GPUManager()
    app.state.storage = StorageService(settings)

    # Detect GPU
    await app.state.gpu_manager.initialize()
    await app.state.broadcaster.broadcast("gpu:status", app.state.gpu_manager.get_status())

    # Initialize pipeline services
    app.state.pipeline = PipelineManager(settings)
    app.state.job_queue = JobQueue(async_session_factory)
    app.state.transcription_service = TranscriptionService(app.state.pipeline)

    # Load model and broadcast status
    try:
        async def model_progress(progress, msg):
            await app.state.broadcaster.broadcast("model:loading_progress", {"progress": progress, "message": msg})
        await app.state.pipeline.load_generation_model(progress_callback=model_progress)
        await app.state.broadcaster.broadcast("model:ready", {"state": "ready"})
    except Exception as e:
        logger.error(f"Model load failed: {e}")
        await app.state.broadcaster.broadcast("model:error", {"error": str(e)})

    # Recover stale jobs from crash
    recovered = await app.state.job_queue.recover_stale_jobs()
    if recovered:
        logger.info(f"Recovered {recovered} stale jobs")

    # Start generation worker
    app.state.worker = GenerationWorker(
        job_queue=app.state.job_queue,
        pipeline=app.state.pipeline,
        gpu=app.state.gpu_manager,
        broadcaster=app.state.broadcaster,
        storage=app.state.storage,
    )
    await app.state.worker.start()

    yield

    # Shutdown
    await app.state.worker.stop()
    await app.state.pipeline.unload()


app = FastAPI(title="HeartMuLa Studio", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for audio output
output_path = Path(settings.output_dir)
output_path.mkdir(parents=True, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=str(output_path)), name="outputs")

# Include routers
app.include_router(events.router)
app.include_router(system.router)
app.include_router(settings_router.router)
app.include_router(generation.router)
app.include_router(tracks.router)
app.include_router(transcription.router)
