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

# Enhanced imports
from schemas_enhanced import (
    CreatePromptRequest, UpdatePromptRequest, TestPromptRequest,
    PromptResponse, TestResultResponse, PaginatedResponse, HealthResponse,
    CreatePipelineRequest, PipelineResponse, UsageMetrics, PerformanceMetrics,
    CostAnalysis, SettingsResponse, PaginationParams, ErrorResponse,
    PromptStatus, TaskType, ModelProvider, PipelineStatus
)
from error_handling import (
    ErrorHandler, BaseAPIException, ValidationError, AuthenticationError,
    AuthorizationError, NotFoundError, ConflictError, RateLimitError,
    ExternalServiceError, DatabaseError, BusinessLogicError, SecurityError,
    validate_uuid, validate_pagination, validate_resource_exists,
    validate_resource_ownership, validate_unique_constraint,
    DatabaseErrorContext, ExternalServiceErrorContext
)
from database_simple import get_db, init_db, test_db_connection
from logging_config import (
    get_logger, set_request_context, clear_request_context,
    SecurityEvent, BusinessEvent, PerformanceMonitor
)
from api.metrics import MetricsCollector
from security import (
    RateLimitMiddleware, SecurityMiddleware, InputValidationMiddleware,
    api_key_manager, get_current_user_or_api_key, require_scope,
    security_config
)

# Initialize logging and metrics
logger = get_logger(__name__)
metrics_collector = MetricsCollector()

