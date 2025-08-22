# Frontend Error Logging Endpoint
# Receives and logs frontend errors for monitoring and debugging

from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import structlog
from uuid import uuid4

# Import logging utilities
try:
    from logging_config import get_logger
    from metrics import MetricsCollector
except ImportError:
    import logging
    get_logger = lambda name: logging.getLogger(name)
    MetricsCollector = None

router = APIRouter(prefix="/api/logs", tags=["Logging"])
logger = get_logger(__name__)

class FrontendErrorLog(BaseModel):
    """Schema for frontend error logs"""
    level: str = Field(..., description="Error level: error, warning, info")
    message: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")
    status: Optional[int] = Field(None, description="HTTP status code if applicable")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    context: Optional[Dict[str, Any]] = Field(None, description="Error context information")
    stackTrace: Optional[str] = Field(None, description="JavaScript stack trace")
    userAgent: Optional[str] = Field(None, description="User agent string")
    url: Optional[str] = Field(None, description="URL where error occurred")
    timestamp: str = Field(..., description="Timestamp when error occurred")

class FrontendErrorBatch(BaseModel):
    """Schema for batch frontend error logs"""
    errors: List[FrontendErrorLog] = Field(..., description="List of error logs")
    session_id: Optional[str] = Field(None, description="Session ID for correlation")
    user_id: Optional[str] = Field(None, description="User ID if authenticated")

# In-memory storage for error logs (in production, use database)
error_logs_store = []
MAX_ERROR_LOGS = 10000  # Keep last 10k errors

def store_error_log(error_log: FrontendErrorLog, session_id: Optional[str] = None, user_id: Optional[str] = None):
    """Store error log with additional metadata"""
    log_entry = {
        "id": str(uuid4()),
        "created_at": datetime.utcnow().isoformat(),
        "session_id": session_id,
        "user_id": user_id,
        **error_log.dict()
    }
    
    # Add to in-memory store
    error_logs_store.append(log_entry)
    
    # Keep only recent logs
    if len(error_logs_store) > MAX_ERROR_LOGS:
        error_logs_store.pop(0)
    
    return log_entry

async def process_error_log(error_log: FrontendErrorLog, request: Request):
    """Process and log frontend error"""
    
    # Extract request information
    client_ip = request.client.host if request.client else "unknown"
    session_id = request.headers.get("X-Session-ID")
    user_id = request.headers.get("X-User-ID")
    
    # Determine log level
    log_level = error_log.level.lower()
    if log_level not in ["error", "warning", "info"]:
        log_level = "error"
    
    # Create structured log entry
    log_data = {
        "frontend_error": True,
        "level": log_level,
        "message": error_log.message,
        "error_code": error_log.code,
        "http_status": error_log.status,
        "details": error_log.details,
        "context": error_log.context,
        "stack_trace": error_log.stackTrace,
        "user_agent": error_log.userAgent,
        "error_url": error_log.url,
        "error_timestamp": error_log.timestamp,
        "client_ip": client_ip,
        "session_id": session_id,
        "user_id": user_id
    }
    
    # Log using appropriate level
    if log_level == "error":
        logger.error("Frontend error reported", **log_data)
    elif log_level == "warning":
        logger.warning("Frontend warning reported", **log_data)
    else:
        logger.info("Frontend info reported", **log_data)
    
    # Store error log
    stored_log = store_error_log(error_log, session_id, user_id)
    
    # Update metrics if available
    if MetricsCollector:
        try:
            metrics = MetricsCollector()
            metrics.record_frontend_error(
                level=log_level,
                code=error_log.code or "UNKNOWN",
                user_id=user_id
            )
        except Exception as e:
            logger.warning("Failed to record error metrics", error=str(e))
    
    return stored_log

@router.post("/frontend-error")
async def log_frontend_error(
    error_log: FrontendErrorLog,
    background_tasks: BackgroundTasks,
    request: Request
):
    """Log a single frontend error"""
    
    try:
        # Process error log in background to avoid blocking response
        background_tasks.add_task(process_error_log, error_log, request)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Error logged successfully",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except Exception as e:
        logger.error("Failed to process frontend error log", error=str(e), exc_info=True)
        
        # Don't fail the frontend request due to logging issues
        return JSONResponse(
            status_code=200,
            content={
                "message": "Error received but processing failed",
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@router.post("/frontend-errors/batch")
async def log_frontend_errors_batch(
    batch: FrontendErrorBatch,
    background_tasks: BackgroundTasks,
    request: Request
):
    """Log multiple frontend errors in batch"""
    
    try:
        # Process each error log
        for error_log in batch.errors:
            background_tasks.add_task(process_error_log, error_log, request)
        
        logger.info(
            "Frontend error batch received",
            error_count=len(batch.errors),
            session_id=batch.session_id,
            user_id=batch.user_id
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "message": f"Batch of {len(batch.errors)} errors logged successfully",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except Exception as e:
        logger.error("Failed to process frontend error batch", error=str(e), exc_info=True)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Error batch received but processing failed",
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@router.get("/frontend-errors")
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
        filtered_logs = error_logs_store.copy()
        
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

@router.delete("/frontend-errors")
async def clear_frontend_errors():
    """Clear all frontend error logs"""
    
    try:
        global error_logs_store
        error_count = len(error_logs_store)
        error_logs_store.clear()
        
        logger.info("Frontend error logs cleared", cleared_count=error_count)
        
        return {
            "message": f"Cleared {error_count} error logs",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to clear frontend error logs", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to clear error logs")

@router.get("/frontend-errors/stats")
async def get_frontend_error_stats():
    """Get frontend error statistics"""
    
    try:
        # Calculate statistics
        total_errors = len(error_logs_store)
        
        level_counts = {}
        code_counts = {}
        recent_errors = 0
        
        cutoff_time = datetime.utcnow().replace(hour=datetime.utcnow().hour - 1)
        
        for log in error_logs_store:
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

# Health check endpoint
@router.get("/health")
async def logging_health_check():
    """Health check for logging service"""
    return {
        "status": "healthy",
        "service": "frontend-error-logging",
        "timestamp": datetime.utcnow().isoformat(),
        "total_logs": len(error_logs_store)
    }