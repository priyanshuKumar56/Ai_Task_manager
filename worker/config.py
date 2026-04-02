"""Worker configuration using pydantic-settings."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0

    MONGODB_URI: str = "mongodb://localhost:27017/ai-task-platform"
    MONGO_DB_NAME: str = "ai-task-platform"

    METRICS_PORT: int = 9090
    HEALTH_PORT: int = 8080

    LOG_LEVEL: str = "INFO"
    NODE_ENV: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True
