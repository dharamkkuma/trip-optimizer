"""
File-related Pydantic models for the Storage API.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, validator


class FileUploadRequest(BaseModel):
    """Model for file upload request validation."""
    
    filename: str = Field(..., description="Name of the file")
    file_size: int = Field(..., gt=0, description="Size of the file in bytes")
    file_type: str = Field(..., description="MIME type of the file")
    
    @validator('filename')
    def validate_filename(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Filename cannot be empty')
        if len(v) > 255:
            raise ValueError('Filename too long (max 255 characters)')
        return v.strip()
    
    @validator('file_type')
    def validate_file_type(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('File type cannot be empty')
        return v.strip()


class FileUploadResponse(BaseModel):
    """Model for single file upload response."""
    
    file_id: UUID = Field(default_factory=uuid4, description="Unique identifier for the uploaded file")
    filename: str = Field(..., description="Name of the uploaded file")
    file_size: int = Field(..., description="Size of the file in bytes")
    file_type: str = Field(..., description="MIME type of the file")
    storage_url: str = Field(..., description="URL to access the file in storage")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when file was uploaded")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() + "Z",
            UUID: lambda v: str(v)
        }


class MultipleFileUploadResponse(BaseModel):
    """Model for multiple file upload response."""
    
    uploaded_files: List[FileUploadResponse] = Field(..., description="List of uploaded files")
    total_files: int = Field(..., description="Total number of files uploaded")
    total_size: int = Field(..., description="Total size of all uploaded files in bytes")
    
    @validator('total_files')
    def validate_total_files(cls, v, values):
        if 'uploaded_files' in values:
            actual_count = len(values['uploaded_files'])
            if v != actual_count:
                raise ValueError(f'Total files count ({v}) does not match uploaded files count ({actual_count})')
        return v
    
    @validator('total_size')
    def validate_total_size(cls, v, values):
        if 'uploaded_files' in values:
            actual_size = sum(file.file_size for file in values['uploaded_files'])
            if v != actual_size:
                raise ValueError(f'Total size ({v}) does not match sum of file sizes ({actual_size})')
        return v


class FileStatusResponse(BaseModel):
    """Model for file status response."""
    
    file_id: UUID = Field(..., description="Unique identifier for the file")
    filename: str = Field(..., description="Name of the file")
    status: str = Field(..., description="Current status of the file")
    storage_url: Optional[str] = Field(None, description="URL to access the file in storage")
    uploaded_at: Optional[datetime] = Field(None, description="Timestamp when file was uploaded")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() + "Z",
            UUID: lambda v: str(v)
        }


class PresignedDownloadResponse(BaseModel):
    """Model for presigned download URL response."""
    
    file_id: UUID = Field(..., description="Unique identifier for the file")
    filename: str = Field(..., description="Name of the file")
    download_url: str = Field(..., description="Presigned URL for downloading the file")
    expires_in: int = Field(..., description="URL expiration time in seconds")
    expires_at: datetime = Field(..., description="URL expiration timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() + "Z",
            UUID: lambda v: str(v)
        }


class PresignedUploadResponse(BaseModel):
    """Model for presigned upload URL response."""
    
    file_id: UUID = Field(..., description="Unique identifier for the file")
    filename: str = Field(..., description="Name of the file")
    upload_url: str = Field(..., description="Presigned URL for uploading the file")
    upload_fields: dict = Field(..., description="Required form fields for upload")
    expires_in: int = Field(..., description="URL expiration time in seconds")
    expires_at: datetime = Field(..., description="URL expiration timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() + "Z",
            UUID: lambda v: str(v)
        }
