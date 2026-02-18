from fastapi import APIRouter, UploadFile, File, Request, HTTPException
import asyncio
import uuid

router = APIRouter(prefix="/api", tags=["transcription"])


@router.post("/transcribe")
async def transcribe_audio(
    request: Request,
    file: UploadFile = File(...),
):
    # Validate file type
    allowed = {".mp3", ".wav", ".flac", ".ogg", ".m4a"}
    ext = "." + (file.filename or "").rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {allowed}")

    storage = request.app.state.storage
    broadcaster = request.app.state.broadcaster
    transcription_service = request.app.state.transcription_service

    # Save upload
    upload_path = await storage.save_upload(file)
    job_id = str(uuid.uuid4())

    # Run transcription (async - broadcast result via SSE)
    async def run_transcription():
        try:
            result = await transcription_service.transcribe(upload_path)
            await broadcaster.broadcast("transcription:completed", {
                "job_id": job_id,
                "lyrics": result["lyrics"],
            })
        except Exception as e:
            await broadcaster.broadcast("transcription:failed", {
                "job_id": job_id,
                "error": str(e),
            })
        finally:
            # Clean up uploaded file
            await storage.delete_file(upload_path)

    asyncio.create_task(run_transcription())
    return {"job_id": job_id}
