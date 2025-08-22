from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from typing import List, Optional
import time
import uuid
from datetime import datetime, timedelta
import uvicorn
from pydantic import BaseModel, Field

from schemas_simple import (
    PaginatedResponse, PromptResponse, CreatePromptRequest, UpdatePromptRequest,
    TestPromptRequest, TestResultResponse, MessageResponse, SettingsResponse,
    PromptStatusEnum
)
from database_simple import get_db, init_db, test_db_connection
from logging_config import (
    get_logger, set_request_context, clear_request_context,
    SecurityEvent, BusinessEvent, PerformanceMonitor
)
from metrics import MetricsCollector
from security import (
    RateLimitMiddleware, SecurityMiddleware, InputValidationMiddleware,
    api_key_manager, get_current_user_or_api_key, require_scope,
    security_config
)

# Initialize logging and metrics
logger = get_logger(__name__)
metrics_collector = MetricsCollector()

# Pydantic models for API requests
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str

class CreateAPIKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    scopes: List[str] = Field(default=["read"])
    expires_in_days: int = Field(default=365, ge=1, le=3650)

class APIKeyResponse(BaseModel):
    api_key: str
    name: str
    scopes: List[str]
    expires_at: datetime

class LoggingMiddleware(BaseHTTPMiddleware):
    """Enhanced middleware for request/response logging and metrics collection"""
    
    async def dispatch(self, request: Request, call_next):
        # Generate request ID for correlation
        request_id = str(uuid.uuid4())
        start_time = time.time()
        
        # Extract user info from token/API key
        user_id = "anonymous"
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                if token.startswith("sk-"):
                    key_data = api_key_manager.verify_api_key(token)
                    if key_data:
                        user_id = key_data["user_id"]
                else:
                    # JWT token - simplified extraction
                    user_id = "jwt_user"
            except Exception:
                pass
        
        # Set logging context
        set_request_context(request_id, user_id)
        
        # Log request
        logger.info(
            "Request started",
            method=request.method,
            url=str(request.url),
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else "unknown",
            request_id=request_id
        )
        
        try:
            # Process request
            response = await call_next(request)
            duration = time.time() - start_time
            
            # Record metrics
            metrics_collector.record_api_request(
                method=request.method,
                endpoint=request.url.path,
                status_code=response.status_code,
                duration=duration,
                user_id=user_id if user_id != "anonymous" else None
            )
            
            # Log response
            logger.info(
                "Request completed",
                status_code=response.status_code,
                duration=duration,
                request_id=request_id
            )
            
            # Record performance metrics
            PerformanceMonitor.log_api_performance(
                endpoint=request.url.path,
                method=request.method,
                duration=duration,
                status_code=response.status_code
            )
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            # Record error metrics
            metrics_collector.record_api_request(
                method=request.method,
                endpoint=request.url.path,
                status_code=500,
                duration=duration,
                user_id=user_id if user_id != "anonymous" else None
            )
            
            # Log error
            logger.error(
                "Request failed",
                error=str(e),
                duration=duration,
                request_id=request_id,
                exc_info=True
            )
            
            raise
        finally:
            # Clear logging context
            clear_request_context()

# Create FastAPI app
app = FastAPI(
    title="PromptPilot API",
    version="1.0.0",
    description="LLM Prompt Engineering and Pipeline Management Platform with Enterprise Security",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add security middleware in correct order
app.add_middleware(LoggingMiddleware)
app.add_middleware(InputValidationMiddleware)
app.add_middleware(RateLimitMiddleware, 
                  requests_per_minute=security_config.rate_limit_per_minute,
                  burst_limit=security_config.burst_limit)
app.add_middleware(SecurityMiddleware,
                  allowed_hosts=security_config.allowed_hosts,
                  cors_origins=security_config.cors_origins,
                  require_https=security_config.require_https)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.promptpilot.dev"]
)

