import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict, Optional
from enum import Enum
import structlog
from structlog.stdlib import LoggerFactory
import uuid
import traceback

class LogLevel(str, Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class StructuredLogger:
    """Production-ready structured logger with JSON output and contextual information"""
    
    def __init__(self, service_name: str = "promptpilot", environment: str = "production"):
        self.service_name = service_name
        self.environment = environment
        self.request_id = None
        self.user_id = None
        self._setup_logging()
    
    def _setup_logging(self):
        """Configure structured logging with proper formatting"""
        
        # Configure structlog
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="ISO"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                self._add_service_context,
                structlog.processors.JSONRenderer()
            ],
            context_class=dict,
            logger_factory=LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )
        
        # Configure standard library logging
        logging.basicConfig(
            format="%(message)s",
            stream=sys.stdout,
            level=logging.INFO,
        )
    
    def _add_service_context(self, logger, name, event_dict):
        """Add service context to all log entries"""
        event_dict.update({
            "service": self.service_name,
            "environment": self.environment,
            "timestamp": datetime.utcnow().isoformat(),
        })
        
        if self.request_id:
            event_dict["request_id"] = self.request_id
        
        if self.user_id:
            event_dict["user_id"] = self.user_id
            
        return event_dict
    
    def set_request_context(self, request_id: str, user_id: Optional[str] = None):
        """Set request context for correlation"""
        self.request_id = request_id
        self.user_id = user_id
    
    def clear_request_context(self):
        """Clear request context"""
        self.request_id = None
        self.user_id = None
    
    def get_logger(self, name: str = None):
        """Get a structured logger instance"""
        return structlog.get_logger(name or self.service_name)

# Global logger instance
logger_instance = StructuredLogger()

def get_logger(name: str = None):
    """Get the global structured logger"""
    return logger_instance.get_logger(name)

def set_request_context(request_id: str, user_id: Optional[str] = None):
    """Set request context globally"""
    logger_instance.set_request_context(request_id, user_id)

def clear_request_context():
    """Clear request context globally"""
    logger_instance.clear_request_context()

class SecurityEvent:
    """Security event logging for audit trails"""
    
    @staticmethod
    def log_authentication_attempt(username: str, success: bool, ip_address: str, user_agent: str):
        logger = get_logger("security")
        logger.info(
            "Authentication attempt",
            event_type="authentication",
            username=username,
            success=success,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_authorization_failure(user_id: str, resource: str, action: str, ip_address: str):
        logger = get_logger("security")
        logger.warning(
            "Authorization failed",
            event_type="authorization_failure",
            user_id=user_id,
            resource=resource,
            action=action,
            ip_address=ip_address
        )
    
    @staticmethod
    def log_api_key_usage(api_key_id: str, endpoint: str, success: bool):
        logger = get_logger("security")
        logger.info(
            "API key usage",
            event_type="api_key_usage",
            api_key_id=api_key_id,
            endpoint=endpoint,
            success=success
        )

class BusinessEvent:
    """Business event logging for analytics and monitoring"""
    
    @staticmethod
    def log_prompt_creation(prompt_id: str, user_id: str, prompt_name: str):
        logger = get_logger("business")
        logger.info(
            "Prompt created",
            event_type="prompt_created",
            prompt_id=prompt_id,
            user_id=user_id,
            prompt_name=prompt_name
        )
    
    @staticmethod
    def log_prompt_execution(prompt_id: str, user_id: str, execution_time: float, success: bool, cost: float):
        logger = get_logger("business")
        logger.info(
            "Prompt executed",
            event_type="prompt_executed",
            prompt_id=prompt_id,
            user_id=user_id,
            execution_time=execution_time,
            success=success,
            cost=cost
        )
    
    @staticmethod
    def log_pipeline_execution(pipeline_id: str, user_id: str, status: str, execution_time: float):
        logger = get_logger("business")
        logger.info(
            "Pipeline executed",
            event_type="pipeline_executed",
            pipeline_id=pipeline_id,
            user_id=user_id,
            status=status,
            execution_time=execution_time
        )

class PerformanceMonitor:
    """Performance monitoring and metrics collection"""
    
    @staticmethod
    def log_api_performance(endpoint: str, method: str, duration: float, status_code: int, request_size: int = 0, response_size: int = 0):
        logger = get_logger("performance")
        logger.info(
            "API performance metrics",
            event_type="api_performance",
            endpoint=endpoint,
            method=method,
            duration=duration,
            status_code=status_code,
            request_size=request_size,
            response_size=response_size
        )
    
    @staticmethod
    def log_database_performance(operation: str, table: str, duration: float, rows_affected: int = 0):
        logger = get_logger("performance")
        logger.info(
            "Database performance metrics",
            event_type="database_performance",
            operation=operation,
            table=table,
            duration=duration,
            rows_affected=rows_affected
        )
    
    @staticmethod
    def log_external_api_call(provider: str, endpoint: str, duration: float, success: bool, error: str = None):
        logger = get_logger("performance")
        logger.info(
            "External API call metrics",
            event_type="external_api_call",
            provider=provider,
            endpoint=endpoint,
            duration=duration,
            success=success,
            error=error
        )

class ErrorLogger:
    """Enhanced error logging with context and stack traces"""
    
    @staticmethod
    def log_application_error(error: Exception, context: Dict[str, Any] = None):
        logger = get_logger("error")
        logger.error(
            "Application error",
            event_type="application_error",
            error_type=type(error).__name__,
            error_message=str(error),
            stack_trace=traceback.format_exc(),
            context=context or {}
        )
    
    @staticmethod
    def log_validation_error(field: str, value: Any, constraint: str, user_id: str = None):
        logger = get_logger("error")
        logger.warning(
            "Validation error",
            event_type="validation_error",
            field=field,
            value=str(value),
            constraint=constraint,
            user_id=user_id
        )
    
    @staticmethod
    def log_external_service_error(service: str, operation: str, error: str, retry_count: int = 0):
        logger = get_logger("error")
        logger.error(
            "External service error",
            event_type="external_service_error",
            service=service,
            operation=operation,
            error=error,
            retry_count=retry_count
        )

def generate_request_id() -> str:
    """Generate a unique request ID for correlation"""
    return str(uuid.uuid4())

def log_request_start(method: str, path: str, user_id: str = None, ip_address: str = None):
    """Log the start of a request"""
    request_id = generate_request_id()
    set_request_context(request_id, user_id)
    
    logger = get_logger("request")
    logger.info(
        "Request started",
        event_type="request_start",
        method=method,
        path=path,
        ip_address=ip_address
    )
    
    return request_id

def log_request_end(request_id: str, status_code: int, duration: float):
    """Log the end of a request"""
    logger = get_logger("request")
    logger.info(
        "Request completed",
        event_type="request_end",
        status_code=status_code,
        duration=duration
    )
    
    clear_request_context()

# Example usage patterns for different log types
if __name__ == "__main__":
    # Application logging
    logger = get_logger("app")
    logger.info("Application started", version="1.0.0")
    
    # Security event
    SecurityEvent.log_authentication_attempt("user123", True, "192.168.1.1", "Mozilla/5.0")
    
    # Business event
    BusinessEvent.log_prompt_creation("prompt-123", "user-456", "Customer Support Bot")
    
    # Performance monitoring
    PerformanceMonitor.log_api_performance("/api/v1/prompts", "GET", 0.15, 200, 1024, 2048)
    
    # Error logging
    try:
        raise ValueError("Example error")
    except Exception as e:
        ErrorLogger.log_application_error(e, {"user_id": "user123", "action": "create_prompt"})