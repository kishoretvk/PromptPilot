# Configuration Management

PromptPilot uses a comprehensive configuration management system based on Pydantic Settings to handle environment-specific configurations, secrets, and application settings.

## 📋 Overview

The configuration system provides:
- Environment-based configuration
- Type-safe settings validation
- Secrets management
- Configuration validation
- Multiple environment support (development, staging, production)

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │────│  Config System   │────│   Environment   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                     ┌─────────────────┐
                     │   Settings      │
                     │                 │
                     │  ├── General    │
                     │  ├── Database   │
                     │  ├── Security   │
                     │  ├── LLM        │
                     │  └── Rate Limit │
                     └─────────────────┘
```

## 🚀 Setup

### Prerequisites
- Python 3.8+
- Pydantic Settings
- python-dotenv
- cryptography (for secrets management)

### Installation
The configuration system is included in the requirements:

```bash
pip install -r requirements.txt
```

This installs pydantic-settings and related dependencies.

## 🛠️ Configuration Files

### .env File
Environment variables are loaded from `.env` file:

```env
# Application
PROJECT_NAME=PromptPilot
PROJECT_VERSION=1.0.0
SECRET_KEY=your-super-secret-key-change-in-production
ENVIRONMENT=development

# Database
DATABASE_URL=sqlite:///./data/promptpilot.db

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
GOOGLE_API_KEY=AI...

# Security
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

### Programmatic Configuration
Settings can also be set programmatically:

```python
from api.config import settings

# Access settings
print(settings.PROJECT_NAME)
print(settings.DATABASE_URL)

# Override settings (for testing)
settings.DATABASE_URL = "sqlite:///./test.db"
```

## 📝 Settings Structure

### General Settings
```python
PROJECT_NAME: str = "PromptPilot"
PROJECT_VERSION: str = "1.0.0"
API_V1_STR: str = "/api/v1"
SECRET_KEY: str = "your-secret-key-change-in-production"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
```

### Database Settings
```python
DATABASE_URL: str = "sqlite:///./data/promptpilot.db"
```

### Security Settings
```python
ALGORITHM: str = "HS256"
```

### LLM Provider Settings
```python
OPENAI_API_KEY: Optional[str] = None
ANTHROPIC_API_KEY: Optional[str] = None
GOOGLE_API_KEY: Optional[str] = None
```

### Rate Limiting Settings
```python
RATE_LIMIT_REQUESTS_PER_MINUTE: int = 100
```

### Environment Settings
```python
ENVIRONMENT: str = "development"  # development, staging, production
```

## 🔐 Secrets Management

### Secret Storage
Secrets are stored encrypted in `data/secrets.json`:

```json
{
  "OPENAI_API_KEY": {
    "value": "gAAAAABk...",
    "encrypted": true
  },
  "SECRET_KEY": {
    "value": "gAAAAABk...",
    "encrypted": true
  }
}
```

### Using Secrets
```python
from api.secrets import get_secret, store_secret

# Store a secret
store_secret("api_key", "sk-1234567890")

# Retrieve a secret
api_key = get_secret("api_key")

# Retrieve with default
api_key = get_secret("api_key", "default-key")
```

### Migrating from Environment Variables
```python
from api.secrets import migrate_env_to_secrets

# Migrate sensitive environment variables to secrets storage
migrate_env_to_secrets()
```

## 🔄 Environment Support

### Development
```env
ENVIRONMENT=development
DEBUG=True
LOG_LEVEL=DEBUG
```

### Staging
```env
ENVIRONMENT=staging
DEBUG=False
LOG_LEVEL=INFO
```

### Production
```env
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=WARNING
SECRET_KEY=super-secret-production-key
```

## 🧪 Validation

### Configuration Validation
The system validates configuration at startup:

```python
from api.config import validate_configuration

# Validate current configuration
errors = validate_configuration()
if errors:
    for error in errors:
        print(f"Configuration error: {error}")
```

### Custom Validation
Add custom validation rules:

