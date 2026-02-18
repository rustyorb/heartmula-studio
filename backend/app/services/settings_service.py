from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.settings import UserSettings


class SettingsService:
    @staticmethod
    async def get_settings(db: AsyncSession) -> UserSettings:
        """Get or create singleton settings row."""
        result = await db.execute(select(UserSettings).where(UserSettings.id == 1))
        settings = result.scalar_one_or_none()
        if settings is None:
            settings = UserSettings(id=1)
            db.add(settings)
            await db.commit()
            await db.refresh(settings)
        return settings

    @staticmethod
    async def update_settings(db: AsyncSession, updates: dict) -> UserSettings:
        """Update settings with partial dict."""
        settings = await SettingsService.get_settings(db)
        for key, value in updates.items():
            if value is not None and hasattr(settings, key):
                setattr(settings, key, value)
        await db.commit()
        await db.refresh(settings)
        return settings
