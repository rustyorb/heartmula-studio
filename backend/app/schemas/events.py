from pydantic import BaseModel
from typing import Any, Optional


class SSEEvent(BaseModel):
    event: str
    data: dict[str, Any]
    timestamp: Optional[float] = None
