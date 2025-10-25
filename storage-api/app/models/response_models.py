"""
Response models for the Storage API.
"""

from datetime import datetime
from typing import Any, Dict, Generic, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar('T')


class APIResponse(BaseModel, Generic[T]):
    """Generic API response model."""
    
    success: bool = Field(..., description="Whether the request was successful")
    message: str = Field(..., description="Response message")
    data: Optional[T] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() + "Z"
        }


class HealthResponse(BaseModel):
    """Health check response model."""
    
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Health check timestamp")
    version: str = Field(..., description="API version")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() + "Z"
        }


class StorageHealthResponse(BaseModel):
    """Storage health check response model."""
    
    status: str = Field(..., description="Storage service status")
    storage_provider: str = Field(..., description="Storage provider name")
    bucket_accessible: bool = Field(..., description="Whether the storage bucket is accessible")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Health check timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() + "Z"
        }


class ErrorResponse(BaseModel):
    """Error response model."""
    
    success: bool = Field(False, description="Always false for error responses")
    message: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z", description="Error timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() + "Z"
        }
