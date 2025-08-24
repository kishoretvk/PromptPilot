# config.py
# Configuration management for PromptPilot

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import validator, field_validator

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
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:3001",  # Grafana
        "http://localhost:9090",  # Prometheus
    ]
    
    @field_validator('BACKEND_CORS_ORIGINS', mode='before')
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    # Validation settings
    @validator('ENVIRONMENT')
    def validate_environment(cls, v):
        if v not in ['development', 'staging', 'production']:
            raise ValueError('ENVIRONMENT must be one of: development, staging, production')
        return v
    
    # Database validation
    @validator('DATABASE_URL')
    def validate_database_url(cls, v):
        if not v:
            raise ValueError('DATABASE_URL is required')
        return v
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"

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