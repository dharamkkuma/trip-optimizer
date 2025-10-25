"""
Custom exceptions for the Storage API.
"""

from typing import Any, Dict, Optional


class StorageAPIException(Exception):
    """Base exception for Storage API errors."""
    
    def __init__(
        self, 
        message: str, 
        error_code: Optional[str] = None, 
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class FileValidationError(StorageAPIException):
    """Exception raised when file validation fails."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="FILE_VALIDATION_ERROR",
            details=details
        )


class StorageServiceError(StorageAPIException):
    """Exception raised when storage service operations fail."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="STORAGE_SERVICE_ERROR",
            details=details
        )


class AuthenticationError(StorageAPIException):
    """Exception raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            details=details
        )


class ConfigurationError(StorageAPIException):
    """Exception raised when configuration is invalid."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            details=details
        )


class RateLimitError(StorageAPIException):
    """Exception raised when rate limit is exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_ERROR",
            details=details
        )
