from fastapi import Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session_factory
from app.services.event_broadcaster import EventBroadcaster
from app.services.gpu_manager import GPUManager
from app.services.storage_service import StorageService


def get_broadcaster(request: Request) -> EventBroadcaster:
    return request.app.state.broadcaster


def get_gpu_manager(request: Request) -> GPUManager:
    return request.app.state.gpu_manager


def get_storage(request: Request) -> StorageService:
    return request.app.state.storage


async def get_db():
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
