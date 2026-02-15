import asyncio
import json
from fastapi import APIRouter, Depends
from starlette.responses import StreamingResponse
from app.dependencies import get_broadcaster
from app.services.event_broadcaster import EventBroadcaster

router = APIRouter(prefix="/api", tags=["events"])


@router.get("/events")
async def event_stream(broadcaster: EventBroadcaster = Depends(get_broadcaster)):
    queue = broadcaster.subscribe()

    async def generate():
        try:
            # Send initial connected event
            yield f"data: {json.dumps({'event': 'system:connected', 'data': {}})}\n\n"
            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(message)}\n\n"
                except asyncio.TimeoutError:
                    # Send heartbeat
                    yield f"data: {json.dumps({'event': 'heartbeat', 'data': {}})}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            broadcaster.unsubscribe(queue)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