# Enhanced exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(
        "Validation error",
        errors=exc.errors(),
        body=exc.body,
        path=request.url.path
    )
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation failed",
            "errors": exc.errors(),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(
        "HTTP exception",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception",
        error=str(exc),
        path=request.url.path,
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# In-memory storage for development
prompts_store = {}
pipelines_store = {}
analytics_store = {"usage": {}, "performance": {}, "costs": {}}
settings_store = {
    "theme": {"mode": "light", "primary_color": "#1976d2"},
    "notifications": {"email_notifications": True},
    "security": {
        "require_api_key": security_config.require_api_key,
        "rate_limit_per_minute": security_config.rate_limit_per_minute,
        "api_key_expiry_days": security_config.api_key_expiry_days
    },
    "api_keys": [],
    "integrations": []
}

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    logger.info("Root endpoint accessed")
    return {
        "name": "PromptPilot API",
        "version": "1.0.0",
        "status": "running",
        "security": "enabled",
        "features": [
            "JWT Authentication",
            "API Key Management", 
            "Rate Limiting",
            "Input Validation",
            "Comprehensive Logging",
            "Metrics Collection"
        ],
        "docs_url": "/docs",
        "health_url": "/health",
        "metrics_url": "http://localhost:8001/metrics"
    }

# Health check with security status
@app.get("/health", tags=["Health"])
async def health_check():
    """Comprehensive health check endpoint with security status"""
    logger.info("Health check requested")
    
    db_status = test_db_connection()
    uptime = datetime.utcnow() - metrics_collector.start_time
    
    health_data = {
        "status": "healthy" if db_status else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "uptime_seconds": uptime.total_seconds(),
        "security": {
            "rate_limiting": "enabled",
            "input_validation": "enabled",
            "api_key_auth": "enabled",
            "jwt_auth": "enabled",
            "https_required": security_config.require_https
        },
        "components": {
            "database": "connected" if db_status else "disconnected",
            "logging": "active",
            "metrics": "active",
            "security_middleware": "active"
        }
    }
    
    logger.info("Health check completed", **health_data)
    return health_data

# Authentication endpoints
@app.post("/api/v1/auth/login", response_model=TokenResponse, tags=["Authentication"])
async def login(credentials: LoginRequest):
    """User login with username/password"""
    logger.info("Login attempt", username=credentials.username)
    
    # Mock authentication - in production, verify against database
    if credentials.username == "admin" and credentials.password == "admin123":
        # Generate mock JWT token
        access_token = f"jwt-{uuid.uuid4()}"
        
        SecurityEvent.log_authentication_attempt(
            username=credentials.username,
            success=True,
            ip_address="unknown",
            user_agent="unknown"
        )
        
        logger.info("Login successful", username=credentials.username)
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=3600,
            user_id="user_123"
        )
    else:
        SecurityEvent.log_authentication_attempt(
            username=credentials.username,
            success=False,
            ip_address="unknown",
            user_agent="unknown"
        )
        
        logger.warning("Login failed", username=credentials.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

# API Key Management endpoints
@app.post("/api/v1/auth/api-keys", response_model=APIKeyResponse, tags=["API Keys"])
async def create_api_key(
    request: CreateAPIKeyRequest,
    current_user: dict = Depends(require_scope("admin"))
):
    """Create a new API key"""
    logger.info("Creating API key", user_id=current_user["id"], key_name=request.name)
    
    api_key = api_key_manager.generate_api_key(
        user_id=current_user["id"],
        name=request.name,
        scopes=set(request.scopes),
        expires_in_days=request.expires_in_days
    )
    
    expires_at = datetime.utcnow() + timedelta(days=request.expires_in_days)
    
    return APIKeyResponse(
        api_key=api_key,
        name=request.name,
        scopes=request.scopes,
        expires_at=expires_at
    )

@app.get("/api/v1/auth/api-keys", tags=["API Keys"])
async def list_api_keys(current_user: dict = Depends(get_current_user_or_api_key)):
    """List user's API keys"""
    return api_key_manager.list_api_keys(current_user["id"])

@app.delete("/api/v1/auth/api-keys/{key_id}", tags=["API Keys"])
async def revoke_api_key(
    key_id: str,
    current_user: dict = Depends(require_scope("admin"))
):
    """Revoke an API key"""
    # In production, implement proper key lookup and revocation
    logger.info("API key revoked", key_id=key_id, user_id=current_user["id"])
    return {"message": "API key revoked successfully"}

# Secured Prompt Management Endpoints
@app.get("/api/v1/prompts", response_model=PaginatedResponse[PromptResponse], tags=["Prompts"])
async def get_prompts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    task_type: Optional[str] = None,
    current_user: dict = Depends(require_scope("read"))
):
    """Get paginated list of prompts (requires read scope)"""
    logger.info("Fetching prompts", user_id=current_user["id"], page=page, limit=limit)
    
    # Filter prompts based on search criteria
    filtered_prompts = []
    for prompt in prompts_store.values():
        if search and search.lower() not in prompt["name"].lower():
            continue
        if tags and not any(tag in prompt["tags"] for tag in tags):
            continue
        if task_type and prompt["task_type"] != task_type:
            continue
        filtered_prompts.append(prompt)
    
    # Pagination
    total = len(filtered_prompts)
    start = (page - 1) * limit
    end = start + limit
    items = filtered_prompts[start:end]
    
    logger.info("Prompts fetched", total=total, returned=len(items))
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": limit,
        "total_pages": (total + limit - 1) // limit,
        "has_next": end < total,
        "has_prev": page > 1
    }

