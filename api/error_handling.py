from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError as PydanticValidationError
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import traceback
import uuid

from logging_config import get_logger

logger = get_logger(__name__)

class BaseAPIException(Exception):
    """Base exception for all API errors"""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = None,
        details: Dict[str, Any] = None,
        headers: Dict[str, str] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        self.headers = headers or {}
        super().__init__(message)

class ValidationError(BaseAPIException):
    """Validation error exception"""
    
    def __init__(self, message: str, field: str = None, value: Any = None, details: Dict[str, Any] = None):
        self.field = field
        self.value = value
        error_details = details or {}
        if field:
            error_details['field'] = field
        if value is not None:
            error_details['value'] = str(value)
        
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            details=error_details
        )

class AuthenticationError(BaseAPIException):
    """Authentication error exception"""
    
    def __init__(self, message: str = "Authentication required", details: Dict[str, Any] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTHENTICATION_ERROR",
            details=details,
            headers={"WWW-Authenticate": "Bearer"}
        )

class AuthorizationError(BaseAPIException):
    """Authorization error exception"""
    
    def __init__(self, message: str = "Insufficient permissions", required_scope: str = None, details: Dict[str, Any] = None):
        error_details = details or {}
        if required_scope:
            error_details['required_scope'] = required_scope
        
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="AUTHORIZATION_ERROR",
            details=error_details
        )

class NotFoundError(BaseAPIException):
    """Resource not found exception"""
    
    def __init__(self, resource: str, identifier: str = None, details: Dict[str, Any] = None):
        error_details = details or {}
        error_details['resource'] = resource
        if identifier:
            error_details['identifier'] = identifier
        
        message = f"{resource} not found"
        if identifier:
            message += f" with identifier: {identifier}"
        
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND_ERROR",
            details=error_details
        )

class ConflictError(BaseAPIException):
    """Resource conflict exception"""
    
    def __init__(self, message: str, resource: str = None, details: Dict[str, Any] = None):
        error_details = details or {}
        if resource:
            error_details['resource'] = resource
        
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code="CONFLICT_ERROR",
            details=error_details
        )

class RateLimitError(BaseAPIException):
    """Rate limit exceeded exception"""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: int = None, details: Dict[str, Any] = None):
        error_details = details or {}
        headers = {}
        
        if retry_after:
            error_details['retry_after'] = retry_after
            headers['Retry-After'] = str(retry_after)
        
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="RATE_LIMIT_ERROR",
            details=error_details,
            headers=headers
        )

class ExternalServiceError(BaseAPIException):
    """External service error exception"""
    
    def __init__(self, service: str, message: str = None, details: Dict[str, Any] = None):
        error_details = details or {}
        error_details['service'] = service
        
        error_message = message or f"External service '{service}' is unavailable"
        
        super().__init__(
            message=error_message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="EXTERNAL_SERVICE_ERROR",
            details=error_details
        )

class DatabaseError(BaseAPIException):
    """Database operation error exception"""
    
    def __init__(self, operation: str, message: str = None, details: Dict[str, Any] = None):
        error_details = details or {}
        error_details['operation'] = operation
        
        error_message = message or f"Database operation '{operation}' failed"
        
        super().__init__(
            message=error_message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="DATABASE_ERROR",
            details=error_details
        )

class BusinessLogicError(BaseAPIException):
    """Business logic error exception"""
    
    def __init__(self, message: str, rule: str = None, details: Dict[str, Any] = None):
        error_details = details or {}
        if rule:
            error_details['business_rule'] = rule
        
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="BUSINESS_LOGIC_ERROR",
            details=error_details
        )

class SecurityError(BaseAPIException):
    """Security violation exception"""
    
    def __init__(self, message: str, violation_type: str = None, details: Dict[str, Any] = None):
        error_details = details or {}
        if violation_type:
            error_details['violation_type'] = violation_type
        
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="SECURITY_ERROR",
            details=error_details
        )

