# Storage API

A FastAPI-based microservice for handling file uploads to multiple cloud storage providers
Currently supports - S3 in Future (Google Cloud Storage, Azure Blob Storage).

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




## Quick Setup with Conda

### Use conda to install dependencies or pip install requirements
```bash
# Run the setup script
./setup.sh

# Activate the environment
conda activate storage-api

```

### PROVIDE AWS CREDENTIALS

```
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
AWS_SESSION_TOKEN=""
```

### Option : Docker Based
```bash
docker-compose up --build
docker-compose up -d
```

### Test Endpoints
```
Add | python -m json.tool to any curl command for formatted output:

All Endpoints can be tested in tests/test_all_endpoints

curl -X GET "http://localhost:8001/" -H "accept: application/json"
http://localhost:8001/docs
http://localhost:8001/openapi.json
curl -X GET "http://localhost:8001/api/v1/upload/list?max_keys=10"

curl -X POST "http://localhost:8001/api/v1/upload/multiple" \
  -H "accept: application/json" \
  -F "files=@/path/to/file1.pdf" \
  -F "files=@/path/to/file2.jpg" \
  -F "files=@/path/to/file3.txt"

  curl -X GET "http://localhost:8001/api/v1/upload/status/{file_id}" -H "accept: application/json"


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
