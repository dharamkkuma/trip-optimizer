"""
Abstract storage interface for the Storage API.

This module defines the interface that all storage providers must implement.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID
from ..models.file_models import FileUploadResponse, FileStatusResponse


class StorageInterface(ABC):
    """Abstract base class for storage providers."""
    
    @abstractmethod
    async def upload_file(
        self, 
        file_content: bytes, 
        filename: str, 
        content_type: str,
        file_id: Optional[UUID] = None
    ) -> FileUploadResponse:
        """
        Upload a single file to storage.
        
        Args:
            file_content: Binary content of the file
            filename: Name of the file
            content_type: MIME type of the file
            file_id: Optional UUID for the file
            
        Returns:
            FileUploadResponse with upload details
            
        Raises:
            StorageServiceError: If upload fails
        """
        pass
    
    @abstractmethod
    async def upload_multiple_files(
        self, 
        files: List[tuple[bytes, str, str]],  # (content, filename, content_type)
        file_ids: Optional[List[UUID]] = None
    ) -> List[FileUploadResponse]:
        """
        Upload multiple files to storage.
        
        Args:
            files: List of tuples containing (content, filename, content_type)
            file_ids: Optional list of UUIDs for the files
            
        Returns:
            List of FileUploadResponse objects
            
        Raises:
            StorageServiceError: If upload fails
        """
        pass
    
    @abstractmethod
    async def get_file_status(self, file_id: UUID) -> FileStatusResponse:
        """
        Get the status of an uploaded file.
        
        Args:
            file_id: UUID of the file
            
        Returns:
            FileStatusResponse with file details
            
        Raises:
            StorageServiceError: If file not found or access fails
        """
        pass
    
    @abstractmethod
    async def delete_file(self, file_id: UUID) -> bool:
        """
        Delete a file from storage.
        
        Args:
            file_id: UUID of the file to delete
            
        Returns:
            True if deletion was successful
            
        Raises:
            StorageServiceError: If deletion fails
        """
        pass
    
    @abstractmethod
    async def list_files(self, prefix: str = "", max_keys: int = 100) -> List[dict]:
        """
        List files in the storage bucket.
        
        Args:
            prefix: Optional prefix to filter files
            max_keys: Maximum number of files to return
            
        Returns:
            List of file information dictionaries
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> dict:
        """
        Check if the storage service is healthy and accessible.
        
        Returns:
            Dictionary with health check results
        """
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """
        Get the name of the storage provider.
        
        Returns:
            Provider name (e.g., 's3', 'gcp', 'azure')
        """
        pass
