"""
Main FastAPI application for the Storage API.
"""

import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi

from .config import get_settings
from .routes import upload_router, health_router
from .utils.exceptions import StorageAPIException
from .models.response_models import ErrorResponse


# Configure logging
def setup_logging():
    """Setup application logging."""
    settings = get_settings()
    
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
        ]
    )
    
    # Set specific loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    setup_logging()
    logger = logging.getLogger(__name__)
    logger.info("Storage API starting up...")
    
    # Initialize any startup tasks here
    # For example, test database connections, initialize Redis, etc.
    
    yield
    
    # Shutdown
    logger.info("Storage API shutting down...")
    # Cleanup tasks here


# Create FastAPI application
def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="A FastAPI-based microservice for handling file uploads to multiple cloud storage providers",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        openapi_url="/openapi.json" if settings.debug else None,
        lifespan=lifespan
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=settings.cors_methods_list,
        allow_headers=settings.cors_headers_list,
    )
    
    # Add trusted host middleware for production
    if not settings.debug:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=["*"]  # Configure this properly for production
        )
    
    # Add custom exception handlers
    @app.exception_handler(StorageAPIException)
    async def storage_api_exception_handler(request: Request, exc: StorageAPIException):
        """Handle custom Storage API exceptions."""
        return JSONResponse(
            status_code=400,
            content=ErrorResponse(
                message=exc.message,
                error_code=exc.error_code,
                details=exc.details
            ).dict()
        )
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions."""
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                message=exc.detail,
                error_code=f"HTTP_{exc.status_code}"
            ).dict()
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle general exceptions."""
        logger = logging.getLogger(__name__)
        logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                message="Internal server error",
                error_code="INTERNAL_SERVER_ERROR"
            ).dict()
        )
    
    # Include routers
    app.include_router(upload_router)
    app.include_router(health_router)
    
    # Custom OpenAPI schema
    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema
        
        openapi_schema = get_openapi(
            title=settings.app_name,
            version=settings.app_version,
            description="A FastAPI-based microservice for handling file uploads to multiple cloud storage providers",
            routes=app.routes,
        )
        
        # Add custom tags
        openapi_schema["tags"] = [
            {
                "name": "upload",
                "description": "File upload operations"
            },
            {
                "name": "health",
                "description": "Health check endpoints"
            }
        ]
        
        app.openapi_schema = openapi_schema
        return app.openapi_schema
    
    app.openapi = custom_openapi
    
    return app


# Create the application instance
app = create_app()


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    settings = get_settings()
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs_url": "/docs" if settings.debug else "Documentation not available in production",
        "health_check": "/health"
    }


# Additional endpoints for API information
@app.get("/info")
async def api_info():
    """Get API information."""
    settings = get_settings()
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "description": "A FastAPI-based microservice for handling file uploads to multiple cloud storage providers",
        "features": [
            "Multi-Cloud Support (AWS S3, Google Cloud Storage, Azure Blob Storage)",
            "JWT Authentication",
            "File Validation",
            "Batch Upload",
            "Rate Limiting",
            "Health Checks"
        ],
        "endpoints": {
            "upload": "/api/v1/upload",
            "health": "/health",
            "docs": "/docs" if settings.debug else None
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
