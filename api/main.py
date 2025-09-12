from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from api.routes import ollama
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from typing import List, Optional
import time
import uuid
from datetime import datetime
import uvicorn

from schemas_simple import (
    PaginatedResponse, PromptResponse, CreatePromptRequest, UpdatePromptRequest,
    TestPromptRequest, TestResultResponse, MessageResponse, SettingsResponse,
    PromptStatusEnum
)
from database_simple import get_db, init_db, test_db_connection, get_current_user
from logging_config import (
    get_logger, set_request_context, clear_request_context,
    SecurityEvent, BusinessEvent, PerformanceMonitor
)
from metrics import MetricsCollector

# Initialize logging and metrics
logger = get_logger(__name__)
metrics_collector = MetricsCollector()

class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request/response logging and metrics collection"""
    
    async def dispatch(self, request: Request, call_next):
        # Generate request ID for correlation
        request_id = str(uuid.uuid4())
        start_time = time.time()
        
        # Extract user info (simplified - in production would come from JWT)
        user_id = request.headers.get("X-User-ID", "anonymous")
        
        # Set logging context
        set_request_context(request_id, user_id)
        
        # Log request
        logger.info(
            "Request started",
            method=request.method,
            url=str(request.url),
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else "unknown"
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
                duration=duration
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
    description="LLM Prompt Engineering and Pipeline Management Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Register Ollama routes
app.include_router(ollama.router)

# Add middleware
app.add_middleware(LoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.promptpilot.dev"]
)

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(
        "Validation error",
        errors=exc.errors(),
        body=exc.body
    )
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body}
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(
        "HTTP exception",
        status_code=exc.status_code,
        detail=exc.detail
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception",
        error=str(exc),
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# In-memory storage for development
prompts_store = {}
pipelines_store = {}
analytics_store = {"usage": {}, "performance": {}, "costs": {}}
settings_store = {
    "theme": {"mode": "light", "primary_color": "#1976d2"},
    "notifications": {"email_notifications": True},
    "security": {"require_api_key": False},
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
        "docs_url": "/docs",
        "health_url": "/health",
        "metrics_url": "http://localhost:8001/metrics"
    }

# Health check with detailed status
@app.get("/health", tags=["Health"])
async def health_check():
    """Comprehensive health check endpoint"""
    logger.info("Health check requested")
    
    db_status = test_db_connection()
    uptime = datetime.utcnow() - metrics_collector.start_time
    
    health_data = {
        "status": "healthy" if db_status else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "uptime_seconds": uptime.total_seconds(),
        "components": {
            "database": "connected" if db_status else "disconnected",
            "logging": "active",
            "metrics": "active"
        }
    }
    
    logger.info("Health check completed", **health_data)
    return health_data

# Metrics endpoint for Prometheus
@app.get("/metrics-info", tags=["Health"])
async def metrics_info():
    """Information about metrics collection"""
    return {
        "metrics_server": "http://localhost:8001/metrics",
        "active_since": metrics_collector.start_time.isoformat(),
        "collection_enabled": True
    }

# Prompt Management Endpoints
@app.get("/api/v1/prompts", response_model=PaginatedResponse[PromptResponse], tags=["Prompts"])
async def get_prompts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    task_type: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Get paginated list of prompts with filtering"""
    logger.info("Fetching prompts", user_id=current_user.id, page=page, limit=limit)
    
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

@app.get("/api/v1/prompts/{prompt_id}", response_model=PromptResponse, tags=["Prompts"])
async def get_prompt(
    prompt_id: str,
    current_user = Depends(get_current_user)
):
    """Get specific prompt by ID"""
    logger.info("Fetching prompt", user_id=current_user.id, prompt_id=prompt_id)
    
    if prompt_id not in prompts_store:
        logger.warning("Prompt not found", prompt_id=prompt_id)
        raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")
    
    logger.info("Prompt fetched successfully", prompt_id=prompt_id)
    return prompts_store[prompt_id]