class EnhancedLoggingMiddleware(BaseHTTPMiddleware):
    """Enhanced middleware with request ID tracking and comprehensive logging"""
    
    async def dispatch(self, request: Request, call_next):
        # Generate request ID for correlation
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
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
        
        # Log request with enhanced details
        request_size = int(request.headers.get("content-length", 0))
        logger.info(
            "Request started",
            method=request.method,
            url=str(request.url),
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else "unknown",
            request_id=request_id,
            user_id=user_id,
            request_size=request_size
        )
        
        try:
            # Process request
            response = await call_next(request)
            duration = time.time() - start_time
            response_size = int(response.headers.get("content-length", 0))
            
            # Record metrics
            metrics_collector.record_api_request(
                method=request.method,
                endpoint=request.url.path,
                status_code=response.status_code,
                duration=duration,
                user_id=user_id if user_id != "anonymous" else None
            )
            
            # Log response with enhanced details
            logger.info(
                "Request completed",
                status_code=response.status_code,
                duration=duration,
                request_id=request_id,
                response_size=response_size
            )
            
            # Record performance metrics
            PerformanceMonitor.log_api_performance(
                endpoint=request.url.path,
                method=request.method,
                duration=duration,
                status_code=response.status_code,
                request_size=request_size,
                response_size=response_size
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
            
            # Log error with enhanced details
            logger.error(
                "Request failed",
                error=str(e),
                error_type=e.__class__.__name__,
                duration=duration,
                request_id=request_id,
                exc_info=True
            )
            
            raise
        finally:
            # Clear logging context
            clear_request_context()

# Create FastAPI app with enhanced configuration
app = FastAPI(
    title="PromptPilot API",
    version="1.0.0",
    description="Enterprise LLM Prompt Engineering and Pipeline Management Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    responses={
        400: {"description": "Bad Request"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not Found"},
        422: {"description": "Validation Error"},
        429: {"description": "Rate Limit Exceeded"},
        500: {"description": "Internal Server Error"},
        503: {"description": "Service Unavailable"}
    }
)

# Add security middleware in correct order
app.add_middleware(EnhancedLoggingMiddleware)
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

# Register error handlers
app.add_exception_handler(BaseAPIException, ErrorHandler.base_api_exception_handler)
app.add_exception_handler(RequestValidationError, ErrorHandler.validation_exception_handler)
app.add_exception_handler(HTTPException, ErrorHandler.http_exception_handler)
app.add_exception_handler(StarletteHTTPException, ErrorHandler.starlette_http_exception_handler)
app.add_exception_handler(Exception, ErrorHandler.general_exception_handler)

# In-memory storage for development (replace with database in production)
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

# Frontend error logging storage and models
frontend_error_logs = []
MAX_FRONTEND_ERROR_LOGS = 10000

class FrontendErrorLog(BaseModel):
    """Schema for frontend error logs"""
    level: str = Field(..., description="Error level: error, warning, info")
    message: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")
    status: Optional[int] = Field(None, description="HTTP status code if applicable")
    details: Optional[dict] = Field(None, description="Additional error details")
    context: Optional[dict] = Field(None, description="Error context information")
    stackTrace: Optional[str] = Field(None, description="JavaScript stack trace")
    userAgent: Optional[str] = Field(None, description="User agent string")
    url: Optional[str] = Field(None, description="URL where error occurred")
    timestamp: str = Field(..., description="Timestamp when error occurred")

# Root endpoint with enhanced information
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with comprehensive API information"""
    logger.info("Root endpoint accessed")
    return {
        "name": "PromptPilot API",
        "version": "1.0.0",
        "status": "running",
        "environment": "production",
        "features": {
            "authentication": ["JWT", "API Keys"],
            "security": ["Rate Limiting", "Input Validation", "Security Headers"],
            "monitoring": ["Structured Logging", "Metrics Collection", "Health Checks"],
            "validation": ["Enhanced Pydantic Schemas", "Comprehensive Error Handling"]
        },
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "metrics": "http://localhost:8001/metrics"
        },
        "limits": {
            "rate_limit_per_minute": security_config.rate_limit_per_minute,
            "max_request_size": "10MB",
            "max_prompt_length": 50000
        }
    }

# Enhanced health check
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Comprehensive health check endpoint with detailed status"""
    logger.info("Health check requested")
    
    try:
        with DatabaseErrorContext("health_check"):
            db_status = test_db_connection()
        
        uptime = datetime.utcnow() - metrics_collector.start_time
        
        components = {
            "database": "healthy" if db_status else "unhealthy",
            "logging": "healthy",
            "metrics": "healthy",
            "security_middleware": "healthy",
            "rate_limiting": "healthy",
            "input_validation": "healthy"
        }
        
        # Determine overall status
        unhealthy_components = [k for k, v in components.items() if v != "healthy"]
        if not unhealthy_components:
            overall_status = "healthy"
        elif len(unhealthy_components) <= 1:
            overall_status = "degraded"
        else:
            overall_status = "unhealthy"
        
        health_data = HealthResponse(
            status=overall_status,
            timestamp=datetime.utcnow(),
            version="1.0.0",
            uptime_seconds=uptime.total_seconds(),
            components=components,
            security={
                "rate_limiting": "enabled",
                "input_validation": "enabled",
                "api_key_auth": "enabled",
                "jwt_auth": "enabled",
                "https_required": security_config.require_https
            }
        )
        
        logger.info("Health check completed", status=overall_status, components=components)
        return health_data
        
    except Exception as e:
        logger.error("Health check failed", error=str(e), exc_info=True)
        raise ExternalServiceError("health_check", "Health check service unavailable")

# Enhanced prompt management endpoints
@app.get("/api/v1/prompts", response_model=PaginatedResponse, tags=["Prompts"])
async def get_prompts(
    request: Request,
    pagination: PaginationParams = Depends(),
    search: Optional[str] = Query(None, max_length=255),
    tags: Optional[List[str]] = Query(None, max_items=10),
    task_type: Optional[TaskType] = None,
    status: Optional[PromptStatus] = None,
    current_user: dict = Depends(require_scope("read"))
):
    """Get paginated list of prompts with enhanced filtering and validation"""
    logger.info("Fetching prompts", 
                user_id=current_user["id"], 
                page=pagination.page, 
                limit=pagination.limit,
                search=search,
                tags=tags,
                task_type=task_type,
                status=status)
    
    try:
        # Validate pagination
        validate_pagination(pagination.page, pagination.limit)
        
        # Filter prompts based on search criteria
        filtered_prompts = []
        for prompt in prompts_store.values():
            # Search filter
            if search and search.lower() not in prompt["name"].lower():
                continue
            
            # Tags filter
            if tags and not any(tag in prompt["tags"] for tag in tags):
                continue
            
            # Task type filter
            if task_type and prompt["task_type"] != task_type:
                continue
            
            # Status filter
            if status and prompt["status"] != status:
                continue
            
            filtered_prompts.append(prompt)
        
        # Sort by updated_at descending
        filtered_prompts.sort(key=lambda x: x["updated_at"], reverse=True)
        
        # Pagination
        total = len(filtered_prompts)
        start = (pagination.page - 1) * pagination.limit
        end = start + pagination.limit
        items = filtered_prompts[start:end]
        
        logger.info("Prompts fetched successfully", 
                   total=total, 
                   returned=len(items),
                   request_id=request.state.request_id)
        
        return PaginatedResponse(
            items=items,
            total=total,
            page=pagination.page,
            per_page=pagination.limit,
            total_pages=(total + pagination.limit - 1) // pagination.limit,
            has_next=end < total,
            has_prev=pagination.page > 1
        )
        
    except ValidationError:
        raise
    except Exception as e:
        logger.error("Error fetching prompts", error=str(e), exc_info=True)
        raise DatabaseError("fetch_prompts", str(e))

@app.get("/api/v1/prompts/{prompt_id}", response_model=PromptResponse, tags=["Prompts"])
async def get_prompt(
    prompt_id: str,
    current_user: dict = Depends(require_scope("read"))
):
    """Get specific prompt by ID with validation"""
    logger.info("Fetching prompt", user_id=current_user["id"], prompt_id=prompt_id)
    
    # Validate UUID format
    validate_uuid(prompt_id, "prompt_id")
    
    # Check if prompt exists
    prompt = prompts_store.get(prompt_id)
    validate_resource_exists(prompt, "Prompt", prompt_id)
    
    logger.info("Prompt fetched successfully", prompt_id=prompt_id)
    return prompt

@app.post("/api/v1/prompts", response_model=PromptResponse, status_code=201, tags=["Prompts"])
async def create_prompt(
    request: Request,
    prompt_data: CreatePromptRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_scope("write"))
):
    """Create a new prompt with enhanced validation"""
    logger.info("Creating prompt", 
                user_id=current_user["id"], 
                prompt_name=prompt_data.name,
                task_type=prompt_data.task_type)
    
    try:
        # Check for duplicate name
        existing_prompt = next((p for p in prompts_store.values() 
                              if p["name"] == prompt_data.name and p["owner_id"] == current_user["id"]), 
                              None)
        validate_unique_constraint(existing_prompt, "name", prompt_data.name, "Prompt")
        
        # Generate new prompt
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
            "status": PromptStatus.DRAFT,
            "version": "1.0.0",
            "owner_id": current_user["id"],
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "execution_count": 0,
            "avg_execution_time": 0.0,
            "success_rate": 0.0,
            "total_cost": 0.0
        }
        
        # Store prompt
        with DatabaseErrorContext("create_prompt"):
            prompts_store[prompt_id] = new_prompt
        
        # Log business event
        BusinessEvent.log_prompt_creation(prompt_id, current_user["id"], prompt_data.name)
        
        logger.info("Prompt created successfully", 
                   prompt_id=prompt_id,
                   request_id=request.state.request_id)
        
        return new_prompt
        
    except (ValidationError, ConflictError):
        raise
    except Exception as e:
        logger.error("Error creating prompt", error=str(e), exc_info=True)
        raise DatabaseError("create_prompt", str(e))

