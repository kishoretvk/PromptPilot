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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.promptpilot.dev"]
)

app.add_middleware(LoggingMiddleware)

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
@app.get("/api/v1/prompts", tags=["Prompts"])
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

    paginated_response = {
        "items": items,
        "total": total,
        "page": page,
        "per_page": limit,
        "total_pages": (total + limit - 1) // limit,
        "has_next": end < total,
        "has_prev": page > 1
    }

    # Return wrapped in data property for frontend compatibility
    return {"data": paginated_response}

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

# Notification Settings endpoints
@app.get("/api/v1/settings/notifications", tags=["Settings"])
async def get_notification_settings(current_user = Depends(get_current_user)):
    """Get notification settings"""
    logger.info("Fetching notification settings", user_id=current_user.id)
    return settings_store.get("notifications", {"email_notifications": True})

@app.put("/api/v1/settings/notifications", tags=["Settings"])
async def update_notification_settings(
    notification_data: dict,
    current_user = Depends(get_current_user)
):
    """Update notification settings"""
    logger.info("Updating notification settings", user_id=current_user.id)
    settings_store["notifications"] = notification_data
    logger.info("Notification settings updated successfully")
    return notification_data

# Security Settings endpoints
@app.get("/api/v1/settings/security", tags=["Settings"])
async def get_security_settings(current_user = Depends(get_current_user)):
    """Get security settings"""
    logger.info("Fetching security settings", user_id=current_user.id)
    return settings_store.get("security", {"require_api_key": False})

@app.put("/api/v1/settings/security", tags=["Settings"])
async def update_security_settings(
    security_data: dict,
    current_user = Depends(get_current_user)
):
    """Update security settings"""
    logger.info("Updating security settings", user_id=current_user.id)
    settings_store["security"] = security_data
    logger.info("Security settings updated successfully")
    return security_data

# Integrations endpoints
@app.get("/api/v1/settings/integrations", tags=["Settings"])
async def get_integrations(current_user = Depends(get_current_user)):
    """Get integrations"""
    logger.info("Fetching integrations", user_id=current_user.id)
    return settings_store.get("integrations", [])

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