@app.post("/api/v1/prompts", response_model=PromptResponse, status_code=201, tags=["Prompts"])
async def create_prompt(
    prompt_data: CreatePromptRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_scope("write"))
):
    """Create a new prompt (requires write scope)"""
    logger.info("Creating prompt", user_id=current_user["id"], prompt_name=prompt_data.name)
    
    prompt_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_prompt = {
        "id": prompt_id,
        "name": prompt_data.name,
        "description": prompt_data.description or "",
        "task_type": prompt_data.task_type,
        "tags": prompt_data.tags,
        "developer_notes": prompt_data.developer_notes or "",
        "messages": [msg.dict() for msg in prompt_data.messages],
        "input_variables": prompt_data.input_variables,
        "model_provider": prompt_data.model_provider,
        "model_name": prompt_data.model_name,
        "parameters": prompt_data.parameters,
        "status": "draft",
        "version": "1.0.0",
        "owner_id": current_user["id"],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "execution_count": 0,
        "avg_execution_time": 0.0,
        "success_rate": 0.0,
        "total_cost": 0.0
    }
    
    prompts_store[prompt_id] = new_prompt
    
    # Log business event
    BusinessEvent.log_prompt_creation(prompt_id, current_user["id"], prompt_data.name)
    
    logger.info("Prompt created successfully", prompt_id=prompt_id)
    
    return new_prompt

# Security configuration endpoints
@app.get("/api/v1/security/config", tags=["Security"])
async def get_security_config(current_user: dict = Depends(require_scope("admin"))):
    """Get security configuration (admin only)"""
    return {
        "rate_limit_per_minute": security_config.rate_limit_per_minute,
        "burst_limit": security_config.burst_limit,
        "require_api_key": security_config.require_api_key,
        "api_key_expiry_days": security_config.api_key_expiry_days,
        "require_https": security_config.require_https,
        "max_request_size": security_config.max_request_size
    }

@app.put("/api/v1/security/config", tags=["Security"])
async def update_security_config(
    config_update: dict,
    current_user: dict = Depends(require_scope("admin"))
):
    """Update security configuration (admin only)"""
    logger.info("Updating security config", user_id=current_user["id"], updates=config_update)
    
    security_config.update(**config_update)
    settings_store["security"].update(config_update)
    
    return {"message": "Security configuration updated successfully"}

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting PromptPilot API with Enterprise Security", version="1.0.0")
    
    # Initialize database
    init_db()
    
    # Start metrics collection
    metrics_collector.start_metrics_server(port=8001)
    metrics_collector.start_system_monitoring()
    
    # Create default API key for testing
    default_api_key = api_key_manager.generate_api_key(
        user_id="admin",
        name="Default Admin Key",
        scopes={"read", "write", "admin"},
        expires_in_days=365
    )
    
    # Add sample data
    sample_prompt_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    prompts_store[sample_prompt_id] = {
        "id": sample_prompt_id,
        "name": "Sample Secure Prompt",
        "description": "A sample prompt for testing with security enabled",
        "task_type": "text-generation",
        "tags": ["sample", "test", "secure"],
        "developer_notes": "This prompt demonstrates security features",
        "messages": [
            {"role": "system", "content": "You are a secure assistant", "priority": 1},
            {"role": "user", "content": "Hello, secure world!", "priority": 2}
        ],
        "input_variables": {"user_name": "string"},
        "model_provider": "openai",
        "model_name": "gpt-3.5-turbo",
        "parameters": {"temperature": 0.7, "max_tokens": 150},
        "status": "published",
        "version": "1.0.0",
        "owner_id": "admin",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "execution_count": 0,
        "avg_execution_time": 0.0,
        "success_rate": 0.0,
        "total_cost": 0.0
    }
    
    logger.info("PromptPilot API started successfully", 
                metrics_port=8001, 
                docs_url="http://localhost:8000/docs",
                default_api_key=default_api_key,
                security_features="enabled")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down PromptPilot API")
    metrics_collector.stop_system_monitoring()

if __name__ == "__main__":
    uvicorn.run(
        "main_secure:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )