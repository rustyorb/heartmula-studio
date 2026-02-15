from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db
from app.services.settings_service import SettingsService
from app.schemas.settings import SettingsResponse, SettingsUpdateRequest

router = APIRouter(prefix="/api", tags=["settings"])


@router.get("/settings", response_model=SettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    settings = await SettingsService.get_settings(db)
    return SettingsResponse.model_validate(settings)


@router.put("/settings", response_model=SettingsResponse)
async def update_settings(
    updates: SettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    settings = await SettingsService.update_settings(
        db, updates.model_dump(exclude_unset=True)
    )
    return SettingsResponse.model_validate(settings)
