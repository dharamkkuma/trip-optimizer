"""
Configuration management for the Storage API.
"""

import os
from functools import lru_cache
from pydantic import BaseModel, validator
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application Settings
    app_name: str = "Storage API"
    app_version: str = "1.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8001
    
    # AWS S3 Configuration
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "us-east-1"
    s3_bucket_name: str
    aws_session_token: str = ""
    
    
    # File Upload Settings
    max_file_size_mb: int = 100
    allowed_file_types: str = "image/jpeg,image/png,image/gif,application/pdf,text/plain"
    upload_path: str = "uploads/"
    
    # CORS Settings
    cors_origins: str = "*"
    cors_methods: str = "GET,POST,PUT,DELETE"
    cors_headers: str = "*"
    
    # Logging
    log_level: str = "INFO"

    
    @validator('aws_access_key_id')
    def validate_aws_access_key_id(cls, v):
        if not v:
            raise ValueError('AWS access key ID is required')
        return v
    
    @validator('aws_secret_access_key')
    def validate_aws_secret_access_key(cls, v):
        if not v:
            raise ValueError('AWS secret access key is required')
        return v
    
    @validator('s3_bucket_name')
    def validate_s3_bucket_name(cls, v):
        if not v:
            raise ValueError('S3 bucket name is required')
        return v
    
    @validator('max_file_size_mb')
    def validate_max_file_size(cls, v):
        if v <= 0:
            raise ValueError('Max file size must be greater than 0')
        if v > 1000:  # 1GB limit
            raise ValueError('Max file size cannot exceed 1000 MB')
        return v
    
    @validator('allowed_file_types')
    def validate_allowed_file_types(cls, v):
        if not v:
            raise ValueError('Allowed file types cannot be empty')
        return v
    
    @validator('cors_origins')
    def validate_cors_origins(cls, v):
        if not v or v == '':
            return '*'
        return v
    
    @validator('cors_methods')
    def validate_cors_methods(cls, v):
        if not v or v == '':
            return 'GET,POST,PUT,DELETE'
        return v
    
    @validator('cors_headers')
    def validate_cors_headers(cls, v):
        if not v or v == '':
            return '*'
        return v
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        if self.cors_origins == '*':
            return ['*']
        return [origin.strip() for origin in self.cors_origins.split(',')]
    
    @property
    def cors_methods_list(self) -> List[str]:
        """Get CORS methods as a list."""
        return [method.strip() for method in self.cors_methods.split(',')]
    
    @property
    def cors_headers_list(self) -> List[str]:
        """Get CORS headers as a list."""
        if self.cors_headers == '*':
            return ['*']
        return [header.strip() for header in self.cors_headers.split(',')]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Ignore extra environment variables


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()

