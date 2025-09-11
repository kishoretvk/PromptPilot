# config.py
# Configuration management for PromptPilot

import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    # Application settings
    PROJECT_NAME: str = "PromptPilot"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/promptpilot.db")

    # Security settings
    ALGORITHM: str = "HS256"

    # LLM Provider settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY")

    # Rate limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "100"))

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:3001",  # Grafana
        "http://localhost:9090",  # Prometheus
    ]

    # .env fields from environment file
    APP_NAME: str = "PromptPilot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    JWT_SECRET_KEY: str = "your-jwt-secret-key-here-32-characters-minimum"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: List[str] = ["http://localhost:3000","https://yourdomain.com"]
    POSTGRES_DB: str = "promptpilot"
    POSTGRES_USER: str = "promptpilot_user"
    POSTGRES_PASSWORD: str = "your-secure-database-password-here"
    REDIS_PASSWORD: str = "your-redis-password-here"
    HUGGINGFACE_API_TOKEN: Optional[str] = ""
    REACT_APP_API_URL: str = "http://localhost:8000"
    REACT_APP_WS_URL: str = "ws://localhost:8000/ws"
    REACT_APP_APP_NAME: str = "PromptPilot"
    REACT_APP_VERSION: str = "1.0.0"
    PROMETHEUS_ENABLED: bool = True
    PROMETHEUS_PORT: int = 8001
    LOG_LEVEL: str = "INFO"
    SENTRY_DSN: str = ""
    REACT_APP_SENTRY_DSN: str = ""
    GRAFANA_ADMIN_PASSWORD: str = ""
    SMTP_SERVER: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    RATE_LIMIT_BURST_SIZE: int = 200
    SESSION_TIMEOUT: int = 3600
    MAX_LOGIN_ATTEMPTS: int = 5
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 10
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_BUCKET_NAME: str = ""
    AWS_REGION: str = "us-west-2"
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_CONTAINER_NAME: str = ""
    WEBHOOK_URL: str = ""
    SLACK_WEBHOOK_URL: str = ""
    ZAPIER_WEBHOOK_URL: str = ""
    MAKE_WEBHOOK_URL: str = ""
    DEVELOPMENT_MODE: bool = False
    BACKEND_RELOAD: bool = False
    FRONTEND_DEV_PORT: int = 3000
    BACKUP_RETENTION_DAYS: int = 30
    BACKUP_SCHEDULE: str = "0 2 * * *"
    BACKUP_STORAGE_PATH: str = "./backups"
    SSL_CERT_PATH: str = ""
    SSL_KEY_PATH: str = ""
    LETSENCRYPT_EMAIL: str = ""
    DOMAIN_NAME: str = ""
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    REDIS_POOL_SIZE: int = 10
    WORKER_PROCESSES: int = 4
    WORKER_CONNECTIONS: int = 1000
    ENABLE_USER_REGISTRATION: bool = True
    ENABLE_SOCIAL_AUTH: bool = False
    ENABLE_API_DOCS: bool = True
    ENABLE_METRICS_ENDPOINT: bool = True
    ENABLE_WEBSOCKET: bool = True
    ENABLE_VECTOR_SEARCH: bool = False
    ENABLE_AI_SUGGESTIONS: bool = False
    ENABLE_BATCH_PROCESSING: bool = False
    ENABLE_GDPR_MODE: bool = False
    DATA_RETENTION_DAYS: int = 365
    ENABLE_AUDIT_LOG: bool = True
    AUDIT_LOG_RETENTION_DAYS: int = 90
    ANONYMIZE_USER_DATA: bool = False
    ENABLE_COOKIE_CONSENT: bool = False
    
    @field_validator('BACKEND_CORS_ORIGINS', mode='before')
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    # Validation settings
    @field_validator('ENVIRONMENT')
    @classmethod
    def validate_environment(cls, v):
        if v not in ['development', 'staging', 'production']:
            raise ValueError('ENVIRONMENT must be one of: development, staging, production')
        return v

    # Database validation
    @field_validator('DATABASE_URL')
    @classmethod
    def validate_database_url(cls, v):
        if not v:
            raise ValueError('DATABASE_URL is required')
        return v
    
    model_config = dict(extra="allow")

# Create settings instance
settings = Settings()

# Function to reload configuration
def reload_settings():
    global settings
    settings = Settings()
    return settings

# Function to validate configuration
def validate_configuration():
    """Validate that all required configuration values are present"""
    errors = []
    
    # Check secret key
    if settings.SECRET_KEY == "your-secret-key-change-in-production":
        errors.append("SECRET_KEY is using default value, please change in production")
    
    # Check database URL
    if not settings.DATABASE_URL:
        errors.append("DATABASE_URL is required")
    
    # Check at least one LLM provider key
    if not any([settings.OPENAI_API_KEY, settings.ANTHROPIC_API_KEY, settings.GOOGLE_API_KEY]):
        errors.append("At least one LLM provider API key is required")
    
    # Check environment
    if settings.ENVIRONMENT == "production" and (
        settings.SECRET_KEY == "your-secret-key-change-in-production"
    ):
        errors.append("Production environment requires proper secret key configuration")
    
    return errors

# Function to get configuration summary
def get_config_summary():
    """Get a summary of current configuration (without sensitive data)"""
    return {
        "project_name": settings.PROJECT_NAME,
        "project_version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "database_url": settings.DATABASE_URL,
        "rate_limit": settings.RATE_LIMIT_REQUESTS_PER_MINUTE,
        "cors_origins": settings.BACKEND_CORS_ORIGINS,
        "llm_providers_configured": {
            "openai": bool(settings.OPENAI_API_KEY),
            "anthropic": bool(settings.ANTHROPIC_API_KEY),
            "google": bool(settings.GOOGLE_API_KEY),
        }
    }

if __name__ == "__main__":
    # Print configuration summary when run directly
    print("PromptPilot Configuration Summary:")
    print("----------------------------------")
    summary = get_config_summary()
    for key, value in summary.items():
        print(f"{key}: {value}")
    
    # Validate configuration
    errors = validate_configuration()
    if errors:
        print("\nConfiguration Warnings:")
        print("-----------------------")
        for error in errors:
            print(f"WARNING: {error}")
    else:
        print("\nConfiguration validation passed!")
