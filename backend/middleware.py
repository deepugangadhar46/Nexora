"""
Security and Performance Middleware
====================================

Comprehensive middleware for security, logging, and performance monitoring.

Author: NEXORA Team
Version: 1.0.0
"""

import time
import logging
import uuid
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import bleach

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp
        
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests with timing and metadata"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Start timer
        start_time = time.time()
        
        # Log request
        logger.info(
            f"Request started",
            extra={
                "request_id": request_id,
                "method": request.method,
                "url": str(request.url),
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
            }
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            logger.info(
                f"Request completed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "url": str(request.url),
                    "status_code": response.status_code,
                    "duration_ms": round(duration * 1000, 2),
                }
            )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            logger.error(
                f"Request failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "url": str(request.url),
                    "error": str(e),
                    "duration_ms": round(duration * 1000, 2),
                },
                exc_info=True
            )
            
            raise


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Limit request body size to prevent DoS attacks"""
    
    def __init__(self, app: ASGIApp, max_size: int = 10 * 1024 * 1024):  # 10MB default
        super().__init__(app)
        self.max_size = max_size
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check Content-Length header
        content_length = request.headers.get("content-length")
        
        if content_length:
            content_length = int(content_length)
            if content_length > self.max_size:
                logger.warning(
                    f"Request body too large: {content_length} bytes (max: {self.max_size})",
                    extra={
                        "client_ip": request.client.host if request.client else None,
                        "url": str(request.url),
                    }
                )
                return JSONResponse(
                    status_code=413,
                    content={
                        "error": "Request body too large",
                        "max_size_bytes": self.max_size,
                        "received_bytes": content_length
                    }
                )
        
        return await call_next(request)


class InputSanitizationMiddleware(BaseHTTPMiddleware):
    """Sanitize input to prevent XSS attacks"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only sanitize for specific content types
        content_type = request.headers.get("content-type", "")
        
        if "application/json" in content_type and request.method in ["POST", "PUT", "PATCH"]:
            try:
                # Get request body
                body = await request.body()
                
                if body:
                    import json
                    data = json.loads(body)
                    
                    # Sanitize string values
                    sanitized_data = self._sanitize_dict(data)
                    
                    # Replace request body with sanitized version
                    request._body = json.dumps(sanitized_data).encode()
                    
            except Exception as e:
                logger.warning(f"Failed to sanitize request body: {str(e)}")
        
        return await call_next(request)
    
    def _sanitize_dict(self, data: dict) -> dict:
        """Recursively sanitize dictionary values"""
        sanitized = {}
        
        for key, value in data.items():
            if isinstance(value, str):
                # Sanitize HTML/script tags
                sanitized[key] = bleach.clean(
                    value,
                    tags=[],  # No HTML tags allowed
                    strip=True
                )
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    self._sanitize_dict(item) if isinstance(item, dict)
                    else bleach.clean(item, tags=[], strip=True) if isinstance(item, str)
                    else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """Monitor endpoint performance and log slow requests"""
    
    def __init__(self, app: ASGIApp, slow_threshold_ms: float = 1000):
        super().__init__(app)
        self.slow_threshold_ms = slow_threshold_ms
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        response = await call_next(request)
        
        duration_ms = (time.time() - start_time) * 1000
        
        # Log slow requests
        if duration_ms > self.slow_threshold_ms:
            logger.warning(
                f"Slow request detected",
                extra={
                    "method": request.method,
                    "url": str(request.url),
                    "duration_ms": round(duration_ms, 2),
                    "threshold_ms": self.slow_threshold_ms,
                }
            )
        
        # Add performance header
        response.headers["X-Response-Time"] = f"{round(duration_ms, 2)}ms"
        
        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        
        except Exception as e:
            logger.error(
                f"Unhandled exception",
                extra={
                    "method": request.method,
                    "url": str(request.url),
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                },
                exc_info=True
            )
            
            # Don't expose internal errors in production
            import os
            is_production = os.getenv("ENVIRONMENT") == "production"
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal server error",
                    "message": "An unexpected error occurred" if is_production else str(e),
                    "request_id": getattr(request.state, "request_id", None),
                }
            )


class CORSSecurityMiddleware(BaseHTTPMiddleware):
    """Enhanced CORS security with origin validation"""
    
    def __init__(self, app: ASGIApp, allowed_origins: list):
        super().__init__(app)
        self.allowed_origins = set(allowed_origins)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        origin = request.headers.get("origin")
        
        # Validate origin
        if origin and origin not in self.allowed_origins:
            logger.warning(
                f"Blocked request from unauthorized origin: {origin}",
                extra={
                    "client_ip": request.client.host if request.client else None,
                    "url": str(request.url),
                }
            )
            
            return JSONResponse(
                status_code=403,
                content={"error": "Origin not allowed"}
            )
        
        return await call_next(request)


def setup_middleware(app):
    """Setup all middleware for the application"""
    import os
    
    # Security headers
    app.add_middleware(SecurityHeadersMiddleware)
    
    # Request logging
    app.add_middleware(RequestLoggingMiddleware)
    
    # Request size limit (10MB)
    app.add_middleware(RequestSizeLimitMiddleware, max_size=10 * 1024 * 1024)
    
    # Input sanitization
    app.add_middleware(InputSanitizationMiddleware)
    
    # Performance monitoring (log requests > 1 second)
    app.add_middleware(PerformanceMonitoringMiddleware, slow_threshold_ms=1000)
    
    # Global error handling
    app.add_middleware(ErrorHandlingMiddleware)
    
    # CORS security (only in production)
    if os.getenv("ENVIRONMENT") == "production":
        allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
        if allowed_origins:
            app.add_middleware(CORSSecurityMiddleware, allowed_origins=allowed_origins)
    
    logger.info("All middleware configured successfully")
