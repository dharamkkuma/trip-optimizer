#!/usr/bin/env python3
"""
Test script for presigned URL endpoints.
"""

import requests
import json

# Configuration
API_BASE_URL = "http://localhost:8001"

def test_presigned_upload():
    """Test presigned upload URL generation."""
    try:
        print("🧪 Testing Presigned Upload URL Generation...")
        
        response = requests.post(
            f"{API_BASE_URL}/api/v1/upload/presigned-upload",
            data={
                "filename": "test-document.pdf",
                "content_type": "pdf",
                "expiration": 3600
            }
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Presigned Upload URL Generated Successfully!")
            print(f"File ID: {result['data']['file_id']}")
            print(f"Filename: {result['data']['filename']}")
            print(f"Upload URL: {result['data']['upload_url'][:100]}...")
            print(f"Expires in: {result['data']['expires_in']} seconds")
            print(f"Expires at: {result['data']['expires_at']}")
            return result['data']['file_id']
        else:
            print(f"❌ Failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_presigned_download(file_id):
    """Test presigned download URL generation."""
    try:
        print(f"\n🧪 Testing Presigned Download URL Generation for file {file_id}...")
        
        response = requests.get(
            f"{API_BASE_URL}/api/v1/upload/presigned-download/{file_id}",
            params={
                "filename": "test-document.pdf",
                "expiration": 3600
            }
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Presigned Download URL Generated Successfully!")
            print(f"File ID: {result['data']['file_id']}")
            print(f"Filename: {result['data']['filename']}")
            print(f"Download URL: {result['data']['download_url'][:100]}...")
            print(f"Expires in: {result['data']['expires_in']} seconds")
            print(f"Expires at: {result['data']['expires_at']}")
        else:
            print(f"❌ Failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def test_health():
    """Test API health."""
    try:
        print("🏥 Testing API Health...")
        response = requests.get(f"{API_BASE_URL}/health")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ API is healthy!")
            return True
        else:
            print("❌ API is not healthy!")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Main test function."""
    print("🚀 Testing Storage API Presigned URLs")
    print("=" * 50)
    
    # Test health first
    if not test_health():
        print("❌ API is not available. Please check if it's running.")
        return
    
    # Test presigned upload
    file_id = test_presigned_upload()
    
    # Test presigned download if upload was successful
    if file_id:
        test_presigned_download(file_id)
    
    print("\n🎉 Presigned URL tests completed!")

if __name__ == "__main__":
    main()
