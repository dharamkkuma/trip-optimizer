"""
Health check API routes for the Storage API.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from ..models import HealthResponse, StorageHealthResponse, APIResponse
from ..services import S3Service
from ..config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


async def get_storage_service() -> S3Service:
    """Dependency to get storage service instance."""
    settings = get_settings()
    return S3Service(
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
        bucket_name=settings.s3_bucket_name,
        upload_path=settings.upload_path,
        aws_session_token=settings.aws_session_token
    )


@router.get("", response_model=HealthResponse)
async def health_check():
    """
    Basic health check endpoint.
    
    Returns:
        HealthResponse with service status
    """
    try:
        settings = get_settings()
        
        return HealthResponse(
            status="healthy",
            version=settings.app_version
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unhealthy")


@router.get("/storage", response_model=APIResponse[StorageHealthResponse])
async def storage_health_check(
    storage_service: S3Service = Depends(get_storage_service)
):
    """
    Storage service health check endpoint.
    
    Args:
        storage_service: Storage service instance
        
    Returns:
        APIResponse with storage health details
    """
    try:
        # Perform storage health check
        health_data = await storage_service.health_check()
        
        # Create response based on health check results
        if health_data["status"] == "healthy":
            response_data = StorageHealthResponse(
                status="healthy",
                storage_provider=health_data["provider"],
                bucket_accessible=health_data["bucket_accessible"]
            )
            
            return APIResponse(
                success=True,
                message="Storage service is healthy",
                data=response_data
            )
        else:
            # Storage service is unhealthy
            response_data = StorageHealthResponse(
                status="unhealthy",
                storage_provider=health_data["provider"],
                bucket_accessible=health_data["bucket_accessible"]
            )
            
            return APIResponse(
                success=False,
                message=f"Storage service is unhealthy: {health_data.get('error', 'Unknown error')}",
                data=response_data
            )
            
    except Exception as e:
        logger.error(f"Storage health check failed: {str(e)}")
        
        # Return unhealthy status
        response_data = StorageHealthResponse(
            status="unhealthy",
            storage_provider="unknown",
            bucket_accessible=False
        )
        
        return APIResponse(
            success=False,
            message=f"Storage health check failed: {str(e)}",
            data=response_data
        )
