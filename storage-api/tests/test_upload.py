#!/usr/bin/env python3
"""
Test script to upload a file to the Storage API.
"""

import requests
import jwt
import json
from datetime import datetime, timedelta

# Configuration
API_BASE_URL = "http://localhost:8001"
JWT_SECRET_KEY = "your-super-secret-jwt-key-here-must-be-at-least-32-characters-long"
FILE_PATH = "/Users/dharmendra.kumar/Downloads/VIP.pdf"

def create_jwt_token():
    """Create a JWT token for authentication."""
    payload = {
        "sub": "test-user",
        "username": "testuser",
        "email": "test@example.com",
        "roles": ["user"],
        "exp": datetime.utcnow() + timedelta(minutes=30)
    }
    
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")
    return token

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
        # Create JWT token
        token = create_jwt_token()
        print(f"Created JWT token: {token[:50]}...")
        
        # Prepare headers
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        print(f"Authorization header: Bearer {token[:50]}...")
        
        # Prepare file
        with open(FILE_PATH, 'rb') as file:
            files = {
                'file': ('VIP.pdf', file, 'application/pdf')
            }
            
            # Upload file
            print(f"Uploading file: {FILE_PATH}")
            response = requests.post(
                f"{API_BASE_URL}/api/v1/upload/single",
                headers=headers,
                files=files
            )
            
            print(f"Upload Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
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