# Storage Providers endpoints
@app.get("/api/v1/settings/providers/storage", tags=["Settings"])
async def get_storage_providers(current_user = Depends(get_current_user)):
    """Get storage providers"""
    logger.info("Fetching storage providers", user_id=current_user.id)
    return {
        "providers": [
            {"name": "Local File System", "status": "configured", "type": "filesystem"},
            {"name": "Git", "status": "configured", "type": "git"},
            {"name": "Database", "status": "configured", "type": "database"},
            {"name": "S3", "status": "not_configured", "type": "s3"},
            {"name": "Azure Blob", "status": "not_configured", "type": "azure"}
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

# Analytics endpoints that UI expects (without /api/v1 prefix for compatibility)
@app.get("/analytics/usage", tags=["Analytics"])
async def get_analytics_usage(
    start_date: str = Query(None),
    end_date: str = Query(None),
    current_user = Depends(get_current_user)
):
    """Get usage analytics data"""
    logger.info("Fetching analytics usage", user_id=current_user.id, start_date=start_date, end_date=end_date)
    return {
        "total_executions": 150,
        "unique_users": 5,
        "total_cost": 12.34,
        "avg_response_time": 1.23,
        "data": [
            {"date": "2025-08-13", "executions": 20, "cost": 1.23},
            {"date": "2025-08-14", "executions": 35, "cost": 2.45},
            {"date": "2025-09-12", "executions": 45, "cost": 3.67},
        ]
    }

@app.get("/analytics/dashboard", tags=["Analytics"])
async def get_analytics_dashboard(
    time_range: str = Query("30d"),
    current_user = Depends(get_current_user)
):
    """Get dashboard analytics data"""
    logger.info("Fetching analytics dashboard", user_id=current_user.id, time_range=time_range)
    return {
        "total_prompts": len(prompts_store),
        "active_prompts": len([p for p in prompts_store.values() if p["status"] == "published"]),
        "total_executions": 150,
        "success_rate": 96.5,
        "avg_cost_per_execution": 0.082,
        "top_prompts": [
            {"name": "Sample Prompt", "executions": 25, "success_rate": 96.0}
        ]
    }

@app.get("/analytics/costs", tags=["Analytics"])
async def get_analytics_costs(
    time_range: str = Query("30d"),
    current_user = Depends(get_current_user)
):
    """Get cost analytics data"""
    logger.info("Fetching analytics costs", user_id=current_user.id, time_range=time_range)
    return {
        "total_cost": 12.34,
        "cost_by_provider": {
            "openai": 10.23,
            "anthropic": 2.11
        },
        "cost_trend": [
            {"date": "2025-08-13", "cost": 1.23},
            {"date": "2025-08-14", "cost": 2.45},
            {"date": "2025-09-12", "cost": 3.67},
        ],
        "avg_cost_per_execution": 0.082
    }

@app.get("/analytics/performance", tags=["Analytics"])
async def get_analytics_performance(
    time_range: str = Query("30d"),
    current_user = Depends(get_current_user)
):
    """Get performance analytics data"""
    logger.info("Fetching analytics performance", user_id=current_user.id, time_range=time_range)
    return {
        "avg_response_time": 1.23,
        "p95_response_time": 2.45,
        "success_rate": 96.5,
        "error_rate": 3.5,
        "performance_trend": [
            {"date": "2025-08-13", "avg_time": 1.1, "success_rate": 98.0},
            {"date": "2025-08-14", "avg_time": 1.2, "success_rate": 97.0},
            {"date": "2025-09-12", "avg_time": 1.3, "success_rate": 96.0},
        ]
    }

# In-memory storage for pipelines
pipelines_store = {}
pipeline_executions_store = {}

# Pipeline Management Endpoints
@app.get("/pipelines", tags=["Pipelines"])
async def get_pipelines(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    current_user = Depends(get_current_user)
):
    """Get paginated list of pipelines"""
    logger.info("Fetching pipelines", user_id=current_user.id, page=page, limit=limit)

    # Filter pipelines based on search criteria
    filtered_pipelines = []
    for pipeline in pipelines_store.values():
        if search and search.lower() not in pipeline["name"].lower():
            continue
        if tags and not any(tag in pipeline["tags"] for tag in tags):
            continue
        filtered_pipelines.append(pipeline)

    # Pagination
    total = len(filtered_pipelines)
    start = (page - 1) * limit
    end = start + limit
    items = filtered_pipelines[start:end]

    logger.info("Pipelines fetched", total=total, returned=len(items))

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": limit,
        "total_pages": (total + limit - 1) // limit,
        "has_next": end < total,
        "has_prev": page > 1
    }

@app.get("/pipelines/{pipeline_id}", tags=["Pipelines"])
async def get_pipeline(
    pipeline_id: str,
    current_user = Depends(get_current_user)
):
    """Get specific pipeline by ID"""
    logger.info("Fetching pipeline", user_id=current_user.id, pipeline_id=pipeline_id)

    if pipeline_id not in pipelines_store:
        logger.warning("Pipeline not found", pipeline_id=pipeline_id)
        raise HTTPException(status_code=404, detail=f"Pipeline {pipeline_id} not found")

    logger.info("Pipeline fetched successfully", pipeline_id=pipeline_id)
    return pipelines_store[pipeline_id]

@app.post("/pipelines", response_model=dict, status_code=201, tags=["Pipelines"])
async def create_pipeline(
    pipeline_data: dict,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Create a new pipeline"""
    logger.info("Creating pipeline", user_id=current_user.id, pipeline_name=pipeline_data.get("name"))

    pipeline_id = str(uuid.uuid4())
    now = datetime.utcnow()

    new_pipeline = {
        "id": pipeline_id,
        "name": pipeline_data.get("name", "New Pipeline"),
        "description": pipeline_data.get("description", ""),
        "steps": pipeline_data.get("steps", []),
        "error_strategy": pipeline_data.get("error_strategy", "fail_fast"),
        "tags": pipeline_data.get("tags", []),
        "status": "draft",
        "version": "1.0.0",
        "owner_id": current_user.id,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "execution_count": 0,
        "success_rate": 0.0
    }

    pipelines_store[pipeline_id] = new_pipeline

    logger.info("Pipeline created successfully", pipeline_id=pipeline_id)

    return new_pipeline

@app.put("/pipelines/{pipeline_id}", tags=["Pipelines"])
async def update_pipeline(
    pipeline_id: str,
    pipeline_data: dict,
    current_user = Depends(get_current_user)
):
    """Update pipeline"""
    logger.info("Updating pipeline", user_id=current_user.id, pipeline_id=pipeline_id)

    if pipeline_id not in pipelines_store:
        raise HTTPException(status_code=404, detail=f"Pipeline {pipeline_id} not found")

    pipeline = pipelines_store[pipeline_id]
    pipeline.update(pipeline_data)
    pipeline["updated_at"] = datetime.utcnow().isoformat()

    logger.info("Pipeline updated successfully", pipeline_id=pipeline_id)
    return pipeline

@app.delete("/pipelines/{pipeline_id}", tags=["Pipelines"])
async def delete_pipeline(
    pipeline_id: str,
    current_user = Depends(get_current_user)
):
    """Delete pipeline"""
    logger.info("Deleting pipeline", user_id=current_user.id, pipeline_id=pipeline_id)

    if pipeline_id not in pipelines_store:
        raise HTTPException(status_code=404, detail=f"Pipeline {pipeline_id} not found")

    del pipelines_store[pipeline_id]
    logger.info("Pipeline deleted successfully", pipeline_id=pipeline_id)
    return {"message": "Pipeline deleted successfully"}

@app.post("/pipelines/{pipeline_id}/duplicate", tags=["Pipelines"])
async def duplicate_pipeline(
    pipeline_id: str,
    data: dict = None,
    current_user = Depends(get_current_user)
):
    """Duplicate pipeline"""
    logger.info("Duplicating pipeline", user_id=current_user.id, pipeline_id=pipeline_id)

    if pipeline_id not in pipelines_store:
        raise HTTPException(status_code=404, detail=f"Pipeline {pipeline_id} not found")

    original = pipelines_store[pipeline_id]
    new_id = str(uuid.uuid4())
    now = datetime.utcnow()

    duplicated = original.copy()
    duplicated.update({
        "id": new_id,
        "name": data.get("name", f"{original['name']} (Copy)"),
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "execution_count": 0,
        "success_rate": 0.0
    })

    pipelines_store[new_id] = duplicated

    logger.info("Pipeline duplicated successfully", original_id=pipeline_id, new_id=new_id)
    return duplicated

@app.post("/pipelines/{pipeline_id}/execute", tags=["Pipelines"])
async def execute_pipeline(
    pipeline_id: str,
    execution_data: dict,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """Execute pipeline"""
    logger.info("Executing pipeline", user_id=current_user.id, pipeline_id=pipeline_id)

    if pipeline_id not in pipelines_store:
        raise HTTPException(status_code=404, detail=f"Pipeline {pipeline_id} not found")

    execution_id = str(uuid.uuid4())
    now = datetime.utcnow()

    execution = {
        "pipeline_id": pipeline_id,
        "execution_id": execution_id,
        "status": "running",
        "start_time": now.isoformat(),
        "input_data": execution_data.get("input", {}),
        "step_results": []
    }

    pipeline_executions_store[execution_id] = execution

    # Mock execution completion
    background_tasks.add_task(mock_pipeline_execution, execution_id)

    logger.info("Pipeline execution started", pipeline_id=pipeline_id, execution_id=execution_id)
    return execution

@app.get("/pipelines/{pipeline_id}/executions", tags=["Pipelines"])
async def get_pipeline_executions(
    pipeline_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """Get pipeline execution history"""
    logger.info("Fetching pipeline executions", user_id=current_user.id, pipeline_id=pipeline_id)

    executions = [e for e in pipeline_executions_store.values() if e["pipeline_id"] == pipeline_id]

    # Pagination
    total = len(executions)
    start = (page - 1) * limit
    end = start + limit
    items = executions[start:end]

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": limit,
        "total_pages": (total + limit - 1) // limit,
        "has_next": end < total,
        "has_prev": page > 1
    }

@app.post("/pipelines/{pipeline_id}/test", tags=["Pipelines"])
async def test_pipeline(
    pipeline_id: str,
    test_data: dict,
    current_user = Depends(get_current_user)
):
    """Test pipeline execution"""
    logger.info("Testing pipeline", user_id=current_user.id, pipeline_id=pipeline_id)

    if pipeline_id not in pipelines_store:
        raise HTTPException(status_code=404, detail=f"Pipeline {pipeline_id} not found")

    # Mock test result
    return {
        "pipeline_id": pipeline_id,
        "execution_id": str(uuid.uuid4()),
        "status": "completed",
        "start_time": datetime.utcnow().isoformat(),
        "end_time": datetime.utcnow().isoformat(),
        "input_data": test_data.get("input", {}),
        "output_data": {"result": "Mock pipeline test result"},
        "step_results": [
            {
                "step_id": "step1",
                "status": "completed",
                "start_time": datetime.utcnow().isoformat(),
                "end_time": datetime.utcnow().isoformat(),
                "input_data": {},
                "output_data": {"result": "Step 1 completed"}
            }
        ],
        "total_cost": 0.01
    }

@app.post("/pipelines/validate", tags=["Pipelines"])
async def validate_pipeline(
    pipeline_data: dict,
    current_user = Depends(get_current_user)
):
    """Validate pipeline configuration"""
    logger.info("Validating pipeline", user_id=current_user.id)

    # Mock validation
    return {
        "is_valid": True,
        "errors": [],
        "warnings": []
    }

@app.get("/pipelines/tags", tags=["Pipelines"])
async def get_pipeline_tags(current_user = Depends(get_current_user)):
    """Get all pipeline tags"""
    logger.info("Fetching pipeline tags", user_id=current_user.id)

    all_tags = set()
    for pipeline in pipelines_store.values():
        all_tags.update(pipeline.get("tags", []))

    return list(all_tags)

@app.get("/pipelines/step-types", tags=["Pipelines"])
async def get_step_types(current_user = Depends(get_current_user)):
    """Get available pipeline step types"""
    logger.info("Fetching step types", user_id=current_user.id)

    return [
        {"type": "prompt", "name": "Prompt Execution", "description": "Execute a prompt"},
        {"type": "transform", "name": "Data Transform", "description": "Transform data"},
        {"type": "condition", "name": "Conditional Logic", "description": "Conditional execution"},
        {"type": "loop", "name": "Loop", "description": "Repeat execution"},
        {"type": "parallel", "name": "Parallel Execution", "description": "Execute steps in parallel"}
    ]

def mock_pipeline_execution(execution_id: str):
    """Mock pipeline execution completion"""
    import time
    time.sleep(2)  # Simulate execution time

    if execution_id in pipeline_executions_store:
        execution = pipeline_executions_store[execution_id]
        execution.update({
            "status": "completed",
            "end_time": datetime.utcnow().isoformat(),
            "output_data": {"result": "Mock pipeline execution completed"},
            "step_results": [
                {
                    "step_id": "step1",
                    "status": "completed",
                    "start_time": datetime.utcnow().isoformat(),
                    "end_time": datetime.utcnow().isoformat(),
                    "input_data": {},
                    "output_data": {"result": "Step 1 completed"}
                }
            ],
            "total_cost": 0.02
        })

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
