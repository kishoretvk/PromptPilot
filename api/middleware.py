import time
import logging
import structlog
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from prometheus_client import Counter, Histogram
from datetime import datetime
import uuid
from typing import Callable

# Metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
REQUEST_SIZE = Histogram('http_request_size_bytes', 'HTTP request size')
RESPONSE_SIZE = Histogram('http_response_size_bytes', 'HTTP response size')

# Configure logger
logger = structlog.get_logger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    \"\"\"Middleware for structured request/response logging\"\"\"
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Start time
        start_time = time.time()
        
        # Get request info
        method = request.method
        url = str(request.url)
        client_ip = request.client.host if request.client else \"unknown\"
        user_agent = request.headers.get(\"user-agent\", \"unknown\")
        
        # Log request
        logger.info(
            \"HTTP request started\",
            request_id=request_id,
            method=method,
            url=url,
            client_ip=client_ip,
            user_agent=user_agent,
            timestamp=datetime.utcnow().isoformat()
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            logger.info(
                \"HTTP request completed\",
                request_id=request_id,
                method=method,
                url=url,
                status_code=response.status_code,
                duration=duration,
                client_ip=client_ip
            )
            
            # Add request ID to response headers
            response.headers[\"X-Request-ID\"] = request_id
            
            return response
            
        except Exception as e:
            # Calculate duration
            duration = time.time() - start_time
            
            # Log error
            logger.error(
                \"HTTP request failed\",
                request_id=request_id,
                method=method,
                url=url,
                error=str(e),
                duration=duration,
                client_ip=client_ip
            )
            
            # Return error response
            return JSONResponse(
                status_code=500,
                content={
                    \"error\": \"Internal Server Error\",
                    \"message\": \"An unexpected error occurred\",
                    \"request_id\": request_id,
                    \"timestamp\": datetime.utcnow().isoformat()
                },
                headers={\"X-Request-ID\": request_id}
            )

class MetricsMiddleware(BaseHTTPMiddleware):
    \"\"\"Middleware for collecting Prometheus metrics\"\"\"
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Start time for duration measurement
        start_time = time.time()
        
        # Get request info
        method = request.method
        path = request.url.path
        
        # Measure request size
        request_size = 0
        if hasattr(request, 'body'):
            try:
                body = await request.body()
                request_size = len(body)
            except:
                pass
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Get response size
            response_size = 0
            if hasattr(response, 'body'):
                try:
                    response_size = len(response.body)
                except:
                    pass
            
            # Record metrics
            REQUEST_COUNT.labels(
                method=method,
                endpoint=self._normalize_path(path),
                status=response.status_code
            ).inc()
            
            REQUEST_DURATION.observe(duration)
            REQUEST_SIZE.observe(request_size)
            RESPONSE_SIZE.observe(response_size)
            
            return response
            
        except Exception as e:
            # Calculate duration
            duration = time.time() - start_time
            
            # Record error metrics
            REQUEST_COUNT.labels(
                method=method,
                endpoint=self._normalize_path(path),
                status=500
            ).inc()
            
            REQUEST_DURATION.observe(duration)
            
            raise e
    
    def _normalize_path(self, path: str) -> str:
        \"\"\"Normalize path for metrics (remove IDs, etc.)\"\"\"
        # Replace UUIDs and IDs with placeholders
        import re
        
        # Replace UUID patterns
        path = re.sub(r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '/{id}', path)
        
        # Replace numeric IDs
        path = re.sub(r'/\\d+', '/{id}', path)
        
        return path

class RateLimitMiddleware(BaseHTTPMiddleware):
    \"\"\"Middleware for rate limiting\"\"\"
    
    def __init__(self, app: ASGIApp, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = {}  # In production, use Redis
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get client identifier
        client_ip = request.client.host if request.client else \"unknown\"
        
        # Check authorization header for user-specific limits
        auth_header = request.headers.get(\"authorization\")
        if auth_header:
            # Use token-based rate limiting
            client_key = f\"token_{auth_header[:20]}\"
        else:
            # Use IP-based rate limiting
            client_key = f\"ip_{client_ip}\"
        
        # Check rate limit
        current_time = time.time()
        minute_key = int(current_time // 60)
        
        if client_key not in self.requests:
            self.requests[client_key] = {}
        
        # Clean old entries
        for key in list(self.requests[client_key].keys()):
            if key < minute_key - 1:  # Keep last minute only
                del self.requests[client_key][key]
        
        # Count requests in current minute
        current_requests = self.requests[client_key].get(minute_key, 0)
        
        if current_requests >= self.requests_per_minute:
            logger.warning(
                \"Rate limit exceeded\",
                client_key=client_key,
                requests=current_requests,
                limit=self.requests_per_minute
            )
            
            return JSONResponse(
                status_code=429,
                content={
                    \"error\": \"Rate limit exceeded\",
                    \"message\": f\"Maximum {self.requests_per_minute} requests per minute\",
                    \"retry_after\": 60,
                    \"timestamp\": datetime.utcnow().isoformat()
                },
                headers={\"Retry-After\": \"60\"}
            )
        
        # Increment counter
        self.requests[client_key][minute_key] = current_requests + 1
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers[\"X-RateLimit-Limit\"] = str(self.requests_per_minute)
        response.headers[\"X-RateLimit-Remaining\"] = str(
            max(0, self.requests_per_minute - self.requests[client_key][minute_key])
        )
        response.headers[\"X-RateLimit-Reset\"] = str(int((minute_key + 1) * 60))
        
        return response

class RequestTrackingMiddleware(BaseHTTPMiddleware):
    \"\"\"Middleware for request tracking and correlation\"\"\"
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get or generate correlation ID
        correlation_id = request.headers.get(\"X-Correlation-ID\") or str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        
        # Get or generate request ID
        request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
        
        # Store request context
        request.state.start_time = time.time()
        request.state.method = request.method
        request.state.path = request.url.path
        
        try:
            # Process request
            response = await call_next(request)
            
            # Add tracking headers
            response.headers[\"X-Correlation-ID\"] = correlation_id
            response.headers[\"X-Request-ID\"] = request_id
            response.headers[\"X-Response-Time\"] = str(
                int((time.time() - request.state.start_time) * 1000)
            )
            
            return response
            
        except Exception as e:
            logger.error(
                \"Request processing failed\",
                correlation_id=correlation_id,
                request_id=request_id,
                error=str(e),
                method=request.state.method,
                path=request.state.path
            )
            raise

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    \"\"\"Middleware for adding security headers\"\"\"
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers[\"X-Content-Type-Options\"] = \"nosniff\"
        response.headers[\"X-Frame-Options\"] = \"DENY\"
        response.headers[\"X-XSS-Protection\"] = \"1; mode=block\"
        response.headers[\"Strict-Transport-Security\"] = \"max-age=31536000; includeSubDomains\"
        response.headers[\"Content-Security-Policy\"] = \"default-src 'self'\"
        response.headers[\"Referrer-Policy\"] = \"strict-origin-when-cross-origin\"
        response.headers[\"Permissions-Policy\"] = \"geolocation=(), microphone=(), camera=()\"
        
        return response

class CacheControlMiddleware(BaseHTTPMiddleware):
    \"\"\"Middleware for cache control headers\"\"\"
    
    def __init__(self, app: ASGIApp, default_max_age: int = 300):
        super().__init__(app)
        self.default_max_age = default_max_age
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add cache control based on endpoint
        path = request.url.path
        
        if path.startswith(\"/api/v1/\"):
            if request.method == \"GET\":
                # Cache GET requests for API
                response.headers[\"Cache-Control\"] = f\"private, max-age={self.default_max_age}\"
            else:
                # Don't cache mutations
                response.headers[\"Cache-Control\"] = \"no-cache, no-store, must-revalidate\"
        elif path in [\"/health\", \"/metrics\"]:
            # Don't cache system endpoints
            response.headers[\"Cache-Control\"] = \"no-cache\"
        else:
            # Default caching
            response.headers[\"Cache-Control\"] = f\"public, max-age={self.default_max_age}\"
        
        return response