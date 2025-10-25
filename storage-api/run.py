#!/usr/bin/env python3
"""
Simple script to run the Storage API application.
"""

import uvicorn
from app.config import get_settings

if __name__ == "__main__":
    settings = get_settings()
    
    print(f"Starting {settings.app_name} v{settings.app_version}")
    print(f"Debug mode: {settings.debug}")
    print(f"Host: {settings.host}:{settings.port}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
