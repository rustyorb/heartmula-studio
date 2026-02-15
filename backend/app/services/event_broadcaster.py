import asyncio
import time
import json
from typing import Any


class EventBroadcaster:
    """Fan-out SSE events to all connected clients."""

    def __init__(self):
        self._clients: set[asyncio.Queue] = set()

    def subscribe(self) -> asyncio.Queue:
        q = asyncio.Queue(maxsize=100)
        self._clients.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self._clients.discard(q)

    async def broadcast(self, event_type: str, data: dict[str, Any]) -> None:
        message = {"event": event_type, "data": data, "timestamp": time.time()}
        dead = []
        for q in self._clients:
            try:
                q.put_nowait(message)
            except asyncio.QueueFull:
                dead.append(q)
        for q in dead:
            self._clients.discard(q)

    @property
    def client_count(self) -> int:
        return len(self._clients)
