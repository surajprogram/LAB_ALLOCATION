import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg2://postgres:Suraj%402005@localhost:5432/campus_lab_optimizer"
    DB_CONNECTION: str | None = None
    
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "Suraj@2005"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "campus_lab_optimizer"

    SECRET_KEY: str = "campus_lab_optimizer_super_secret_jwt_key_2026_code_crack"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    ADMIN_NAME: str = "Administrator"
    ADMIN_EMAIL: str = "admin@campuslab.edu"
    ADMIN_PASSWORD: str = "admin123"

    @property
    def get_database_url(self) -> str:
        url = self.DB_CONNECTION or self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

settings = Settings()