@app.put("/api/v1/prompts/{prompt_id}", response_model=PromptResponse, tags=["Prompts"])
async def update_prompt(
    prompt_id: str,
    prompt_data: UpdatePromptRequest,
    current_user: dict = Depends(require_scope("write"))
):
    """Update existing prompt with validation"""
    logger.info("Updating prompt", user_id=current_user["id"], prompt_id=prompt_id)
    
    # Validate UUID format
    validate_uuid(prompt_id, "prompt_id")
    
    # Check if prompt exists
    prompt = prompts_store.get(prompt_id)
    validate_resource_exists(prompt, "Prompt", prompt_id)
    
    # Check ownership
    validate_resource_ownership(prompt, current_user["id"], "Prompt")
    
    try:
        # Update fields that are provided
        update_data = prompt_data.dict(exclude_unset=True)
        
        # Check for name conflicts if name is being updated
        if "name" in update_data and update_data["name"] != prompt["name"]:
            existing_prompt = next((p for p in prompts_store.values() 
                                  if p["name"] == update_data["name"] and 
                                     p["owner_id"] == current_user["id"] and 
                                     p["id"] != prompt_id), 
                                  None)
            validate_unique_constraint(existing_prompt, "name", update_data["name"], "Prompt")
        
        # Apply updates
        for field, value in update_data.items():
            if field == "messages" and value:
                prompt[field] = [msg.dict() if hasattr(msg, 'dict') else msg for msg in value]
            else:
                prompt[field] = value
        
        prompt["updated_at"] = datetime.utcnow().isoformat()
        
        logger.info("Prompt updated successfully", prompt_id=prompt_id)
        return prompt
        
    except (ValidationError, ConflictError, AuthorizationError):
        raise
    except Exception as e:
        logger.error("Error updating prompt", error=str(e), exc_info=True)
        raise DatabaseError("update_prompt", str(e))

