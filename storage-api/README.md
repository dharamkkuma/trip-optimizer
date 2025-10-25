# Storage API

A FastAPI-based microservice for handling file uploads to multiple cloud storage providers (AWS S3, Google Cloud Storage, Azure Blob Storage).

## Features

- **Multi-Cloud Support**: Upload files to AWS S3, Google Cloud Storage, or Azure Blob Storage
- **Authentication**: JWT token-based authentication
- **Rate Limiting**: Redis-based rate limiting for API protection
- **File Validation**: File type and size validation
- **Batch Upload**: Support for single and multiple file uploads
- **Error Handling**: Comprehensive error handling and logging

## Tech Stack

- **Framework**: FastAPI (Python)
- **Storage SDKs**: 
  - boto3 (AWS S3)
  - google-cloud-storage (GCP)
  - azure-storage-blob (Azure)
- **Authentication**: JWT tokens
- **Rate Limiting**: Redis-based rate limiter
- **Database**: Redis (for rate limiting and caching)

## Project Structure

```
storage-api/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── models/              # Pydantic models
│   │   ├── __init__.py
│   │   ├── file_models.py   # File upload models
│   │   └── response_models.py # API response models
│   ├── routes/              # API routes
│   │   ├── __init__.py
│   │   ├── upload.py        # Upload endpoints
│   │   └── health.py        # Health check endpoints
│   ├── services/            # Business logic services
│   │   ├── __init__.py
│   │   ├── storage_interface.py # Abstract storage interface
│   │   ├── s3_service.py    # AWS S3 implementation
│   │   ├── gcp_service.py   # Google Cloud Storage implementation
│   │   ├── azure_service.py # Azure Blob Storage implementation
│   │   └── auth_service.py  # Authentication service
│   └── utils/               # Utility functions
│       ├── __init__.py
│       ├── validators.py    # File validation utilities
│       └── exceptions.py    # Custom exceptions
├── tests/                   # Test files
│   ├── __init__.py
│   ├── test_upload.py
│   └── test_auth.py
├── requirements.txt         # Python dependencies
├── Dockerfile              # Docker configuration
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Application Settings
APP_NAME=Storage API
APP_VERSION=1.0.0
DEBUG=True
HOST=0.0.0.0
PORT=8000

# Authentication
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis Configuration (for rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# Google Cloud Storage Configuration (Optional)
GCP_PROJECT_ID=your-gcp-project-id
GCP_BUCKET_NAME=your-gcp-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Azure Blob Storage Configuration (Optional)
AZURE_STORAGE_ACCOUNT_NAME=your-azure-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-azure-account-key
AZURE_CONTAINER_NAME=your-azure-container-name

# File Upload Settings
MAX_FILE_SIZE_MB=100
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain
UPLOAD_PATH=uploads/
```

## API Endpoints

### Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### File Upload Endpoints

#### 1. Upload Single File
**POST** `/api/v1/upload/single`

Upload a single file to the configured storage provider.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (binary file data)

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file_id": "uuid-string",
    "filename": "example.jpg",
    "file_size": 1024000,
    "file_type": "image/jpeg",
    "storage_url": "https://bucket.s3.amazonaws.com/path/to/file.jpg",
    "uploaded_at": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. Upload Multiple Files
**POST** `/api/v1/upload/multiple`

Upload multiple files in a single request.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `files` (array of binary file data)

**Response:**
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "uploaded_files": [
      {
        "file_id": "uuid-string-1",
        "filename": "file1.jpg",
        "file_size": 1024000,
        "file_type": "image/jpeg",
        "storage_url": "https://bucket.s3.amazonaws.com/path/to/file1.jpg",
        "uploaded_at": "2024-01-15T10:30:00Z"
      },
      {
        "file_id": "uuid-string-2",
        "filename": "file2.pdf",
        "file_size": 2048000,
        "file_type": "application/pdf",
        "storage_url": "https://bucket.s3.amazonaws.com/path/to/file2.pdf",
        "uploaded_at": "2024-01-15T10:30:01Z"
      }
    ],
    "total_files": 2,
    "total_size": 3072000
  }
}
```

#### 3. Get Upload Status
**GET** `/api/v1/upload/status/{file_id}`

Get the status of an uploaded file.

**Response:**
```json
{
  "success": true,
  "data": {
    "file_id": "uuid-string",
    "filename": "example.jpg",
    "status": "uploaded",
    "storage_url": "https://bucket.s3.amazonaws.com/path/to/file.jpg",
    "uploaded_at": "2024-01-15T10:30:00Z"
  }
}
```

### Health Check Endpoints

#### 4. Health Check
**GET** `/health`

Check if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

#### 5. Storage Health Check
**GET** `/health/storage`

Check if the configured storage provider is accessible.

**Response:**
```json
{
  "status": "healthy",
  "storage_provider": "s3",
  "bucket_accessible": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

