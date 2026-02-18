from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.dependencies import get_db
from app.models.track import Track
from app.schemas.track import TrackResponse, TrackUpdateRequest, TrackListResponse
from pathlib import Path
from typing import Optional

router = APIRouter(prefix="/api", tags=["tracks"])


@router.get("/tracks", response_model=TrackListResponse)
async def list_tracks(
    db: AsyncSession = Depends(get_db),
    search: Optional[str] = None,
    tags: Optional[str] = None,
    favorite: Optional[bool] = None,
    sort: str = "created_at",
    limit: int = 20,
    offset: int = 0,
):
    query = select(Track)
    count_query = select(func.count()).select_from(Track)

    if search:
        search_filter = Track.title.ilike(f"%{search}%") | Track.lyrics.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    if tags:
        query = query.where(Track.tags.ilike(f"%{tags}%"))
        count_query = count_query.where(Track.tags.ilike(f"%{tags}%"))
    if favorite is not None:
        query = query.where(Track.favorite == favorite)
        count_query = count_query.where(Track.favorite == favorite)

    # Sort
    if sort == "title":
        query = query.order_by(Track.title.asc())
    elif sort == "duration_ms":
        query = query.order_by(Track.duration_ms.desc())
    else:
        query = query.order_by(Track.created_at.desc())

    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    tracks = list(result.scalars().all())
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    return TrackListResponse(
        tracks=[TrackResponse.model_validate(t) for t in tracks],
        total=total,
    )


@router.get("/tracks/{track_id}", response_model=TrackResponse)
async def get_track(track_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")
    return TrackResponse.model_validate(track)


@router.patch("/tracks/{track_id}", response_model=TrackResponse)
async def update_track(
    track_id: str,
    updates: TrackUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(track, key, value)

    await db.commit()
    await db.refresh(track)
    return TrackResponse.model_validate(track)


@router.delete("/tracks/{track_id}")
async def delete_track(
    track_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Track).where(Track.id == track_id))
    track = result.scalar_one_or_none()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    # Delete file
    storage = request.app.state.storage
    if track.output_path:
        await storage.delete_file(Path(track.output_path))

    await db.delete(track)
    await db.commit()
    return {"success": True}
