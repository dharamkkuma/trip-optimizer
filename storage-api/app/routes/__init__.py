"""
API routes for the Storage API.

This module contains all the FastAPI route definitions.
"""

from .upload import router as upload_router
from .health import router as health_router

__all__ = ["upload_router", "health_router"]
