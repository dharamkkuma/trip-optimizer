#!/bin/bash

# Storage API - All Endpoints Test Script
# This script tests all available endpoints in the Storage API

API_BASE_URL="http://localhost:8001"
FILE_PATH="/Users/dharmendra.kumar/Downloads/VIP.pdf"

echo "🚀 Storage API - Testing All Endpoints"
echo "======================================"
echo "API Base URL: $API_BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 200 ]; then
        echo -e "${GREEN}✅ Status: $1${NC}"
    else
        echo -e "${RED}❌ Status: $1${NC}"
    fi
}

echo -e "${BLUE}1. ROOT ENDPOINT${NC}"
echo "GET /"
curl -s -X GET "$API_BASE_URL/" -H "accept: application/json"
echo -e "\n"

echo -e "${BLUE}2. API INFO ENDPOINT${NC}"
echo "GET /info"
curl -s -X GET "$API_BASE_URL/info" -H "accept: application/json" | python -m json.tool
echo -e "\n"

echo -e "${BLUE}3. HEALTH CHECK ENDPOINT${NC}"
echo "GET /health"
curl -s -X GET "$API_BASE_URL/health" -H "accept: application/json" | python -m json.tool
echo -e "\n"

echo -e "${BLUE}4. STORAGE HEALTH CHECK ENDPOINT${NC}"
echo "GET /health/storage"
curl -s -X GET "$API_BASE_URL/health/storage" -H "accept: application/json" | python -m json.tool
echo -e "\n"

echo -e "${BLUE}5. LIST FILES ENDPOINT${NC}"
echo "GET /api/v1/upload/list"
curl -s -X GET "$API_BASE_URL/api/v1/upload/list" -H "accept: application/json" | python -m json.tool
echo -e "\n"

echo -e "${BLUE}6. LIST UPLOADED FILES ONLY${NC}"
echo "GET /api/v1/upload/list?prefix=uploads/"
curl -s -X GET "$API_BASE_URL/api/v1/upload/list?prefix=uploads/" -H "accept: application/json" | python -m json.tool
echo -e "\n"

echo -e "${BLUE}7. LIST FILES WITH LIMIT${NC}"
echo "GET /api/v1/upload/list?max_keys=5"
curl -s -X GET "$API_BASE_URL/api/v1/upload/list?max_keys=5" -H "accept: application/json" | python -m json.tool
echo -e "\n"

echo -e "${BLUE}8. UPLOAD SINGLE FILE${NC}"
echo "POST /api/v1/upload/single"
if [ -f "$FILE_PATH" ]; then
    curl -s -X POST "$API_BASE_URL/api/v1/upload/single" \
        -H "accept: application/json" \
        -F "file=@$FILE_PATH" | python -m json.tool
else
    echo -e "${YELLOW}⚠️  File not found: $FILE_PATH${NC}"
    echo "Creating a test file..."
    echo "This is a test file for upload" > /tmp/test.txt
    curl -s -X POST "$API_BASE_URL/api/v1/upload/single" \
        -H "accept: application/json" \
        -F "file=@/tmp/test.txt" | python -m json.tool
fi
echo -e "\n"

echo -e "${BLUE}9. UPLOAD MULTIPLE FILES${NC}"
echo "POST /api/v1/upload/multiple"
if [ -f "$FILE_PATH" ]; then
    curl -s -X POST "$API_BASE_URL/api/v1/upload/multiple" \
        -H "accept: application/json" \
        -F "files=@$FILE_PATH" \
        -F "files=@/tmp/test.txt" | python -m json.tool
else
    echo -e "${YELLOW}⚠️  Using test files only${NC}"
    curl -s -X POST "$API_BASE_URL/api/v1/upload/multiple" \
        -H "accept: application/json" \
        -F "files=@/tmp/test.txt" | python -m json.tool
fi
echo -e "\n"

echo -e "${BLUE}10. GET FILE STATUS (Example)${NC}"
echo "GET /api/v1/upload/status/{file_id}"
echo -e "${YELLOW}Note: Replace {file_id} with actual file ID from upload response${NC}"
echo "Example: GET /api/v1/upload/status/5ba10a67-566c-4222-a1d7-20a42ab92fb8"
curl -s -X GET "$API_BASE_URL/api/v1/upload/status/5ba10a67-566c-4222-a1d7-20a42ab92fb8" -H "accept: application/json" | python -m json.tool
echo -e "\n"

echo -e "${GREEN}🎉 All endpoints tested!${NC}"
echo ""
echo -e "${BLUE}📋 Summary of Available Endpoints:${NC}"
echo "1. GET  /                    - Root endpoint"
echo "2. GET  /info                - API information"
echo "3. GET  /health              - Basic health check"
echo "4. GET  /health/storage      - Storage health check"
echo "5. GET  /api/v1/upload/list  - List files in bucket"
echo "6. POST /api/v1/upload/single - Upload single file"
echo "7. POST /api/v1/upload/multiple - Upload multiple files"
echo "8. GET  /api/v1/upload/status/{file_id} - Get file status"
echo ""
echo -e "${BLUE}📖 Interactive Documentation:${NC}"
echo "Visit: $API_BASE_URL/docs"
