"""
File validation utilities for the Storage API.
"""

import os
import mimetypes
from typing import List, Set
from .exceptions import FileValidationError


def validate_file_type(
    filename: str, 
    allowed_types: List[str], 
    file_content: bytes = None
) -> str:
    """
    Validate file type based on filename extension and optionally content.
    
    Args:
        filename: Name of the file
        allowed_types: List of allowed MIME types
        file_content: Optional file content for MIME type detection
        
    Returns:
        Detected MIME type
        
    Raises:
        FileValidationError: If file type is not allowed
    """
    if not filename:
        raise FileValidationError("Filename cannot be empty")
    
    # Get MIME type from filename extension
    mime_type, _ = mimetypes.guess_type(filename)
    
    if not mime_type:
        # Try to detect from file content if provided
        if file_content:
            import magic
            try:
                mime_type = magic.from_buffer(file_content, mime=True)
            except Exception:
                pass
    
    if not mime_type:
        raise FileValidationError(
            f"Could not determine file type for '{filename}'",
            details={"filename": filename}
        )
    
    # Check if MIME type is allowed
    if mime_type not in allowed_types:
        raise FileValidationError(
            f"File type '{mime_type}' is not allowed. Allowed types: {', '.join(allowed_types)}",
            details={
                "filename": filename,
                "detected_type": mime_type,
                "allowed_types": allowed_types
            }
        )
    
    return mime_type


def validate_file_size(file_size: int, max_size_mb: int) -> None:
    """
    Validate file size against maximum allowed size.
    
    Args:
        file_size: Size of the file in bytes
        max_size_mb: Maximum allowed size in megabytes
        
    Raises:
        FileValidationError: If file size exceeds limit
    """
    if file_size <= 0:
        raise FileValidationError("File size must be greater than 0")
    
    max_size_bytes = max_size_mb * 1024 * 1024
    
    if file_size > max_size_bytes:
        raise FileValidationError(
            f"File size ({file_size} bytes) exceeds maximum allowed size ({max_size_bytes} bytes)",
            details={
                "file_size": file_size,
                "max_size_bytes": max_size_bytes,
                "max_size_mb": max_size_mb
            }
        )


def validate_filename(filename: str) -> str:
    """
    Validate and sanitize filename.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
        
    Raises:
        FileValidationError: If filename is invalid
    """
    if not filename or not filename.strip():
        raise FileValidationError("Filename cannot be empty")
    
    # Remove path separators and other dangerous characters
    dangerous_chars = ['/', '\\', '..', '<', '>', ':', '"', '|', '?', '*']
    sanitized = filename.strip()
    
    for char in dangerous_chars:
        if char in sanitized:
            raise FileValidationError(
                f"Filename contains invalid character: '{char}'",
                details={"filename": filename, "invalid_char": char}
            )
    
    # Check length
    if len(sanitized) > 255:
        raise FileValidationError(
            "Filename too long (maximum 255 characters)",
            details={"filename": filename, "length": len(sanitized)}
        )
    
    return sanitized


def get_file_extension(filename: str) -> str:
    """
    Get file extension from filename.
    
    Args:
        filename: Name of the file
        
    Returns:
        File extension (without dot)
    """
    _, ext = os.path.splitext(filename)
    return ext.lstrip('.').lower()


def is_image_file(filename: str) -> bool:
    """
    Check if file is an image based on extension.
    
    Args:
        filename: Name of the file
        
    Returns:
        True if file appears to be an image
    """
    image_extensions = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico'}
    ext = get_file_extension(filename)
    return ext in image_extensions


def is_document_file(filename: str) -> bool:
    """
    Check if file is a document based on extension.
    
    Args:
        filename: Name of the file
        
    Returns:
        True if file appears to be a document
    """
    doc_extensions = {'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'}
    ext = get_file_extension(filename)
    return ext in doc_extensions
