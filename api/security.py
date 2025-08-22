from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from typing import Dict, Optional, Set
import time
import hashlib
import secrets
from datetime import datetime, timedelta
from collections import defaultdict, deque
import asyncio
import json
import re
from ipaddress import ip_address, ip_network

from logging_config import get_logger, SecurityEvent
from metrics import MetricsCollector

logger = get_logger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware with sliding window and IP/user-based limits"""
    
    def __init__(self, app, requests_per_minute: int = 100, burst_limit: int = 20):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.burst_limit = burst_limit
        self.request_counts = defaultdict(deque)
        self.burst_counts = defaultdict(int)
        self.blocked_ips = defaultdict(int)
        
    async def dispatch(self, request: Request, call_next):
        client_ip = self.get_client_ip(request)
        user_id = request.headers.get("X-User-ID", "anonymous")
        identifier = f"{client_ip}:{user_id}"
        
        current_time = time.time()
        
        # Check if IP is temporarily blocked
        if self.blocked_ips.get(client_ip, 0) > current_time:
            logger.warning("Rate limit exceeded - IP blocked", ip=client_ip, user_id=user_id)
            SecurityEvent.log_authorization_failure(
                user_id=user_id,
                resource="rate_limit",
                action="request",
                ip_address=client_ip
            )
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. IP temporarily blocked."}
            )
        
        # Clean old requests (sliding window)
        requests = self.request_counts[identifier]
        while requests and requests[0] < current_time - 60:  # Remove requests older than 1 minute
            requests.popleft()
        
        # Check rate limits
        if len(requests) >= self.requests_per_minute:
            # Block IP for 5 minutes
            self.blocked_ips[client_ip] = current_time + 300
            logger.warning("Rate limit exceeded", ip=client_ip, user_id=user_id, requests_count=len(requests))
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded"}
            )
        
        # Check burst limit
        burst_window = current_time - 10  # 10 second window
        recent_requests = sum(1 for req_time in requests if req_time > burst_window)
        
        if recent_requests >= self.burst_limit:
            logger.warning("Burst limit exceeded", ip=client_ip, user_id=user_id, burst_count=recent_requests)
            return JSONResponse(
                status_code=429,
                content={"detail": "Burst limit exceeded"}
            )
        
        # Record this request
        requests.append(current_time)
        
        response = await call_next(request)
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """Extract client IP with proxy support"""
        # Check for forwarded headers
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"

class SecurityMiddleware(BaseHTTPMiddleware):
    """Comprehensive security middleware"""
    
    def __init__(self, app, 
                 allowed_hosts: Optional[Set[str]] = None,
                 cors_origins: Optional[Set[str]] = None,
                 require_https: bool = False):
        super().__init__(app)
        self.allowed_hosts = allowed_hosts or set()
        self.cors_origins = cors_origins or set()
        self.require_https = require_https
        
        # Security headers
        self.security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
        }
    
    async def dispatch(self, request: Request, call_next):
        # HTTPS enforcement
        if self.require_https and request.url.scheme != "https":
            return JSONResponse(
                status_code=400,
                content={"detail": "HTTPS required"}
            )
        
        # Host validation
        if self.allowed_hosts:
            host = request.headers.get("host", "").split(":")[0]
            if host not in self.allowed_hosts:
                logger.warning("Invalid host", host=host)
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid host"}
                )
        
        # Request size validation
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB limit
            return JSONResponse(
                status_code=413,
                content={"detail": "Request entity too large"}
            )
        
        response = await call_next(request)
        
        # Add security headers
        for header, value in self.security_headers.items():
            response.headers[header] = value
        
        return response

class APIKeyManager:
    """Enhanced API key management with scopes and rate limits"""
    
    def __init__(self):
        self.api_keys: Dict[str, dict] = {}
        self.key_usage: Dict[str, deque] = defaultdict(deque)
    
    def generate_api_key(self, 
                        user_id: str,
                        name: str,
                        scopes: Set[str] = None,
                        rate_limit: int = 100,
                        expires_in_days: int = 365) -> str:
        """Generate a new API key with metadata"""
        api_key = f"sk-{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        
        self.api_keys[key_hash] = {
            "user_id": user_id,
            "name": name,
            "scopes": scopes or {"read", "write"},
            "rate_limit": rate_limit,
            "created_at": datetime.utcnow(),
            "expires_at": expires_at,
            "is_active": True,
            "usage_count": 0,
            "last_used": None
        }
        
        logger.info("API key generated", user_id=user_id, key_name=name)
        return api_key
    
    def verify_api_key(self, api_key: str, required_scope: str = None) -> Optional[dict]:
        """Verify API key and check permissions"""
        if not api_key.startswith("sk-"):
            return None
        
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        key_data = self.api_keys.get(key_hash)
        
        if not key_data:
            return None
        
        # Check if key is active
        if not key_data["is_active"]:
            return None
        
        # Check expiration
        if key_data["expires_at"] < datetime.utcnow():
            return None
        
        # Check scope
        if required_scope and required_scope not in key_data["scopes"]:
            return None
        
        # Check rate limit
        current_time = time.time()
        usage_window = self.key_usage[key_hash]
        
        # Clean old usage records
        while usage_window and usage_window[0] < current_time - 60:
            usage_window.popleft()
        
        if len(usage_window) >= key_data["rate_limit"]:
            return None
        
        # Record usage
        usage_window.append(current_time)
        key_data["usage_count"] += 1
        key_data["last_used"] = datetime.utcnow()
        
        SecurityEvent.log_api_key_usage(
            api_key_id=key_hash[:8],
            endpoint="unknown",
            success=True
        )
        
        return key_data
    
    def revoke_api_key(self, api_key: str) -> bool:
        """Revoke an API key"""
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        if key_hash in self.api_keys:
            self.api_keys[key_hash]["is_active"] = False
            logger.info("API key revoked", key_hash=key_hash[:8])
            return True
        return False
    
    def list_api_keys(self, user_id: str) -> list:
        """List API keys for a user"""
        return [
            {
                "id": key_hash[:8],
                "name": data["name"],
                "scopes": list(data["scopes"]),
                "created_at": data["created_at"],
                "expires_at": data["expires_at"],
                "is_active": data["is_active"],
                "usage_count": data["usage_count"],
                "last_used": data["last_used"]
            }
            for key_hash, data in self.api_keys.items()
            if data["user_id"] == user_id
        ]

class InputValidationMiddleware(BaseHTTPMiddleware):
    """Input validation and sanitization middleware"""
    
    def __init__(self, app):
        super().__init__(app)
        self.sql_injection_patterns = [
            r"(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)",
            r"(\b--|\#|\*|\;)",
            r"(\bOR\b|\bAND\b).*(\=|\>|\<)",
        ]
        self.xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>.*?</iframe>",
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Validate request path
        if self.is_suspicious_path(request.url.path):
            logger.warning("Suspicious request path", path=request.url.path)
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid request path"}
            )
        
        # Validate query parameters
        for key, value in request.query_params.items():
            if self.is_malicious_input(value):
                logger.warning("Malicious query parameter", key=key, value=value)
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid query parameter"}
                )
        
        # Validate headers
        user_agent = request.headers.get("user-agent", "")
        if self.is_suspicious_user_agent(user_agent):
            logger.warning("Suspicious user agent", user_agent=user_agent)
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid user agent"}
            )
        
        response = await call_next(request)
        return response
    
    def is_suspicious_path(self, path: str) -> bool:
        """Check for suspicious path patterns"""
        suspicious_patterns = [
            r"\.\.\/",  # Directory traversal
            r"\/etc\/",  # System files
            r"\/proc\/",  # Process files
            r"\/var\/",  # Variable files
            r"\.(php|asp|jsp|cgi)$",  # Server-side scripts
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, path, re.IGNORECASE):
                return True
        return False
    
    def is_malicious_input(self, input_text: str) -> bool:
        """Check for malicious input patterns"""
        all_patterns = self.sql_injection_patterns + self.xss_patterns
        
        for pattern in all_patterns:
            if re.search(pattern, input_text, re.IGNORECASE):
                return True
        return False
    
    def is_suspicious_user_agent(self, user_agent: str) -> bool:
        """Check for suspicious user agents"""
        if not user_agent or len(user_agent) < 10:
            return True
        
        suspicious_agents = [
            "sqlmap", "nikto", "nmap", "masscan", "zap",
            "burp", "gobuster", "dirb", "dirbuster"
        ]
        
        return any(agent in user_agent.lower() for agent in suspicious_agents)

# Global instances
api_key_manager = APIKeyManager()
security_middleware = SecurityMiddleware
rate_limit_middleware = RateLimitMiddleware
input_validation_middleware = InputValidationMiddleware

# Authentication dependency
security_bearer = HTTPBearer()

async def get_current_user_or_api_key(
    credentials: HTTPAuthorizationCredentials = Depends(security_bearer)
) -> dict:
    """Get user from JWT token or API key"""
    token = credentials.credentials
    
    # Check if it's an API key
    if token.startswith("sk-"):
        key_data = api_key_manager.verify_api_key(token)
        if key_data:
            return {
                "id": key_data["user_id"],
                "type": "api_key",
                "scopes": key_data["scopes"]
            }
        else:
            logger.warning("Invalid API key used")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
    
    # Handle JWT token (simplified for demo)
    # In production, implement proper JWT validation
    logger.info("JWT authentication", token=token[:10] + "...")
    return {
        "id": "user_123",
        "type": "jwt",
        "scopes": {"read", "write", "admin"}
    }

def require_scope(required_scope: str):
    """Dependency to require specific scope"""
    def scope_checker(user: dict = Depends(get_current_user_or_api_key)):
        if required_scope not in user.get("scopes", set()):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required scope: {required_scope}"
            )
        return user
    return scope_checker

# Configuration class
class SecurityConfig:
    """Security configuration"""
    
    def __init__(self):
        self.rate_limit_per_minute = 100
        self.burst_limit = 20
        self.require_api_key = False
        self.allowed_hosts = set()
        self.cors_origins = {"http://localhost:3000", "http://127.0.0.1:3000"}
        self.require_https = False
        self.api_key_expiry_days = 365
        self.max_request_size = 10 * 1024 * 1024  # 10MB
        
    def update(self, **kwargs):
        """Update configuration"""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

# Global security config
security_config = SecurityConfig()