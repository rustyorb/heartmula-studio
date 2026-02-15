import asyncio
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class GPUInfo:
    name: str = "No GPU"
    vram_total_gb: float = 0
    vram_used_gb: float = 0
    vram_free_gb: float = 0
    cuda_available: bool = False
    use_mmgp: bool = False


class GPUManager:
    def __init__(self):
        self.info = GPUInfo()
        self._lock = asyncio.Lock()

    async def initialize(self) -> GPUInfo:
        """Detect GPU capabilities."""
        try:
            import torch
            if torch.cuda.is_available():
                props = torch.cuda.get_device_properties(0)
                total = props.total_mem / (1024**3)
                used = torch.cuda.memory_allocated(0) / (1024**3)
                self.info = GPUInfo(
                    name=props.name,
                    vram_total_gb=round(total, 1),
                    vram_used_gb=round(used, 1),
                    vram_free_gb=round(total - used, 1),
                    cuda_available=True,
                    use_mmgp=total < 14,  # Use mmgp for GPUs < 14GB
                )
            else:
                logger.warning("CUDA not available")
        except ImportError:
            logger.warning("PyTorch not installed, GPU features disabled")
        return self.info

    def get_status(self) -> dict:
        """Return current GPU status as dict."""
        try:
            import torch
            if torch.cuda.is_available():
                used = torch.cuda.memory_allocated(0) / (1024**3)
                reserved = torch.cuda.memory_reserved(0) / (1024**3)
                self.info.vram_used_gb = round(used, 1)
                self.info.vram_free_gb = round(self.info.vram_total_gb - used, 1)
        except (ImportError, RuntimeError):
            pass
        return {
            "name": self.info.name,
            "vram_total_gb": self.info.vram_total_gb,
            "vram_used_gb": self.info.vram_used_gb,
            "vram_free_gb": self.info.vram_free_gb,
            "use_mmgp": self.info.use_mmgp,
        }

    async def gpu_lock(self):
        """Acquire exclusive GPU access."""
        return self._lock
