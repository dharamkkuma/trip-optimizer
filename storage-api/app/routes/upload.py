"""
Upload API routes for the Storage API.
"""

import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from ..models import (
    FileUploadResponse, 
    MultipleFileUploadResponse, 
    APIResponse,
    ErrorResponse
)
from ..services import S3Service
from ..utils import (
    validate_file_type, 
    validate_file_size, 
    validate_filename,
    FileValidationError,
    StorageServiceError
)
from ..config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/upload", tags=["upload"])


async def get_current_user():
    """Dependency to get current user (no authentication for testing)."""
    # Return a mock user for testing purposes
    return {
        "user_id": "test-user",
        "username": "testuser",
        "email": "test@example.com",
        "roles": ["user"]
    }


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


@router.post("/single", response_model=APIResponse[FileUploadResponse])
async def upload_single_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    storage_service: S3Service = Depends(get_storage_service)
):
    """
    Upload a single file to storage.
    
    Args:
        file: The file to upload
        current_user: Current authenticated user
        storage_service: Storage service instance
        
    Returns:
        APIResponse with file upload details
    """
    try:
        settings = get_settings()
        
        # Read file content
        file_content = await file.read()
        
        # Validate filename
        validated_filename = validate_filename(file.filename or "unknown")
        
        # Validate file type
        allowed_types = settings.allowed_file_types.split(',')
        content_type = validate_file_type(validated_filename, allowed_types, file_content)
        
        # Validate file size
        validate_file_size(len(file_content), settings.max_file_size_mb)
        
        # Upload file
        upload_response = await storage_service.upload_file(
            file_content=file_content,
            filename=validated_filename,
            content_type=content_type
        )
        
        logger.info(f"User {current_user.get('user_id')} uploaded file {validated_filename}")
        
        return APIResponse(
            success=True,
            message="File uploaded successfully",
            data=upload_response
        )
        
    except FileValidationError as e:
        logger.warning(f"File validation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except StorageServiceError as e:
        logger.error(f"Storage service error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during file upload: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/multiple", response_model=APIResponse[MultipleFileUploadResponse])
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
    storage_service: S3Service = Depends(get_storage_service)
):
    """
    Upload multiple files to storage.
    
    Args:
        files: List of files to upload
        current_user: Current authenticated user
        storage_service: Storage service instance
        
    Returns:
        APIResponse with multiple file upload details
    """
    try:
        settings = get_settings()
        uploaded_files = []
        total_size = 0
        
        # Process each file
        for file in files:
            try:
                # Read file content
                file_content = await file.read()
                
                # Validate filename
                validated_filename = validate_filename(file.filename or "unknown")
                
                # Validate file type
                allowed_types = settings.allowed_file_types.split(',')
                content_type = validate_file_type(validated_filename, allowed_types, file_content)
                
                # Validate file size
                validate_file_size(len(file_content), settings.max_file_size_mb)
                
                # Upload file
                upload_response = await storage_service.upload_file(
                    file_content=file_content,
                    filename=validated_filename,
                    content_type=content_type
                )
                
                uploaded_files.append(upload_response)
                total_size += len(file_content)
                
            except FileValidationError as e:
                logger.warning(f"File validation failed for {file.filename}: {str(e)}")
                # Continue with other files
                continue
            except Exception as e:
                logger.error(f"Error uploading file {file.filename}: {str(e)}")
                # Continue with other files
                continue
        
        if not uploaded_files:
            raise HTTPException(status_code=400, detail="No files were successfully uploaded")
        
        logger.info(f"User {current_user.get('user_id')} uploaded {len(uploaded_files)} files")
        
        response_data = MultipleFileUploadResponse(
            uploaded_files=uploaded_files,
            total_files=len(uploaded_files),
            total_size=total_size
        )
        
        return APIResponse(
            success=True,
            message=f"Successfully uploaded {len(uploaded_files)} files",
            data=response_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during multiple file upload: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/status/{file_id}", response_model=APIResponse[dict])
async def get_upload_status(
    file_id: str,
    current_user: dict = Depends(get_current_user),
    storage_service: S3Service = Depends(get_storage_service)
):
    """
    Get the status of an uploaded file.
    
    Args:
        file_id: UUID of the uploaded file
        current_user: Current authenticated user
        storage_service: Storage service instance
        
    Returns:
        APIResponse with file status details
    """
    try:
        from uuid import UUID
        
        # Validate UUID format
        try:
            file_uuid = UUID(file_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid file ID format")
        
        # Get file status
        file_status = await storage_service.get_file_status(file_uuid)
        
        return APIResponse(
            success=True,
            message="File status retrieved successfully",
            data=file_status.dict()
        )
        
    except StorageServiceError as e:
        logger.error(f"Storage service error: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting file status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/list", response_model=APIResponse[dict])
async def list_files(
    prefix: str = "",
    max_keys: int = 100,
    current_user: dict = Depends(get_current_user),
    storage_service: S3Service = Depends(get_storage_service)
):
    """
    List files in the storage bucket.
    
    Args:
        prefix: Optional prefix to filter files (e.g., "uploads/")
        max_keys: Maximum number of files to return (default: 100)
        current_user: Current authenticated user
        storage_service: Storage service instance
        
    Returns:
        APIResponse with list of files
    """
    try:
        # Validate max_keys
        if max_keys <= 0 or max_keys > 1000:
            raise HTTPException(status_code=400, detail="max_keys must be between 1 and 1000")
        
        # List files
        files = await storage_service.list_files(prefix=prefix, max_keys=max_keys)
        
        # Calculate total size
        total_size = sum(file.get('size', 0) for file in files)
        
        response_data = {
            "files": files,
            "total_files": len(files),
            "total_size": total_size,
            "prefix": prefix,
            "max_keys": max_keys
        }
        
        return APIResponse(
            success=True,
            message=f"Successfully listed {len(files)} files",
            data=response_data
        )
        
    except StorageServiceError as e:
        logger.error(f"Storage service error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error listing files: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
