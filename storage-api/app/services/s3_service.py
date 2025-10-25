"""
AWS S3 storage service implementation.
"""

import boto3
import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
from botocore.exceptions import ClientError, NoCredentialsError
from ..models.file_models import FileUploadResponse, FileStatusResponse
from ..utils.exceptions import StorageServiceError, ConfigurationError
from .storage_interface import StorageInterface


logger = logging.getLogger(__name__)


class S3Service(StorageInterface):
    """AWS S3 storage service implementation."""
    
    def __init__(
        self,
        aws_access_key_id: str,
        aws_secret_access_key: str,
        region_name: str,
        bucket_name: str,
        upload_path: str = "uploads/",
        aws_session_token: str = None
    ):
        """
        Initialize S3 service.
        
        Args:
            aws_access_key_id: AWS access key ID
            aws_secret_access_key: AWS secret access key
            region_name: AWS region name
            bucket_name: S3 bucket name
            upload_path: Path prefix for uploads
        """
        self.aws_access_key_id = aws_access_key_id
        self.aws_secret_access_key = aws_secret_access_key
        self.aws_session_token = aws_session_token
        self.region_name = region_name
        self.bucket_name = bucket_name
        self.upload_path = upload_path.rstrip('/') + '/'
        
        # Initialize S3 client
        try:
            client_kwargs = {
                'aws_access_key_id': self.aws_access_key_id,
                'aws_secret_access_key': self.aws_secret_access_key,
                'region_name': self.region_name
            }
            
            # Add session token if provided
            if self.aws_session_token:
                client_kwargs['aws_session_token'] = self.aws_session_token
            
            self.s3_client = boto3.client('s3', **client_kwargs)
        except NoCredentialsError:
            raise ConfigurationError("AWS credentials not found")
        except Exception as e:
            raise ConfigurationError(f"Failed to initialize S3 client: {str(e)}")
    
    async def upload_file(
        self, 
        file_content: bytes, 
        filename: str, 
        content_type: str,
        file_id: Optional[UUID] = None
    ) -> FileUploadResponse:
        """Upload a single file to S3."""
        if file_id is None:
            file_id = uuid4()
        
        # Generate S3 key
        s3_key = f"{self.upload_path}{file_id}/{filename}"
        
        try:
            # Upload file to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
                Metadata={
                    'file_id': str(file_id),
                    'original_filename': filename,
                    'uploaded_at': datetime.utcnow().isoformat()
                }
            )
            
            # Generate storage URL
            storage_url = f"https://{self.bucket_name}.s3.{self.region_name}.amazonaws.com/{s3_key}"
            
            logger.info(f"Successfully uploaded file {filename} to S3 with key {s3_key}")
            
            return FileUploadResponse(
                file_id=file_id,
                filename=filename,
                file_size=len(file_content),
                file_type=content_type,
                storage_url=storage_url,
                uploaded_at=datetime.utcnow()
            )
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"S3 upload failed: {error_code} - {error_message}")
            raise StorageServiceError(
                f"Failed to upload file to S3: {error_message}",
                details={
                    "error_code": error_code,
                    "filename": filename,
                    "s3_key": s3_key
                }
            )
        except Exception as e:
            logger.error(f"Unexpected error during S3 upload: {str(e)}")
            raise StorageServiceError(
                f"Unexpected error during file upload: {str(e)}",
                details={"filename": filename}
            )
    
    async def upload_multiple_files(
        self, 
        files: List[tuple[bytes, str, str]],
        file_ids: Optional[List[UUID]] = None
    ) -> List[FileUploadResponse]:
        """Upload multiple files to S3."""
        if file_ids is None:
            file_ids = [uuid4() for _ in files]
        
        if len(files) != len(file_ids):
            raise StorageServiceError("Number of files and file IDs must match")
        
        results = []
        for (file_content, filename, content_type), file_id in zip(files, file_ids):
            try:
                result = await self.upload_file(file_content, filename, content_type, file_id)
                results.append(result)
            except StorageServiceError as e:
                logger.error(f"Failed to upload file {filename}: {str(e)}")
                # Continue with other files, but log the error
                continue
        
        if not results:
            raise StorageServiceError("Failed to upload any files")
        
        return results
    
    async def get_file_status(self, file_id: UUID) -> FileStatusResponse:
        """Get the status of an uploaded file."""
        try:
            # List objects with the file_id prefix
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f"{self.upload_path}{file_id}/"
            )
            
            if 'Contents' not in response or not response['Contents']:
                raise StorageServiceError(f"File with ID {file_id} not found")
            
            # Get the first object (should be the file)
            obj = response['Contents'][0]
            s3_key = obj['Key']
            
            # Get object metadata
            head_response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            metadata = head_response.get('Metadata', {})
            original_filename = metadata.get('original_filename', 'unknown')
            uploaded_at_str = metadata.get('uploaded_at')
            
            # Parse uploaded_at timestamp
            uploaded_at = None
            if uploaded_at_str:
                try:
                    uploaded_at = datetime.fromisoformat(uploaded_at_str.replace('Z', '+00:00'))
                except ValueError:
                    uploaded_at = obj['LastModified']
            else:
                uploaded_at = obj['LastModified']
            
            # Generate storage URL
            storage_url = f"https://{self.bucket_name}.s3.{self.region_name}.amazonaws.com/{s3_key}"
            
            return FileStatusResponse(
                file_id=file_id,
                filename=original_filename,
                status="uploaded",
                storage_url=storage_url,
                uploaded_at=uploaded_at
            )
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                raise StorageServiceError(f"File with ID {file_id} not found")
            else:
                raise StorageServiceError(f"Failed to get file status: {e.response['Error']['Message']}")
        except Exception as e:
            logger.error(f"Unexpected error getting file status: {str(e)}")
            raise StorageServiceError(f"Unexpected error getting file status: {str(e)}")
    
    async def delete_file(self, file_id: UUID) -> bool:
        """Delete a file from S3."""
        try:
            # List objects with the file_id prefix
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=f"{self.upload_path}{file_id}/"
            )
            
            if 'Contents' not in response or not response['Contents']:
                raise StorageServiceError(f"File with ID {file_id} not found")
            
            # Delete all objects with this prefix (in case there are multiple files)
            objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]
            
            self.s3_client.delete_objects(
                Bucket=self.bucket_name,
                Delete={'Objects': objects_to_delete}
            )
            
            logger.info(f"Successfully deleted file {file_id} from S3")
            return True
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                raise StorageServiceError(f"File with ID {file_id} not found")
            else:
                raise StorageServiceError(f"Failed to delete file: {e.response['Error']['Message']}")
        except Exception as e:
            logger.error(f"Unexpected error deleting file: {str(e)}")
            raise StorageServiceError(f"Unexpected error deleting file: {str(e)}")
    
    async def list_files(self, prefix: str = "", max_keys: int = 100) -> List[dict]:
        """List files in the S3 bucket."""
        try:
            # List objects in the bucket
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix,
                MaxKeys=max_keys
            )
            
            files = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    # Extract file information
                    file_info = {
                        "key": obj['Key'],
                        "size": obj['Size'],
                        "last_modified": obj['LastModified'].isoformat() + "Z",
                        "storage_class": obj.get('StorageClass', 'STANDARD'),
                        "url": f"https://{self.bucket_name}.s3.{self.region_name}.amazonaws.com/{obj['Key']}"
                    }
                    
                    # Try to get metadata for uploaded files
                    if obj['Key'].startswith(self.upload_path):
                        try:
                            head_response = self.s3_client.head_object(
                                Bucket=self.bucket_name,
                                Key=obj['Key']
                            )
                            metadata = head_response.get('Metadata', {})
                            file_info.update({
                                "file_id": metadata.get('file_id'),
                                "original_filename": metadata.get('original_filename'),
                                "uploaded_at": metadata.get('uploaded_at'),
                                "content_type": head_response.get('ContentType')
                            })
                        except Exception:
                            # If metadata retrieval fails, continue without it
                            pass
                    
                    files.append(file_info)
            
            return files
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"S3 list files failed: {error_code} - {error_message}")
            raise StorageServiceError(
                f"Failed to list files in S3: {error_message}",
                details={
                    "error_code": error_code,
                    "prefix": prefix,
                    "max_keys": max_keys
                }
            )
        except Exception as e:
            logger.error(f"Unexpected error listing files: {str(e)}")
            raise StorageServiceError(
                f"Unexpected error listing files: {str(e)}",
                details={"prefix": prefix, "max_keys": max_keys}
            )
    
    async def health_check(self) -> dict:
        """Check if S3 service is healthy and accessible."""
        try:
            # Try to list objects in the bucket (limited to 1 object)
            self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                MaxKeys=1
            )
            
            return {
                "status": "healthy",
                "provider": "s3",
                "bucket_accessible": True,
                "bucket_name": self.bucket_name,
                "region": self.region_name
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            return {
                "status": "unhealthy",
                "provider": "s3",
                "bucket_accessible": False,
                "error": e.response['Error']['Message'],
                "error_code": error_code
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "provider": "s3",
                "bucket_accessible": False,
                "error": str(e)
            }
    
    def get_provider_name(self) -> str:
        """Get the name of the storage provider."""
        return "s3"