@app.post("/api/v1/prompts", response_model=PromptResponse, status_code=201, tags=["Prompts"])
async def create_prompt(
    prompt_data: CreatePromptRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Create a new prompt"""
    logger.info("Creating prompt", user_id=current_user.id, prompt_name=prompt_data.name)
    
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
        "owner_id": current_user.id,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "execution_count": 0,
        "avg_execution_time": 0.0,
        "success_rate": 0.0,
        "total_cost": 0.0
    }
    
    prompts_store[prompt_id] = new_prompt
    
    # Log business event
    BusinessEvent.log_prompt_creation(prompt_id, current_user.id, prompt_data.name)
    
    logger.info("Prompt created successfully", prompt_id=prompt_id)
    
    return new_prompt

@app.post("/api/v1/prompts/{prompt_id}/test", response_model=TestResultResponse, tags=["Prompts"])
async def test_prompt(
    prompt_id: str,
    test_data: TestPromptRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Test prompt execution"""
    logger.info("Testing prompt", user_id=current_user.id, prompt_id=prompt_id)
    
    if prompt_id not in prompts_store:
        raise HTTPException(status_code=404, detail=f"Prompt {prompt_id} not found")
    
    start_time = time.time()
    
    # Mock test result
    execution_time = 1.23
    success = True
    cost = 0.001
    
    result = {
        "id": str(uuid.uuid4()),
        "output": f"Mock output for prompt {prompt_id} with variables: {test_data.input_variables}",
        "execution_time": execution_time,
        "cost": cost,
        "success": success,
        "error_message": None,
        "tokens_used": 150,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Record metrics
    prompt = prompts_store[prompt_id]
    metrics_collector.record_prompt_execution(
        prompt_id=prompt_id,
        user_id=current_user.id,
        provider=prompt["model_provider"],
        status="success" if success else "failure",
        duration=execution_time
    )
    
    # Log business event
    BusinessEvent.log_prompt_execution(
        prompt_id=prompt_id,
        user_id=current_user.id,
        execution_time=execution_time,
        success=success,
        cost=cost
    )
    
    logger.info("Prompt test completed", prompt_id=prompt_id, success=success, duration=execution_time)
    
    return result

# Frontend error logging endpoint
@app.post("/api/logs/frontend-error", tags=["Logging"])
async def log_frontend_error(
    error_data: dict,
    request: Request
):
    """Log frontend errors for monitoring"""
    logger.error(
        "Frontend error logged",
        error_message=error_data.get("message"),
        error_stack=error_data.get("stack"),
        error_component=error_data.get("component"),
        user_agent=request.headers.get("user-agent"),
        url=str(request.url)
    )
    return {"status": "logged"}

# Settings endpoints (continuing from rest_simple.py pattern)
@app.get("/api/v1/settings", response_model=SettingsResponse, tags=["Settings"])
async def get_settings(current_user = Depends(get_current_user)):
    """Get all settings"""
    logger.info("Fetching settings", user_id=current_user.id)
    return settings_store

@app.put("/api/v1/settings", response_model=SettingsResponse, tags=["Settings"])
async def update_settings(
    settings_data: dict,
    current_user = Depends(get_current_user)
):
    """Update settings"""
    logger.info("Updating settings", user_id=current_user.id)
    settings_store.update(settings_data)
    logger.info("Settings updated successfully")
    return settings_store

# Theme settings endpoints
@app.get("/api/v1/settings/theme", tags=["Settings"])
async def get_theme_settings(current_user = Depends(get_current_user)):
    """Get theme settings"""
    logger.info("Fetching theme settings", user_id=current_user.id)
    return settings_store.get("theme", {"mode": "light", "primary_color": "#1976d2"})

@app.put("/api/v1/settings/theme", tags=["Settings"])
async def update_theme_settings(
    theme_data: dict,
    current_user = Depends(get_current_user)
):
    """Update theme settings"""
    logger.info("Updating theme settings", user_id=current_user.id)
    settings_store["theme"] = theme_data
    logger.info("Theme settings updated successfully")
    return theme_data

# API Keys endpoints
@app.get("/api/v1/settings/api-keys", tags=["Settings"])
async def get_api_keys(current_user = Depends(get_current_user)):
    """Get API keys"""
    logger.info("Fetching API keys", user_id=current_user.id)
    return settings_store.get("api_keys", [])

# LLM Providers endpoints
@app.get("/api/v1/settings/providers/llm", tags=["Settings"])
async def get_llm_providers(current_user = Depends(get_current_user)):
    """Get LLM providers"""
    logger.info("Fetching LLM providers", user_id=current_user.id)
    return {
        "providers": [
            {"name": "OpenAI", "status": "configured", "models": ["gpt-3.5-turbo", "gpt-4"]},
            {"name": "Anthropic", "status": "not_configured", "models": ["claude-3-sonnet"]},
            {"name": "HuggingFace", "status": "not_configured", "models": []}
        ]
    }

# Additional endpoints for analytics
@app.get("/api/v1/analytics/usage", tags=["Analytics"])
async def get_usage_metrics(
    time_range: str = Query("week"),
    current_user = Depends(get_current_user)
):
    """Get usage metrics"""
    logger.info("Fetching usage metrics", user_id=current_user.id, time_range=time_range)
    return {
        "total_prompts": len(prompts_store),
        "total_executions": 150,
        "total_users": 5,
        "execution_trend": [
            {"date": "2024-01-01", "executions": 20},
            {"date": "2024-01-02", "executions": 35},
            {"date": "2024-01-03", "executions": 45},
        ]
    }

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting PromptPilot API", version="1.0.0")
    
    # Initialize database
    init_db()
    
    # Start metrics collection
    metrics_collector.start_metrics_server(port=8001)
    metrics_collector.start_system_monitoring()
    
    # Add sample data
    sample_prompt_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    prompts_store[sample_prompt_id] = {
        "id": sample_prompt_id,
        "name": "Sample Prompt",
        "description": "A sample prompt for testing",
        "task_type": "text-generation",
        "tags": ["sample", "test"],
        "developer_notes": "This is a sample prompt",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant", "priority": 1},
            {"role": "user", "content": "Hello, how are you?", "priority": 2}
        ],
        "input_variables": {"user_name": "string"},
        "model_provider": "openai",
        "model_name": "gpt-3.5-turbo",
        "parameters": {"temperature": 0.7, "max_tokens": 150},
        "status": "published",
        "version": "1.0.0",
        "owner_id": "dev-user-123",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "execution_count": 25,
        "avg_execution_time": 1.45,
        "success_rate": 96.0,
        "total_cost": 2.34
    }
    
    logger.info("PromptPilot API started successfully", 
                metrics_port=8001, 
                docs_url="http://localhost:8000/docs")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down PromptPilot API")
    metrics_collector.stop_system_monitoring()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
