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
    ErrorResponse,
    PresignedDownloadResponse,
    PresignedUploadResponse
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


@router.get("/presigned-download/{file_id}", response_model=APIResponse[PresignedDownloadResponse])
async def get_presigned_download_url(
    file_id: str,
    filename: str,
    expiration: int = 3600,
    current_user: dict = Depends(get_current_user),
    storage_service: S3Service = Depends(get_storage_service)
):
    """
    Generate a presigned URL for downloading a file from S3.
    
    Args:
        file_id: Unique identifier for the file
        filename: Name of the file to download
        expiration: URL expiration time in seconds (default: 3600 = 1 hour)
        current_user: Current authenticated user
        storage_service: Storage service instance
        
    Returns:
        APIResponse with presigned download URL
    """
    try:
        # Validate expiration time (max 7 days = 604800 seconds)
        if expiration <= 0 or expiration > 604800:
            raise HTTPException(
                status_code=400, 
                detail="Expiration time must be between 1 and 604800 seconds (7 days)"
            )
        
        # Validate filename
        validated_filename = validate_filename(filename)
        
        # Generate presigned download URL
        download_url = await storage_service.generate_presigned_download_url(
            file_id=file_id,
            filename=validated_filename,
            expiration=expiration
        )
        
        from datetime import datetime, timedelta
        expires_at = datetime.utcnow() + timedelta(seconds=expiration)
        
        response_data = PresignedDownloadResponse(
            file_id=file_id,
            filename=validated_filename,
            download_url=download_url,
            expires_in=expiration,
            expires_at=expires_at
        )
        
        logger.info(f"User {current_user.get('user_id')} requested presigned download URL for {validated_filename}")
        
        return APIResponse(
            success=True,
            message="Presigned download URL generated successfully",
            data=response_data
        )
        
    except FileValidationError as e:
        logger.warning(f"File validation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except StorageServiceError as e:
        logger.error(f"Storage service error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error generating presigned download URL: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/presigned-upload", response_model=APIResponse[PresignedUploadResponse])
async def get_presigned_upload_url(
    filename: str = Form(...),
    content_type: str = Form(...),
    expiration: int = 3600,
    current_user: dict = Depends(get_current_user),
    storage_service: S3Service = Depends(get_storage_service)
):
    """
    Generate a presigned URL for uploading a file to S3.
    
    Args:
        filename: Name of the file to upload
        content_type: MIME type of the file
        expiration: URL expiration time in seconds (default: 3600 = 1 hour)
        current_user: Current authenticated user
        storage_service: Storage service instance
        
    Returns:
        APIResponse with presigned upload URL and form fields
    """
    try:
        # Validate expiration time (max 7 days = 604800 seconds)
        if expiration <= 0 or expiration > 604800:
            raise HTTPException(
                status_code=400, 
                detail="Expiration time must be between 1 and 604800 seconds (7 days)"
            )
        
        # Validate filename
        validated_filename = validate_filename(filename)
        
        # Validate content type
        settings = get_settings()
        allowed_types = settings.allowed_file_types.split(',')
        if content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Content type '{content_type}' not allowed. Allowed types: {', '.join(allowed_types)}"
            )
        
        # Generate unique file ID
        from uuid import uuid4
        file_id = str(uuid4())
        
        # Generate presigned upload URL
        presigned_post = await storage_service.generate_presigned_upload_url(
            file_id=file_id,
            filename=validated_filename,
            content_type=content_type,
            expiration=expiration
        )
        
        from datetime import datetime, timedelta
        expires_at = datetime.utcnow() + timedelta(seconds=expiration)
        
        response_data = PresignedUploadResponse(
            file_id=file_id,
            filename=validated_filename,
            upload_url=presigned_post['url'],
            upload_fields=presigned_post['fields'],
            expires_in=expiration,
            expires_at=expires_at
        )
        
        logger.info(f"User {current_user.get('user_id')} requested presigned upload URL for {validated_filename}")
        
        return APIResponse(
            success=True,
            message="Presigned upload URL generated successfully",
            data=response_data
        )
        
    except FileValidationError as e:
        logger.warning(f"File validation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except StorageServiceError as e:
        logger.error(f"Storage service error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error generating presigned upload URL: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
