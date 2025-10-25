#!/usr/bin/env python3
"""
Test script to upload a file to the Storage API.

curl -X POST "http://localhost:8001/api/v1/upload/single" \
  -F "file=@/path/to/your/file.pdf"

Response:

{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file_id": "791a9986-883d-447c-ac54-a7917dd42770",
    "filename": "VIP.pdf",
    "file_size": 1463774,
    "file_type": "application/pdf",
    "storage_url": "https://dharmendra-ps.s3.us-east-1.amazonaws.com/uploads/791a9986-883d-447c-ac54-a7917dd42770/VIP.pdf",
    "uploaded_at": "2025-10-25T08:41:39.311662Z"
  },
  "timestamp": "2025-10-25T08:41:39.311928Z"
}


"""

import requests
import jwt
import json
from datetime import datetime, timedelta

# Configuration
API_BASE_URL = "http://localhost:8001"
FILE_PATH = "/Users/dharmendra.kumar/Downloads/VIP2.pdf"

def test_health():
    """Test the health endpoint."""
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        print(f"Health Check: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def upload_file():
    """Upload a file to the Storage API."""
    try:
        # Prepare file
        with open(FILE_PATH, 'rb') as file:
            files = {
                'file': ('VIP.pdf', file, 'application/pdf')
            }
            
            # Upload file
            print(f"Uploading file: {FILE_PATH}")
            response = requests.post(
                f"{API_BASE_URL}/api/v1/upload/single",
                files=files
            )
            
            print(f"Upload Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"result: {result}")
                print(f"✅ Upload successful!")
                print(f"File ID: {result['data']['file_id']}")
                print(f"Storage URL: {result['data']['storage_url']}")
                return result
            else:
                print(f"❌ Upload failed: {response.text}")
                return None
                
    except Exception as e:
        print(f"Upload failed with error: {e}")
        return None

def main():
    """Main function."""
    print("🚀 Testing Storage API Upload")
    print("=" * 50)
    
    # Test health
    if not test_health():
        print("❌ API is not healthy. Please check if it's running.")
        return
    
    print("\n📤 Testing file upload...")
    result = upload_file()
    
    if result:
        print("\n🎉 Upload test completed successfully!")
    else:
        print("\n💥 Upload test failed!")

if __name__ == "__main__":
    main()
