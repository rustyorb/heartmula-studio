from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str = "sqlite+aiosqlite:///data/heartmula.db"

    # Model paths
    model_path: str = "./models"
    model_version: str = "3B"
    lazy_load: bool = True  # Required for 12GB VRAM

    # Generation defaults
    default_max_length_ms: int = 240000
    default_temperature: float = 1.0
    default_topk: int = 50
    default_cfg_scale: float = 1.5

    # Storage
    output_dir: str = "data/outputs"
    upload_dir: str = "data/uploads"
    max_upload_size_mb: int = 50

    class Config:
        env_prefix = "HEARTMULA_"
        env_file = ".env"


def get_settings() -> Settings:
    return Settings()