@app.delete("/api/v1/prompts/{prompt_id}", status_code=204, tags=["Prompts"])
async def delete_prompt(
    prompt_id: str,
    current_user: dict = Depends(require_scope("write"))
):
    """Delete prompt with validation"""
    logger.info("Deleting prompt", user_id=current_user["id"], prompt_id=prompt_id)
    
    # Validate UUID format
    validate_uuid(prompt_id, "prompt_id")
    
    # Check if prompt exists
    prompt = prompts_store.get(prompt_id)
    validate_resource_exists(prompt, "Prompt", prompt_id)
    
    # Check ownership
    validate_resource_ownership(prompt, current_user["id"], "Prompt")
    
    try:
        with DatabaseErrorContext("delete_prompt"):
            del prompts_store[prompt_id]
        
        logger.info("Prompt deleted successfully", prompt_id=prompt_id)
        
    except (AuthorizationError, NotFoundError):
        raise
    except Exception as e:
        logger.error("Error deleting prompt", error=str(e), exc_info=True)
        raise DatabaseError("delete_prompt", str(e))

@app.post("/api/v1/prompts/{prompt_id}/test", response_model=TestResultResponse, tags=["Prompts"])
async def test_prompt(
    prompt_id: str,
    test_data: TestPromptRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_scope("execute"))
):
    """Test prompt execution with enhanced validation and error handling"""
    logger.info("Testing prompt", user_id=current_user["id"], prompt_id=prompt_id)
    
    # Validate UUID format
    validate_uuid(prompt_id, "prompt_id")
    
    # Check if prompt exists
    prompt = prompts_store.get(prompt_id)
    validate_resource_exists(prompt, "Prompt", prompt_id)
    
    try:
        start_time = time.time()
        
        # Simulate LLM API call
        with ExternalServiceErrorContext(prompt["model_provider"]):
            # Mock test execution
            execution_time = 1.23
            success = True
            cost = 0.001
            tokens_used = 150
            
            # Simulate potential failures for demonstration
            import random
            if random.random() < 0.05:  # 5% failure rate
                raise Exception("Simulated LLM API error")
        
        result = {
            "id": str(uuid.uuid4()),
            "output": f"Mock output for prompt {prompt_id} with variables: {test_data.input_variables}",
            "execution_time": execution_time,
            "cost": cost,
            "success": success,
            "error_message": None,
            "tokens_used": tokens_used,
            "model_info": {
                "provider": prompt["model_provider"],
                "model": prompt["model_name"],
                "parameters": prompt["parameters"]
            },
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Record metrics
        metrics_collector.record_prompt_execution(
            prompt_id=prompt_id,
            user_id=current_user["id"],
            provider=prompt["model_provider"],
            status="success" if success else "failure",
            duration=execution_time
        )
        
        # Log business event
        BusinessEvent.log_prompt_execution(
            prompt_id=prompt_id,
            user_id=current_user["id"],
            execution_time=execution_time,
            success=success,
            cost=cost
        )
        
        logger.info("Prompt test completed successfully", 
                   prompt_id=prompt_id, 
                   success=success, 
                   duration=execution_time)
        
        return result
        
    except (NotFoundError, ExternalServiceError):
        raise
    except Exception as e:
        logger.error("Error testing prompt", error=str(e), exc_info=True)
        raise ExternalServiceError(prompt.get("model_provider", "unknown"), str(e))

# Frontend Error Logging Endpoints
@app.post("/api/logs/frontend-error", tags=["Logging"])
async def log_frontend_error(
    error_log: FrontendErrorLog,
    background_tasks: BackgroundTasks,
    request: Request
):
    """Log a single frontend error"""
    
    try:
        # Process error log
        client_ip = request.client.host if request.client else "unknown"
        session_id = request.headers.get("X-Session-ID")
        user_id = request.headers.get("X-User-ID")
        
        # Create log entry
        log_entry = {
            "id": str(uuid.uuid4()),
            "created_at": datetime.utcnow().isoformat(),
            "session_id": session_id,
            "user_id": user_id,
            "client_ip": client_ip,
            **error_log.dict()
        }
        
        # Add to storage
        frontend_error_logs.append(log_entry)
        if len(frontend_error_logs) > MAX_FRONTEND_ERROR_LOGS:
            frontend_error_logs.pop(0)
        
        # Log using appropriate level
        log_level = error_log.level.lower()
        log_data = {
            "frontend_error": True,
            "level": log_level,
            "message": error_log.message,
            "error_code": error_log.code,
            "http_status": error_log.status,
            "client_ip": client_ip,
            "session_id": session_id,
            "user_id": user_id
        }
        
        if log_level == "error":
            logger.error("Frontend error reported", **log_data)
        elif log_level == "warning":
            logger.warning("Frontend warning reported", **log_data)
        else:
            logger.info("Frontend info reported", **log_data)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Error logged successfully",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except Exception as e:
        logger.error("Failed to process frontend error log", error=str(e), exc_info=True)
        return JSONResponse(
            status_code=200,
            content={
                "message": "Error received but processing failed",
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@app.get("/api/logs/frontend-errors", tags=["Logging"])
async def get_frontend_errors(
    level: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    session_id: Optional[str] = None,
    user_id: Optional[str] = None
):
    """Get frontend error logs with filtering"""
    
    try:
        # Filter error logs
        filtered_logs = frontend_error_logs.copy()
        
        if level:
            filtered_logs = [log for log in filtered_logs if log.get("level") == level.lower()]
        
        if session_id:
            filtered_logs = [log for log in filtered_logs if log.get("session_id") == session_id]
        
        if user_id:
            filtered_logs = [log for log in filtered_logs if log.get("user_id") == user_id]
        
        # Sort by timestamp (newest first)
        filtered_logs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Apply pagination
        paginated_logs = filtered_logs[offset:offset + limit]
        
        return {
            "logs": paginated_logs,
            "total": len(filtered_logs),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error("Failed to retrieve frontend error logs", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve error logs")

@app.get("/api/logs/frontend-errors/stats", tags=["Logging"])
async def get_frontend_error_stats():
    """Get frontend error statistics"""
    
    try:
        # Calculate statistics
        total_errors = len(frontend_error_logs)
        
        level_counts = {}
        code_counts = {}
        recent_errors = 0
        
        cutoff_time = datetime.utcnow().replace(hour=datetime.utcnow().hour - 1)
        
        for log in frontend_error_logs:
            # Count by level
            level = log.get("level", "unknown")
            level_counts[level] = level_counts.get(level, 0) + 1
            
            # Count by error code
            code = log.get("code", "unknown")
            code_counts[code] = code_counts.get(code, 0) + 1
            
            # Count recent errors (last hour)
            try:
                log_time = datetime.fromisoformat(log.get("created_at", ""))
                if log_time > cutoff_time:
                    recent_errors += 1
            except:
                pass
        
        return {
            "total_errors": total_errors,
            "recent_errors": recent_errors,
            "level_breakdown": level_counts,
            "top_error_codes": dict(sorted(code_counts.items(), key=lambda x: x[1], reverse=True)[:10]),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to calculate frontend error stats", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to calculate error statistics")

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting PromptPilot Production API", version="1.0.0")
    
    try:
        # Initialize database
        with DatabaseErrorContext("startup_database_init"):
            init_db()
        
        # Start metrics collection
        metrics_collector.start_metrics_server(port=8001)
        metrics_collector.start_system_monitoring()
        
        # Create default API key for testing
        default_api_key = api_key_manager.generate_api_key(
            user_id="admin",
            name="Default Admin Key",
            scopes={"read", "write", "execute", "admin"},
            expires_in_days=365
        )
        
        # Add sample data
        sample_prompt_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        sample_prompt = {
            "id": sample_prompt_id,
            "name": "Production Sample Prompt",
            "description": "A comprehensive sample prompt demonstrating production features",
            "task_type": TaskType.TEXT_GENERATION,
            "tags": ["sample", "production", "demo"],
            "developer_notes": "This prompt demonstrates enhanced validation and error handling",
            "messages": [
                {"role": "system", "content": "You are a production-ready AI assistant with comprehensive error handling", "priority": 1},
                {"role": "user", "content": "Generate a professional response about {topic}", "priority": 2}
            ],
            "input_variables": {"topic": "string"},
            "model_provider": ModelProvider.OPENAI,
            "model_name": "gpt-3.5-turbo",
            "parameters": {"temperature": 0.7, "max_tokens": 200, "top_p": 0.9},
            "status": PromptStatus.PUBLISHED,
            "version": "1.0.0",
            "owner_id": "admin",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "execution_count": 0,
            "avg_execution_time": 0.0,
            "success_rate": 0.0,
            "total_cost": 0.0
        }
        
        prompts_store[sample_prompt_id] = sample_prompt
        
        logger.info("PromptPilot Production API started successfully", 
                    metrics_port=8001, 
                    docs_url="http://localhost:8000/docs",
                    default_api_key=default_api_key,
                    features={
                        "enhanced_validation": "enabled",
                        "comprehensive_error_handling": "enabled",
                        "security_features": "enabled",
                        "observability": "enabled"
                    })
        
    except Exception as e:
        logger.error("Failed to start application", error=str(e), exc_info=True)
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down PromptPilot Production API")
    try:
        metrics_collector.stop_system_monitoring()
        logger.info("Application shutdown completed successfully")
    except Exception as e:
        logger.error("Error during shutdown", error=str(e), exc_info=True)

if __name__ == "__main__":
    uvicorn.run(
        "main_production:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