class ErrorResponse:
    """Standardized error response format"""
    
    @staticmethod
    def create_error_response(
        message: str,
        status_code: int = 500,
        error_code: str = None,
        details: Dict[str, Any] = None,
        errors: List[Dict[str, Any]] = None,
        request_id: str = None
    ) -> Dict[str, Any]:
        """Create standardized error response"""
        
        response = {
            "error": True,
            "message": message,
            "status_code": status_code,
            "error_code": error_code or "INTERNAL_ERROR",
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        if request_id:
            response["request_id"] = request_id
        
        if details:
            response["details"] = details
        
        if errors:
            response["errors"] = errors
        
        return response
    
    @staticmethod
    def create_validation_error_response(
        errors: List[Dict[str, Any]],
        request_id: str = None
    ) -> Dict[str, Any]:
        """Create validation error response"""
        
        formatted_errors = []
        for error in errors:
            field_path = " -> ".join(str(loc) for loc in error.get("loc", []))
            formatted_errors.append({
                "field": field_path,
                "message": error.get("msg", "Validation error"),
                "type": error.get("type", "validation_error"),
                "input": error.get("input")
            })
        
        return ErrorResponse.create_error_response(
            message="Validation failed",
            status_code=422,
            error_code="VALIDATION_ERROR",
            errors=formatted_errors,
            request_id=request_id
        )

class ErrorHandler:
    """Centralized error handling"""
    
    @staticmethod
    async def base_api_exception_handler(request: Request, exc: BaseAPIException) -> JSONResponse:
        """Handle custom API exceptions"""
        
        request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
        
        logger.error(
            "API exception occurred",
            error_type=exc.__class__.__name__,
            message=exc.message,
            status_code=exc.status_code,
            error_code=exc.error_code,
            details=exc.details,
            request_id=request_id,
            path=request.url.path,
            method=request.method
        )
        
        response_data = ErrorResponse.create_error_response(
            message=exc.message,
            status_code=exc.status_code,
            error_code=exc.error_code,
            details=exc.details,
            request_id=request_id
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=response_data,
            headers=exc.headers
        )
    
    @staticmethod
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        """Handle Pydantic validation errors"""
        
        request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
        
        logger.warning(
            "Validation error occurred",
            errors=exc.errors(),
            body=str(exc.body) if exc.body else None,
            request_id=request_id,
            path=request.url.path,
            method=request.method
        )
        
        response_data = ErrorResponse.create_validation_error_response(
            errors=exc.errors(),
            request_id=request_id
        )
        
        return JSONResponse(
            status_code=422,
            content=response_data
        )
    
    @staticmethod
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        """Handle FastAPI HTTP exceptions"""
        
        request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
        
        logger.warning(
            "HTTP exception occurred",
            status_code=exc.status_code,
            detail=exc.detail,
            request_id=request_id,
            path=request.url.path,
            method=request.method
        )
        
        response_data = ErrorResponse.create_error_response(
            message=exc.detail,
            status_code=exc.status_code,
            error_code="HTTP_ERROR",
            request_id=request_id
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=response_data,
            headers=getattr(exc, 'headers', None)
        )
    
    @staticmethod
    async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        """Handle Starlette HTTP exceptions"""
        
        request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
        
        logger.warning(
            "Starlette HTTP exception occurred",
            status_code=exc.status_code,
            detail=exc.detail,
            request_id=request_id,
            path=request.url.path,
            method=request.method
        )
        
        response_data = ErrorResponse.create_error_response(
            message=exc.detail,
            status_code=exc.status_code,
            error_code="HTTP_ERROR",
            request_id=request_id
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=response_data
        )
    
    @staticmethod
    async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Handle all other exceptions"""
        
        request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
        
        logger.error(
            "Unhandled exception occurred",
            error_type=exc.__class__.__name__,
            error_message=str(exc),
            request_id=request_id,
            path=request.url.path,
            method=request.method,
            traceback=traceback.format_exc()
        )
        
        # Don't expose internal error details in production
        response_data = ErrorResponse.create_error_response(
            message="An internal server error occurred",
            status_code=500,
            error_code="INTERNAL_SERVER_ERROR",
            request_id=request_id,
            details={
                "error_type": exc.__class__.__name__,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        return JSONResponse(
            status_code=500,
            content=response_data
        )

# Utility functions for common error scenarios
def validate_uuid(value: str, field_name: str) -> str:
    """Validate UUID format"""
    try:
        uuid.UUID(value)
        return value
    except ValueError:
        raise ValidationError(f"Invalid UUID format for {field_name}", field=field_name, value=value)

def validate_pagination(page: int, limit: int) -> tuple:
    """Validate pagination parameters"""
    if page < 1:
        raise ValidationError("Page number must be greater than 0", field="page", value=page)
    
    if limit < 1 or limit > 100:
        raise ValidationError("Limit must be between 1 and 100", field="limit", value=limit)
    
    return page, limit

def validate_resource_exists(resource, resource_type: str, identifier: str = None):
    """Validate that a resource exists"""
    if resource is None:
        raise NotFoundError(resource_type, identifier)
    return resource

def validate_resource_ownership(resource, user_id: str, resource_type: str):
    """Validate that user owns the resource"""
    if hasattr(resource, 'owner_id') and resource.owner_id != user_id:
        raise AuthorizationError(f"Access denied to {resource_type}")
    return resource

def validate_unique_constraint(existing_resource, field_name: str, value: Any, resource_type: str):
    """Validate unique constraint"""
    if existing_resource:
        raise ConflictError(
            f"{resource_type} with {field_name} '{value}' already exists",
            resource=resource_type,
            details={field_name: value}
        )

# Error context manager for database operations
class DatabaseErrorContext:
    """Context manager for handling database errors"""
    
    def __init__(self, operation: str):
        self.operation = operation
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            logger.error(f"Database error in {self.operation}", error=str(exc_val), exc_info=True)
            raise DatabaseError(self.operation, str(exc_val))
        return False

# Error context manager for external service calls
class ExternalServiceErrorContext:
    """Context manager for handling external service errors"""
    
    def __init__(self, service_name: str):
        self.service_name = service_name
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            logger.error(f"External service error: {self.service_name}", error=str(exc_val), exc_info=True)
            raise ExternalServiceError(self.service_name, str(exc_val))
        return False