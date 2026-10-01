"""
SafeRoute Bengaluru — Application Configuration
Loads all settings from environment variables using Pydantic Settings.
"""

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application settings loaded from .env file or environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    app_name: str = "SafeRoute Bengaluru"
    app_version: str = "0.1.0"
    debug: bool = False

    # --- Database ---
    database_url: str = Field(default=..., env="DATABASE_URL")
    database_url_sync: str = Field(default=..., env="DATABASE_URL_SYNC")

    # --- Redis ---
    redis_url: str = "redis://localhost:6379/0"

    # --- Celery ---
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    @field_validator("jwt_secret_key")
    @classmethod
    def check_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("JWT_SECRET_KEY must be set and non-empty")
        return v

    # --- JWT Auth ---
    jwt_secret_key: str = Field(..., env="JWT_SECRET_KEY")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440  # 24 hours

    # --- SMS / Twilio ---
    sms_backend: str = "mock"  # "mock" or "twilio"
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_verify_service_sid: str = ""
    twilio_phone_number: str = ""

    # --- CORS ---
    cors_allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",")]

    # --- Graph ---
    graph_rebuild_on_startup: bool = True

    # --- Safety Score Weights ---
    weight_cctv: float = 0.30
    weight_crowd: float = 0.25
    weight_emergency: float = 0.20
    weight_lighting: float = 0.15
    weight_crime: float = 0.10

    # --- Routing ---
    routing_alpha: float = 0.8
    routing_beta: float = 0.1
    routing_gamma: float = 0.1

settings = Settings()