```python
from pydantic import validator

class Settings(BaseSettings):
    @validator('ENVIRONMENT')
    def validate_environment(cls, v):
        if v not in ['development', 'staging', 'production']:
            raise ValueError('ENVIRONMENT must be one of: development, staging, production')
        return v
```

## 📊 Configuration Summary

### Get Configuration Summary
```python
from api.config import get_config_summary

# Get non-sensitive configuration summary
summary = get_config_summary()
print(summary)
```

Sample output:
```json
{
  "project_name": "PromptPilot",
  "project_version": "1.0.0",
  "environment": "development",
  "database_url": "sqlite:///./data/promptpilot.db",
  "rate_limit": 100,
  "cors_origins": [
    "http://localhost:3000",
    "http://localhost:8000"
  ],
  "llm_providers_configured": {
    "openai": true,
    "anthropic": false,
    "google": false
  }
}
```

## 🛡️ Security Best Practices

### Secret Key Management
- Never commit secret keys to version control
- Use different keys for each environment
- Rotate keys regularly
- Use environment variables or secrets management

### Environment Variables
```bash
# Set in production environment
export SECRET_KEY="your-production-secret-key"
export DATABASE_URL="postgresql://user:pass@localhost/db"
```

### Docker Environment
```dockerfile
# Dockerfile
ENV ENVIRONMENT=production

# Pass secrets at runtime
# docker run -e SECRET_KEY="prod-key" promptpilot
```

## 🔄 Reloading Configuration

### Reload Settings
```python
from api.config import reload_settings

# Reload configuration from environment
new_settings = reload_settings()
```

### Hot Reloading
For development environments:

```python
import os
from api.config import settings

# Check for changes in .env file
if os.path.exists('.env'):
    # Reload settings
    reload_settings()
```

## 📈 Performance Considerations

### Caching
Settings are cached for performance:

```python
# First access - loads from environment
settings = Settings()

# Subsequent accesses - uses cached instance
settings.PROJECT_NAME
```

### Lazy Loading
Secrets are loaded on demand:

```python
# Secrets not loaded yet
from api.secrets import secrets_manager

# Secrets loaded when first accessed
value = secrets_manager.get_secret("key")
```

## 🚨 Common Issues

### Missing Configuration
Handle missing configuration gracefully:

```python
from api.config import settings

# Provide defaults for optional settings
api_key = settings.OPENAI_API_KEY or "default-key"
```

### Invalid Configuration
Validate configuration early:

```python
from api.config import validate_configuration

# Validate at application startup
def startup_event():
    errors = validate_configuration()
    if errors:
        raise ValueError(f"Invalid configuration: {errors}")
```

### Environment Conflicts
Separate environments properly:

```env
# development.env
ENVIRONMENT=development
DATABASE_URL=sqlite:///./data/dev.db

# production.env
ENVIRONMENT=production
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host/prod-db
```

## 🧪 Testing Configuration

### Test Configuration
```python
import pytest
from api.config import Settings

def test_settings_validation():
    # Test valid settings
    settings = Settings(ENVIRONMENT="development")
    assert settings.ENVIRONMENT == "development"
    
    # Test invalid settings
    with pytest.raises(ValueError):
        Settings(ENVIRONMENT="invalid")
```

### Mock Configuration
```python
import pytest
from unittest.mock import patch
from api.config import Settings

@pytest.fixture
def mock_settings():
    with patch('api.config.settings') as mock:
        mock.PROJECT_NAME = "Test Project"
        yield mock
```

## 📚 Further Reading

- [Pydantic Settings Documentation](https://docs.pydantic.dev/latest/usage/pydantic_settings/)
- [Python-dotenv Documentation](https://saurabh-kumar.com/python-dotenv/)
- [12 Factor App - Config](https://12factor.net/config)
- [Environment Variables Best Practices](https://medium.com/chingu/environment-variables-best-practices-3507645dc70e)

## 🤝 Contributing

To contribute to the configuration system:
1. Follow the existing pattern for new settings
2. Add appropriate validation
3. Update documentation
4. Test across environments